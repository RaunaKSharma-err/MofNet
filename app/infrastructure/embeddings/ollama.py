"""Ollama embedding provider — implement when switching to offline AI."""

from app.config.settings import Settings
from app.core.exceptions import EmbeddingError


class OllamaEmbeddingProvider:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    @property
    def model_name(self) -> str:
        return self._settings.ollama_embedding_model

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        raise EmbeddingError(
            "Ollama embeddings are not implemented yet. Set EMBEDDING_PROVIDER=openrouter."
        )

    def embed_query(self, text: str) -> list[float]:
        return self.embed_texts([text])[0]
