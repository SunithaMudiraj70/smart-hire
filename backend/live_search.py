import os
import re
import json
import urllib.parse
import uuid
import datetime
import logging
import requests
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.models import JobPosting
from backend.ingestion.models import generate_dedupe_key, classify_experience_level, classify_work_mode
from backend.ingestion.connectors import extract_skills_from_text
from backend.vector_engine import embed_text
from backend.urlguard import validate_apply_url

logger = logging.getLogger("smart_hire.live_search")

RAPID_API_KEY = os.environ.get("RAPID_API_KEY", "765c41d967msh7e25ccc8dea6ab1p19daf1jsn32c47dc2018c")
RAPIDAPI_HOST = os.environ.get("RAPIDAPI_HOST", "jsearch.p.rapidapi.com")

# Query expansion aliases for common industry search terms
QUERY_EXPANSIONS = {
    "fde": "Forward Deployed Engineer",
    "sde": "Software Development Engineer",
    "fresher": "Software Engineer Fresher entry level",
    "support": "Customer Support Representative",
    "customer support": "Customer Support Associate",
    "cs": "Customer Support Specialist",
    "qa": "Quality Assurance Engineer Software Tester",
    "sre": "Site Reliability Engineer DevOps",
    "ml": "Machine Learning Engineer",
    "ai": "Artificial Intelligence Engineer",
    "pm": "Product Manager",
    "intern": "Software Engineering Intern",
    "internship": "Internship fresher"
}

def fetch_live_rapidapi_jobs(keyword: str, location: str = "India", limit: int = 15) -> List[Dict[str, Any]]:
    """Fetches live real-world jobs from RapidAPI JSearch (aggregating LinkedIn, Indeed, Glassdoor, etc.)."""
    if not RAPID_API_KEY:
        return []

    # Apply query expansion if applicable
    q_lower = keyword.lower().strip()
    expanded_q = QUERY_EXPANSIONS.get(q_lower, keyword)
    search_query = f"{expanded_q} in {location}".strip() if location else expanded_q

    headers = {
        "x-rapidapi-key": RAPID_API_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST
    }
    params = {
        "query": search_query,
        "num_pages": "1"
    }

    results = []
    try:
        url = f"https://{RAPIDAPI_HOST}/search-v2"
        res = requests.get(url, headers=headers, params=params, timeout=7)
        if res.status_code == 200:
            payload = res.json()
            data = payload.get("data", {})
            raw_jobs = data.get("jobs", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])

            for j in raw_jobs[:limit]:
                title = j.get("job_title") or "Software Engineer"
                company = j.get("employer_name") or "Tech Employer"
                city = j.get("job_city") or ""
                state = j.get("job_state") or ""
                country = j.get("job_country") or "India"
                loc = f"{city}, {state}, {country}".strip(", ") or (location or "India")

                publisher = j.get("job_publisher") or "Direct Employer"
                raw_link = j.get("job_apply_link")
                if not raw_link or not isinstance(raw_link, str) or not raw_link.startswith("http") or raw_link.strip() == "#":
                    # Compliance Rule: Skip jobs with no real URL
                    continue
                valid_url = raw_link.strip()

                # URL Guard: Validate apply URL against allowlist & DNS resolution
                is_val, reason = validate_apply_url(publisher, valid_url)
                if not is_val:
                    logger.info(f"RapidAPI job '{title}' rejected ({valid_url}): {reason}")
                    continue

                min_sal = j.get("job_min_salary")
                max_sal = j.get("job_max_salary")
                salary = f"₹{int(min_sal):,} - ₹{int(max_sal):,} a year" if min_sal and max_sal else "Competitive"

                desc = j.get("job_description") or ""
                skills = extract_skills_from_text(f"{title} {desc}")

                results.append({
                    "id": f"RAPID-{j.get('job_id', uuid.uuid4().hex[:8])[:16]}",
                    "title": title,
                    "company": company,
                    "location": loc,
                    "salary": salary,
                    "rating": "4.3 ★",
                    "source": publisher,
                    "apply_url": valid_url,
                    "apply_urls": [valid_url],
                    "sources_list": [publisher],
                    "description": desc[:1000] if len(desc) > 1000 else desc,
                    "skills": skills or ["Customer Support", "Communication"],
                    "job_type": "Full-time",
                    "work_mode": classify_work_mode(loc, title, desc),
                    "experience_level": classify_experience_level(title, desc),
                    "years_experience": "0-2 years",
                    "created_at": datetime.datetime.utcnow(),
                    "link_status": "ok",
                    "is_demo": False,
                    "url_origin": "api",
                    "raw_payload": json.dumps(j)
                })
    except Exception as e:
        logger.warning(f"Live RapidAPI JSearch query error for '{keyword}': {e}")

    return results

def dynamically_fetch_and_persist_jobs(
    db: Session,
    keyword: str,
    location: str = "India"
) -> List[Dict[str, Any]]:
    """
    Fetches real live job postings via RapidAPI JSearch,
    generates dense vector embeddings, caches them in JobPosting table,
    and returns normalized job dictionaries with direct application links.
    """
    live_jobs = fetch_live_rapidapi_jobs(keyword, location, limit=15)

    # Persist and embed to DB for instant subsequent lookups
    persisted_dicts = []
    for item in live_jobs:
        dedupe = generate_dedupe_key(item["company"], item["title"], item.get("location", ""))

        # Check if already in DB
        existing = db.query(JobPosting).filter((JobPosting.id == item["id"]) | (JobPosting.dedupe_key == dedupe)).first()
        if existing:
            persisted_dicts.append({
                "id": existing.id,
                "title": existing.title,
                "company": existing.company,
                "location": existing.location,
                "salary": existing.salary,
                "rating": existing.rating,
                "source": existing.source,
                "apply_url": existing.apply_url,
                "link": existing.apply_url,
                "direct_apply_url": existing.apply_url,
                "apply_urls": existing.apply_urls or [existing.apply_url],
                "sources_list": existing.sources_list or [existing.source],
                "description": existing.description,
                "skills": existing.skills or [],
                "job_type": existing.job_type,
                "work_mode": existing.work_mode,
                "experience_level": existing.experience_level,
                "years_experience": existing.years_experience,
                "embedding": existing.embedding,
                "created_at": getattr(existing, "first_seen_at", datetime.datetime.utcnow())
            })
            continue

        text_for_embedding = f"{item['title']} {item['company']} {item['location']} {' '.join(item['skills'])} {item['description']}"
        emb = embed_text(text_for_embedding)

        new_post = JobPosting(
            id=item["id"],
            dedupe_key=dedupe,
            title=item["title"],
            company=item["company"],
            location=item["location"],
            salary=item["salary"],
            rating=item["rating"],
            source=item["source"],
            apply_url=item["apply_url"],
            apply_urls=item["apply_urls"],
            sources_list=item["sources_list"],
            description=item["description"],
            skills=item["skills"],
            job_type=item["job_type"],
            work_mode=item["work_mode"],
            experience_level=item["experience_level"],
            years_experience=item["years_experience"],
            is_active=True,
            is_demo=False,
            url_origin=item.get("url_origin", "api"),
            raw_payload=item.get("raw_payload"),
            link_status="ok",
            report_count=0,
            embedding=emb,
            first_seen_at=datetime.datetime.utcnow(),
            last_seen_at=datetime.datetime.utcnow()
        )
        db.add(new_post)
        item["embedding"] = emb
        item["link"] = item["apply_url"]
        item["direct_apply_url"] = item["apply_url"]
        persisted_dicts.append(item)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.warning(f"Failed to commit dynamic live jobs: {e}")

    return persisted_dicts
