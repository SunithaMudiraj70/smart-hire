import os
import time
import uuid
import secrets
import datetime
import logging
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, BackgroundTasks, status
from fastapi.responses import JSONResponse

from backend.ingestion.runner import run_ingestion_pipeline
from backend.linkcheck import audit_all_db_links
from backend.database import SessionLocal

logger = logging.getLogger("smart_hire.admin")

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# Rate limit cooldown in seconds (prevents overlapping or spam ingestion runs)
INGEST_COOLDOWN_SECONDS = int(os.environ.get("ADMIN_INGEST_COOLDOWN_SECONDS", "30"))
_last_ingestion_timestamp: float = 0.0

def run_admin_ingest_cycle(run_id: str):
    """
    Executes one ingestion cycle followed by a link health audit.
    Runs inside FastAPI background worker thread.
    """
    logger.info(f"[ADMIN INGEST {run_id}] Background cycle starting...")
    start_time = time.time()
    try:
        # 1. Run ingestion pipeline across all active connectors
        run_ingestion_pipeline()

        # 2. Run link health check across active jobs
        db = SessionLocal()
        try:
            audit_all_db_links(db, concurrency=4)
        finally:
            db.close()

        elapsed = time.time() - start_time
        logger.info(f"[ADMIN INGEST {run_id}] Background cycle successfully finished in {elapsed:.2f}s")
    except Exception as e:
        logger.error(f"[ADMIN INGEST {run_id}] Error in background ingestion cycle: {e}", exc_info=True)

@router.post("/ingest", status_code=status.HTTP_202_ACCEPTED)
def trigger_admin_ingest(
    background_tasks: BackgroundTasks,
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token")
):
    """
    Triggers one complete ingestion pipeline cycle plus link health verification.
    Protected by constant-time comparison of X-Admin-Token against ADMIN_TOKEN.
    Rate limited with a cooldown period.
    Returns HTTP 202 Accepted immediately with a unique run_id.
    """
    global _last_ingestion_timestamp

    expected_token = os.environ.get("ADMIN_TOKEN", "smart-hire-admin-token")
    if not x_admin_token or not secrets.compare_digest(x_admin_token.strip(), expected_token.strip()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Admin-Token header"
        )

    now = time.time()
    elapsed_since_last = now - _last_ingestion_timestamp
    if _last_ingestion_timestamp > 0 and elapsed_since_last < INGEST_COOLDOWN_SECONDS:
        retry_after = int(INGEST_COOLDOWN_SECONDS - elapsed_since_last)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Ingestion already triggered recently. Retry after {retry_after}s.",
            headers={"Retry-After": str(retry_after)}
        )

    _last_ingestion_timestamp = now
    run_id = f"run_{uuid.uuid4().hex[:12]}"

    background_tasks.add_task(run_admin_ingest_cycle, run_id)

    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={
            "status": "accepted",
            "run_id": run_id,
            "message": "Ingestion and link check cycle queued",
            "queued_at": datetime.datetime.utcnow().isoformat() + "Z"
        }
    )
