import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

def normalize_database_url(url: str | None) -> str:
    """
    Ensures DATABASE_URL conforms to SQLAlchemy 2 requirements.
    Replaces legacy 'postgres://' scheme with 'postgresql://'.
    """
    if not url:
        return "sqlite:///./smart_hire.db"
    clean_url = str(url).strip()
    if clean_url.startswith("postgres://"):
        return clean_url.replace("postgres://", "postgresql://", 1)
    return clean_url

raw_db_url = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DATABASE_URL") or "sqlite:///./smart_hire.db"
DATABASE_URL = normalize_database_url(raw_db_url)

engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production PostgreSQL connection pool configuration
    engine_kwargs["pool_size"] = int(os.environ.get("DB_POOL_SIZE", "20"))
    engine_kwargs["max_overflow"] = int(os.environ.get("DB_MAX_OVERFLOW", "10"))
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = int(os.environ.get("DB_POOL_RECYCLE", "1800"))

try:
    engine = create_engine(DATABASE_URL, **engine_kwargs)
    with engine.connect() as conn:
        pass
except Exception as e:
    print(f"[Warning] Failed to connect to {DATABASE_URL} ({e}). Falling back to sqlite:///./smart_hire.db")
    DATABASE_URL = "sqlite:///./smart_hire.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_safe_migrations():
    """
    Safe schema migration for existing SQLite or Postgres tables.
    Adds any missing columns to applied_jobs or job_postings without dropping user data.
    """
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    # Migrate applied_jobs
    if "applied_jobs" in table_names:
        existing_cols = {col["name"] for col in inspector.get_columns("applied_jobs")}
        desired_cols = {
            "source": "VARCHAR(100) DEFAULT 'Direct ATS'",
            "apply_url": "VARCHAR(1000) DEFAULT ''",
            "clicked_at": "DATETIME",
            "applied_at": "DATETIME",
            "confirmed_via": "VARCHAR(50) DEFAULT 'manual'",
            "notes": "TEXT DEFAULT ''",
            "interview_prep_cache": "JSON",
        }
        with engine.begin() as conn:
            for col_name, col_type in desired_cols.items():
                if col_name not in existing_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE applied_jobs ADD COLUMN {col_name} {col_type}"))
                    except Exception:
                        pass

    # Migrate job_postings
    if "job_postings" in table_names:
        existing_cols = {col["name"] for col in inspector.get_columns("job_postings")}
        desired_job_cols = {
            "city": "VARCHAR(100)",
            "state": "VARCHAR(100)",
            "country": "VARCHAR(100) DEFAULT 'India'",
            "is_remote": "BOOLEAN DEFAULT 0",
            "salary": "VARCHAR(100) DEFAULT 'Competitive'",
            "rating": "VARCHAR(20) DEFAULT ''",
            "source": "VARCHAR(100) DEFAULT 'Greenhouse'",
            "apply_url": "VARCHAR(1000) DEFAULT ''",
            "apply_urls": "JSON",
            "sources_list": "JSON",
            "description": "TEXT DEFAULT ''",
            "skills": "JSON",
            "job_type": "VARCHAR(100) DEFAULT 'Full-time'",
            "work_mode": "VARCHAR(50) DEFAULT 'remote'",
            "experience_level": "VARCHAR(50) DEFAULT 'fresher'",
            "years_experience": "VARCHAR(50) DEFAULT '0-2 years'",
            "dedupe_key": "VARCHAR(255)",
            "is_active": "BOOLEAN DEFAULT 1",
            "is_demo": "BOOLEAN DEFAULT 0",
            "url_origin": "VARCHAR(50) DEFAULT 'api'",
            "raw_payload": "TEXT",
            "link_status": "VARCHAR(50) DEFAULT 'ok'",
            "link_checked_at": "DATETIME",
            "report_count": "INTEGER DEFAULT 0",
            "embedding": "JSON",
            "first_seen_at": "DATETIME",
            "last_seen_at": "DATETIME"
        }
        with engine.begin() as conn:
            for col_name, col_type in desired_job_cols.items():
                if col_name not in existing_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE job_postings ADD COLUMN {col_name} {col_type}"))
                    except Exception:
                        pass

        # Backfill location fields for jobs missing city/state
        try:
            from backend.locations import parse_location
            with engine.begin() as conn:
                rows = conn.execute(text("SELECT id, location FROM job_postings WHERE city IS NULL AND state IS NULL")).fetchall()
                for r in rows:
                    jid, loc_str = r[0], r[1]
                    parsed = parse_location(loc_str or "")
                    conn.execute(
                        text("UPDATE job_postings SET city = :city, state = :state, country = :country, is_remote = :is_remote, work_mode = CASE WHEN work_mode IS NULL OR work_mode = '' THEN :work_mode ELSE work_mode END WHERE id = :id"),
                        {
                            "id": jid,
                            "city": parsed["city"],
                            "state": parsed["state"],
                            "country": parsed["country"],
                            "is_remote": 1 if parsed["is_remote"] else 0,
                            "work_mode": parsed["work_mode"]
                        }
                    )
        except Exception:
            pass

        # Clean up fake ratings, fake salaries, and normalize skills
        try:
            from backend.skills_extractor import clean_skills
            import json
            with engine.begin() as conn:
                # 1. Nullify fake star ratings
                conn.execute(text("UPDATE job_postings SET rating = NULL WHERE rating LIKE '%★%' OR rating LIKE '%rating%'"))
                # 2. Nullify fake placeholder salaries
                conn.execute(text(
                    "UPDATE job_postings SET salary = NULL WHERE "
                    "LOWER(salary) IN ('competitive', 'market standard', 'not disclosed', 'undisclosed', '₹0', '$0', '0') "
                    "OR salary LIKE '₹14,00,000 - ₹28,00,000%' "
                    "OR salary LIKE '₹16,00,000 - ₹30,00,000%' "
                    "OR salary LIKE '₹18,00,000 - ₹32,00,000%'"
                ))
                # 3. Clean up skills
                rows = conn.execute(text("SELECT id, skills FROM job_postings")).fetchall()
                for r in rows:
                    jid, raw_skills = r[0], r[1]
                    if raw_skills:
                        try:
                            parsed_s = json.loads(raw_skills) if isinstance(raw_skills, str) else raw_skills
                            cleaned_s = clean_skills(parsed_s)
                            conn.execute(
                                text("UPDATE job_postings SET skills = :skills WHERE id = :id"),
                                {"id": jid, "skills": json.dumps(cleaned_s)}
                            )
                        except Exception:
                            pass
        except Exception:
            pass

    # Migrate saved_searches
    if "saved_searches" in table_names:
        existing_cols = {col["name"] for col in inspector.get_columns("saved_searches")}
        desired_search_cols = {
            "keyword": "VARCHAR(255) DEFAULT ''",
            "location": "VARCHAR(255) DEFAULT ''",
            "filters": "JSON",
            "last_notified_at": "DATETIME",
            "created_at": "DATETIME"
        }
        with engine.begin() as conn:
            for col_name, col_type in desired_search_cols.items():
                if col_name not in existing_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE saved_searches ADD COLUMN {col_name} {col_type}"))
                    except Exception:
                        pass

    # Migrate ingestion_runs
    if "ingestion_runs" in table_names:
        existing_cols = {col["name"] for col in inspector.get_columns("ingestion_runs")}
        desired_run_cols = {
            "source": "VARCHAR(100)",
            "status": "VARCHAR(50) DEFAULT 'success'",
            "fetched_count": "INTEGER DEFAULT 0",
            "new_count": "INTEGER DEFAULT 0",
            "updated_count": "INTEGER DEFAULT 0",
            "failed_count": "INTEGER DEFAULT 0",
            "duration_ms": "INTEGER DEFAULT 0",
            "error_message": "TEXT DEFAULT ''",
            "created_at": "DATETIME"
        }
        with engine.begin() as conn:
            for col_name, col_type in desired_run_cols.items():
                if col_name not in existing_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE ingestion_runs ADD COLUMN {col_name} {col_type}"))
                    except Exception:
                        pass

def init_db():
    import backend.models  # Ensure all models are registered
    Base.metadata.create_all(bind=engine)
    try:
        run_safe_migrations()
    except Exception as e:
        print(f"[Migration] Notice: {e}")
