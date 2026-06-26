from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.document import DocumentSummary


class AnalyticsBase(BaseModel):
    question_id: str
    document_id: str
    rank: int = Field(..., ge=1)
    relevance_score: float = Field(..., ge=0.0, le=1.0)
    was_used_in_prompt: bool = True
    retrieval_duration_ms: int | None = Field(default=None, ge=0)


class AnalyticsCreate(AnalyticsBase):
    pass


class AnalyticsRead(AnalyticsBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class AnalyticsWithDocument(AnalyticsRead):
    document: DocumentSummary
