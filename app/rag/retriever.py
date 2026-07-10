import time
from typing import Any

from app.config.settings import Settings
from app.core.exceptions import RetrievalError
from app.core.logging import get_logger
from app.rag.interfaces.embedding import EmbeddingProvider
from app.rag.interfaces.vector_store import VectorStore
from app.rag.models import RetrievalResult, RetrievedChunk

logger = get_logger(__name__)


class ContextRetriever:
    def __init__(
        self,
        settings: Settings,
        embedding_provider: EmbeddingProvider,
        vector_store: VectorStore,
    ) -> None:
        self._settings = settings
        self._embedding_provider = embedding_provider
        self._vector_store = vector_store

    def retrieve(
        self,
        question: str,
        grade: int | None = None,
        subject: str | None = None,
    ) -> RetrievalResult:
        start = time.perf_counter()

        try:
            query_embedding = self._embedding_provider.embed_query(question)
            where = self._build_filter(grade=grade, subject=subject)
            raw_chunks = self._vector_store.query(
                embedding=query_embedding,
                top_k=self._settings.rag_top_k,
                where=where,
            )
            filtered = self._filter_by_score(raw_chunks)
            duration_ms = int((time.perf_counter() - start) * 1000)

            logger.info(
                "Retrieved %d chunks (filtered from %d) in %dms",
                len(filtered),
                len(raw_chunks),
                duration_ms,
            )

            return RetrievalResult(
                query=question,
                chunks=filtered,
                retrieval_duration_ms=duration_ms,
            )
        except RetrievalError:
            raise
        except Exception as exc:
            logger.exception("Context retrieval failed")
            raise RetrievalError(f"Failed to retrieve context: {exc}") from exc

    # def _build_filter(
    #     self,
    #     grade: int | None,
    #     subject: str | None,
    # ) -> dict[str, Any] | None:
    #     conditions: list[dict[str, Any]] = []

    #     if grade is not None:
    #         conditions.append({"grade": grade})
    #     if subject is not None:
    #         conditions.append({"subject": subject})

    #     if not conditions:
    #         return None
    #     if len(conditions) == 1:
    #         return conditions[0]

    #     return {"$and": conditions}

    def _build_filter(
        self,
        grade: int | None,
        subject: str | None,
    ) -> dict[str, Any] | None:
        return None

    def _filter_by_score(self, chunks: list[RetrievedChunk]) -> list[RetrievedChunk]:
        filtered = [
            chunk
            for chunk in chunks
            if chunk.relevance_score >= self._settings.rag_min_score
        ]
        return [
            RetrievedChunk(
                chroma_id=chunk.chroma_id,
                document_id=chunk.document_id,
                text=chunk.text,
                title=chunk.title,
                subject=chunk.subject,
                grade=chunk.grade,
                chapter=chunk.chapter,
                source_file=chunk.source_file,
                relevance_score=chunk.relevance_score,
                rank=new_rank,
            )
            for new_rank, chunk in enumerate(filtered, start=1)
        ]
