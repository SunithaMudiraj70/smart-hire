import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models import User, SavedJob, AppliedJob, ApplicationEvent, Notification, InterviewNote
from backend.schemas import (
    SaveJobRequest,
    ApplyJobRequest,
    UpdateAppliedStatus,
    CopyKitResponse
)
from backend.auth import get_current_user
from backend.application_engine import generate_tailored_cover_letter

router = APIRouter(prefix="/api/jobs", tags=["Jobs & Applications"])

@router.get("/saved")
def get_user_saved_jobs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    records = db.query(SavedJob).filter(SavedJob.user_id == user.id).order_by(SavedJob.created_at.desc()).all()
    return [r.job_data for r in records]

@router.post("/save")
@router.post("/saved")
def toggle_save_job(req: SaveJobRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job_id = str(req.job.get("id") or req.job.get("job_id") or "")
    if not job_id:
        raise HTTPException(status_code=400, detail="Job ID is required")

    existing = db.query(SavedJob).filter(SavedJob.user_id == user.id, SavedJob.job_id == job_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        is_saved = False
    else:
        new_save = SavedJob(
            user_id=user.id,
            job_id=job_id,
            job_data=req.job
        )
        db.add(new_save)
        db.commit()
        is_saved = True

    count = db.query(SavedJob).filter(SavedJob.user_id == user.id).count()
    return {"success": True, "is_saved": is_saved, "count": count, "job_id": job_id}

@router.delete("/saved/{job_id}")
def delete_saved_job(job_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(SavedJob).filter(SavedJob.user_id == user.id, SavedJob.job_id == job_id).first()
    if existing:
        db.delete(existing)
        db.commit()
    count = db.query(SavedJob).filter(SavedJob.user_id == user.id).count()
    return {"success": True, "is_saved": False, "count": count, "job_id": job_id}

# --- Phase A: Honest Application Tracking ---

@router.post("/apply-click")
def register_apply_click(req: ApplyJobRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Called when candidate clicks 'Apply on <source>'.
    Creates or updates the tracking record with status 'clicked' (NOT applied).
    Logs an application timeline event.
    """
    job = req.job
    job_id = str(job.get("id") or job.get("job_id") or "")
    if not job_id:
        raise HTTPException(status_code=400, detail="Job ID is required")

    apply_url = job.get("direct_apply_url") or job.get("link") or ""
    source = job.get("source") or "Direct ATS"
    company = job.get("company") or "Company"
    title = job.get("title") or "Position"
    location = job.get("location") or "India / Remote"
    salary = job.get("salary") or "Competitive"

    record = db.query(AppliedJob).filter(AppliedJob.user_id == user.id, AppliedJob.job_id == job_id).first()
    if not record:
        app_ref = f"APP-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{abs(hash(job_id + user.id)) % 10000:04d}"
        record = AppliedJob(
            user_id=user.id,
            job_id=job_id,
            application_id=app_ref,
            company=company,
            title=title,
            location=location,
            salary=salary,
            status="clicked",
            source=source,
            apply_url=apply_url,
            clicked_at=datetime.datetime.utcnow(),
            applied_at=datetime.datetime.utcnow(),
            confirmed_via="manual",
            job_data=job
        )
        db.add(record)
        db.flush()

        # Log timeline event
        event = ApplicationEvent(
            application_id=record.id,
            from_status="",
            to_status="clicked",
            note=f"Apply link clicked for {source}"
        )
        db.add(event)
    else:
        # Existing record
        if record.status not in ("applied", "interview", "offer", "rejected"):
            record.status = "clicked"
        record.clicked_at = datetime.datetime.utcnow()
        record.apply_url = apply_url
        record.job_data = job

        event = ApplicationEvent(
            application_id=record.id,
            from_status=record.status,
            to_status="clicked",
            note=f"Re-visited apply link on {source}"
        )
        db.add(event)

    db.commit()
    db.refresh(record)

    return {
        "success": True,
        "id": record.id,
        "application_id": record.application_id,
        "company": record.company,
        "title": record.title,
        "status": record.status,
        "apply_url": record.apply_url
    }

@router.post("/applied/{record_id}/confirm")
def confirm_applied_job(record_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Called when candidate confirms 'Yes, I applied' in the return prompt modal.
    Marks status as 'applied', sets applied_at, and records timeline event.
    """
    record = db.query(AppliedJob).filter(AppliedJob.id == record_id, AppliedJob.user_id == user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Application record not found")

    old_status = record.status
    record.status = "applied"
    record.applied_at = datetime.datetime.utcnow()
    record.confirmed_via = "manual"

    event = ApplicationEvent(
        application_id=record.id,
        from_status=old_status,
        to_status="applied",
        note="Confirmed application submission upon return"
    )
    db.add(event)

    # In-app notification
    notif = Notification(
        user_id=user.id,
        title=f"Application tracked: {record.title}",
        body=f"Tracked submission to {record.company} ({record.application_id})",
        kind="application",
        job_id=record.job_id
    )
    db.add(notif)

    db.commit()
    db.refresh(record)

    return {
        "success": True,
        "id": record.id,
        "status": record.status,
        "applied_at": record.applied_at.isoformat(),
        "message": f"Application for {record.title} at {record.company} confirmed!"
    }

@router.get("/applied")
def get_user_applied_jobs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns application tracker records for current user with timeline events."""
    records = db.query(AppliedJob).filter(AppliedJob.user_id == user.id).order_by(AppliedJob.clicked_at.desc()).all()
    results = []
    for r in records:
        results.append({
            "id": r.id,
            "application_id": r.application_id,
            "job_id": r.job_id,
            "company": r.company,
            "title": r.title,
            "location": r.location,
            "salary": r.salary,
            "status": r.status.lower(),
            "source": r.source,
            "apply_url": r.apply_url,
            "clicked_at": r.clicked_at.isoformat() if r.clicked_at else "",
            "applied_at": r.applied_at.isoformat() if r.applied_at else "",
            "confirmed_via": r.confirmed_via,
            "notes": r.notes or "",
            "cover_letter": r.cover_letter or "",
            "job_data": r.job_data or {},
            "events": [
                {
                    "id": ev.id,
                    "from_status": ev.from_status,
                    "to_status": ev.to_status,
                    "note": ev.note,
                    "created_at": ev.created_at.isoformat()
                }
                for ev in r.events
            ]
        })
    return results

@router.put("/applied/{record_id}/status")
def update_applied_status(record_id: str, req: UpdateAppliedStatus, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Updates status in application tracker: saved, clicked, applied, reviewing, interview, on_hold, offer, rejected."""
    valid_statuses = ["saved", "clicked", "applied", "reviewing", "interview", "on_hold", "offer", "rejected"]
    new_status = req.status.lower().strip()
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{req.status}'. Allowed statuses: {', '.join(valid_statuses)}"
        )

    record = db.query(AppliedJob).filter(AppliedJob.id == record_id, AppliedJob.user_id == user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Application record not found")

    old_status = record.status
    record.status = new_status
    if new_status in ("applied", "reviewing", "interview") and not record.applied_at:
        record.applied_at = datetime.datetime.utcnow()

    note_text = req.note or f"Status updated to {new_status}"
    event = ApplicationEvent(
        application_id=record.id,
        from_status=old_status,
        to_status=new_status,
        note=note_text
    )
    db.add(event)
    db.commit()
    db.refresh(record)

    return {"success": True, "id": record.id, "status": record.status, "note": note_text}

@router.put("/applied/{record_id}/notes")
def update_applied_notes(record_id: str, payload: Dict[str, str], user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.query(AppliedJob).filter(AppliedJob.id == record_id, AppliedJob.user_id == user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Application record not found")

    record.notes = payload.get("notes", "")
    db.commit()
    return {"success": True, "id": record.id, "notes": record.notes}

@router.get("/applied/{record_id}/timeline")
def get_application_timeline(record_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.query(AppliedJob).filter(AppliedJob.id == record_id, AppliedJob.user_id == user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Application record not found")

    events = db.query(ApplicationEvent).filter(ApplicationEvent.application_id == record.id).order_by(ApplicationEvent.created_at.desc()).all()
    return [
        {
            "id": ev.id,
            "from_status": ev.from_status,
            "to_status": ev.to_status,
            "note": ev.note,
            "created_at": ev.created_at.isoformat()
        }
        for ev in events
    ]

@router.get("/portal-search-links")
def get_portal_search_links(q: str = "", loc: str = "India"):
    """
    Returns verified external portal search URLs for candidate job exploration.
    These are search links, NOT specific applications, and must be labelled 'Search on <Portal> ↗'.
    """
    from backend.urlguard import portal_search_links
    return portal_search_links(q, loc)

@router.post("/{id}/check-link")
def check_job_link_endpoint(id: str, db: Session = Depends(get_db)):
    """Rate-limited link health check for an individual job posting."""
    from backend.linkcheck import check_and_update_job
    result = check_and_update_job(db, id)
    if "error" in result:
        raise HTTPException(status_code=404, detail="Job not found")
    return result

@router.post("/{id}/report-link")
def report_broken_link_endpoint(id: str, db: Session = Depends(get_db)):
    """User reports broken or expired link. 3 reports hides the job automatically."""
    from backend.models import JobPosting
    job = db.query(JobPosting).filter(JobPosting.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.report_count = (job.report_count or 0) + 1
    if job.report_count >= 3:
        job.link_status = "broken"
    db.commit()
    return {
        "id": job.id,
        "report_count": job.report_count,
        "link_status": job.link_status,
        "hidden": job.report_count >= 3 or job.link_status == "broken"
    }

@router.post("/copy-cover-letter", response_model=CopyKitResponse)
@router.post("/copy-kit", response_model=CopyKitResponse)
def generate_copy_cover_letter(req: SaveJobRequest, user: User = Depends(get_current_user)):
    """Generates a plain, ready-to-paste cover letter (greeting, 3 short paragraphs, sign-off)."""
    profile = user.profile
    cand_dict = {
        "name": user.name,
        "email": user.email,
        "phone": profile.phone if profile else "",
        "location": profile.location if profile else "India",
        "skills": profile.skills if profile else ["Python", "JavaScript"],
        "years_experience": profile.years_experience if profile else 1
    }

    job = req.job
    company = job.get("company", "the team")
    title = job.get("title", "this position")
    skills_list = cand_dict["skills"]
    skills_str = ", ".join(skills_list[:4]) if skills_list else "Software Engineering"
    
    # 3 short paragraphs
    p1 = f"Dear {company} Hiring Team,\n\nI am writing to express my enthusiastic interest in the {title} role at {company}. With practical experience in {skills_str}, I am confident in my ability to make an immediate, positive impact on your team."
    p2 = generate_tailored_cover_letter(cand_dict, job)
    p3 = f"Thank you for considering my application. I would welcome the opportunity to discuss how my skillset and background align with {company}'s roadmap.\n\nSincerely,\n{user.name}"

    clean_letter = f"{p1}\n\n{p2}\n\n{p3}"

    return CopyKitResponse(
        applicant_name=user.name,
        email=user.email,
        phone=cand_dict["phone"] or "Not specified",
        location=cand_dict["location"] or "India",
        skills=skills_str,
        cover_note=p2,
        clipboard_text=clean_letter
    )
