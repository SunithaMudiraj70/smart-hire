#!/usr/bin/env python3
"""
smart-hire link health audit script.
Audits all visible job postings in the database (or all jobs if requested).
Categorizes each link as:
 - ok: HTTP < 400 (and valid content)
 - broken: HTTP 404/410, DNS failure (NXDOMAIN), connection error, or Ashby "page not found"
 - unknown: HTTP 403, 429, 5xx (rate-limiting / bot protection)
Prints summary counts per source and lists broken URLs.
"""

import os
import sys
import socket
import datetime
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

load_dotenv()

from backend.database import SessionLocal, init_db
from backend.models import JobPosting
from backend.urlguard import validate_apply_url

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

def check_single_url(url: str, source: str = "", company: str = "") -> tuple[str, str]:
    """
    Checks URL health.
    Returns (status, detail) where status is 'ok', 'broken', 'unknown', or 'rejected'.
    """
    # 0. URL Guard Validation
    is_valid, reason = validate_apply_url(source, url)
    if not is_valid:
        return "rejected", f"urlguard_rejected({reason})"

    if not url or url.strip() == "#" or not url.startswith("http"):
        return "broken", "empty_or_invalid_url"

    parsed = urllib.parse.urlparse(url)
    hostname = parsed.hostname
    if not hostname:
        return "broken", "no_hostname"

    # 1. DNS check
    try:
        socket.gethostbyname(hostname)
    except Exception as e:
        return "broken", f"dns_error({e.__class__.__name__})"

    # 2. Portal Anti-bot handling (LinkedIn, Indeed, Naukri, Foundit)
    # Don't fail anti-bot challenge as broken
    if any(portal in hostname for portal in ("linkedin.com", "indeed.com", "naukri.com", "foundit.in")):
        return "ok", "portal_domain_verified"

    # 3. HTTP Request (HEAD first, then GET)
    headers = {"User-Agent": USER_AGENT}
    try:
        res = requests.head(url, headers=headers, timeout=6, allow_redirects=True)
        if res.status_code in (404, 410):
            return "broken", f"http_{res.status_code}"
        elif res.status_code in (403, 405, 999):
            res = requests.get(url, headers=headers, timeout=6, allow_redirects=True)
    except requests.exceptions.RequestException:
        try:
            res = requests.get(url, headers=headers, timeout=6, allow_redirects=True)
        except Exception as e:
            return "broken", f"network_error({e.__class__.__name__})"

    status_code = res.status_code

    # 4. Ashby ATS check
    if "ashbyhq.com" in hostname:
        body = res.text.lower()
        if "the page you requested was not found" in body or "page not found" in body:
            return "broken", "ashby_page_not_found"

    # 5. Greenhouse ATS check
    if "boards.greenhouse.io" in hostname:
        if status_code in (404, 410):
            return "broken", f"greenhouse_{status_code}"
        body = res.text.lower()
        if "job not found" in body or "page not found" in body:
            return "broken", "greenhouse_job_not_found"

    # 6. Categorize
    if status_code in (404, 410):
        return "broken", f"http_{status_code}"
    elif status_code < 400:
        return "ok", f"http_{status_code}"
    elif status_code in (403, 429, 999) or status_code >= 500:
        return "unknown", f"http_{status_code}"
    else:
        return "broken", f"http_{status_code}"

def audit_database(visible_only: bool = True):
    init_db()
    db = SessionLocal()
    try:
        query = db.query(JobPosting).filter(JobPosting.is_active == True)
        # If columns exist in JobPosting, filter demo and already-broken jobs
        if hasattr(JobPosting, "is_demo") and visible_only:
            query = query.filter(JobPosting.is_demo == False, JobPosting.link_status != "broken")

        jobs = query.all()
        print(f"\n--- smart-hire Link Health Audit ---")
        print(f"Auditing {len(jobs)} active jobs (visible_only={visible_only})...\n")

        stats = {"ok": 0, "broken": 0, "unknown": 0, "rejected": 0}
        by_source = {}
        broken_records = []

        def worker(job):
            status, detail = check_single_url(job.apply_url, job.source, job.company)
            return job, status, detail

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(worker, j) for j in jobs]
            for f in as_completed(futures):
                job, status, detail = f.result()
                stats[status] += 1
                src = job.source or "Unknown"
                if src not in by_source:
                    by_source[src] = {"ok": 0, "broken": 0, "unknown": 0, "rejected": 0}
                by_source[src][status] += 1

                # Persist health status to database
                db_record = db.query(JobPosting).filter(JobPosting.id == job.id).first()
                if db_record:
                    db_record.link_status = status
                    db_record.link_checked_at = datetime.datetime.utcnow()
                    if status in ("broken", "rejected"):
                        db_record.is_active = False

                if status in ("broken", "rejected"):
                    broken_records.append({
                        "id": job.id,
                        "company": job.company,
                        "title": job.title,
                        "source": src,
                        "url": job.apply_url,
                        "detail": detail
                    })

        try:
            db.commit()
        except Exception as e:
            db.rollback()

        # Summary
        print(f"Overall Link Health Summary:")
        print(f"  Total Visible Jobs: {len(jobs)}")
        print(f"  OK links:          {stats['ok']}")
        print(f"  Broken links:      {stats['broken']}")
        print(f"  Unknown links:     {stats['unknown']} (bot protection/CDN rate limits)")
        print(f"  Rejected links:    {stats['rejected']} (URL guard allowlist/scheme/DNS)")

        print("\nBreakdown by Source:")
        for src, counts in sorted(by_source.items()):
            print(f"  {src:25s} | OK: {counts['ok']:2d} | Broken: {counts['broken']:2d} | Unknown: {counts['unknown']:2d} | Rejected: {counts['rejected']:2d}")

        if broken_records:
            print(f"\nFirst 20 Broken URLs (out of {len(broken_records)} total):")
            for idx, b in enumerate(broken_records[:20], 1):
                print(f"  {idx:2d}. [{b['id']}] {b['company']} - {b['title']}")
                print(f"      Source: {b['source']}")
                print(f"      URL:    {b['url']}")
                print(f"      Reason: {b['detail']}")
        else:
            print("\n[SUCCESS] Zero broken URLs found among visible jobs!")

        return stats, broken_records
    finally:
        db.close()

if __name__ == "__main__":
    visible = True
    if len(sys.argv) > 1 and sys.argv[1] == "--all":
        visible = False
    stats, broken = audit_database(visible_only=visible)
    sys.exit(0 if stats["broken"] == 0 else 1)

