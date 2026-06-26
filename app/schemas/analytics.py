from pydantic import BaseModel, ConfigDict, Field

from app.schemas.question import RecentQuestionItem


class SubjectCount(BaseModel):
    subject: str
    count: int = Field(..., ge=0)


class AnalyticsResponse(BaseModel):
    total_questions: int = Field(..., ge=0)
    most_asked_subjects: list[SubjectCount]
    recent_questions: list[RecentQuestionItem]


class AnalyticsRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    question_id: str
    document_id: str
    rank: int
    relevance_score: float
    was_used_in_prompt: bool
    retrieval_duration_ms: int | None = None
