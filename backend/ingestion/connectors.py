import os
import re
import json
import logging
import requests
from typing import List, Dict, Any, Optional, Callable
from backend.ingestion.base import BaseConnector
from backend.ingestion.models import (
    NormalizedJob,
    generate_dedupe_key,
    classify_experience_level,
    classify_work_mode
)
from backend.skills_extractor import clean_skills, extract_skills_from_text

logger = logging.getLogger("smart_hire.ingestion")

def get_nested(data: Dict[str, Any], path: str, default: Any = None) -> Any:
    """Helper to extract nested dictionary values via dot-notation (e.g. 'location.name')."""
    if not isinstance(data, dict):
        return default
    keys = path.split(".")
    val = data
    for k in keys:
        if isinstance(val, dict):
            val = val.get(k)
        else:
            return default
    return val if val is not None else default

class DeclarativeConnector(BaseConnector):
    """
    Base declarative connector that maps JSON API payloads to NormalizedJob instances.
    Reduces code duplication across ATS endpoints.
    """
    name: str = "Declarative"
    title_path: str = "title"
    company_path: str = "company"
    location_path: str = "location"
    apply_url_path: str = "apply_url"
    desc_path: str = "description"
    tags_path: Optional[str] = None
    default_work_mode: str = "remote"

    def fetch_jobs(self, limit: int = 30) -> List[NormalizedJob]:
        return []

    def map_item(self, item: Dict[str, Any], prefix: str = "", default_company: Optional[str] = None) -> Optional[NormalizedJob]:
        if not isinstance(item, dict):
            return None

        title = get_nested(item, self.title_path) or "Software Engineer"
        company = default_company or get_nested(item, self.company_path) or "Employer"
        location = get_nested(item, self.location_path) or "Remote / India"
        apply_url = get_nested(item, self.apply_url_path)

        if not apply_url or not isinstance(apply_url, str) or not apply_url.startswith("http") or apply_url.strip() == "#":
            return None

        apply_url = apply_url.strip()
        desc = get_nested(item, self.desc_path) or ""
        clean_desc = re.sub(r"<[^>]+>", " ", str(desc))[:1200]

        # Extract skills
        raw_tags = get_nested(item, self.tags_path, []) if self.tags_path else []
        tags = [str(t) for t in raw_tags] if isinstance(raw_tags, list) else []
        skills = clean_skills(tags + extract_skills_from_text(title + " " + clean_desc))

        job_id = f"{prefix}-{get_nested(item, 'id') or abs(hash(apply_url)) % 100000}"
        dedupe = generate_dedupe_key(company, title, location)

        return NormalizedJob(
            id=job_id,
            title=title,
            company=company,
            location=location,
            salary=None,
            rating=None,
            source=self.name,
            apply_url=apply_url,
            apply_urls=[apply_url],
            sources_list=[self.name],
            description=clean_desc or f"{company} is hiring for {title}.",
            skills=skills,
            job_type="Full-time",
            work_mode=classify_work_mode(location, title, clean_desc),
            experience_level=classify_experience_level(title, clean_desc),
            years_experience="0-2 years" if "fresher" in classify_experience_level(title) else "1-3 years",
            dedupe_key=dedupe,
            url_origin="api",
            raw_payload=json.dumps(item),
            link_status="ok"
        )

class RemoteOKConnector(DeclarativeConnector):
    name = "RemoteOK"
    title_path = "position"
    company_path = "company"
    location_path = "location"
    apply_url_path = "url"
    desc_path = "description"
    tags_path = "tags"

    def fetch_jobs(self, limit: int = 30) -> List[NormalizedJob]:
        results = []
        try:
            url = "https://remoteok.com/api"
            headers = {"User-Agent": "smart-hire-agent/1.0 (+https://smart-hire.app)"}
            res = requests.get(url, headers=headers, timeout=8)
            if res.status_code == 200:
                data = res.json()
                for item in data[1:limit + 1]:
                    job = self.map_item(item, prefix="ROK")
                    if job:
                        sal_min, sal_max = item.get("salary_min"), item.get("salary_max")
                        if sal_min and sal_max and sal_min > 0:
                            job.salary = f"${sal_min:,} - ${sal_max:,}"
                        results.append(job)
        except Exception as e:
            logger.warning(f"RemoteOK connector error: {e}")
        return results

class JobicyConnector(DeclarativeConnector):
    name = "Jobicy"
    title_path = "jobTitle"
    company_path = "companyName"
    location_path = "jobGeo"
    apply_url_path = "url"
    desc_path = "jobDescription"

    def fetch_jobs(self, limit: int = 30) -> List[NormalizedJob]:
        results = []
        try:
            url = f"https://jobicy.com/api/v2/remote-jobs?count={limit}"
            res = requests.get(url, timeout=8)
            if res.status_code == 200:
                data = res.json().get("jobs", [])
                for item in data[:limit]:
                    job = self.map_item(item, prefix="JBY")
                    if job:
                        try:
                            s_min = int(item.get("annualSalaryMin") or 0)
                            s_max = int(item.get("annualSalaryMax") or 0)
                            if s_min > 0 and s_max > 0:
                                job.salary = f"${s_min:,} - ${s_max:,}"
                        except Exception:
                            pass
                        results.append(job)
        except Exception as e:
            logger.warning(f"Jobicy connector error: {e}")
        return results

def get_verified_boards() -> Dict[str, List[str]]:
    boards_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "config", "boards.json")
    try:
        with open(boards_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {
            "greenhouse": ["canonical", "cloudflare", "figma", "gitlab"],
            "lever": ["palantir", "spotify"],
            "ashby": ["sentry", "linear", "replit", "notion"]
        }

class GreenhouseConnector(DeclarativeConnector):
    name = "Greenhouse"
    title_path = "title"
    location_path = "location.name"
    apply_url_path = "absolute_url"

    def fetch_jobs(self, limit: int = 30) -> List[NormalizedJob]:
        results = []
        boards = get_verified_boards().get("greenhouse", ["canonical", "cloudflare", "figma", "gitlab"])
        for board in boards:
            if len(results) >= limit:
                break
            try:
                url = f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs"
                res = requests.get(url, timeout=6)
                if res.status_code == 200:
                    for j in res.json().get("jobs", []):
                        job = self.map_item(j, prefix="GH", default_company=board.title())
                        if job:
                            results.append(job)
                        if len(results) >= limit:
                            break
            except Exception as e:
                logger.warning(f"Greenhouse board {board} error: {e}")
        return results

class LeverConnector(DeclarativeConnector):
    name = "Lever"
    title_path = "text"
    location_path = "categories.location"
    apply_url_path = "hostedUrl"
    desc_path = "descriptionPlain"

    def fetch_jobs(self, limit: int = 30) -> List[NormalizedJob]:
        results = []
        sites = get_verified_boards().get("lever", ["palantir", "spotify"])
        for site in sites:
            if len(results) >= limit:
                break
            try:
                url = f"https://api.lever.co/v0/postings/{site}?mode=json"
                res = requests.get(url, timeout=6)
                if res.status_code == 200:
                    for j in res.json():
                        job = self.map_item(j, prefix="LEV", default_company=site.title())
                        if job:
                            results.append(job)
                        if len(results) >= limit:
                            break
            except Exception as e:
                logger.warning(f"Lever site {site} error: {e}")
        return results

class AshbyConnector(DeclarativeConnector):
    name = "Ashby"
    title_path = "title"
    location_path = "location"
    apply_url_path = "jobUrl"

    def fetch_jobs(self, limit: int = 30) -> List[NormalizedJob]:
        results = []
        boards = get_verified_boards().get("ashby", ["sentry", "linear", "replit", "notion"])
        for board in boards:
            if len(results) >= limit:
                break
            try:
                url = f"https://api.ashbyhq.com/posting-api/job-board/{board}"
                res = requests.get(url, timeout=6)
                if res.status_code == 200:
                    for j in res.json().get("jobs", []):
                        job = self.map_item(j, prefix="ASH", default_company=board.title())
                        if job:
                            results.append(job)
                        if len(results) >= limit:
                            break
            except Exception as e:
                logger.warning(f"Ashby board {board} error: {e}")
        return results

class JSearchConnector(DeclarativeConnector):
    name = "JSearch"
    title_path = "job_title"
    company_path = "employer_name"
    apply_url_path = "job_apply_link"
    desc_path = "job_description"

    def fetch_jobs(self, limit: int = 30) -> List[NormalizedJob]:
        rapid_key = os.environ.get("RAPID_API_KEY")
        if not rapid_key:
            return []
        results = []
        try:
            url = "https://jsearch.p.rapidapi.com/search-v2"
            headers = {"X-RapidAPI-Key": rapid_key, "X-RapidAPI-Host": "jsearch.p.rapidapi.com"}
            params = {"query": "software engineer fresher India", "num_pages": "1"}
            res = requests.get(url, headers=headers, params=params, timeout=7)
            if res.status_code == 200:
                data = res.json()
                raw_jobs = data.get("data", {}).get("jobs", []) if isinstance(data.get("data"), dict) else data.get("data", [])
                for j in raw_jobs[:limit]:
                    loc = f"{j.get('job_city', '')}, {j.get('job_state', '')}, {j.get('job_country', 'India')}".strip(", ")
                    job = self.map_item(j, prefix="JS")
                    if job:
                        if loc:
                            job.location = loc
                        min_sal = j.get('job_min_salary')
                        max_sal = j.get('job_max_salary')
                        if min_sal and max_sal and min_sal > 0:
                            job.salary = f"₹{min_sal:,} - ₹{max_sal:,}"
                        results.append(job)
        except Exception as e:
            logger.warning(f"JSearch connector error: {e}")
        return results

ALL_CONNECTORS: List[BaseConnector] = [
    RemoteOKConnector(),
    JobicyConnector(),
    GreenhouseConnector(),
    LeverConnector(),
    AshbyConnector(),
    JSearchConnector(),
]
