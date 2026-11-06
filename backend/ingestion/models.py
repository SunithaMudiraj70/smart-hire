import re
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

def generate_dedupe_key(company: str, title: str, location: str = "") -> str:
    """Generates normalized deduplication key from company, title, and optional location."""
    clean_company = re.sub(r"[^a-z0-9]", "", company.lower())
    clean_title = re.sub(r"[^a-z0-9]", "", title.lower())
    clean_loc = re.sub(r"[^a-z0-9]", "", (location or "").lower())[:15]
    if clean_loc:
        return f"{clean_company}:{clean_title}:{clean_loc}"
    return f"{clean_company}:{clean_title}"

def classify_experience_level(title: str, description: str = "", exp_str: str = "") -> str:
    """
    Classifies a job into: 'internship', 'fresher', 'junior', 'mid', 'senior'
    based on title, description, and years of experience patterns.
    """
    text = f"{title} {exp_str} {description[:400]}".lower()

    if any(k in text for k in ["intern", "internship", "trainee", "apprentice", "student"]):
        return "internship"

    if any(k in text for k in ["fresher", "entry level", "entry-level", "graduate", "campus", "0-1 year", "0-1 yr", "0 to 1", "0-2 year", "0-2 yr"]):
        return "fresher"

    if any(k in text for k in ["junior", "associate", "1-3 year", "1-3 yr", "1 to 3", "early career", "early-career"]):
        return "junior"

    if any(k in text for k in ["lead", "principal", "staff", "architect", "director", "head of", "vp", "5+ year", "6+ year", "7+ year", "8+ year", "10+ year", "senior", "sr."]):
        return "senior"

    return "mid"

def classify_work_mode(location: str, title: str = "", description: str = "") -> str:
    text = f"{location} {title} {description[:200]}".lower()
    if "remote" in text or "work from home" in text or "wfh" in text:
        return "remote"
    if "hybrid" in text:
        return "hybrid"
    return "onsite"

class NormalizedJob(BaseModel):
    id: str
    title: str
    company: str
    location: str = "India / Remote"
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "India"
    is_remote: bool = False
    salary: Optional[str] = None
    rating: Optional[str] = None
    source: str
    apply_url: str
    apply_urls: List[str] = Field(default_factory=list)
    sources_list: List[str] = Field(default_factory=list)
    description: str = ""
    skills: List[str] = Field(default_factory=list)
    job_type: str = "Full-time"
    work_mode: str = "remote"
    experience_level: str = "fresher"
    years_experience: str = "0-2 years"
    dedupe_key: str = ""
    url_origin: str = "api"
    raw_payload: Optional[str] = None
    link_status: str = "ok"

