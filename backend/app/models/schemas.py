"""Pydantic schemas for request/response validation."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, Literal


# ── Auth ──────────────────────────────────────────────────────────────────────

class SignUpRequest(BaseModel):
    uid: str
    name: str
    email: str
    aadhaarData: Optional[dict] = None


class SignInRequest(BaseModel):
    email: str
    id_token: str = Field(alias="idToken")


class SessionTokenRequest(BaseModel):
    id_token: str = Field(alias="idToken")


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: Literal["admin", "user"] = "user"


# ── Interviews ────────────────────────────────────────────────────────────────

class GenerateInterviewRequest(BaseModel):
    userid: str
    trade: Optional[str] = None
    role: Optional[str] = None
    district: Optional[str] = ""
    language: Optional[str] = "en"
    count: Optional[int] = None
    amount: Optional[int] = None


class GenerateDeepLinkRequest(BaseModel):
    name: str
    email: Optional[str] = None
    district: str
    trade: str
    language: str
    aadhaarData: Optional[dict] = None
    changed_by_admin: bool = False
    consent_confirmed: bool = False



class InterviewResponse(BaseModel):
    id: str
    role: str
    level: str
    questions: list[str]
    techstack: list[str]
    created_at: str = Field(alias="createdAt")
    user_id: str = Field(alias="userId")
    type: str
    finalized: bool
    video_url: Optional[str] = Field(None, alias="videoUrl")

    model_config = {"populate_by_name": True}


# ── Feedback ──────────────────────────────────────────────────────────────────

class FillerWords(BaseModel):
    um: int = 0
    uh: int = 0
    like: int = 0
    basically: int = 0
    you_know: int = 0
    actually: int = 0
    right: int = 0
    so: int = 0
    kind_of: int = 0
    sort_of: int = 0


class FillerOccurrence(BaseModel):
    type: str
    timestamp: float
    time_label: str = Field(alias="timeLabel")

    model_config = {"populate_by_name": True}


class SpeechQuality(BaseModel):
    total_filler_words: int = Field(alias="totalFillerWords")
    filler_word_percentage: float = Field(alias="fillerWordPercentage")
    estimated_wpm: float = Field(alias="estimatedWPM")
    completeness_score: float = Field(alias="completenessScore")
    filler_words: FillerWords = Field(alias="fillerWords")
    filler_occurrences: list[FillerOccurrence] = Field(
        default_factory=list, alias="fillerOccurrences"
    )

    model_config = {"populate_by_name": True}


class IntegrityMetrics(BaseModel):
    face_presence_score: float = Field(alias="facePresenceScore")
    face_absence_events: int = Field(alias="faceAbsenceEvents")
    longest_absence_duration: float = Field(alias="longestAbsenceDuration")
    absence_cluster: str = Field(alias="absenceCluster")
    continuity_anomaly_flag: bool = Field(alias="continuityAnomalyFlag")
    continuity_anomaly_reason: Optional[str] = Field(
        None, alias="continuityAnomalyReason"
    )
    perceptual_hash: Optional[str] = Field(None, alias="perceptualHash")
    integrity_flag: bool = Field(alias="integrityFlag")
    integrity_reason: Optional[str] = Field(None, alias="integrityReason")

    model_config = {"populate_by_name": True}


class TranscriptMessage(BaseModel):
    role: str
    content: str


class CreateFeedbackRequest(BaseModel):
    interview_id: str = Field(alias="interviewId")
    user_id: str = Field(alias="userId")
    transcript: list[TranscriptMessage]
    trade: str = "General"
    language: Literal["kn-IN", "hi-IN", "en-IN"] = "en-IN"
    feedback_id: Optional[str] = Field(None, alias="feedbackId")
    speech_quality: Optional[SpeechQuality] = Field(None, alias="speechQuality")
    integrity_metrics: Optional[IntegrityMetrics] = Field(
        None, alias="integrityMetrics"
    )

    model_config = {"populate_by_name": True}


class FeedbackResponse(BaseModel):
    id: str
    interview_id: str = Field(alias="interviewId")
    relevance: int
    clarity: int
    skill_confidence: int = Field(alias="skillConfidence")
    fitment_label: str = Field(alias="fitmentLabel")
    summary: str
    created_at: str = Field(alias="createdAt")
    model_answers: Optional[list[str]] = Field(None, alias="modelAnswers")
    speech_quality: Optional[dict] = Field(None, alias="speechQuality")
    transcript: Optional[list[dict]] = None
    integrity_metrics: Optional[dict] = Field(None, alias="integrityMetrics")
    review_required: Optional[bool] = Field(None, alias="reviewRequired")

    model_config = {"populate_by_name": True}


# ── Extract Interview Fields ─────────────────────────────────────────────────

class ExtractFieldsRequest(BaseModel):
    transcript: str


class ExtractedFields(BaseModel):
    role: str
    level: str
    techstack: str
    type: str
    amount: int
