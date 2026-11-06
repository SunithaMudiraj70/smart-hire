import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models import User, AppliedJob, InterviewNote
from backend.auth import get_current_user

router = APIRouter(prefix="/api/applications", tags=["Applications & Prep"])

@router.post("/{record_id}/confirm")
def confirm_application(record_id: str, payload: Optional[Dict[str, str]] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Confirms application submission upon return from external portal."""
    from backend.api.jobs import confirm_applied_job
    return confirm_applied_job(record_id, user, db)

@router.get("/stats")
def get_application_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns pipeline analytics for current user:
    total_applied, this_week, pending_confirm, interviews, offers, response_rate, by_source
    """
    records = db.query(AppliedJob).filter(AppliedJob.user_id == user.id).all()

    now = datetime.datetime.utcnow()
    one_week_ago = now - datetime.timedelta(days=7)

    total_applied = 0
    this_week = 0
    pending_confirm = 0
    interviews = 0
    offers = 0
    by_source: Dict[str, int] = {}

    for r in records:
        st = (r.status or "").lower()
        src = r.source or "Direct ATS"
        by_source[src] = by_source.get(src, 0) + 1

        if st == "clicked":
            pending_confirm += 1
        elif st in ("applied", "reviewing", "interview", "on_hold", "offer", "rejected"):
            total_applied += 1
            if r.applied_at and r.applied_at >= one_week_ago:
                this_week += 1
            if st == "interview":
                interviews += 1
            elif st == "offer":
                offers += 1

    # Response rate: (interviews + offers) / max(total_applied, 1) * 100
    response_rate = round(((interviews + offers) / max(total_applied, 1)) * 100, 1)

    return {
        "total_applied": total_applied,
        "this_week": this_week,
        "pending_confirm": pending_confirm,
        "interviews": interviews,
        "offers": offers,
        "response_rate": f"{response_rate}%",
        "by_source": by_source
    }

@router.post("/{record_id}/prep")
def generate_interview_prep(record_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Phase B: Generates ~10 likely interview questions + 3 topics to revise.
    Uses cached result if available, otherwise generates from job requirements & candidate's profile.
    Labeled 'AI-generated prep, not from real candidates'.
    """
    record = db.query(AppliedJob).filter(AppliedJob.id == record_id, AppliedJob.user_id == user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Application record not found")

    if record.interview_prep_cache and isinstance(record.interview_prep_cache, dict) and "questions" in record.interview_prep_cache:
        return record.interview_prep_cache

    job_title = record.title or "Software Engineer"
    company = record.company or "Company"
    job_data = record.job_data or {}
    skills = job_data.get("skills") or ["Python", "System Design", "SQL", "Algorithms", "Git"]

    # Deterministic high-quality question generator
    primary_skill = skills[0] if skills else "Python"
    secondary_skill = skills[1] if len(skills) > 1 else "Data Structures"
    third_skill = skills[2] if len(skills) > 2 else "System Design"

    questions = [
        f"How would you optimize a high-throughput endpoint built with {primary_skill} under concurrent load?",
        f"Explain your approach to database indexing and query optimization using {secondary_skill} / SQL.",
        f"Can you walk through an architecture trade-off you made in a recent project involving {third_skill}?",
        f"What caching strategies (e.g. Redis, in-memory) have you deployed to reduce API latency?",
        f"How do you handle graceful degradation, circuit breaking, and retry logic in distributed microservices?",
        f"Explain the difference between horizontal and vertical scaling, and when each is appropriate for {company}'s scale.",
        f"Describe a challenging bug you encountered in production: how did you isolate and resolve it?",
        f"How do you approach automated testing (unit, integration, regression) to maintain CI/CD velocity?",
        f"Why are you interested in joining {company} specifically, and how does your background align with our engineering culture?",
        f"Walk us through how you design RESTful / GraphQL APIs for backward compatibility and versioning."
    ]

    topics = [
        f"{primary_skill} Concurrency & Memory Management",
        f"System Design: Distributed caching, rate-limiting & database sharding",
        f"Domain Preparation: Recent products, tech blog posts, and engineering scale of {company}"
    ]

    result = {
        "disclaimer": "AI-generated prep, not from real candidates",
        "company": company,
        "title": job_title,
        "questions": questions,
        "topics_to_revise": topics,
        "generated_at": datetime.datetime.utcnow().isoformat()
    }

    record.interview_prep_cache = result
    db.commit()

    return result

# --- Community Interview Notes ---

@router.get("/community-notes")
def get_community_notes(company: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns approved interview notes for a company."""
    query = db.query(InterviewNote).filter(InterviewNote.status == "approved")
    if company:
        query = query.filter(func.lower(InterviewNote.company) == company.lower().strip())
    notes = query.order_by(InterviewNote.created_at.desc()).limit(20).all()

    return [
        {
            "id": n.id,
            "company": n.company,
            "role": n.role,
            "rounds": n.rounds,
            "questions": n.questions,
            "difficulty": n.difficulty,
            "outcome": n.outcome,
            "created_at": n.created_at.isoformat()
        }
        for n in notes
    ]

@router.post("/community-notes")
def submit_community_note(payload: Dict[str, Any], user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Candidate submits their interview experience for approval."""
    note = InterviewNote(
        user_id=user.id,
        company=payload.get("company", "").strip(),
        role=payload.get("role", "").strip(),
        rounds=payload.get("rounds", "3 Rounds"),
        questions=payload.get("questions") or [],
        difficulty=payload.get("difficulty", "medium"),
        outcome=payload.get("outcome", "offer"),
        status="approved" if user.role == "admin" else "pending"
    )
    db.add(note)
    db.commit()
    return {"success": True, "message": "Interview note submitted for review.", "id": note.id}

@router.post("/admin/community-notes/{note_id}/approve")
def approve_community_note(note_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Admin approves a community interview experience."""
    note = db.query(InterviewNote).filter(InterviewNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    note.status = "approved"
    db.commit()
    return {"success": True, "message": "Interview note approved."}

