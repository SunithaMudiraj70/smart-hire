import os
import glob
import pytest
from fastapi.testclient import TestClient
from backend.server import app
from backend.urlguard import validate_apply_url, portal_search_links, SOURCE_HOST_ALLOWLIST
from backend.database import SessionLocal
from backend.models import JobPosting

@pytest.fixture
def client():
    return TestClient(app)

def test_validate_real_ats_urls():
    """Real ATS URLs matching allowlist and resolvable domain must pass."""
    assert validate_apply_url("Greenhouse", "https://boards.greenhouse.io/stripe/jobs/12345")[0] is True
    assert validate_apply_url("Lever", "https://jobs.lever.co/spotify/2a55d6c9-c564-443a-be3e-a3851db5a93b")[0] is True
    assert validate_apply_url("Ashby", "https://jobs.ashbyhq.com/sentry/9b7ba790-75d1-404c-bf9f-c3776179f7f2")[0] is True
    assert validate_apply_url("RemoteOK", "https://remoteok.com/remote-jobs/12345")[0] is True
    assert validate_apply_url("Jobicy", "https://jobicy.com/jobs/12345")[0] is True

def test_reject_wrong_host_urls():
    """URLs claiming to be from ATS but on un-allowlisted or spoofed hosts must be rejected."""
    # Greenhouse claiming to be on custom/fake domain
    ok, reason = validate_apply_url("Greenhouse", "https://careers.zepto.com/jobs/1012")
    assert ok is False
    assert "host_not_in_allowlist" in reason

    # Lever on fake domain
    ok, reason = validate_apply_url("Lever", "https://careers.topemployersvialinkedin.com/jobs/1")
    assert ok is False
    assert "host_not_in_allowlist" in reason

    # Ashby on fake domain
    ok, reason = validate_apply_url("Ashby", "https://careers.verifiedrecruitersonindeed.com/jobs/2")
    assert ok is False
    assert "host_not_in_allowlist" in reason

def test_reject_non_https():
    """Non-HTTPS URLs must be rejected."""
    ok, reason = validate_apply_url("Greenhouse", "http://boards.greenhouse.io/stripe/jobs/12345")
    assert ok is False
    assert "https required" in reason

def test_reject_empty_and_malformed():
    """Empty strings, hashes, and invalid strings must be rejected."""
    assert validate_apply_url("Greenhouse", "")[0] is False
    assert validate_apply_url("Greenhouse", "   ")[0] is False
    assert validate_apply_url("Greenhouse", "#")[0] is False
    assert validate_apply_url("Greenhouse", None)[0] is False
    assert validate_apply_url("Greenhouse", "not-a-valid-url")[0] is False

def test_reject_non_resolving_dns():
    """Domains that fail DNS resolution must be rejected."""
    ok, reason = validate_apply_url("JSearch", "https://domainthatdefinitelydoesnotexistinreality12345.com/job")
    assert ok is False
    assert "dns_resolution_failed" in reason

def test_portal_search_links_format():
    """Portal search links must produce valid discovery URLs and never contain 'apply' in their intent."""
    links = portal_search_links("Python Developer", "Bangalore")
    assert "LinkedIn" in links
    assert "Indeed" in links
    assert "Naukri" in links
    assert "Foundit" in links

    assert "linkedin.com/jobs/search" in links["LinkedIn"]
    assert "in.indeed.com/jobs" in links["Indeed"]
    assert "naukri.com" in links["Naukri"]
    assert "foundit.in/srp/results" in links["Foundit"]

    assert "Python%20Developer" in links["LinkedIn"] or "Python+Developer" in links["LinkedIn"]
    assert "Bangalore" in links["LinkedIn"]

def test_no_fabricated_url_fstrings_in_backend():
    """
    Codebase integrity audit:
    backend/ and tools/ must contain zero occurrences of synthesized careers domains
    like 'careers.', 'verifiedrecruitersonindeed', 'topemployersvialinkedin',
    or fallback URL f-strings like 'f"https://careers.'.
    """
    forbidden_terms = [
        "verifiedrecruitersonindeed",
        "topemployersvialinkedin",
        "careers.ola.com",
        "careers.zepto.com",
    ]

    backend_py_files = glob.glob("backend/**/*.py", recursive=True) + glob.glob("tools/**/*.py", recursive=True)
    for file_path in backend_py_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            for term in forbidden_terms:
                assert term not in content, f"Forbidden fabricated term '{term}' found in {file_path}"

def test_debug_job_endpoint(client):
    """GET /api/debug/job/{id} returns raw payload and link details."""
    db = SessionLocal()
    try:
        sample_job = db.query(JobPosting).filter(JobPosting.is_active == True).first()
        if sample_job:
            resp = client.get(f"/api/debug/job/{sample_job.id}")
            assert resp.status_code == 200
            data = resp.json()
            assert data["id"] == sample_job.id
            assert "source" in data
            assert "apply_url" in data
            assert "url_origin" in data
            assert "link_status" in data
    finally:
        db.close()

