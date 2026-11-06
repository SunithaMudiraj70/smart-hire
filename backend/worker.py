"""
smart-hire Background Scheduler Worker
Runs ingestion every 30 minutes, link checks hourly, and expires stale jobs unseen for 14 days.
Decoupled from the web API server for multi-worker production scalability.
"""

import os
import sys
import time
import logging
import datetime
from apscheduler.schedulers.blocking import BlockingScheduler

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.database import SessionLocal, init_db
from backend.models import JobPosting
from backend.ingestion.runner import run_ingestion_pipeline
from backend.linkcheck import audit_all_db_links
from backend.logging_config import logger

def job_ingestion_task():
    logger.info("[WORKER] Running scheduled ingestion task (every 30m)...")
    try:
        run_ingestion_pipeline()
    except Exception as e:
        logger.error(f"[WORKER] Ingestion task failed: {e}", exc_info=True)

def job_linkcheck_task():
    logger.info("[WORKER] Running scheduled hourly link health audit...")
    db = SessionLocal()
    try:
        stats = audit_all_db_links(db, concurrency=8)
        logger.info(f"[WORKER] Link health audit finished: {stats}")
    except Exception as e:
        logger.error(f"[WORKER] Link health audit failed: {e}", exc_info=True)
    finally:
        db.close()

def job_expire_stale_task():
    logger.info("[WORKER] Running 14-day stale job expiry sweep...")
    db = SessionLocal()
    try:
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=14)
        expired_count = db.query(JobPosting).filter(
            JobPosting.is_active == True,
            JobPosting.last_seen_at < cutoff
        ).update({"is_active": False})
        db.commit()
        logger.info(f"[WORKER] Expired {expired_count} stale jobs unseen for > 14 days.")
    except Exception as e:
        logger.error(f"[WORKER] Stale job expiry failed: {e}", exc_info=True)
    finally:
        db.close()

def main():
    logger.info("Initializing smart-hire background worker...")
    init_db()

    scheduler = BlockingScheduler()
    # Ingestion every 30 minutes
    scheduler.add_job(job_ingestion_task, "interval", minutes=30, id="ingestion_30m", next_run_time=datetime.datetime.now())
    # Link check every 60 minutes
    scheduler.add_job(job_linkcheck_task, "interval", hours=1, id="linkcheck_hourly")
    # Expire stale jobs daily
    scheduler.add_job(job_expire_stale_task, "interval", hours=12, id="expire_stale_12h")

    logger.info("smart-hire background worker started. Scheduled jobs: ingestion (30m), linkcheck (1h), expire_stale (12h).")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("smart-hire background worker stopped.")

if __name__ == "__main__":
    main()

