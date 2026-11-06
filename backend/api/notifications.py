from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, Notification, UserSettings
from backend.schemas import NotificationOut
from backend.auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

def notify(
    db: Session,
    user_id: str,
    title: str,
    body: str,
    kind: str = "match",
    job_id: str = ""
) -> Optional[Notification]:
    """
    Creates a notification for the specified user respecting their notification settings.
    If the notification is a match and user disabled notify_new_matches, it is skipped.
    """
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if settings:
        if kind == "match" and not settings.notify_new_matches:
            return None
        if kind == "digest" and not settings.email_digest:
            return None

    notif = Notification(
        user_id=user_id,
        title=title,
        body=body,
        kind=kind,
        job_id=job_id,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

@router.get("", response_model=List[NotificationOut])
def get_notifications(
    limit: int = 30,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches the latest notifications (up to 30) for current user."""
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )
    return notifs

@router.get("/unread-count")
def get_unread_count(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = (
        db.query(Notification)
        .filter(Notification.user_id == user.id, Notification.is_read == False)
        .count()
    )
    return {"unread_count": count}

@router.post("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user.id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    notif.is_read = True
    db.commit()
    return {"success": True, "message": "Notification marked as read"}

@router.post("/read-all")
def mark_all_read(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"success": True, "message": "All notifications marked as read"}

