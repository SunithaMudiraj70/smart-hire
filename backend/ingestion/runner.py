import os
import time
import datetime
import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.models import JobPosting, IngestionRun, User, SavedSearch
from backend.ingestion.connectors import ALL_CONNECTORS
from backend.ingestion.models import NormalizedJob
from backend.vector_engine import embed_text
from backend.api.notifications import notify
from backend.urlguard import validate_apply_url
from backend.locations import parse_location

logger = logging.getLogger("smart_hire.ingestion")

def run_ingestion_pipeline():
    """
    Executes the ingestion pipeline across all configured connectors.
    Logs metrics per source into ingestion_runs.
    Upserts into job_postings with deduplication and dense embeddings.
    """
    logger.info("Starting smart-hire ingestion pipeline...")
    db = SessionLocal()
    try:
        newly_added_jobs: List[JobPosting] = []

        for connector in ALL_CONNECTORS:
            start_t = time.time()
            source_name = connector.name
            fetched = 0
            new_c = 0
            updated_c = 0
            failed_c = 0
            err_msg = ""

            try:
                jobs = connector.fetch_jobs(limit=25)
                fetched = len(jobs)
                seen_in_batch = {}

                for j in jobs:
                    try:
                        # URL Guard: Validate apply URL against allowlist & DNS resolution
                        is_valid, reason = validate_apply_url(j.source, j.apply_url)
                        if not is_valid:
                            failed_c += 1
                            logger.warning(f"URL Guard rejected job {j.id} from {j.source} ({j.apply_url}): {reason}")
                            continue

                        loc_parsed = parse_location(j.location or "")
                        job_city = getattr(j, "city", None) or loc_parsed["city"]
                        job_state = getattr(j, "state", None) or loc_parsed["state"]
                        job_country = getattr(j, "country", None) or loc_parsed["country"]
                        job_is_remote = getattr(j, "is_remote", False) or loc_parsed["is_remote"]
                        job_work_mode = j.work_mode if j.work_mode and j.work_mode != "onsite" else loc_parsed["work_mode"]

                        existing = seen_in_batch.get(j.id) or seen_in_batch.get(j.dedupe_key) or db.query(JobPosting).filter((JobPosting.id == j.id) | (JobPosting.dedupe_key == j.dedupe_key)).first()
                        if existing:
                            # Cross-source deduplication: merge apply_urls and sources
                            urls = set(existing.apply_urls or [])
                            urls.add(j.apply_url)
                            existing.apply_urls = list(urls)

                            srcs = set(existing.sources_list or [])
                            srcs.add(j.source)
                            existing.sources_list = list(srcs)

                            existing.last_seen_at = datetime.datetime.utcnow()
                            existing.is_active = True
                            if getattr(j, "raw_payload", None):
                                existing.raw_payload = j.raw_payload
                            if job_city and not existing.city:
                                existing.city = job_city
                            if job_state and not existing.state:
                                existing.state = job_state
                            existing.is_remote = existing.is_remote or job_is_remote
                            seen_in_batch[j.id] = existing
                            seen_in_batch[j.dedupe_key] = existing
                            updated_c += 1
                        else:
                            # Generate embedding for dense vector semantic search
                            content = f"{j.title} {' '.join(j.skills)} {j.description[:600]}"
                            vec = embed_text(content)

                            new_job = JobPosting(
                                id=j.id,
                                title=j.title,
                                company=j.company,
                                location=j.location,
                                city=job_city,
                                state=job_state,
                                country=job_country,
                                is_remote=job_is_remote,
                                salary=j.salary,
                                rating=j.rating,
                                source=j.source,
                                apply_url=j.apply_url,
                                apply_urls=j.apply_urls or [j.apply_url],
                                sources_list=j.sources_list or [j.source],
                                description=j.description,
                                skills=j.skills,
                                job_type=j.job_type,
                                work_mode=job_work_mode,
                                experience_level=j.experience_level,
                                years_experience=j.years_experience,
                                dedupe_key=j.dedupe_key,
                                is_active=True,
                                is_demo=False,
                                url_origin=getattr(j, "url_origin", "api"),
                                raw_payload=getattr(j, "raw_payload", None),
                                link_status=getattr(j, "link_status", "ok"),
                                embedding=vec,
                                first_seen_at=datetime.datetime.utcnow(),
                                last_seen_at=datetime.datetime.utcnow()
                            )
                            db.add(new_job)
                            db.flush()
                            seen_in_batch[j.id] = new_job
                            seen_in_batch[j.dedupe_key] = new_job
                            newly_added_jobs.append(new_job)
                            new_c += 1
                    except Exception as item_err:
                        db.rollback()
                        failed_c += 1
                        logger.warning(f"Error upserting job {j.id}: {item_err}")

                db.commit()
            except Exception as source_err:
                err_msg = str(source_err)
                logger.error(f"Connector {source_name} failed: {source_err}")

            duration_ms = int((time.time() - start_t) * 1000)

            # Record ingestion run log
            run_log = IngestionRun(
                source=source_name,
                status="failed" if err_msg and fetched == 0 else ("partial" if failed_c > 0 else "success"),
                fetched_count=fetched,
                new_count=new_c,
                updated_count=updated_c,
                failed_count=failed_c,
                duration_ms=duration_ms,
                error_message=err_msg,
                started_at=datetime.datetime.fromtimestamp(start_t),
                completed_at=datetime.datetime.utcnow(),
                created_at=datetime.datetime.utcnow()
            )
            db.add(run_log)
            db.commit()

        # Inactivity sweep: Mark jobs unseen for > 14 days inactive
        fourteen_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=14)
        db.query(JobPosting).filter(JobPosting.last_seen_at < fourteen_days_ago).update({"is_active": False})
        db.commit()

        # Notify candidates on newly added matching jobs
        if newly_added_jobs:
            notify_users_on_new_jobs(db, newly_added_jobs)

        logger.info(f"Ingestion completed. {len(newly_added_jobs)} new positions added.")
    finally:
        db.close()

def notify_users_on_new_jobs(db: Session, jobs: List[JobPosting]):
    """
    Checks newly added jobs against candidate skills and saved searches.
    Calls notify() respecting candidate notification settings.
    """
    candidates = db.query(User).filter(User.role == "candidate").all()
    for user in candidates:
        if not user.profile or not user.profile.skills:
            continue
        user_skills = set(s.lower() for s in user.profile.skills)
        for job in jobs[:5]:
            job_skills = set(s.lower() for s in job.skills or [])
            overlap = user_skills.intersection(job_skills)
            if len(overlap) >= 2:
                notify(
                    db=db,
                    user_id=user.id,
                    title=f"New match: {job.title} at {job.company}",
                    body=f"Matches your skills in {', '.join(list(overlap)[:3])}.",
                    kind="match",
                    job_id=job.id
                )
                break  # Send at most 1 batch match alert per run

def start_ingestion_scheduler():
    """Initializes APScheduler to run ingestion every 2 hours."""
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        scheduler = BackgroundScheduler(daemon=True)
        scheduler.add_job(run_ingestion_pipeline, "interval", hours=2, id="job_ingestion")
        scheduler.start()
        logger.info("APScheduler initialized: Ingestion running every 2 hours.")
        return scheduler
    except Exception as e:
        logger.warning(f"Failed to start APScheduler: {e}")
        return None

