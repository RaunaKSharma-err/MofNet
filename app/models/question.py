from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QuestionBase(BaseModel):
    question_text: str = Field(..., min_length=1, max_length=4000)
    answer_text: str
    subject: str | None = None
    grade: int | None = Field(default=None, ge=1, le=12)
    student_id: str | None = None
    language: str = "ne"
    llm_provider: str
    llm_model: str
    latency_ms: int | None = Field(default=None, ge=0)
    chunks_retrieved: int = Field(default=0, ge=0)
    avg_relevance_score: float | None = Field(default=None, ge=0.0, le=1.0)


class QuestionCreate(QuestionBase):
    pass


class QuestionRead(QuestionBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class QuestionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    question_text: str
    subject: str | None = None
    grade: int | None = None
    created_at: datetime
