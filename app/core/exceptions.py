class HimalMeshError(Exception):
    """Base application error."""


class EmbeddingError(HimalMeshError):
    """Failed to generate embeddings."""


class LLMProviderError(HimalMeshError):
    """Failed to generate an LLM response."""


class VectorStoreError(HimalMeshError):
    """ChromaDB operation failed."""


class IngestionError(HimalMeshError):
    """Curriculum ingestion failed."""


class RetrievalError(HimalMeshError):
    """Context retrieval failed."""
