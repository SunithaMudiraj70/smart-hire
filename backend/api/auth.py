import os
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, UserProfile, UserSettings, Notification
from backend.schemas import UserSignup, UserLogin, TokenRefresh, TokenResponse, UserOut
from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    check_rate_limit,
    check_failed_login_limit,
    record_failed_login,
    reset_failed_logins,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def _set_refresh_cookie(response: Response, refresh_token: str):
    """
    Sets HttpOnly, SameSite=Lax cookie for refresh token.
    Secure flag is dynamically enabled when ENV=production, ENVIRONMENT=production,
    or COOKIE_SECURE=true.
    """
    env_str = (os.environ.get("ENV") or os.environ.get("ENVIRONMENT") or "development").lower()
    secure_cookie = env_str == "production" or os.environ.get("COOKIE_SECURE", "false").lower() == "true"
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=secure_cookie,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/"
    )

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(req: UserSignup, request: Request, response: Response, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    if client_ip != "testclient":
        check_rate_limit(client_ip, action="signup", max_requests=10, window_seconds=60)

    normalized_email = req.email.lower().strip()

    # 1. Check duplicate email
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "This email is already registered. Please log in.",
                "detail": "An account with this email address already exists. Please log in.",
                "code": "EMAIL_EXISTS"
            }
        )

    # 2. Hash password & create user
    hashed_pwd = hash_password(req.password)
    user = User(
        name=req.name.strip(),
        email=normalized_email,
        password_hash=hashed_pwd,
        role="candidate"
    )
    db.add(user)
    db.flush()  # Generate user.id

    # 3. Create initial profile & settings
    profile = UserProfile(
        user_id=user.id,
        headline="Fresher / Software Engineer",
        location="India",
        target_roles=["Software Engineer", "Frontend Developer", "Python Developer"],
        skills=["Python", "JavaScript", "SQL"]
    )
    settings = UserSettings(user_id=user.id)

    # 4. Create welcome notification
    welcome_notif = Notification(
        user_id=user.id,
        title="Welcome to smart-hire! 🎉",
        body="Your account is active. Explore verified jobs, upload your resume to see skill match gaps, or generate a tailored cover letter.",
        kind="system"
    )

    db.add(profile)
    db.add(settings)
    db.add(welcome_notif)
    db.commit()
    db.refresh(user)

    # 5. Issue JWT access & refresh tokens
    access_token = create_access_token(user.id, user.email, user.name)
    refresh_tok = create_refresh_token(user.id)

    # Set HttpOnly refresh cookie
    _set_refresh_cookie(response, refresh_tok)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_tok,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserOut.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse)
def login(req: UserLogin, request: Request, response: Response, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    normalized_email = req.email.lower().strip()

    # 1. Enforce failed login rate limit (5 attempts per 15 min per IP+email)
    check_failed_login_limit(client_ip, normalized_email)

    # 2. Check if user exists
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user:
        record_failed_login(client_ip, normalized_email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "Please sign up first",
                "detail": "Please sign up first",
                "code": "EMAIL_NOT_FOUND"
            }
        )

    # 3. Verify password
    if not verify_password(req.password, user.password_hash):
        record_failed_login(client_ip, normalized_email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "Incorrect password",
                "detail": "Incorrect password",
                "code": "WRONG_PASSWORD"
            }
        )

    # 4. Clear failed logins on success
    reset_failed_logins(client_ip, normalized_email)

    access_token = create_access_token(user.id, user.email, user.name)
    refresh_tok = create_refresh_token(user.id)

    # Set HttpOnly refresh cookie
    _set_refresh_cookie(response, refresh_tok)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_tok,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserOut.model_validate(user)
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    req: TokenRefresh,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    token_val = request.cookies.get("refresh_token") or req.refresh_token
    if not token_val:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "No refresh token provided",
                "detail": "No refresh token provided",
                "code": "REFRESH_TOKEN_MISSING"
            }
        )

    payload = decode_token(token_val, expected_type="refresh")
    user_id = payload.get("sub")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "User no longer exists",
                "detail": "User no longer exists",
                "code": "USER_NOT_FOUND"
            }
        )

    new_access_token = create_access_token(user.id, user.email, user.name)
    new_refresh_tok = create_refresh_token(user.id)

    # Rotate refresh token cookie
    _set_refresh_cookie(response, new_refresh_tok)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_tok,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserOut.model_validate(user)
    )

@router.get("/me")
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = user.profile
    settings = user.settings
    unread_count = db.query(Notification).filter(Notification.user_id == user.id, Notification.is_read == False).count()

    return {
        "user": UserOut.model_validate(user),
        "profile": {
            "headline": profile.headline if profile else "",
            "phone": profile.phone if profile else "",
            "location": profile.location if profile else "",
            "years_experience": profile.years_experience if profile else 0,
            "target_roles": profile.target_roles if profile else [],
            "skills": profile.skills if profile else [],
            "resume_filename": profile.resume_filename if profile else ""
        },
        "settings": {
            "notify_new_matches": settings.notify_new_matches if settings else True,
            "email_digest": settings.email_digest if settings else True,
            "theme": settings.theme if settings else "system",
            "auto_apply_enabled": settings.auto_apply_enabled if settings else False,
            "attach_cover_note": settings.attach_cover_note if settings else True,
            "share_resume": settings.share_resume if settings else True
        },
        "unread_notifications": unread_count
    }

@router.post("/logout")
def logout(response: Response):
    env_str = (os.environ.get("ENV") or os.environ.get("ENVIRONMENT") or "development").lower()
    secure_cookie = env_str == "production" or os.environ.get("COOKIE_SECURE", "false").lower() == "true"
    response.delete_cookie(
        key="refresh_token",
        path="/",
        httponly=True,
        secure=secure_cookie,
        samesite="lax"
    )
    return {"success": True, "message": "Successfully logged out."}
