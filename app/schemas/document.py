from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    chroma_id: str
    title: str
    subject: str
    grade: int
    chapter: str | None = None
    source_file: str
    language: str
    chunk_index: int
    content_preview: str | None = None
    ingested_at: datetime


class DocumentSource(BaseModel):
    """Curriculum source cited in an answer response."""

    document_id: str
    chroma_id: str
    title: str
    subject: str
    grade: int
    chapter: str | None = None
    excerpt: str | None = None
    relevance_score: float = Field(..., ge=0.0, le=1.0)
    rank: int = Field(..., ge=1)
