from typing import Any, Protocol

from app.rag.models import CurriculumChunk, RetrievedChunk


class VectorStore(Protocol):
    def upsert_chunks(
        self,
        chroma_ids: list[str],
        texts: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict[str, Any]],
    ) -> None:
        ...

    def query(
        self,
        embedding: list[float],
        top_k: int,
        where: dict[str, Any] | None = None,
    ) -> list[RetrievedChunk]:
        ...

    def delete_by_source(self, source_file: str) -> None:
        ...

    def count(self) -> int:
        ...
