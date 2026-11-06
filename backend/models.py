import uuid
import datetime
from sqlalchemy import Column, String, DateTime, Text, Boolean, Integer, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from backend.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="candidate")  # candidate, recruiter, org_admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan", order_by="desc(Notification.created_at)")
    saved_jobs = relationship("SavedJob", back_populates="user", cascade="all, delete-orphan", order_by="desc(SavedJob.created_at)")
    applied_jobs = relationship("AppliedJob", back_populates="user", cascade="all, delete-orphan", order_by="desc(AppliedJob.applied_at)")
    saved_searches = relationship("SavedSearch", back_populates="user", cascade="all, delete-orphan")
    interview_notes = relationship("InterviewNote", back_populates="user", cascade="all, delete-orphan")
    org_memberships = relationship("OrgMembership", back_populates="user", cascade="all, delete-orphan")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    headline = Column(String(255), default="Software Engineer")
    phone = Column(String(50), default="")
    location = Column(String(150), default="India")
    years_experience = Column(Integer, default=1)
    target_roles = Column(JSON, default=list)
    skills = Column(JSON, default=list)
    resume_filename = Column(String(255), default="")
    resume_text = Column(Text, default="")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="profile")

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    notify_new_matches = Column(Boolean, default=True)
    email_digest = Column(Boolean, default=True)
    theme = Column(String(20), default="system")
    auto_apply_enabled = Column(Boolean, default=False)
    attach_cover_note = Column(Boolean, default=True)
    share_resume = Column(Boolean, default=True)

    user = relationship("User", back_populates="settings")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    body = Column(Text, default="")
    kind = Column(String(50), default="match")  # match, application, digest, system
    job_id = Column(String(100), default="")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")

class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String(100), nullable=False, index=True)
    job_data = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="saved_jobs")

class AppliedJob(Base):
    __tablename__ = "applied_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String(100), nullable=False, index=True)
    application_id = Column(String(100), nullable=False)  # e.g. APP-YYYYMMDD-XXXX
    company = Column(String(255), default="")
    title = Column(String(255), default="")
    location = Column(String(255), default="")
    salary = Column(String(100), default="")
    # Status: saved | clicked | applied | interview | offer | rejected
    status = Column(String(50), default="clicked")
    source = Column(String(100), default="Direct ATS")
    apply_url = Column(String(1000), default="")
    clicked_at = Column(DateTime, default=datetime.datetime.utcnow)
    applied_at = Column(DateTime, nullable=True)
    # confirmed_via: manual | email | native
    confirmed_via = Column(String(50), default="manual")
    notes = Column(Text, default="")
    cover_letter = Column(Text, default="")
    interview_prep_cache = Column(JSON, default=dict)
    job_data = Column(JSON, default=dict)

    user = relationship("User", back_populates="applied_jobs")
    events = relationship("ApplicationEvent", back_populates="application", cascade="all, delete-orphan", order_by="desc(ApplicationEvent.created_at)")

class ApplicationEvent(Base):
    __tablename__ = "application_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applied_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    from_status = Column(String(50), default="")
    to_status = Column(String(50), nullable=False)
    note = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    application = relationship("AppliedJob", back_populates="events")

class InterviewNote(Base):
    __tablename__ = "interview_notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company = Column(String(255), nullable=False, index=True)
    role = Column(String(255), nullable=False)
    rounds = Column(String(255), default="3 Rounds")
    questions = Column(JSON, default=list)
    difficulty = Column(String(50), default="medium")  # easy, medium, hard
    outcome = Column(String(50), default="offer")  # offer, rejected, pending
    status = Column(String(50), default="pending")  # pending, approved
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="interview_notes")

class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(String(100), primary_key=True)
    title = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=False, index=True)
    location = Column(String(255), default="India / Remote", index=True)
    city = Column(String(100), index=True, nullable=True)
    state = Column(String(100), index=True, nullable=True)
    country = Column(String(100), index=True, default="India")
    is_remote = Column(Boolean, default=False, index=True)
    salary = Column(String(100), default="Competitive")
    rating = Column(String(20), default="")
    source = Column(String(100), default="Greenhouse")
    apply_url = Column(String(1000), default="")
    apply_urls = Column(JSON, default=list)  # multiple apply URLs for deduplicated listings
    sources_list = Column(JSON, default=list)
    description = Column(Text, default="")
    skills = Column(JSON, default=list)
    job_type = Column(String(100), default="Full-time")
    work_mode = Column(String(50), default="remote", index=True)  # remote, hybrid, onsite
    # internship, fresher, junior, mid, senior
    experience_level = Column(String(50), default="fresher", index=True)
    years_experience = Column(String(50), default="0-2 years")
    dedupe_key = Column(String(255), unique=True, index=True)
    is_active = Column(Boolean, default=True, index=True)
    is_demo = Column(Boolean, default=False, nullable=False, index=True)
    url_origin = Column(String(50), default="api", nullable=False)  # api | search_link
    raw_payload = Column(Text, nullable=True)  # original JSON response payload from source API
    link_status = Column(String(50), default="ok", nullable=False, index=True)  # ok | broken | unknown
    link_checked_at = Column(DateTime, nullable=True)
    report_count = Column(Integer, default=0, nullable=False)
    embedding = Column(JSON, default=list)  # 384-dim vector for all-MiniLM-L6-v2
    posted_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    first_seen_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    last_seen_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class IngestionRun(Base):
    __tablename__ = "ingestion_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source = Column(String(100), nullable=False, index=True)
    status = Column(String(50), default="success")  # success, partial, failed
    fetched_count = Column(Integer, default=0)
    new_count = Column(Integer, default=0)
    updated_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    error_message = Column(Text, default="")
    started_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

class SavedSearch(Base):
    __tablename__ = "saved_searches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    keyword = Column(String(255), default="")
    location = Column(String(255), default="")
    filters = Column(JSON, default=dict)
    last_notified_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="saved_searches")

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    memberships = relationship("OrgMembership", back_populates="organization", cascade="all, delete-orphan")
    posted_jobs = relationship("NativeJob", back_populates="organization", cascade="all, delete-orphan")

class OrgMembership(Base):
    __tablename__ = "org_memberships"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default="recruiter")  # recruiter, org_admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    organization = relationship("Organization", back_populates="memberships")
    user = relationship("User", back_populates="org_memberships")

class NativeJob(Base):
    __tablename__ = "native_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    department = Column(String(100), default="Engineering")
    location = Column(String(255), default="India / Remote")
    salary = Column(String(100), default="Market Standard")
    skills = Column(JSON, default=list)
    description = Column(Text, default="")
    status = Column(String(50), default="active")  # active, closed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    organization = relationship("Organization", back_populates="posted_jobs")
    submissions = relationship("NativeSubmission", back_populates="job", cascade="all, delete-orphan")

class NativeSubmission(Base):
    __tablename__ = "native_submissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("native_jobs.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="applied")  # applied, reviewing, interview, offer, rejected
    candidate_name = Column(String(255), default="")
    candidate_email = Column(String(255), default="")
    match_score = Column(Integer, default=75)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    job = relationship("NativeJob", back_populates="submissions")
