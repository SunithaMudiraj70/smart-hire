import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, UserProfile, UserSettings
from backend.schemas import ProfileUpdate, SettingsUpdate
from backend.auth import get_current_user
from backend.resume_service import extract_text_from_pdf, parse_resume_content

router = APIRouter(prefix="/api/user", tags=["User Profile & Settings"])

@router.get("/profile")
def get_profile(user: User = Depends(get_current_user)):
    profile = user.profile
    if not profile:
        return {
            "name": user.name,
            "email": user.email,
            "headline": "Candidate",
            "phone": "",
            "location": "India",
            "years_experience": 1,
            "target_roles": ["Software Engineer"],
            "skills": ["Python", "SQL"],
            "resume_filename": ""
        }

    return {
        "name": user.name,
        "email": user.email,
        "headline": profile.headline or "",
        "phone": profile.phone or "",
        "location": profile.location or "India",
        "years_experience": profile.years_experience or 1,
        "target_roles": profile.target_roles or [],
        "skills": profile.skills or [],
        "resume_filename": profile.resume_filename or ""
    }

@router.post("/profile")
@router.put("/profile")
def update_profile(req: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = user.profile
    if not profile:
        profile = UserProfile(user_id=user.id)
        db.add(profile)

    update_dict = req.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None:
            setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return {"success": True, "message": "Profile updated successfully.", "profile": profile}

@router.get("/settings")
def get_settings(user: User = Depends(get_current_user)):
    settings = user.settings
    if not settings:
        return {
            "notify_new_matches": True,
            "email_digest": True,
            "theme": "system",
            "auto_apply_enabled": False,
            "attach_cover_note": True,
            "share_resume": True
        }
    return {
        "notify_new_matches": settings.notify_new_matches,
        "email_digest": settings.email_digest,
        "theme": settings.theme or "system",
        "auto_apply_enabled": settings.auto_apply_enabled,
        "attach_cover_note": settings.attach_cover_note,
        "share_resume": settings.share_resume
    }

@router.put("/settings")
@router.post("/settings")
def update_settings(req: SettingsUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    settings = user.settings
    if not settings:
        settings = UserSettings(user_id=user.id)
        db.add(settings)

    update_dict = req.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None:
            setattr(settings, key, value)

    db.commit()
    db.refresh(settings)
    return {"success": True, "settings": settings}

@router.post("/resume-upload")
async def upload_resume(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "data", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{user.id}_{file.filename}")

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    if file.filename.lower().endswith(".pdf"):
        text = extract_text_from_pdf(file_path)
    else:
        text = content.decode("utf-8", errors="ignore")

    parsed = parse_resume_content(text, file.filename)

    profile = user.profile
    if not profile:
        profile = UserProfile(user_id=user.id)
        db.add(profile)

    profile.resume_filename = file.filename
    profile.resume_text = text[:4000]
    if parsed.get("skills"):
        existing_skills = set(profile.skills or [])
        merged_skills = list(existing_skills.union(parsed.get("skills")))
        profile.skills = merged_skills
    if parsed.get("years_experience"):
        profile.years_experience = parsed.get("years_experience")
    if parsed.get("phone") and not profile.phone:
        profile.phone = parsed.get("phone")

    db.commit()
    db.refresh(profile)

    return {
        "success": True,
        "message": f"Resume {file.filename} uploaded and parsed successfully.",
        "skills": profile.skills,
        "years_experience": profile.years_experience,
        "resume_filename": profile.resume_filename
    }

@router.delete("/account")
def delete_account(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(user)
    db.commit()
    return {"success": True, "message": "Account deleted successfully."}
