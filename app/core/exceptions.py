class MofNetAIError(Exception):
    """Base application error."""


class EmbeddingError(MofNetAIError):
    """Failed to generate embeddings."""


class LLMProviderError(MofNetAIError):
    """Failed to generate an LLM response."""


class VectorStoreError(MofNetAIError):
    """ChromaDB operation failed."""


class IngestionError(MofNetAIError):
    """Curriculum ingestion failed."""


class RetrievalError(MofNetAIError):
    """Context retrieval failed."""
