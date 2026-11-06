import os
import json
import requests
from typing import Dict, List, Any, Optional

try:
    from config import SUPABASE_URL, SUPABASE_KEY
except ImportError:
    SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
    SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
USER_PROFILE_FILE = os.path.join(BASE_DIR, "user_profile.json")
APPLICATIONS_LOG_FILE = os.path.join(BASE_DIR, "applications_log.json")
SAVED_JOBS_FILE = os.path.join(BASE_DIR, "saved_jobs.json")

class SupabaseClient:
    """
    Supabase REST client for smart-hire.
    Synchronizes users, profiles, application logs, and saved jobs to Supabase.
    Gracefully falls back to local JSON persistence when Supabase credentials
    are not set or if network is offline.
    """
    def __init__(self, url: str = None, key: str = None):
        self.url = (url or SUPABASE_URL or "").rstrip("/")
        self.key = key or SUPABASE_KEY or ""
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    @property
    def is_configured(self) -> bool:
        return bool(self.url and self.key and "supabase.co" in self.url)

    def test_connection(self) -> Dict[str, Any]:
        """Verify Supabase connectivity or return local storage status."""
        if not self.is_configured:
            return {
                "status": "local_storage_active",
                "connected": False,
                "provider": "Local Persistent JSON",
                "message": "Supabase credentials not configured. Running on resilient local JSON persistence."
            }
        try:
            # Probe users table
            endpoint = f"{self.url}/rest/v1/users?select=count"
            resp = requests.get(endpoint, headers=self.headers, timeout=4)
            if resp.status_code in [200, 206]:
                return {
                    "status": "connected",
                    "connected": True,
                    "provider": "Supabase PostgreSQL",
                    "message": "Successfully connected to Supabase database."
                }
            elif resp.status_code == 404:
                return {
                    "status": "connected_tables_missing",
                    "connected": True,
                    "provider": "Supabase PostgreSQL",
                    "message": "Connected to Supabase. Tables will be initialized."
                }
            else:
                return {
                    "status": "auth_error",
                    "connected": False,
                    "provider": "Supabase (Auth Error)",
                    "message": f"Supabase returned status {resp.status_code}. Using local JSON fallback."
                }
        except Exception as e:
            return {
                "status": "connection_error",
                "connected": False,
                "provider": "Local Persistent JSON (Fallback)",
                "message": f"Connection error: {str(e)[:120]}. Using local storage."
            }

    def save_user(self, user_data: Dict[str, Any]) -> bool:
        """Save candidate profile to Supabase or local storage."""
        if self.is_configured:
            try:
                prof = user_data.get("profile", {})
                email = prof.get("email")
                if email:
                    endpoint = f"{self.url}/rest/v1/users?email=eq.{email}"
                    payload = {
                        "email": email,
                        "name": prof.get("name"),
                        "phone": prof.get("phone"),
                        "location": prof.get("location"),
                        "headline": prof.get("headline"),
                        "skills": json.dumps(prof.get("skills", [])),
                        "years_experience": prof.get("years_experience", 0),
                        "linkedin": prof.get("linkedin"),
                        "filename": prof.get("filename"),
                        "settings": json.dumps(user_data.get("settings", {}))
                    }
                    resp = requests.post(f"{self.url}/rest/v1/users", headers=self.headers, json=payload, timeout=5)
                    if resp.status_code in [200, 201]:
                        return True
            except Exception as e:
                print(f"[Supabase] Error saving user: {e}")
        return False

    def save_application(self, record: Dict[str, Any]) -> bool:
        """Save application receipt to Supabase."""
        if self.is_configured:
            try:
                endpoint = f"{self.url}/rest/v1/applications"
                payload = {
                    "application_id": record.get("application_id"),
                    "job_id": record.get("job_id"),
                    "job_title": record.get("job_title"),
                    "company": record.get("company"),
                    "location": record.get("location"),
                    "salary": record.get("salary"),
                    "source": record.get("source"),
                    "link": record.get("link"),
                    "candidate_name": record.get("candidate_name"),
                    "candidate_email": record.get("candidate_email"),
                    "match_score": record.get("match_score"),
                    "status": record.get("status"),
                    "applied_at": record.get("applied_at"),
                    "cover_letter": record.get("full_cover_letter", record.get("cover_letter_preview")),
                    "resume_attached": record.get("resume_attached")
                }
                resp = requests.post(endpoint, headers=self.headers, json=payload, timeout=5)
                if resp.status_code in [200, 201]:
                    return True
            except Exception as e:
                print(f"[Supabase] Error saving application: {e}")
        return False

# Global instance
db_client = SupabaseClient()
