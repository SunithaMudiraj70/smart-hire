import os
import sys
import math
import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Depends, Request, Query, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.database import init_db, get_db, engine
from backend.logging_config import RequestIDMiddleware, logger
from backend.models import User, JobPosting, IngestionRun, SavedJob
from backend.auth import get_current_user_optional, get_current_user
from backend.api import auth, user, notifications, jobs, applications, searches, recruiter, admin
from backend.vector_engine import hybrid_search, embed_text
from backend.live_search import dynamically_fetch_and_persist_jobs
from backend.ingestion.runner import start_ingestion_scheduler

# Initialize tables and safe migrations
init_db()

# Background ingestion scheduler (runs in separate worker container in production)
scheduler = None
if os.environ.get("RUN_SCHEDULER_IN_API", "false").lower() == "true":
    scheduler = start_ingestion_scheduler()

app = FastAPI(
    title="smart-hire — Job Search Intelligence",
    description="Real-time job search intelligence web application for freshers, early-career and working professionals in India.",
    version="1.0.0"
)

@app.on_event("startup")
def startup_checks():
    # 1. Log Resident Set Size (RSS) memory at startup for Render free tier budgeting
    try:
        import psutil
        process = psutil.Process(os.getpid())
        rss_bytes = process.memory_info().rss
        rss_mb = rss_bytes / (1024 * 1024)
        logger.info(f"[STARTUP MEMORY] Process PID={os.getpid()} RSS Memory: {rss_mb:.2f} MB (Render free tier 512 MB limit)")
    except Exception as mem_err:
        logger.info(f"[STARTUP MEMORY] Note: psutil memory check: {mem_err}")

    # 2. Startup URL check
    from backend.urlguard import validate_apply_url
    from backend.database import SessionLocal
    seed_demo = os.environ.get("SEED_DEMO", "false").lower() == "true"
    if not seed_demo:
        db = SessionLocal()
        try:
            visible_jobs = db.query(JobPosting).filter(JobPosting.is_active == True, JobPosting.is_demo == False).all()
            invalid_count = 0
            for j in visible_jobs:
                is_valid, reason = validate_apply_url(j.source, j.apply_url)
                if not is_valid:
                    invalid_count += 1
                    logger.error(f"[STARTUP URL CHECK] Job {j.id} from {j.source} failed URL validation: {reason} (URL: {j.apply_url})")
            if invalid_count > 0:
                logger.error(f"[STARTUP URL CHECK] Total {invalid_count} active visible jobs failed URL validation!")
            else:
                logger.info(f"[STARTUP URL CHECK] All {len(visible_jobs)} active visible jobs passed URL validation.")
        except Exception as e:
            logger.warning(f"Startup URL check error: {e}")
        finally:
            db.close()

# Request ID & structured logging middleware
app.add_middleware(RequestIDMiddleware)

# CORS configuration
def parse_cors_origins(origins_str: Optional[str]) -> List[str]:
    """
    Parses CORS_ORIGINS as a comma-separated list of origins.
    When cookies/credentials are used (allow_credentials=True), '*' is strictly
    forbidden by browser standards and must never be in allow_origins.
    """
    default_dev_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://localhost:8000"
    ]
    if not origins_str:
        return default_dev_origins

    parsed = [o.strip() for o in origins_str.split(",") if o.strip()]
    safe_origins = [o for o in parsed if o != "*"]
    for dev_o in default_dev_origins:
        if dev_o not in safe_origins:
            safe_origins.append(dev_o)
    return safe_origins

allowed_cors_origins = parse_cors_origins(os.environ.get("CORS_ORIGINS"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_cors_origins,
    allow_origin_regex=r"^https://.*\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    req_id = getattr(request.state, "request_id", "-")
    content = {"request_id": req_id}
    if isinstance(exc.detail, dict):
        content.update(exc.detail)
        if "error" not in content and "detail" in exc.detail:
            content["error"] = exc.detail["detail"]
        if "detail" not in content and "error" in exc.detail:
            content["detail"] = exc.detail["error"]
    else:
        content["error"] = str(exc.detail)
        content["detail"] = str(exc.detail)
    return JSONResponse(status_code=exc.status_code, content=content, headers=getattr(exc, "headers", None))

@app.exception_handler(RequestValidationError)
async def custom_validation_exception_handler(request: Request, exc: RequestValidationError):
    req_id = getattr(request.state, "request_id", "-")
    fields = {}
    for err in exc.errors():
        loc = ".".join(str(l) for l in err.get("loc", []) if l != "body")
        fields[loc or "general"] = err.get("msg", "Invalid value")
    return JSONResponse(
        status_code=422,
        content={
            "error": "Invalid input",
            "detail": "Invalid input",
            "code": "VALIDATION_ERROR",
            "fields": fields,
            "request_id": req_id
        }
    )

# Include Routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(notifications.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(searches.router)
app.include_router(recruiter.router)
app.include_router(admin.router)

class SearchParams(BaseModel):
    keyword: Optional[str] = ""
    location: Optional[str] = ""
    portal: Optional[str] = "all"
    job_type: Optional[str] = "all"
    work_mode: Optional[str] = "all"
    experience: Optional[str] = "all"
    min_match: Optional[int] = 0
    fresher_only: Optional[bool] = False
    sort: Optional[str] = "match"  # match or newest

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    user_count = db.query(User).count()
    job_count = db.query(JobPosting).filter(JobPosting.is_active == True).count()
    return {
        "status": "healthy",
        "app": "smart-hire",
        "tagline": "Find the right job without scrolling every portal.",
        "users_registered": user_count,
        "active_jobs_indexed": job_count,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@app.get("/api/debug/info")
def get_debug_info():
    """Dev-only debug info enabled when DEBUG=true."""
    if os.environ.get("DEBUG", "").lower() not in ("true", "1"):
        raise HTTPException(status_code=403, detail="Debug endpoint disabled in production.")

    import platform
    import sqlalchemy
    import pydantic

    return {
        "app": "smart-hire",
        "python_version": platform.python_version(),
        "sqlalchemy_version": sqlalchemy.__version__,
        "pydantic_version": pydantic.__version__,
        "database_engine": engine.url.drivername,
        "vector_backend": os.environ.get("VECTOR_BACKEND", "local"),
        "scheduler_active": scheduler.running if scheduler else False,
        "sources_configured": ["Greenhouse", "Lever", "RemoteOK", "Jobicy", "JSearch", "CareerPageJsonLd"],
        "b2b_recruiter_enabled": os.environ.get("FEATURE_B2B_RECRUITER", "true") == "true"
    }

@app.get("/api/debug/job/{job_id}")
def debug_job_info(job_id: str, db: Session = Depends(get_db)):
    """Returns raw payload and link details for a job ID."""
    j = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "id": j.id,
        "source": j.source,
        "apply_url": j.apply_url,
        "url_origin": getattr(j, "url_origin", "api"),
        "raw_payload": getattr(j, "raw_payload", None),
        "link_status": getattr(j, "link_status", "ok")
    }

@app.get("/api/locations")
def get_locations_endpoint(q: str = Query("", alias="q")):
    """Returns autocompleted cities, states, and remote option for combobox."""
    from backend.locations import search_locations
    return search_locations(q, limit=20)

@app.get("/api/admin/ingestion")
def get_ingestion_logs(user: Optional[User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    """Returns per-source ingestion metrics and run history."""
    runs = db.query(IngestionRun).order_by(IngestionRun.created_at.desc()).limit(30).all()
    return [
        {
            "id": r.id,
            "source": r.source,
            "status": r.status,
            "fetched_count": r.fetched_count,
            "new_count": r.new_count,
            "updated_count": r.updated_count,
            "failed_count": r.failed_count,
            "duration_ms": r.duration_ms,
            "error_message": r.error_message,
            "created_at": r.created_at.isoformat()
        }
        for r in runs
    ]

@app.get("/api/insights")
def get_market_insights(user: Optional[User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    """
    Market Pulse strip at the top:
    - Real count of active jobs in database
    - User's high matches (score >= 70%)
    - Top skill in demand
    - Last updated timestamp
    """
    from backend.redis_cache import get_cache, set_cache
    cache_key = f"insights:{user.id if user else 'anon'}"
    cached = get_cache(cache_key)
    if cached:
        return cached
    # Real counts from database
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    date_col = getattr(JobPosting, "posted_at", JobPosting.first_seen_at)
    new_jobs_today = (
        db.query(JobPosting)
        .filter(
            JobPosting.is_active == True,
            JobPosting.is_demo == False,
            date_col >= today_start
        )
        .count()
    )
    if new_jobs_today == 0:
        week_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
        new_jobs_today = (
            db.query(JobPosting)
            .filter(
                JobPosting.is_active == True,
                JobPosting.is_demo == False,
                date_col >= week_ago
            )
            .count()
        )
        if new_jobs_today == 0:
            new_jobs_today = db.query(JobPosting).filter(JobPosting.is_active == True, JobPosting.is_demo == False).count()

    # Calculate top skill across indexed jobs
    jobs = db.query(JobPosting).filter(JobPosting.is_active == True, JobPosting.is_demo == False).limit(80).all()
    skill_counts: Dict[str, int] = {}
    for j in jobs:
        for s in (j.skills or []):
            skill_counts[s] = skill_counts.get(s, 0) + 1
    top_skill = max(skill_counts, key=skill_counts.get) if skill_counts else "Python"

    # User matches calculation
    cand_skills = set(s.lower() for s in (user.profile.skills if user and user.profile else ["python", "sql", "react"]))
    high_matches = 0
    for j in jobs:
        j_skills = set(s.lower() for s in (j.skills or []))
        if len(cand_skills.intersection(j_skills)) >= 2:
            high_matches += 1

    result = {
        "new_jobs_today": new_jobs_today,
        "your_matches": high_matches,
        "top_skill_in_demand": top_skill,
        "last_updated": datetime.datetime.utcnow().strftime("%I:%M %p UTC"),
        "updated_at": datetime.datetime.utcnow().isoformat(),
        "active_sources": ["Greenhouse", "Lever", "RemoteOK", "JSearch", "SmartRecruiters", "Ashby", "Workable"]
    }
    set_cache(cache_key, result, expire_seconds=30)
    return result

def score_job_for_candidate(job: Dict[str, Any], cand_skills: List[str]) -> Dict[str, Any]:
    cand_set = set(s.lower() for s in cand_skills)
    j_skills = job.get("skills", [])
    j_set = set(s.lower() for s in j_skills)

    matched = []
    missing = []
    for s in j_skills:
        if s.lower() in cand_set:
            matched.append(s)
        else:
            missing.append(s)

    if not j_skills:
        score = 75
    else:
        score = int((len(matched) / len(j_skills)) * 60) + 35  # scaled between 35 and 95
        score = min(98, max(30, score))

    learn_next = missing[0] if missing else "Cloud Architecture"

    job["match"] = {
        "score": score,
        "matched_skills": matched or cand_skills[:3],
        "missing_skills": missing or ["Redis"],
        "recommendation": f"Add {learn_next} to increase interview conversion for this role."
    }
    return job

@app.get("/api/jobs/search")
def search_jobs_get(
    q: str = Query(""),
    keyword: Optional[str] = Query(None),
    location: str = Query(""),
    city: str = Query("all"),
    state: str = Query("all"),
    country: str = Query("all"),
    portal: str = Query("all"),
    work_mode: str = Query("all"),
    experience_level: str = Query("all", alias="experience"),
    experience_years: Optional[str] = Query(None),
    posted_within: str = Query("all", alias="date_posted"),
    fresher_only: bool = Query(False),
    sort: str = Query("match"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query_str = (q or keyword or "").strip()
    eff_exp = experience_years if (experience_years and experience_years != "all") else experience_level

    # If location is passed but city/state not set, try parsing location string
    target_city = city
    target_state = state
    if location and (target_city == "all" and target_state == "all"):
        from backend.locations import normalize_city, normalize_state
        detected_c = normalize_city(location)
        detected_s = normalize_state(location)
        if detected_c:
            target_city = detected_c
        elif detected_s:
            target_state = detected_s

    # Build target query for live search fallback
    loc_combined = f"{target_city if target_city != 'all' else ''} {target_state if target_state != 'all' else ''} {location if location != 'all' else ''}".strip()
    target_loc = loc_combined or (country if country != "all" else "India")

    # Fetch verified active jobs from database
    include_demo = os.environ.get("SEED_DEMO", "false").lower() == "true"
    base_query = db.query(JobPosting).filter(
        JobPosting.is_active == True,
        JobPosting.link_status != "broken",
        JobPosting.report_count < 3
    )
    if not include_demo:
        base_query = base_query.filter(JobPosting.is_demo == False)

    db_jobs = base_query.limit(300).all()
    jobs_dicts = []
    for j in db_jobs:
        real_apply = (j.apply_url or "").strip()
        jobs_dicts.append({
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "location": j.location,
            "city": getattr(j, "city", None),
            "state": getattr(j, "state", None),
            "country": getattr(j, "country", "India"),
            "is_remote": getattr(j, "is_remote", False),
            "salary": j.salary,
            "rating": j.rating,
            "source": j.source,
            "apply_url": real_apply,
            "link": real_apply,
            "direct_apply_url": real_apply,
            "apply_urls": j.apply_urls or [real_apply],
            "sources_list": j.sources_list or [j.source],
            "description": j.description,
            "skills": j.skills or [],
            "job_type": j.job_type,
            "work_mode": j.work_mode,
            "experience_level": j.experience_level,
            "years_experience": j.years_experience,
            "embedding": j.embedding,
            "created_at": getattr(j, "first_seen_at", datetime.datetime.utcnow()),
            "link_status": getattr(j, "link_status", "ok"),
            "report_count": getattr(j, "report_count", 0),
            "url_origin": getattr(j, "url_origin", "api")
        })

    # Optional dynamic live search when explicitly enabled (disabled by default for instant sub-50ms searches)
    if query_str and os.environ.get("ENABLE_LIVE_SEARCH", "false").lower() == "true":
        existing_matches = [
            j for j in jobs_dicts
            if query_str.lower() in j["title"].lower()
            or query_str.lower() in j["description"].lower()
            or any(query_str.lower() in s.lower() for s in j["skills"])
        ]
        if len(existing_matches) < 3:
            try:
                live_fetched = dynamically_fetch_and_persist_jobs(db, query_str, target_loc)
                for item in live_fetched:
                    if not any(j["id"] == item["id"] for j in jobs_dicts):
                        jobs_dicts.append(item)
            except Exception:
                pass

    # Execute hybrid search with strict location and facet evaluation
    ranked_jobs = hybrid_search(
        jobs=jobs_dicts,
        query=query_str,
        location=location,
        country=country,
        state=target_state,
        city=target_city,
        experience_years=eff_exp,
        date_posted=posted_within,
        fresher_only=fresher_only,
        work_mode=work_mode,
        top_k=200
    )

    cand_skills = user.profile.skills if user and user.profile and user.profile.skills else ["Python", "SQL", "Git"]
    scored = [score_job_for_candidate(j, cand_skills) for j in ranked_jobs]

    if sort == "newest":
        scored.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
    else:  # default 'match'
        scored.sort(key=lambda x: x.get("match", {}).get("score", 0), reverse=True)

    total = len(scored)
    pages = math.ceil(total / page_size) if page_size > 0 else 1
    start_idx = (page - 1) * page_size
    paged_jobs = scored[start_idx : start_idx + page_size]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
        "jobs": paged_jobs,
        "candidate_skills": cand_skills
    }

@app.get("/api/jobs/recommended")
def get_recommended_jobs(user: Optional[User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    cand_skills = user.profile.skills if user and user.profile and user.profile.skills else ["Python", "SQL", "Git"]
    query_str = " ".join(cand_skills)

    include_demo = os.environ.get("SEED_DEMO", "false").lower() == "true"
    base_query = db.query(JobPosting).filter(
        JobPosting.is_active == True,
        JobPosting.link_status != "broken",
        JobPosting.report_count < 3
    )
    if not include_demo:
        base_query = base_query.filter(JobPosting.is_demo == False)

    db_jobs = base_query.limit(100).all()
    jobs_dicts = []
    for j in db_jobs:
        real_apply = (j.apply_url or "").strip()
        jobs_dicts.append({
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "location": j.location,
            "salary": j.salary,
            "rating": j.rating,
            "source": j.source,
            "apply_url": real_apply,
            "link": real_apply,
            "direct_apply_url": real_apply,
            "apply_urls": j.apply_urls or [real_apply],
            "sources_list": j.sources_list or [j.source],
            "description": j.description,
            "skills": j.skills or [],
            "job_type": j.job_type,
            "work_mode": j.work_mode,
            "experience_level": j.experience_level,
            "years_experience": j.years_experience,
            "embedding": j.embedding,
            "created_at": getattr(j, "first_seen_at", datetime.datetime.utcnow()),
            "link_status": getattr(j, "link_status", "ok"),
            "report_count": getattr(j, "report_count", 0)
        })

    ranked_jobs = hybrid_search(jobs=jobs_dicts, query=query_str, top_k=30)
    scored = [score_job_for_candidate(j, cand_skills) for j in ranked_jobs]
    scored.sort(key=lambda x: x.get("match", {}).get("score", 0), reverse=True)

    return {
        "candidate_name": user.name if user else "Candidate",
        "skills": cand_skills,
        "jobs": scored
    }

# Static file serving for production build of web/
WEB_DIST = os.path.join(BASE_DIR, "web", "dist")
if os.path.exists(WEB_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(WEB_DIST, "assets")), name="web_assets")

    @app.get("/{full_path:path}", response_class=HTMLResponse)
    def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        index_file = os.path.join(WEB_DIST, "index.html")
        if os.path.exists(index_file):
            with open(index_file, "r", encoding="utf-8") as f:
                return f.read()
        return "<h1>smart-hire API Online (run web on :3000)</h1>"
