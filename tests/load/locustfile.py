import os
import sys
import uuid
import random
from locust import HttpUser, task, between

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.auth import create_access_token
from backend.database import SessionLocal
from backend.models import User

SAMPLE_KEYWORDS = ["Python", "React", "Frontend", "Backend", "Data Engineer", "Machine Learning"]
SAMPLE_LOCATIONS = ["Bengaluru", "Hyderabad", "Pune", "Delhi NCR", "Remote"]
SAMPLE_WORK_MODES = ["all", "remote", "hybrid"]

class CandidateUser(HttpUser):
    wait_time = between(0.3, 1.0)

    def on_start(self):
        """Simulate authenticated candidate using genuine signed JWT and DB user."""
        db = SessionLocal()
        u = db.query(User).filter(User.role == "candidate").first()
        user_id = u.id if u else "2ea7099a-a6e7-44de-af0a-72ab41f2aad8"
        email = u.email if u else "candidate_test1@example.com"
        db.close()

        token = create_access_token(user_id=user_id, email=email, name="Candidate")
        self.headers = {"Authorization": f"Bearer {token}"}

    @task(6)
    def search_jobs(self):
        """Search jobs with various filters and pagination."""
        keyword = random.choice(SAMPLE_KEYWORDS)
        location = random.choice(SAMPLE_LOCATIONS)
        work_mode = random.choice(SAMPLE_WORK_MODES)

        self.client.get(
            "/api/jobs/search",
            params={
                "q": keyword,
                "location": location,
                "work_mode": work_mode,
                "page": 1,
                "page_size": 20
            },
            headers=self.headers,
            name="/api/jobs/search"
        )

    @task(3)
    def get_market_insights(self):
        """Fetch real-time market pulse insights."""
        self.client.get("/api/insights", headers=self.headers, name="/api/insights")

    @task(2)
    def save_and_apply_job(self):
        """Simulate saving a job and clicking apply."""
        res = self.client.get(
            "/api/jobs/search?q=Python&page=1&page_size=5",
            headers=self.headers,
            name="/api/jobs/search"
        )
        if res.status_code == 200:
            jobs = res.json().get("jobs", [])
            if jobs:
                job = jobs[0]

                # Toggle save
                self.client.post(
                    "/api/jobs/save",
                    json={"job": job},
                    headers=self.headers,
                    name="/api/jobs/save"
                )

                # Register apply click
                click_res = self.client.post(
                    "/api/jobs/apply-click",
                    json={"job": job},
                    headers=self.headers,
                    name="/api/jobs/apply-click"
                )

                if click_res.status_code == 200:
                    rec_id = click_res.json().get("id")
                    if rec_id:
                        # Confirm application
                        self.client.post(
                            f"/api/applications/{rec_id}/confirm",
                            json={"notes": "Applied via load test flow"},
                            headers=self.headers,
                            name="/api/applications/{id}/confirm"
                        )
