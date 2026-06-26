import uuid

from sqlalchemy import Float, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class Question(Base, TimestampMixin):
    """
    Every student question and generated answer from POST /ask.

    Core table for recent-activity views and subject-level analytics.
    """

    __tablename__ = "questions"
    __table_args__ = (
        Index("ix_questions_created_at", "created_at"),
        Index("ix_questions_subject", "subject"),
        Index("ix_questions_grade", "grade"),
        Index("ix_questions_student_id", "student_id"),
        Index("ix_questions_subject_created_at", "subject", "created_at"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    question_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Raw question submitted by the student.",
    )
    answer_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Final LLM-generated educational answer returned to the client.",
    )
    subject: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        doc="Subject provided by client or inferred during retrieval; powers subject analytics.",
    )
    grade: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        doc="Optional grade filter applied during retrieval.",
    )
    student_id: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        doc="Optional anonymous device or student identifier for future per-student views.",
    )
    language: Mapped[str] = mapped_column(
        String(8),
        nullable=False,
        default="ne",
        doc="Response language requested by the client.",
    )
    llm_provider: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        doc="Provider used for generation (openrouter or ollama) for migration tracking.",
    )
    llm_model: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="Exact model name used so answers can be compared across provider changes.",
    )
    latency_ms: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        doc="End-to-end request latency for teacher dashboard performance monitoring.",
    )
    chunks_retrieved: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        doc="Number of curriculum chunks returned by the retriever.",
    )
    avg_relevance_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        doc="Mean retrieval score across chunks; indicates answer grounding quality.",
    )

    analytics: Mapped[list["Analytics"]] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="Analytics.rank",
    )
