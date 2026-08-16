import json

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

    def generate(self, messages: list[LLMMessage], temperature: float = 0.2) -> LLMResponse:
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

    async def generate_stream(self, messages: list[LLMMessage], temperature: float = 0.2):
        if not self._settings.openrouter_api_key:
            raise LLMProviderError("OPENROUTER_API_KEY is not configured.")

        payload = {
            "model": self.model_name,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": temperature,
            "stream": True,
        }

        client = httpx.AsyncClient(
            base_url=self._settings.openrouter_base_url,
            timeout=self._settings.openrouter_timeout_seconds,
            headers={
                "Authorization": f"Bearer {self._settings.openrouter_api_key}",
                "HTTP-Referer": "https://mofnet-ai.local",
                "X-Title": self._settings.openrouter_app_name,
            },
        )

        try:
            async with client.stream(
                "POST",
                "/chat/completions",
                json=payload,
            ) as response:
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                        except Exception:
                            continue
                        choice = data.get("choices", [{}])[0]
                        delta = choice.get("delta", {})
                        content = delta.get("content")
                        if content:
                            yield content
        except httpx.HTTPError as exc:
            raise LLMProviderError(f"OpenRouter streaming failed: {exc}") from exc
        finally:
            await client.aclose()
