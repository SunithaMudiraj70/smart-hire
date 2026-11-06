#!/usr/bin/env python3
"""
scripts/purge_bad_urls.py
Audits every job posting in smart_hire.db against urlguard.validate_apply_url.
Deletes all jobs with fabricated URLs, non-resolving domains, or allowlist violations.
Also deletes legacy synthetic demo records.
Then runs a fresh ingestion cycle using verified real ATS APIs.
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.database import SessionLocal, init_db
from backend.models import JobPosting, SavedJob, AppliedJob
from backend.urlguard import validate_apply_url
from backend.ingestion.runner import run_ingestion_pipeline

def purge_bad_jobs():
    init_db()
    db = SessionLocal()
    try:
        jobs = db.query(JobPosting).all()
        print(f"--- Purging Bad & Fabricated URLs from Database ---")
        print(f"Total job postings currently in DB: {len(jobs)}")

        deleted_count = 0
        deleted_reasons = {}
        deleted_by_source = {}

        for j in jobs:
            should_delete = False
            reason = "ok"

            # 1. Any legacy synthetic demo or mock job
            if getattr(j, "is_demo", False) or j.id.startswith(("JOB-SEED-", "LIVE-LI-", "LIVE-IND-", "LIVE-ISH-")):
                should_delete = True
                reason = "legacy_demo_or_mock"
            elif not j.apply_url or not j.apply_url.startswith("https://"):
                should_delete = True
                reason = "missing_or_non_https"
            else:
                is_valid, val_reason = validate_apply_url(j.source, j.apply_url)
                if not is_valid:
                    should_delete = True
                    reason = val_reason

            if should_delete:
                deleted_count += 1
                deleted_reasons[reason] = deleted_reasons.get(reason, 0) + 1
                src = j.source or "Unknown"
                deleted_by_source[src] = deleted_by_source.get(src, 0) + 1

                # Clean up any cascades in saved_jobs or applied_jobs
                db.query(SavedJob).filter(SavedJob.job_id == j.id).delete(synchronize_session=False)
                db.query(AppliedJob).filter(AppliedJob.job_id == j.id).delete(synchronize_session=False)
                db.delete(j)

        db.commit()

        print(f"\nPurged {deleted_count} invalid job records.")
        print("\nBreakdown of Deletions by Reason:")
        for r, cnt in sorted(deleted_reasons.items(), key=lambda x: x[1], reverse=True):
            print(f"  {r:35s}: {cnt}")

        print("\nBreakdown of Deletions by Source:")
        for s, cnt in sorted(deleted_by_source.items(), key=lambda x: x[1], reverse=True):
            print(f"  {s:35s}: {cnt}")

        remaining = db.query(JobPosting).count()
        print(f"\nRemaining verified job postings in DB: {remaining}")

        return deleted_count, remaining
    finally:
        db.close()

if __name__ == "__main__":
    deleted, remaining = purge_bad_jobs()
    print("\nRunning ingestion pipeline to fetch fresh, verified ATS postings...")
    run_ingestion_pipeline()
    print("\n[SUCCESS] Bad URLs purged and fresh ingestion complete.")

