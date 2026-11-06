import os
import time
import datetime
import bcrypt
import jwt
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.database import get_db

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "smart_hire_super_secret_jwt_key_2026_dev_env_x99")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("JWT_ACCESS_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.environ.get("JWT_REFRESH_EXPIRE_DAYS", "7"))

security = HTTPBearer(auto_error=False)

# Simple in-memory sliding window rate limiter
_RATE_LIMITS: Dict[str, list] = {}

# Failed login attempt tracking: 5 failures within 15 minutes (900s) per (IP, normalized email)
_FAILED_LOGINS: Dict[str, list] = {}

def check_rate_limit(identifier: str, action: str = "auth", max_requests: int = 15, window_seconds: int = 60):
    """
    Enforces basic in-memory rate limiting per IP address or user.
    Throws HTTP 429 if rate limit is exceeded.
    """
    key = f"{action}:{identifier}"
    now = time.time()
    timestamps = _RATE_LIMITS.get(key, [])
    # Filter timestamps within window
    timestamps = [t for t in timestamps if now - t < window_seconds]
    if len(timestamps) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": f"Too many {action} requests. Please wait a minute before trying again.",
                "detail": f"Too many {action} requests. Please wait a minute before trying again.",
                "code": "RATE_LIMITED"
            }
        )
    timestamps.append(now)
    _RATE_LIMITS[key] = timestamps

def check_failed_login_limit(ip: str, email: str, max_failures: int = 5, window_seconds: int = 900):
    """
    Checks if a given (IP, normalized email) has exceeded failed login limits (5 in 15 mins).
    """
    from backend.redis_cache import check_distributed_rate_limit
    norm_email = (email or "").lower().strip()
    key = f"failed_login:{ip}:{norm_email}"

    if not check_distributed_rate_limit(key, limit=max_failures, window_seconds=window_seconds):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Too many attempts. Try again in 15 minutes.",
                "detail": "Too many attempts. Try again in 15 minutes.",
                "code": "RATE_LIMITED"
            }
        )

    now = time.time()
    attempts = _FAILED_LOGINS.get(key, [])
    attempts = [t for t in attempts if now - t < window_seconds]
    _FAILED_LOGINS[key] = attempts
    if len(attempts) >= max_failures:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Too many attempts. Try again in 15 minutes.",
                "detail": "Too many attempts. Try again in 15 minutes.",
                "code": "RATE_LIMITED"
            }
        )

def record_failed_login(ip: str, email: str, window_seconds: int = 900):
    """
    Records a failed login attempt for (IP, normalized email).
    """
    norm_email = (email or "").lower().strip()
    key = f"failed_login:{ip}:{norm_email}"
    now = time.time()
    attempts = _FAILED_LOGINS.get(key, [])
    attempts = [t for t in attempts if now - t < window_seconds]
    attempts.append(now)
    _FAILED_LOGINS[key] = attempts

def reset_failed_logins(ip: str, email: str):
    """
    Clears failed login attempts for (IP, normalized email) upon successful authentication.
    """
    norm_email = (email or "").lower().strip()
    key = f"failed_login:{ip}:{norm_email}"
    _FAILED_LOGINS.pop(key, None)

def hash_password(password: str) -> str:
    """Hashes a password with bcrypt (truncated to 72 bytes per bcrypt standard)."""
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a stored bcrypt hash."""
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8")[:72], hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: str, email: str, name: str) -> str:
    """Creates a 15-minute access token."""
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "type": "access",
        "exp": expire,
        "iat": datetime.datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    """Creates a 7-day refresh token."""
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": expire,
        "iat": datetime.datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str, expected_type: str = "access") -> Dict[str, Any]:
    """Decodes and validates a token."""
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if decoded.get("type") != expected_type:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token type. Expected {expected_type} token.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return decoded
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please sign in or refresh your session.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: Session = Depends(get_db)
):
    """Returns current User model if bearer token is valid, otherwise None."""
    if not auth or not auth.credentials:
        return None
    try:
        payload = decode_token(auth.credentials, expected_type="access")
        from backend.models import User
        user = db.query(User).filter(User.id == payload.get("sub")).first()
        return user
    except HTTPException:
        return None

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: Session = Depends(get_db)
):
    """Enforces authentication and returns current User model."""
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(auth.credentials, expected_type="access")
    from backend.models import User
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
