#!/usr/bin/env python3
"""
End-to-End Smoke Test for smart-hire
Executes complete candidate lifecycle via HTTP against the running backend:
1. Signup
2. Search positions (Boolean & keyword)
3. Recommended positions
4. Save job bookmark
5. Apply click (status=clicked)
6. Confirm application (status=applied)
7. Pipeline stats verification
8. Notifications verification
9. Settings verification
Prints PASS/FAIL per step with request id on failure.
"""

import sys
import uuid
import requests

BASE_URL = "http://127.0.0.1:8000"

def run_smoke_test():
    print("\n--- smart-hire End-to-End Smoke Test ---\n")
    session = requests.Session()

    test_email = f"smoketest_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "SmokeTestPassword123!"

    # Step 1: Signup
    signup_payload = {
        "name": "Smoke Test Candidate",
        "email": test_email,
        "password": test_password
    }
    r = session.post(f"{BASE_URL}/api/auth/signup", json=signup_payload)
    req_id = r.headers.get("X-Request-ID", "-")
    if r.status_code == 201:
        tokens = r.json()
        token = tokens["access_token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        print(f"[PASS] 1. Candidate Signup ({test_email})")
    else:
        print(f"[FAIL] 1. Candidate Signup failed ({r.status_code}) - Request ID: {req_id}")
        return False

    # Step 2: Search jobs
    r = session.get(f"{BASE_URL}/api/jobs/search?q=Python&fresher_only=true")
    req_id = r.headers.get("X-Request-ID", "-")
    if r.status_code == 200 and r.json().get("total", 0) > 0:
        jobs = r.json()["jobs"]
        test_job = jobs[0]
        print(f"[PASS] 2. Job Search (Returned {len(jobs)} jobs)")
    else:
        print(f"[FAIL] 2. Job Search failed ({r.status_code}) - Request ID: {req_id}")
        return False

    # Step 3: Recommended jobs
    r = session.get(f"{BASE_URL}/api/jobs/recommended")
    req_id = r.headers.get("X-Request-ID", "-")
    if r.status_code == 200 and len(r.json().get("jobs", [])) > 0:
        print(f"[PASS] 3. Recommended Jobs (Returned {len(r.json()['jobs'])} recommendations)")
    else:
        print(f"[FAIL] 3. Recommended Jobs failed ({r.status_code}) - Request ID: {req_id}")
        return False

    # Step 4: Save job
    r = session.post(f"{BASE_URL}/api/jobs/save", json={"job": test_job})
    req_id = r.headers.get("X-Request-ID", "-")
    if r.status_code == 200 and r.json().get("is_saved") is True:
        print(f"[PASS] 4. Save Job Bookmark ({test_job.get('title')})")
    else:
        print(f"[FAIL] 4. Save Job Bookmark failed ({r.status_code}) - Request ID: {req_id}")
        return False

    # Step 5: Apply click (status=clicked)
    r = session.post(f"{BASE_URL}/api/jobs/apply-click", json={"job": test_job})
    req_id = r.headers.get("X-Request-ID", "-")
    if r.status_code == 200 and r.json().get("status") == "clicked":
        app_record_id = r.json()["id"]
        print(f"[PASS] 5. Apply Click (Status set to 'clicked', ID: {app_record_id})")
    else:
        print(f"[FAIL] 5. Apply Click failed ({r.status_code}) - Request ID: {req_id}")
        return False

    # Step 6: Confirm application (status=applied)
    r = session.post(f"{BASE_URL}/api/jobs/applied/{app_record_id}/confirm")
    req_id = r.headers.get("X-Request-ID", "-")
    if r.status_code == 200 and r.json().get("status") == "applied":
        print(f"[PASS] 6. Confirm Application (Status updated to 'applied')")
    else:
        print(f"[FAIL] 6. Confirm Application failed ({r.status_code}) - Request ID: {req_id}")
        return False

    # Step 7: Pipeline stats
    r = session.get(f"{BASE_URL}/api/applications/stats")
    req_id = r.headers.get("X-Request-ID", "-")
    if r.status_code == 200 and r.json().get("total_applied", 0) >= 1:
        stats = r.json()
        print(f"[PASS] 7. Application Stats (Total applied: {stats['total_applied']}, response rate: {stats['response_rate']})")
    else:
        print(f"[FAIL] 7. Application Stats failed ({r.status_code}) - Request ID: {req_id}")
        return False

    # Step 8: Notifications
    r = session.get(f"{BASE_URL}/api/notifications")
    req_id = r.headers.get("X-Request-ID", "-")
    if r.status_code == 200 and len(r.json()) > 0:
        print(f"[PASS] 8. Notifications ({len(r.json())} notifications received)")
    else:
        print(f"[FAIL] 8. Notifications failed ({r.status_code}) - Request ID: {req_id}")
        return False

    # Step 9: Settings
    r = session.get(f"{BASE_URL}/api/user/settings")
    req_id = r.headers.get("X-Request-ID", "-")
    if r.status_code == 200 and "notify_new_matches" in r.json():
        print(f"[PASS] 9. User Settings verified")
    else:
        print(f"[FAIL] 9. User Settings failed ({r.status_code}) - Request ID: {req_id}")
        return False

    print("\n==================================================")
    print("ALL 9 SMOKE TEST STEPS PASSED!\n")
    return True

if __name__ == "__main__":
    success = run_smoke_test()
    sys.exit(0 if success else 1)

