from dataclasses import dataclass, field


@dataclass(frozen=True)
class CurriculumChunk:
    text: str
    title: str
    subject: str
    grade: int
    chapter: str | None
    source_file: str
    language: str
    chunk_index: int
    token_count: int | None = None


@dataclass(frozen=True)
class RetrievedChunk:
    chroma_id: str
    document_id: str | None
    text: str
    title: str
    subject: str
    grade: int
    chapter: str | None
    source_file: str
    relevance_score: float
    rank: int


@dataclass
class RetrievalResult:
    query: str
    chunks: list[RetrievedChunk] = field(default_factory=list)
    retrieval_duration_ms: int = 0

    @property
    def avg_relevance_score(self) -> float | None:
        if not self.chunks:
            return None
        return sum(c.relevance_score for c in self.chunks) / len(self.chunks)


@dataclass(frozen=True)
class RAGContext:
    question: str
    chunks: list[RetrievedChunk]
    grade: int | None
    subject: str | None
    language: str


@dataclass(frozen=True)
class LLMMessage:
    role: str
    content: str


@dataclass(frozen=True)
class LLMResponse:
    content: str
    model: str
    provider: str
    prompt_tokens: int | None = None
    completion_tokens: int | None = None


@dataclass
class IngestionStats:
    files_processed: int = 0
    chunks_created: int = 0
    chunks_skipped: int = 0
    chunks_updated: int = 0
