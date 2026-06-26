from typing import Any

import chromadb

from app.config.settings import Settings
from app.core.exceptions import VectorStoreError
from app.core.logging import get_logger
from app.rag.models import RetrievedChunk

logger = get_logger(__name__)


def _distance_to_score(distance: float) -> float:
    """Convert Chroma distance to a 0-1 relevance score (higher is better)."""
    return max(0.0, min(1.0, 1.0 - distance))


class ChromaVectorStore:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        try:
            self._client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
            self._collection = self._client.get_or_create_collection(
                name=settings.chroma_collection,
                metadata={"hnsw:space": "cosine"},
            )
        except Exception as exc:
            raise VectorStoreError(f"Failed to initialize ChromaDB: {exc}") from exc

    def upsert_chunks(
        self,
        chroma_ids: list[str],
        texts: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict[str, Any]],
    ) -> None:
        try:
            self._collection.upsert(
                ids=chroma_ids,
                documents=texts,
                embeddings=embeddings,
                metadatas=metadatas,
            )
        except Exception as exc:
            logger.exception("ChromaDB upsert failed")
            raise VectorStoreError(f"Failed to upsert chunks: {exc}") from exc

    def query(
        self,
        embedding: list[float],
        top_k: int,
        where: dict[str, Any] | None = None,
    ) -> list[RetrievedChunk]:
        try:
            results = self._collection.query(
                query_embeddings=[embedding],
                n_results=top_k,
                where=where,
                include=["documents", "metadatas", "distances"],
            )
        except Exception as exc:
            logger.exception("ChromaDB query failed")
            raise VectorStoreError(f"Failed to query vector store: {exc}") from exc

        chunks: list[RetrievedChunk] = []
        if not results["ids"] or not results["ids"][0]:
            return chunks

        for rank, chroma_id in enumerate(results["ids"][0], start=1):
            metadata = results["metadatas"][0][rank - 1] or {}
            distance = results["distances"][0][rank - 1]
            text = results["documents"][0][rank - 1] or ""

            chunks.append(
                RetrievedChunk(
                    chroma_id=chroma_id,
                    document_id=metadata.get("document_id"),
                    text=text,
                    title=str(metadata.get("title", "")),
                    subject=str(metadata.get("subject", "")),
                    grade=int(metadata.get("grade", 0)),
                    chapter=metadata.get("chapter"),
                    source_file=str(metadata.get("source_file", "")),
                    relevance_score=_distance_to_score(distance),
                    rank=rank,
                )
            )

        return chunks

    def delete_by_source(self, source_file: str) -> None:
        try:
            self._collection.delete(where={"source_file": source_file})
        except Exception as exc:
            logger.exception("ChromaDB delete failed for source %s", source_file)
            raise VectorStoreError(f"Failed to delete chunks: {exc}") from exc

    def count(self) -> int:
        return self._collection.count()
