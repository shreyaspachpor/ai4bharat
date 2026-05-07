"""Feedback router – create AI-generated feedback & retrieve it."""

from datetime import datetime
from fastapi import APIRouter, HTTPException
from app.firebase_init import get_db
from app.models.schemas import CreateFeedbackRequest, ExtractFieldsRequest
from app.services.gemini_service import generate_feedback, extract_interview_fields

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("/create")
async def create_feedback(req: CreateFeedbackRequest):
    """Generate AI feedback for a completed interview."""
    db = get_db()

    try:
        # Format transcript
        transcript_text = "\n".join(
            f"- {msg.role}: {msg.content}" for msg in req.transcript
        )

        # Get interview questions
        interview_doc = db.collection("interviews").document(req.interview_id).get()
        questions = interview_doc.to_dict().get("questions", []) if interview_doc.exists else []
        role = interview_doc.to_dict().get("role") if interview_doc.exists else None

        # Call Gemini for feedback + model answers
        feedback_obj = generate_feedback(
            transcript_text=transcript_text,
            trade=req.trade,
            language=req.language,
            questions=questions,
            role=role,
        )

        review_required = bool(
            req.integrity_metrics and req.integrity_metrics.integrity_flag
        )

        feedback = {
            "interviewId": req.interview_id,
            "userId": req.user_id,
            "relevance": feedback_obj.get("relevance", 0),
            "clarity": feedback_obj.get("clarity", 0),
            "skillConfidence": feedback_obj.get("skillConfidence", 0),
            "fitmentLabel": (
                "Requires manual verification"
                if review_required
                else feedback_obj.get("fitmentLabel", "Low confidence / poor quality")
            ),
            "summary": feedback_obj.get("summary", ""),
            "createdAt": datetime.utcnow().isoformat(),
            "modelAnswers": feedback_obj.get("modelAnswers", []),
            "speechQuality": (
                req.speech_quality.model_dump(by_alias=True) if req.speech_quality else None
            ),
            "transcript": [msg.model_dump() for msg in req.transcript],
            "integrityMetrics": (
                req.integrity_metrics.model_dump(by_alias=True)
                if req.integrity_metrics
                else None
            ),
            "reviewRequired": review_required,
        }

        if req.feedback_id:
            fb_ref = db.collection("feedback").document(req.feedback_id)
        else:
            fb_ref = db.collection("feedback").document()

        fb_ref.set(feedback)

        return {"success": True, "feedbackId": fb_ref.id}
    except Exception as e:
        print(f"Error saving feedback: {e}")
        return {"success": False, "error": str(e)}


@router.get("/{interview_id}/{user_id}")
async def get_feedback_by_interview(interview_id: str, user_id: str):
    """Get feedback for a specific interview and user."""
    db = get_db()

    docs = (
        db.collection("feedback")
        .where("interviewId", "==", interview_id)
        .where("userId", "==", user_id)
        .limit(1)
        .stream()
    )

    for doc in docs:
        return {"id": doc.id, **doc.to_dict()}

    return None


@router.get("/user/{user_id}")
async def get_all_feedback_by_user(user_id: str):
    """Get all feedback for a specific user to prevent N+1 queries."""
    db = get_db()

    docs = (
        db.collection("feedback")
        .where("userId", "==", user_id)
        .stream()
    )

    feedbacks = []
    for doc in docs:
        feedbacks.append({"id": doc.id, **doc.to_dict()})
    
    return feedbacks


@router.post("/extract-fields")
async def extract_fields(req: ExtractFieldsRequest):
    """Extract structured interview fields from a voice transcript using Gemini."""
    try:
        fields = extract_interview_fields(req.transcript)
        return {"success": True, "fields": fields}
    except Exception as e:
        print(f"Error extracting fields: {e}")
        return {"success": False, "error": str(e)}
