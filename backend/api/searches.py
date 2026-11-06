import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, SavedSearch
from backend.auth import get_current_user

router = APIRouter(prefix="/api/saved-searches", tags=["Saved Searches"])

class SavedSearchCreate(BaseModel):
    keyword: Optional[str] = ""
    location: Optional[str] = ""
    filters: Optional[Dict[str, Any]] = None

@router.get("")
def get_user_saved_searches(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    searches = db.query(SavedSearch).filter(SavedSearch.user_id == user.id).order_by(SavedSearch.created_at.desc()).all()
    return [
        {
            "id": s.id,
            "keyword": s.keyword,
            "location": s.location,
            "filters": s.filters or {},
            "created_at": s.created_at.isoformat()
        }
        for s in searches
    ]

@router.post("")
def create_saved_search(req: SavedSearchCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    search = SavedSearch(
        user_id=user.id,
        keyword=req.keyword or "",
        location=req.location or "",
        filters=req.filters or {}
    )
    db.add(search)
    db.commit()
    db.refresh(search)
    return {"success": True, "id": search.id, "message": "Search alert saved."}

@router.delete("/{search_id}")
def delete_saved_search(search_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    search = db.query(SavedSearch).filter(SavedSearch.id == search_id, SavedSearch.user_id == user.id).first()
    if not search:
        raise HTTPException(status_code=404, detail="Saved search not found")
    db.delete(search)
    db.commit()
    return {"success": True, "message": "Saved search deleted."}

