import uuid

from sqlalchemy import Boolean, Float, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class Analytics(Base, TimestampMixin):
    """
    Per-chunk retrieval record for a question.

    Links questions to the documents that influenced an answer and stores
    retrieval metrics for teacher dashboards and RAG tuning.
    """

    __tablename__ = "analytics"
    __table_args__ = (
        UniqueConstraint("question_id", "document_id", name="uq_analytics_question_document"),
        Index("ix_analytics_question_id", "question_id"),
        Index("ix_analytics_document_id", "document_id"),
        Index("ix_analytics_question_rank", "question_id", "rank"),
        Index("ix_analytics_relevance_score", "relevance_score"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    question_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
        doc="Parent question this retrieval event belongs to.",
    )
    document_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        doc="Curriculum document chunk retrieved from the knowledge base.",
    )
    rank: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        doc="Retrieval rank (1 = most relevant) preserving result ordering.",
    )
    relevance_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        doc="Similarity score from the vector store for RAG quality analysis.",
    )
    was_used_in_prompt: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        doc="Whether this chunk was included in the LLM context window.",
    )
    retrieval_duration_ms: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        doc="Time spent retrieving this chunk; useful when profiling RAG latency.",
    )

    question: Mapped["Question"] = relationship(back_populates="analytics")
    document: Mapped["Document"] = relationship(back_populates="analytics")
