import httpx

from app.config.settings import Settings
from app.core.exceptions import EmbeddingError
from app.core.logging import get_logger

logger = get_logger(__name__)


class OpenRouterEmbeddingProvider:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = httpx.Client(
            base_url=settings.openrouter_base_url,
            timeout=settings.openrouter_timeout_seconds,
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "HTTP-Referer": "https://mofnet-ai.local",
                "X-Title": settings.openrouter_app_name,
            },
        )

    @property
    def model_name(self) -> str:
        return self._settings.openrouter_embedding_model

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        if not self._settings.openrouter_api_key:
            raise EmbeddingError("OPENROUTER_API_KEY is not configured.")

        embeddings: list[list[float]] = []
        batch_size = self._settings.rag_embedding_batch_size

        try:
            for start in range(0, len(texts), batch_size):
                batch = texts[start : start + batch_size]
                response = self._client.post(
                    "/embeddings",
                    json={"model": self.model_name, "input": batch},
                )
                response.raise_for_status()
                payload = response.json()
                batch_embeddings = [item["embedding"] for item in payload["data"]]
                embeddings.extend(batch_embeddings)
        except httpx.HTTPError as exc:
            logger.exception("OpenRouter embedding request failed")
            raise EmbeddingError(f"Embedding request failed: {exc}") from exc

        return embeddings

    def embed_query(self, text: str) -> list[float]:
        return self.embed_texts([text])[0]
