"""Interviews router – CRUD operations + question generation."""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Cookie
from typing import Optional
from app.firebase_init import get_db, get_auth
from app.config import get_settings
from app.models.schemas import GenerateInterviewRequest, GenerateDeepLinkRequest
import uuid
from app.services.question_bank import normalize_trade, get_questions, TRADE_SKILLS

router = APIRouter(prefix="/api/interviews", tags=["interviews"])


def _verify_user(session: str | None) -> str | None:
    """Verify session cookie and return uid, or None."""
    if not session:
        return None
    try:
        auth = get_auth()
        decoded = auth.verify_session_cookie(session, check_revoked=True)
        return decoded["uid"]
    except Exception:
        return None


@router.post("/generate")
async def generate_interview(req: GenerateInterviewRequest):
    """Generate a trade-based interview with questions from the question bank."""
    db = get_db()
    trade = normalize_trade(req.trade or req.role)
    lang = req.language if req.language in ("kn", "hi") else "en"
    count = req.count or req.amount or 4

    questions = get_questions(trade, lang, count)

    interview = {
        "role": trade,
        "type": "trade",
        "level": "N/A",
        "techstack": TRADE_SKILLS.get(trade, []),
        "questions": questions,
        "userId": req.userid,
        "finalized": True,
        "createdAt": datetime.utcnow().isoformat(),
        "district": (req.district or "").strip(),
        "interviewLanguage": lang,
    }

    doc_ref = db.collection("interviews").add(interview)
    interview_id = doc_ref[1].id

    return {"success": True, "interviewId": interview_id}


@router.post("/generate-deep-link")
async def generate_deep_link(req: GenerateDeepLinkRequest):
    """Generate a deep link for an NGO candidate registration."""
    db = get_db()
    
    # 1. Create a placeholder user document.
    user_id = str(uuid.uuid4())
    user_data = {
        "name": req.name,
        "email": req.email or f"{user_id}@skillfit.in",
        "role": "candidate",
        "aadhaarDetails": req.aadhaarData,
        "createdAt": datetime.utcnow().isoformat(),
        "is_guest": True,
        "changed_by_admin": req.changed_by_admin,
        "consent_confirmed": req.consent_confirmed
    }
    db.collection("users").document(user_id).set(user_data)
    
    # 2. Generate Interview with Questions
    trade = normalize_trade(req.trade)
    lang = req.language
    short_lang = lang
    if lang == "en-IN": short_lang = "en"
    elif lang == "hi-IN": short_lang = "hi"
    elif lang == "kn-IN": short_lang = "kn"
    elif lang not in ("kn", "hi", "en"): short_lang = "en"
    
    questions = get_questions(trade, short_lang, 4)
    deep_link_token = str(uuid.uuid4())
    
    interview = {
        "role": trade,
        "type": "trade",
        "level": "N/A",
        "techstack": TRADE_SKILLS.get(trade, []),
        "questions": questions,
        "userId": user_id,
        "finalized": True,
        "createdAt": datetime.utcnow().isoformat(),
        "district": req.district.strip(),
        "interviewLanguage": req.language, # Store full language code like 'kn-IN'
        "deep_link_token": deep_link_token,
        "changed_by_admin": req.changed_by_admin,
        "consent_confirmed": req.consent_confirmed
    }

    doc_ref = db.collection("interviews").add(interview)
    interview_id = doc_ref[1].id

    return {"success": True, "token": deep_link_token, "interviewId": interview_id}

@router.get("/deep-link/{token}")
async def get_interview_by_token(token: str):
    """Get interview details by deep link token."""
    db = get_db()
    docs = db.collection("interviews").where("deep_link_token", "==", token).limit(1).stream()
    
    for doc in docs:
        return {"id": doc.id, **doc.to_dict()}
        
    raise HTTPException(status_code=404, detail="Interview token not found or expired")



@router.get("/{interview_id}")
async def get_interview(interview_id: str):
    """Get a single interview by ID."""
    db = get_db()
    doc = db.collection("interviews").document(interview_id).get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Interview not found")

    return {"id": doc.id, **doc.to_dict()}


@router.get("/user/{user_id}")
async def get_interviews_by_user(user_id: str):
    """Get all interviews created by a user."""
    db = get_db()
    docs = (
        db.collection("interviews")
        .where("userId", "==", user_id)
        .order_by("createdAt", direction="DESCENDING")
        .stream()
    )

    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


@router.get("/latest/{user_id}")
async def get_latest_interviews(user_id: str, limit: int = 20):
    """Get available (not yet completed by this user) trade interviews."""
    db = get_db()

    # All finalized interviews
    all_interviews = db.collection("interviews").where("finalized", "==", True).stream()

    # Interviews user already completed
    user_feedback = db.collection("feedback").where("userId", "==", user_id).stream()
    completed_ids = {doc.to_dict().get("interviewId") for doc in user_feedback}

    # Filter, sort, limit
    result = []
    for doc in all_interviews:
        data = doc.to_dict()
        if doc.id not in completed_ids and data.get("type") == "trade":
            result.append({"id": doc.id, **data})

    result.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return result[:limit]


@router.get("/completed/{user_id}")
async def get_completed_interviews(user_id: str):
    """Get interviews the user has completed (has feedback for)."""
    db = get_db()

    user_feedback = db.collection("feedback").where("userId", "==", user_id).stream()
    completed_ids = [doc.to_dict().get("interviewId") for doc in user_feedback]

    if not completed_ids:
        return []

    # Firestore 'in' query limited to 30
    results = []
    for chunk in [completed_ids[i : i + 30] for i in range(0, len(completed_ids), 30)]:
        docs = db.collection("interviews").where("__name__", "in", chunk).stream()
        for doc in docs:
            data = doc.to_dict()
            if data.get("type") == "trade":
                results.append({"id": doc.id, **data})

    results.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return results


@router.delete("/{interview_id}")
async def delete_interview(interview_id: str, user_id: str):
    """Delete an interview and its associated feedback."""
    db = get_db()

    doc = db.collection("interviews").document(interview_id).get()
    if not doc.exists:
        return {"success": False, "error": "Interview not found"}

    data = doc.to_dict()
    if data.get("userId") != user_id:
        return {"success": False, "error": "You can only delete your own interviews"}

    # Delete feedback first
    feedback_docs = (
        db.collection("feedback")
        .where("interviewId", "==", interview_id)
        .stream()
    )
    for fb_doc in feedback_docs:
        fb_doc.reference.delete()

    # Delete interview
    db.collection("interviews").document(interview_id).delete()
    return {"success": True}
