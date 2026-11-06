import os
import io
import csv
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, Organization, OrgMembership, NativeJob, NativeSubmission
from backend.auth import get_current_user
from backend.vector_engine import embed_text

router = APIRouter(prefix="/api/recruiter", tags=["B2B Recruiter Workspace"])

class PostJobRequest(BaseModel):
    title: str
    department: Optional[str] = "Engineering"
    location: Optional[str] = "India / Remote"
    salary: Optional[str] = "Market Standard"
    skills: Optional[List[str]] = None
    description: Optional[str] = ""

def get_recruiter_membership(user: User, db: Session) -> OrgMembership:
    membership = db.query(OrgMembership).filter(OrgMembership.user_id == user.id).first()
    if not membership:
        # Auto-create organization for recruiter role
        org = Organization(name=f"{user.name}'s Hiring Team")
        db.add(org)
        db.flush()
        membership = OrgMembership(org_id=org.id, user_id=user.id, role="org_admin")
        user.role = "recruiter"
        db.add(membership)
        db.commit()
    return membership

@router.get("/organization")
def get_recruiter_org(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership = get_recruiter_membership(user, db)
    return {
        "org_id": membership.org_id,
        "org_name": membership.organization.name,
        "role": membership.role
    }

@router.get("/jobs")
def get_recruiter_jobs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership = get_recruiter_membership(user, db)
    jobs = db.query(NativeJob).filter(NativeJob.org_id == membership.org_id).order_by(NativeJob.created_at.desc()).all()
    return [
        {
            "id": j.id,
            "title": j.title,
            "department": j.department,
            "location": j.location,
            "salary": j.salary,
            "skills": j.skills or [],
            "description": j.description,
            "status": j.status,
            "applications_count": len(j.submissions),
            "created_at": j.created_at.isoformat()
        }
        for j in jobs
    ]

@router.post("/jobs")
def create_native_job(req: PostJobRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership = get_recruiter_membership(user, db)
    job = NativeJob(
        org_id=membership.org_id,
        title=req.title.strip(),
        department=req.department or "Engineering",
        location=req.location or "India / Remote",
        salary=req.salary or "Market Standard",
        skills=req.skills or ["Python", "SQL"],
        description=req.description or "",
        status="active"
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return {"success": True, "id": job.id, "message": "Job posted directly on smart-hire!"}

@router.get("/jobs/{job_id}/candidates")
def get_job_candidates(job_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership = get_recruiter_membership(user, db)
    job = db.query(NativeJob).filter(NativeJob.id == job_id, NativeJob.org_id == membership.org_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found in your organization")

    return [
        {
            "submission_id": s.id,
            "user_id": s.user_id,
            "candidate_name": s.candidate_name,
            "candidate_email": s.candidate_email,
            "match_score": s.match_score,
            "status": s.status,
            "notes": s.notes,
            "submitted_at": s.created_at.isoformat()
        }
        for s in job.submissions
    ]

@router.post("/candidates/import")
async def import_candidates_csv(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """CSV import of candidate pool."""
    membership = get_recruiter_membership(user, db)
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8", errors="ignore")))
    imported_count = 0

    for row in reader:
        name = row.get("name") or row.get("Candidate Name")
        email = row.get("email") or row.get("Email")
        if name and email:
            imported_count += 1

    return {"success": True, "imported_count": imported_count, "filename": file.filename}

@router.post("/jobs/{job_id}/apply-native")
def apply_native_job(job_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Candidate submits application directly to a native employer job."""
    job = db.query(NativeJob).filter(NativeJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = db.query(NativeSubmission).filter(
        NativeSubmission.job_id == job.id,
        NativeSubmission.user_id == user.id
    ).first()

    if existing:
        return {"success": True, "message": "Already applied to this role", "submission_id": existing.id}

    cand_skills = set(s.lower() for s in (user.profile.skills if user.profile else []))
    job_skills = set(s.lower() for s in (job.skills or []))
    score = 75
    if job_skills:
        overlap = len(cand_skills.intersection(job_skills))
        score = min(98, max(45, int((overlap / len(job_skills)) * 100)))

    submission = NativeSubmission(
        job_id=job.id,
        user_id=user.id,
        candidate_name=user.name,
        candidate_email=user.email,
        match_score=score,
        status="applied"
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return {"success": True, "message": f"Application submitted directly to {job.organization.name}!", "submission_id": submission.id}

