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
        total_start = time.perf_counter()

        try:
            emb_start = time.perf_counter()
            query_embedding = self._embedding_provider.embed_query(question)
            emb_elapsed = time.perf_counter() - emb_start

            where = self._build_filter(grade=grade, subject=subject)
            raw_chunks = self._vector_store.query(
                embedding=query_embedding,
                top_k=self._settings.rag_top_k,
                where=where,
            )

            deduped = self._dedup_chunks(raw_chunks)
            ranked = self._rank_by_relevance(deduped)
            duration_ms = int((time.perf_counter() - total_start) * 1000)

            logger.info(
                "Retrieved %d chunks (from %d raw) in %dms",
                len(ranked),
                len(raw_chunks),
                duration_ms,
            )

            return RetrievalResult(
                query=question,
                chunks=ranked,
                retrieval_duration_ms=duration_ms,
                embedding_duration_ms=int(emb_elapsed * 1000),
            )
        except RetrievalError:
            raise
        except Exception as exc:
            logger.exception("Context retrieval failed")
            raise RetrievalError(f"Failed to retrieve context: {exc}") from exc

    def _build_filter(
        self,
        grade: int | None,
        subject: str | None,
    ) -> dict[str, Any] | None:
        conditions: list[dict[str, Any]] = []
        if grade is not None:
            conditions.append({"grade": grade})
        if subject is not None:
            conditions.append({"subject": subject})
        if len(conditions) == 1:
            return conditions[0]
        if len(conditions) > 1:
            return {"$and": conditions}
        return None

    def _dedup_chunks(self, chunks: list[RetrievedChunk]) -> list[RetrievedChunk]:
        seen_texts: set[str] = set()
        result: list[RetrievedChunk] = []
        for chunk in chunks:
            normalized = " ".join(chunk.text.split()).lower()
            if normalized not in seen_texts:
                seen_texts.add(normalized)
                result.append(chunk)
        return result

    def _rank_by_relevance(self, chunks: list[RetrievedChunk]) -> list[RetrievedChunk]:
        return sorted(chunks, key=lambda c: c.relevance_score, reverse=True)
