import uuid
from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class Document(Base, TimestampMixin):
    """
    Registry of curriculum chunks indexed in ChromaDB.

    SQLite stores metadata and provenance; ChromaDB stores embeddings and full text.
    """

    __tablename__ = "documents"
    __table_args__ = (
        UniqueConstraint("chroma_id", name="uq_documents_chroma_id"),
        Index("ix_documents_subject", "subject"),
        Index("ix_documents_grade", "grade"),
        Index("ix_documents_subject_grade", "subject", "grade"),
        Index("ix_documents_source_file", "source_file"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    chroma_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Stable ID shared with ChromaDB for cross-store lookups.",
    )
    title: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        doc="Human-readable chunk title, usually derived from the section heading.",
    )
    subject: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="Normalized subject key used for filtering and analytics grouping.",
    )
    grade: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        doc="Nepal curriculum grade level for scoped retrieval.",
    )
    chapter: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        doc="Optional chapter or unit name within the subject.",
    )
    source_file: Mapped[str] = mapped_column(
        String(1024),
        nullable=False,
        doc="Original curriculum file path for teacher audit and re-ingestion.",
    )
    language: Mapped[str] = mapped_column(
        String(8),
        nullable=False,
        default="ne",
        doc="Content language code (e.g. ne, en) for bilingual curriculum support.",
    )
    chunk_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        doc="Position of this chunk within the source document after splitting.",
    )
    token_count: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        doc="Approximate token count to monitor chunk size and prompt budget.",
    )
    content_preview: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Short excerpt shown in analytics and source citations without loading ChromaDB.",
    )
    content_hash: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        doc="Hash of chunk text to detect curriculum changes and skip duplicate ingestion.",
    )
    ingested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        doc="When this chunk was last written to the vector store.",
    )

    analytics: Mapped[list["Analytics"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
    )
