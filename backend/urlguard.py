import socket
import urllib.parse
from typing import Tuple, Dict, Any, Optional

# Per-source host allowlists
SOURCE_HOST_ALLOWLIST: Dict[str, set] = {
    "greenhouse": {"boards.greenhouse.io", "job-boards.greenhouse.io"},
    "lever": {"jobs.lever.co"},
    "ashby": {"jobs.ashbyhq.com"},
    "workable": {"apply.workable.com"},
    "smartrecruiters": {"jobs.smartrecruiters.com"},
    "adzuna": {"adzuna.in", "www.adzuna.in"},
    "remoteok": {"remoteok.com", "www.remoteok.com"},
    "jobicy": {"jobicy.com", "www.jobicy.com"},
}

def portal_search_links(keyword: str, location: str = "India") -> Dict[str, str]:
    """
    Returns generic portal search URLs for candidate discovery.
    These are search links, NOT specific job applications, and must be labelled
    'Search on <Portal> ↗'.
    """
    q_enc = urllib.parse.quote(keyword.strip() if keyword else "Software Engineer")
    loc_enc = urllib.parse.quote(location.strip() if location else "India")
    return {
        "LinkedIn": f"https://www.linkedin.com/jobs/search/?keywords={q_enc}&location={loc_enc}",
        "Indeed": f"https://in.indeed.com/jobs?q={q_enc}&l={loc_enc}",
        "Naukri": f"https://www.naukri.com/{q_enc}-jobs-in-{loc_enc}",
        "Foundit": f"https://www.foundit.in/srp/results?query={q_enc}&locations={loc_enc}",
    }

def validate_apply_url(source: str, url: str) -> Tuple[bool, str]:
    """
    Validates an apply URL against requirements:
    1. Must be non-empty string.
    2. Must use HTTPS scheme.
    3. Host must belong to source's allowlist (or pass DNS for jsearch/jsonld/other).
    4. Host must resolve in DNS.
    Returns (is_valid, reason).
    """
    if not url or not isinstance(url, str):
        return False, "missing_or_not_string"

    clean_url = url.strip()
    if clean_url in ("#", ""):
        return False, "empty_or_hash"

    try:
        parsed = urllib.parse.urlparse(clean_url)
    except Exception as e:
        return False, f"unparseable_url: {e}"

    if parsed.scheme.lower() != "https":
        return False, f"invalid_scheme: {parsed.scheme} (https required)"

    netloc = (parsed.netloc or "").split(":")[0].lower()
    if not netloc or "." not in netloc:
        return False, f"invalid_host: {netloc}"

    src_key = (source or "").lower().replace(" ", "").replace("ats", "")

    # Check allowlist for recognized primary ATS sources
    matched_allowlist = None
    for k, allowed_hosts in SOURCE_HOST_ALLOWLIST.items():
        if k in src_key:
            matched_allowlist = allowed_hosts
            break

    if matched_allowlist is not None:
        if netloc not in matched_allowlist:
            return False, f"host_not_in_allowlist: {netloc} not in {matched_allowlist}"

    # For jsearch, jsonld, direct company careers, or allowlisted ATS: DNS must resolve
    try:
        socket.gethostbyname(netloc)
    except Exception as e:
        return False, f"dns_resolution_failed: {e}"

    return True, "ok"

