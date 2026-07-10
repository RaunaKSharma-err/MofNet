import httpx

from app.config.settings import Settings
from app.core.exceptions import LLMProviderError
from app.core.logging import get_logger
from app.rag.models import LLMMessage, LLMResponse

logger = get_logger(__name__)


class OpenRouterLLMProvider:
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
    def provider_name(self) -> str:
        return "openrouter"

    @property
    def model_name(self) -> str:
        return self._settings.openrouter_model

    def generate(self, messages: list[LLMMessage], temperature: float = 0.3) -> LLMResponse:
        if not self._settings.openrouter_api_key:
            raise LLMProviderError("OPENROUTER_API_KEY is not configured.")

        payload = {
            "model": self.model_name,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": temperature,
        }

        try:
            response = self._client.post("/chat/completions", json=payload)
            response.raise_for_status()
            data = response.json()
            choice = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})
            return LLMResponse(
                content=choice.strip(),
                model=self.model_name,
                provider=self.provider_name,
                prompt_tokens=usage.get("prompt_tokens"),
                completion_tokens=usage.get("completion_tokens"),
            )
        except httpx.HTTPError as exc:
            logger.exception("OpenRouter chat completion failed")
            raise LLMProviderError(f"LLM request failed: {exc}") from exc
