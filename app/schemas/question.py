from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.document import DocumentSource


class QuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    question_text: str
    answer_text: str
    subject: str | None = None
    grade: int | None = None
    student_id: str | None = None
    language: str
    llm_provider: str
    llm_model: str
    latency_ms: int | None = None
    chunks_retrieved: int
    avg_relevance_score: float | None = None
    created_at: datetime


class RecentQuestionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    question_text: str
    subject: str | None = None
    grade: int | None = None
    created_at: datetime


class AskResponseMetadata(BaseModel):
    question_id: str
    latency_ms: int | None = None
    model: str
    provider: str
    chunks_retrieved: int


class AskResponse(BaseModel):
    answer: str
    sources: list[DocumentSource] = Field(default_factory=list)
    metadata: AskResponseMetadata
