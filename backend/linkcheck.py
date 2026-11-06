"""
smart-hire Link Health Verification Engine
Asynchronously checks job apply links, validates ATS endpoints, and updates link health.
"""

import time
import socket
import logging
import urllib.parse
from datetime import datetime
from typing import Tuple, Dict, Any, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from sqlalchemy.orm import Session

from backend.models import JobPosting

logger = logging.getLogger("smart_hire.linkcheck")

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

def check_url_health(url: str, company: str = "", timeout: float = 10.0) -> Tuple[str, str, int, float]:
    """
    Checks URL health using HEAD with fallback to GET on 403/405.
    Returns: (status, reason, http_code, duration_ms)
      status in {'ok', 'broken', 'unknown'}
    """
    start_time = time.time()
    if not url or url.strip() == "#" or not url.startswith("http"):
        duration = (time.time() - start_time) * 1000
        return "broken", "empty_or_invalid_url", 0, duration

    parsed = urllib.parse.urlparse(url.strip())
    hostname = parsed.hostname
    if not hostname:
        duration = (time.time() - start_time) * 1000
        return "broken", "no_hostname", 0, duration

    # 1. DNS Pre-check
    try:
        socket.gethostbyname(hostname)
    except Exception as e:
        duration = (time.time() - start_time) * 1000
        return "broken", f"dns_error_{type(e).__name__}", 0, duration

    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }

    res: Optional[requests.Response] = None
    try:
        # Attempt HEAD request first
        res = requests.head(url, headers=headers, timeout=timeout, allow_redirects=True)
        # If server rejects HEAD with 403 or 405, fallback to GET
        if res.status_code in (403, 405):
            res = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
    except requests.exceptions.RequestException:
        try:
            # Fallback to GET on network/protocol error
            res = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            return "broken", f"network_error_{type(e).__name__}", 0, duration

    duration = (time.time() - start_time) * 1000
    if res is None:
        return "broken", "no_response", 0, duration

    status_code = res.status_code

    # 2. ATS-specific validation
    # Ashby "not found" page often returns HTTP 200 with HTML stating page not found
    if "ashbyhq.com" in hostname:
        body_sample = res.text.lower() if res.text else ""
        if "the page you requested was not found" in body_sample or "page not found" in body_sample:
            return "broken", "ashby_page_not_found", status_code, duration

    # Greenhouse ATS validation
    if "boards.greenhouse.io" in hostname:
        body_sample = res.text.lower() if res.text else ""
        if "job not found" in body_sample or "the page you are looking for doesn't exist" in body_sample:
            return "broken", "greenhouse_job_not_found", status_code, duration

    # Lever ATS validation
    if "jobs.lever.co" in hostname:
        body_sample = res.text.lower() if res.text else ""
        if "posting not found" in body_sample or "this position is no longer available" in body_sample:
            return "broken", "lever_posting_not_found", status_code, duration

    # 2.5 Portal Anti-Bot & Rate Limit Handling (LinkedIn, Indeed, Naukri, Foundit)
    if any(portal in hostname for portal in ("linkedin.com", "indeed.com", "naukri.com", "foundit.in")):
        if status_code in (403, 429, 999) or status_code >= 500:
            return "unknown", f"portal_bot_guard_{status_code}", status_code, duration

    # 3. Categorize by HTTP code
    if status_code in (404, 410):
        return "broken", f"http_{status_code}", status_code, duration
    elif status_code < 400:
        return "ok", f"http_{status_code}", status_code, duration
    elif status_code in (403, 429, 999) or status_code >= 500:
        return "unknown", f"http_{status_code}", status_code, duration
    else:
        return "broken", f"http_{status_code}", status_code, duration

def check_and_update_job(db: Session, job_id: str) -> Dict[str, Any]:
    """
    Re-checks link health for a single job and updates database record.
    """
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        return {"error": "Job not found", "job_id": job_id}

    status, reason, http_code, duration = check_url_health(job.apply_url, job.company)
    
    # If users flagged it 3 or more times, hide it regardless
    if (job.report_count or 0) >= 3:
        status = "broken"

    job.link_status = status
    job.link_checked_at = datetime.utcnow()
    db.commit()

    logger.info(f"Link check: id={job_id} url={job.apply_url} status={status} code={http_code} duration={duration:.1f}ms reason={reason}")

    q_str = urllib.parse.quote_plus(f"{job.company or ''} careers {job.title or ''}".strip())
    fallback_search_url = f"https://www.google.com/search?q={q_str}"

    return {
        "id": job.id,
        "company": job.company,
        "title": job.title,
        "apply_url": job.apply_url,
        "link_status": status,
        "http_code": http_code,
        "duration_ms": round(duration, 1),
        "report_count": job.report_count or 0,
        "fallback_search_url": fallback_search_url
    }

def audit_all_db_links(db: Session, concurrency: int = 10) -> Dict[str, Any]:
    """
    Scans all active jobs in the DB, updates link_status and logs statistics per source.
    """
    jobs = db.query(JobPosting).filter(JobPosting.is_active == True).all()
    stats = {"total": len(jobs), "ok": 0, "broken": 0, "unknown": 0, "by_source": {}}

    def worker(j: JobPosting):
        status, reason, code, dur = check_url_health(j.apply_url, j.company)
        return j.id, status, reason, code, dur, j.source

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(worker, j) for j in jobs]
        for f in as_completed(futures):
            jid, status, reason, code, dur, src = f.result()
            stats[status] += 1
            src_key = src or "Other"
            if src_key not in stats["by_source"]:
                stats["by_source"][src_key] = {"ok": 0, "broken": 0, "unknown": 0}
            stats["by_source"][src_key][status] += 1

            # Update DB record in separate commit
            job_rec = db.query(JobPosting).filter(JobPosting.id == jid).first()
            if job_rec:
                job_rec.link_status = status
                job_rec.link_checked_at = datetime.utcnow()

    db.commit()
    logger.info(f"Audit completed: {stats['total']} jobs. ok={stats['ok']} broken={stats['broken']} unknown={stats['unknown']}")
    return stats

