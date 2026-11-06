import uuid
import pytest
from fastapi.testclient import TestClient
from backend.server import app
from backend.database import Base, engine, SessionLocal
from backend.models import User, SavedJob, AppliedJob

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def unique_email():
    return f"candidate_{uuid.uuid4().hex[:8]}@example.com"

def test_signup_valid(client, unique_email):
    payload = {
        "name": "Arjun Sharma",
        "email": unique_email,
        "password": "strongPassword123!"
    }
    resp = client.post("/api/auth/signup", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == unique_email
    assert data["user"]["name"] == "Arjun Sharma"

def test_signup_short_password(client):
    payload = {
        "name": "Short Pass User",
        "email": f"short_{uuid.uuid4().hex[:6]}@example.com",
        "password": "short"
    }
    resp = client.post("/api/auth/signup", json=payload)
    assert resp.status_code == 422

def test_signup_duplicate_email(client, unique_email):
    payload = {
        "name": "Arjun Duplicate",
        "email": unique_email,
        "password": "validPassword123"
    }
    first_resp = client.post("/api/auth/signup", json=payload)
    assert first_resp.status_code == 201

    second_resp = client.post("/api/auth/signup", json=payload)
    assert second_resp.status_code == 400
    assert "already exists" in second_resp.json()["detail"]

def test_login_success_and_failure(client, unique_email):
    client.post("/api/auth/signup", json={
        "name": "Login Tester",
        "email": unique_email,
        "password": "strongPassword123!"
    })

    login_resp = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "strongPassword123!"
    })
    assert login_resp.status_code == 200
    tokens = login_resp.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens

    bad_resp = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "wrongPasswordXYZ"
    })
    assert bad_resp.status_code == 401
    data = bad_resp.json()
    assert "Incorrect password" in (data.get("detail") or data.get("error"))
    assert data.get("code") == "WRONG_PASSWORD"

def test_refresh_token(client, unique_email):
    signup_resp = client.post("/api/auth/signup", json={
        "name": "Refresh Tester",
        "email": unique_email,
        "password": "strongPassword123!"
    })
    refresh_token = signup_resp.json()["refresh_token"]

    refresh_resp = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_resp.status_code == 200
    data = refresh_resp.json()
    assert "access_token" in data
    assert "refresh_token" in data

def test_protected_me_endpoint(client, unique_email):
    unauth_resp = client.get("/api/auth/me")
    assert unauth_resp.status_code == 401

    signup_resp = client.post("/api/auth/signup", json={
        "name": "Me Endpoint Tester",
        "email": unique_email,
        "password": "strongPassword123!"
    })
    token = signup_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    auth_resp = client.get("/api/auth/me", headers=headers)
    assert auth_resp.status_code == 200
    user_data = auth_resp.json()
    assert user_data["user"]["email"] == unique_email
    assert "profile" in user_data
    assert "settings" in user_data

def test_user_profile_and_settings(client, unique_email):
    signup_resp = client.post("/api/auth/signup", json={
        "name": "Profile Tester",
        "email": unique_email,
        "password": "strongPassword123!"
    })
    token = signup_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    prof_update = client.post("/api/user/profile", json={
        "headline": "Lead Full Stack Engineer",
        "skills": ["React", "FastAPI", "TypeScript", "Python"],
        "years_experience": 3
    }, headers=headers)
    assert prof_update.status_code == 200

    prof_get = client.get("/api/user/profile", headers=headers)
    assert prof_get.status_code == 200
    assert prof_get.json()["headline"] == "Lead Full Stack Engineer"
    assert "React" in prof_get.json()["skills"]

    settings_update = client.put("/api/user/settings", json={
        "theme": "dark",
        "notify_new_matches": False
    }, headers=headers)
    assert settings_update.status_code == 200
    assert settings_update.json()["settings"]["theme"] == "dark"

# --- Phase A Tests: Apply Click, Confirm & Stats ---

def test_honest_apply_click_and_confirm(client, unique_email):
    signup_resp = client.post("/api/auth/signup", json={
        "name": "Honest Apply Tester",
        "email": unique_email,
        "password": "strongPassword123!"
    })
    token = signup_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    test_job = {
        "id": f"JOB-CLICK-{uuid.uuid4().hex[:6]}",
        "title": "Backend Systems Engineer",
        "company": "Razorpay",
        "location": "Bengaluru",
        "salary": "₹16,00,000",
        "source": "Greenhouse",
        "link": "https://boards.greenhouse.io/razorpay/jobs/123"
    }

    # 1. Apply click -> Status must be 'clicked', NOT applied
    click_resp = client.post("/api/jobs/apply-click", json={"job": test_job}, headers=headers)
    assert click_resp.status_code == 200
    data = click_resp.json()
    assert data["status"] == "clicked"
    record_id = data["id"]

    # 2. Check stats -> pending_confirm should be >= 1, total_applied 0
    stats_resp = client.get("/api/applications/stats", headers=headers)
    assert stats_resp.status_code == 200
    assert stats_resp.json()["pending_confirm"] >= 1

    # 3. Confirm application -> Status must update to 'applied'
    confirm_resp = client.post(f"/api/jobs/applied/{record_id}/confirm", headers=headers)
    assert confirm_resp.status_code == 200
    assert confirm_resp.json()["status"] == "applied"

    # 4. Check stats again -> total_applied should be >= 1
    stats_resp2 = client.get("/api/applications/stats", headers=headers)
    assert stats_resp2.status_code == 200
    assert stats_resp2.json()["total_applied"] >= 1

    # 5. Check timeline events recorded
    applied_list = client.get("/api/jobs/applied", headers=headers)
    assert applied_list.status_code == 200
    app_record = next(r for r in applied_list.json() if r["id"] == record_id)
    assert len(app_record["events"]) >= 2

# --- Phase B Tests: Interview Prep ---

def test_interview_prep_generation(client, unique_email):
    signup_resp = client.post("/api/auth/signup", json={
        "name": "Prep Tester",
        "email": unique_email,
        "password": "strongPassword123!"
    })
    token = signup_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    test_job = {
        "id": f"JOB-PREP-{uuid.uuid4().hex[:6]}",
        "title": "Machine Learning Engineer",
        "company": "Swiggy",
        "skills": ["Python", "PyTorch", "FastAPI"]
    }

    click_resp = client.post("/api/jobs/apply-click", json={"job": test_job}, headers=headers)
    record_id = click_resp.json()["id"]

    prep_resp = client.post(f"/api/applications/{record_id}/prep", headers=headers)
    assert prep_resp.status_code == 200
    prep_data = prep_resp.json()
    assert "disclaimer" in prep_data
    assert "AI-generated" in prep_data["disclaimer"]
    assert len(prep_data["questions"]) == 10
    assert len(prep_data["topics_to_revise"]) == 3

# --- Phase C & D Tests: Hybrid Search & Saved Searches ---

def test_hybrid_search_and_saved_searches(client, unique_email):
    signup_resp = client.post("/api/auth/signup", json={
        "name": "Search Tester",
        "email": unique_email,
        "password": "strongPassword123!"
    })
    token = signup_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Ensure at least one test job exists for searching
    db = SessionLocal()
    from backend.models import JobPosting
    if db.query(JobPosting).filter(JobPosting.title.ilike("%Python%")).count() == 0:
        job = JobPosting(
            id=f"test_job_{uuid.uuid4().hex[:6]}",
            title="Python Backend Engineer",
            company="TechCorp",
            location="Bengaluru",
            description="Looking for a Python Engineer",
            source="greenhouse",
            apply_url="https://boards.greenhouse.io/techcorp/jobs/123",
            is_active=True,
            is_demo=False
        )
        db.add(job)
        db.commit()
    db.close()

    # Search with Boolean query
    search_resp = client.get("/api/jobs/search?q=Python%20AND%20Engineer", headers=headers)
    assert search_resp.status_code == 200
    assert search_resp.json()["total"] >= 1

    # Create saved search
    save_s_resp = client.post("/api/saved-searches", json={"keyword": "Python", "location": "Bengaluru"}, headers=headers)
    assert save_s_resp.status_code == 200
    search_id = save_s_resp.json()["id"]

    # List saved searches
    list_s_resp = client.get("/api/saved-searches", headers=headers)
    assert list_s_resp.status_code == 200
    assert any(s["id"] == search_id for s in list_s_resp.json())

    # Delete saved search
    del_s_resp = client.delete(f"/api/saved-searches/{search_id}", headers=headers)
    assert del_s_resp.status_code == 200

# --- Rule 1 Test: Debug Info ---

def test_debug_info_endpoint(client):
    resp = client.get("/api/debug/info")
    assert resp.status_code == 200
    data = resp.json()
    assert data["app"] == "smart-hire"
    assert "vector_backend" in data
    assert "sources_configured" in data

# --- Step 3 Tests: Auth Error Codes, Cookies & Rate Limiting ---

def test_auth_error_codes(client, unique_email):
    # 1. Non-existent email
    non_existent = f"nonexistent_{uuid.uuid4().hex[:8]}@example.com"
    resp = client.post("/api/auth/login", json={"email": non_existent, "password": "anyPassword123"})
    assert resp.status_code == 401
    data = resp.json()
    assert data.get("code") == "EMAIL_NOT_FOUND"
    assert data.get("error") == "Please sign up first"

    # 2. Signup user
    signup_resp = client.post("/api/auth/signup", json={
        "name": "Auth Code Tester",
        "email": unique_email,
        "password": "correctPassword123"
    })
    assert signup_resp.status_code == 201

    # 3. Wrong password
    wrong_pwd_resp = client.post("/api/auth/login", json={"email": unique_email, "password": "wrongPassword123"})
    assert wrong_pwd_resp.status_code == 401
    wrong_data = wrong_pwd_resp.json()
    assert wrong_data.get("code") == "WRONG_PASSWORD"
    assert wrong_data.get("error") == "Incorrect password"

    # 4. Duplicate email
    dup_resp = client.post("/api/auth/signup", json={
        "name": "Duplicate Tester",
        "email": unique_email,
        "password": "correctPassword123"
    })
    assert dup_resp.status_code == 400
    dup_data = dup_resp.json()
    assert dup_data.get("code") == "EMAIL_EXISTS"
    assert "already registered" in dup_data.get("error", "")

def test_httponly_refresh_cookie_lifecycle(client, unique_email):
    # Signup sets cookie
    signup_resp = client.post("/api/auth/signup", json={
        "name": "Cookie Tester",
        "email": unique_email,
        "password": "validPassword123"
    })
    assert signup_resp.status_code == 201
    assert "refresh_token" in signup_resp.cookies

    # Login sets cookie
    login_resp = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "validPassword123"
    })
    assert login_resp.status_code == 200
    assert "refresh_token" in login_resp.cookies

    # Refresh endpoint works with cookie
    refresh_resp = client.post("/api/auth/refresh", json={})
    assert refresh_resp.status_code == 200
    assert "access_token" in refresh_resp.json()
    assert "refresh_token" in refresh_resp.cookies

    # Logout clears cookie
    logout_resp = client.post("/api/auth/logout")
    assert logout_resp.status_code == 200
    # Cookie should be expired or empty
    cookie_val = logout_resp.cookies.get("refresh_token")
    assert cookie_val is None or cookie_val == '""' or cookie_val == ""

def test_rate_limiting_failed_logins(client):
    target_email = f"ratelimit_{uuid.uuid4().hex[:8]}@example.com"
    # Attempts 1 to 5 should fail with 401
    for _ in range(5):
        resp = client.post("/api/auth/login", json={"email": target_email, "password": "wrong"})
        assert resp.status_code == 401

    # 6th attempt must be 429 RATE_LIMITED
    sixth_resp = client.post("/api/auth/login", json={"email": target_email, "password": "wrong"})
    assert sixth_resp.status_code == 429
    data = sixth_resp.json()
    assert data.get("code") == "RATE_LIMITED"
    assert "Too many attempts" in data.get("error", "")

