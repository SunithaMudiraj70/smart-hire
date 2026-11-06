import os
import sys
import re
import socket
import urllib.parse
from collections import Counter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.database import SessionLocal, init_db
from backend.models import JobPosting

print("=== STEP 1 AUDIT: FINDING URL FABRICATIONS & BAD HOSTS ===\n")

# 1. Grep backend/, scripts/, tools/, job_agents/, web/ for URL fabrication & fake domains
search_dirs = ["backend", "scripts", "tools", "job_agents", "web/src"]
suspicious_patterns = [
    (r"verifiedrecruiter", "verifiedrecruiter"),
    (r"topemployer", "topemployer"),
    (r"careers\.", "careers."),
    (r"f[\"'].*?https?://", "f-string http URL"),
    (r"(?:apply_url|url|link)\s*(?:\|\||or)\s*f?[\"']https?://", "fallback url"),
    (r"careers\.\$\{", "JS template careers.${...}"),
    (r"https?://careers\.", "hardcoded careers. domain")
]

findings = []
for d in search_dirs:
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith((".py", ".ts", ".tsx", ".js", ".json")):
                path = os.path.join(root, f)
                with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                    for line_no, line in enumerate(fh, 1):
                        for pat, label in suspicious_patterns:
                            if re.search(pat, line, re.IGNORECASE):
                                findings.append((path, line_no, label, line.strip()))

print(f"1. Codebase Scan Matches ({len(findings)} matches):")
for path, line_no, label, line in findings:
    print(f"  [{label}] {path}:{line_no}")
    print(f"      {line[:140]}")

# 2. Database analysis
init_db()
db = SessionLocal()
jobs = db.query(JobPosting).all()

print(f"\n2. Database Job Postings Total: {len(jobs)}")

source_counts = Counter(j.source for j in jobs)
print("\n--- Jobs by Source ---")
for s, cnt in source_counts.most_common():
    print(f"  {s:35s}: {cnt}")

host_counts = Counter()
dns_failures = []
visible_dns_failures = []

for j in jobs:
    url = (j.apply_url or "").strip()
    try:
        parsed = urllib.parse.urlparse(url)
        host = parsed.netloc.split(":")[0].lower()
    except Exception:
        host = "INVALID_URL"
    host_counts[host] += 1

    # DNS check
    resolved = True
    dns_err = ""
    try:
        socket.gethostbyname(host)
    except Exception as e:
        resolved = False
        dns_err = str(e)
        dns_failures.append((j, host, dns_err))
        if j.is_active and not getattr(j, "is_demo", False) and getattr(j, "link_status", "ok") != "broken":
            visible_dns_failures.append((j, host, dns_err))

print("\n--- Top 20 Apply URL Hosts in DB ---")
for h, cnt in host_counts.most_common(20):
    print(f"  {h:35s}: {cnt}")

print(f"\n--- Total DNS Failures in DB: {len(dns_failures)} (Visible: {len(visible_dns_failures)}) ---")
print("Top 20 Unresolvable Hosts / Jobs in DB:")
for idx, (j, host, err) in enumerate(dns_failures[:20], 1):
    vis = "VISIBLE" if (j.is_active and not getattr(j, "is_demo", False) and getattr(j, "link_status", "ok") != "broken") else "HIDDEN/DEMO"
    print(f"  {idx:2d}. [{j.id}] ({vis}) {j.company} - {j.title}")
    print(f"      Source: {j.source}")
    print(f"      Host:   {host}")
    print(f"      URL:    {j.apply_url}")
    print(f"      Error:  {err}")

db.close()
