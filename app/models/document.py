from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DocumentBase(BaseModel):
    chroma_id: str
    title: str
    subject: str
    grade: int
    chapter: str | None = None
    source_file: str
    language: str = "ne"
    chunk_index: int = 0
    token_count: int | None = None
    content_preview: str | None = None
    content_hash: str | None = None


class DocumentCreate(DocumentBase):
    ingested_at: datetime | None = None


class DocumentRead(DocumentBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ingested_at: datetime
    created_at: datetime
    updated_at: datetime


class DocumentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    chroma_id: str
    title: str
    subject: str
    grade: int
    chapter: str | None = None
    content_preview: str | None = None
