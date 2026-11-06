import os
import time
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import Response

from backend.server import app, parse_cors_origins
from backend.database import normalize_database_url
from backend.api.auth import _set_refresh_cookie
from backend.email_service import send_email, send_candidate_job_digest

@pytest.fixture
def client():
    return TestClient(app)

# -----------------------------------------------------------------------------
# 1. Database URL Scheme Normalization Tests (SQLAlchemy 2 compatibility)
# -----------------------------------------------------------------------------
def test_normalize_database_url_legacy_postgres():
    """Converts legacy postgres:// to postgresql:// required by SQLAlchemy 2."""
    legacy_url = "postgres://smart_hire_user:secret_pass@db.render.com:5432/smart_hire"
    normalized = normalize_database_url(legacy_url)
    assert normalized == "postgresql://smart_hire_user:secret_pass@db.render.com:5432/smart_hire"
    assert normalized.startswith("postgresql://")

def test_normalize_database_url_already_postgresql():
    """Preserves already-compliant postgresql:// URL without alteration."""
    standard_url = "postgresql://user:pass@localhost:5432/smart_hire"
    assert normalize_database_url(standard_url) == standard_url

def test_normalize_database_url_sqlite_and_empty():
    """Preserves SQLite URLs and handles empty or None inputs safely."""
    sqlite_url = "sqlite:///./smart_hire.db"
    assert normalize_database_url(sqlite_url) == sqlite_url
    assert normalize_database_url("") == "sqlite:///./smart_hire.db"
    assert normalize_database_url(None) == "sqlite:///./smart_hire.db"

# -----------------------------------------------------------------------------
# 2. CORS Origins Parsing Tests (Never wildcard '*' with credentials)
# -----------------------------------------------------------------------------
def test_cors_origins_never_wildcard():
    """Wildcard '*' must be stripped out so browsers do not reject credentials/cookies."""
    origins_with_wildcard = "https://smart-hire-web.onrender.com, *, http://localhost:3000"
    safe_origins = parse_cors_origins(origins_with_wildcard)
    assert "*" not in safe_origins
    assert "https://smart-hire-web.onrender.com" in safe_origins
    assert "http://localhost:3000" in safe_origins

def test_cors_origins_empty_fallback():
    """Empty or None CORS_ORIGINS falls back to safe local dev origins."""
    fallback_origins = parse_cors_origins("")
    assert "*" not in fallback_origins
    assert "http://localhost:3000" in fallback_origins

# -----------------------------------------------------------------------------
# 3. Refresh Cookie Security Tests
# -----------------------------------------------------------------------------
def test_refresh_cookie_secure_in_production(monkeypatch):
    """Cookie must have secure=True when ENV=production or ENVIRONMENT=production."""
    monkeypatch.setenv("ENV", "production")
    resp = Response()
    _set_refresh_cookie(resp, "test-refresh-token-xyz")

    set_cookie_header = resp.headers.get("set-cookie", "")
    assert "httponly" in set_cookie_header.lower()
    assert "samesite=lax" in set_cookie_header.lower()
    assert "secure" in set_cookie_header.lower()

def test_refresh_cookie_in_development(monkeypatch):
    """Cookie has secure=False in local dev so localhost HTTP testing succeeds."""
    monkeypatch.setenv("ENV", "development")
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.setenv("COOKIE_SECURE", "false")
    resp = Response()
    _set_refresh_cookie(resp, "test-refresh-token-dev")

    set_cookie_header = resp.headers.get("set-cookie", "")
    assert "httponly" in set_cookie_header.lower()
    assert "samesite=lax" in set_cookie_header.lower()
    assert "secure" not in set_cookie_header.lower()

# -----------------------------------------------------------------------------
# 4. Admin Ingestion Endpoint Tests (POST /api/admin/ingest)
# -----------------------------------------------------------------------------
def test_admin_ingest_missing_token(client):
    """Rejects request with 401 Unauthorized when X-Admin-Token header is missing."""
    resp = client.post("/api/admin/ingest")
    assert resp.status_code == 401
    assert "Invalid or missing X-Admin-Token" in resp.json().get("detail", "")

def test_admin_ingest_invalid_token(client, monkeypatch):
    """Rejects request with 401 Unauthorized when X-Admin-Token header does not match."""
    monkeypatch.setenv("ADMIN_TOKEN", "valid-secret-token-12345")
    resp = client.post("/api/admin/ingest", headers={"X-Admin-Token": "wrong-token"})
    assert resp.status_code == 401
    assert "Invalid or missing X-Admin-Token" in resp.json().get("detail", "")

def test_admin_ingest_success_and_rate_limit(client, monkeypatch):
    """
    Valid token returns 202 Accepted with run_id and queues background task.
    Consecutive invocation within cooldown period returns 429 Too Many Requests.
    """
    token = "test-admin-token-render-2026"
    monkeypatch.setenv("ADMIN_TOKEN", token)
    monkeypatch.setenv("ADMIN_INGEST_COOLDOWN_SECONDS", "30")

    # Reset last ingestion timestamp for clean test run
    import backend.api.admin as admin_module
    admin_module._last_ingestion_timestamp = 0.0

    # Mock the heavy background cycle
    with patch("backend.api.admin.run_ingestion_pipeline") as mock_pipeline, \
         patch("backend.api.admin.audit_all_db_links") as mock_linkcheck:

        # First call: Should succeed with 202 Accepted
        resp1 = client.post("/api/admin/ingest", headers={"X-Admin-Token": token})
        assert resp1.status_code == 202
        data1 = resp1.json()
        assert data1["status"] == "accepted"
        assert "run_id" in data1
        assert data1["run_id"].startswith("run_")

        # Second call immediately after: Should be rate limited with 429
        resp2 = client.post("/api/admin/ingest", headers={"X-Admin-Token": token})
        assert resp2.status_code == 429
        assert "Rate limit exceeded" in resp2.json().get("detail", "")

# -----------------------------------------------------------------------------
# 5. Email Digest Service Tests (Resend HTTP API & Dry-Run Mode)
# -----------------------------------------------------------------------------
def test_email_service_dry_run_mode(monkeypatch):
    """When RESEND_API_KEY is not set, email service operates in safe dry-run mode."""
    monkeypatch.setenv("RESEND_API_KEY", "")
    res = send_email(
        to_email="candidate@example.com",
        subject="Welcome to smart-hire",
        html_content="<p>Test digest</p>"
    )
    assert res["status"] == "dry_run"
    assert "Email logged in dry-run mode" in res["message"]

def test_email_digest_builder_dry_run(monkeypatch):
    """send_candidate_job_digest formats top jobs and executes dry-run dispatch."""
    monkeypatch.setenv("RESEND_API_KEY", "")
    sample_jobs = [
        {
            "title": "Full Stack Engineer",
            "company": "Tech Corp",
            "location": "Bengaluru, Karnataka",
            "apply_url": "https://boards.greenhouse.io/techcorp/jobs/1",
            "match": {"score": 85}
        }
    ]
    res = send_candidate_job_digest(
        user_email="dev@example.com",
        user_name="Alex",
        top_jobs=sample_jobs
    )
    assert res["status"] == "dry_run"
    assert res["to"] == "dev@example.com"
