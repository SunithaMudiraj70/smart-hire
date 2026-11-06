from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict
import datetime

# Authentication Schemas
class UserSignup(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenRefresh(BaseModel):
    refresh_token: Optional[str] = None

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    role: str
    created_at: datetime.datetime

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int = 900  # 15 minutes in seconds
    user: UserOut

# Profile Schemas
class ProfileUpdate(BaseModel):
    headline: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    years_experience: Optional[int] = None
    target_roles: Optional[List[str]] = None
    skills: Optional[List[str]] = None

class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    headline: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""
    years_experience: int = 1
    target_roles: List[str] = []
    skills: List[str] = []
    resume_filename: Optional[str] = ""
    updated_at: Optional[datetime.datetime] = None

# Settings Schemas
class SettingsUpdate(BaseModel):
    notify_new_matches: Optional[bool] = None
    email_digest: Optional[bool] = None
    theme: Optional[str] = None
    auto_apply_enabled: Optional[bool] = None
    attach_cover_note: Optional[bool] = None
    share_resume: Optional[bool] = None

class SettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    notify_new_matches: bool = True
    email_digest: bool = True
    theme: str = "system"
    auto_apply_enabled: bool = False
    attach_cover_note: bool = True
    share_resume: bool = True

# Notification Schemas
class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    body: str
    kind: str
    job_id: str
    is_read: bool
    created_at: datetime.datetime

# Saved & Applied Job Schemas
class SaveJobRequest(BaseModel):
    job: Dict[str, Any]

class ApplyJobRequest(BaseModel):
    job: Dict[str, Any]
    cover_letter: Optional[str] = ""
    status: Optional[str] = "Applied"

class UpdateAppliedStatus(BaseModel):
    status: str  # saved, clicked, applied, reviewing, interview, on_hold, offer, rejected
    note: Optional[str] = None

class CopyKitResponse(BaseModel):
    applicant_name: str
    email: str
    phone: str
    location: str
    skills: str
    cover_note: str
    clipboard_text: str
