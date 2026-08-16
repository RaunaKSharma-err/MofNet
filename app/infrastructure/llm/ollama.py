import json
import os
import time

import httpx

from app.config.settings import get_settings
from app.rag.models import LLMResponse
from app.core.exceptions import LLMProviderError
from app.rag.interfaces.llm import LLMProvider


def _auto_detect_threads() -> int:
    try:
        cpu_count = os.cpu_count() or 2
        return max(1, min(cpu_count, 2))
    except Exception:
        return 2


class OllamaLLMProvider(LLMProvider):
    def __init__(self, settings=None):
        self._settings = settings or get_settings()
        self.base_url = getattr(
            self._settings,
            "ollama_base_url",
            "http://localhost:11434",
        )

        self.model = getattr(
            self._settings,
            "ollama_model",
            "llama3.2:1b",
        )

        self._client = httpx.Client(timeout=120)
        self._async_client: httpx.AsyncClient | None = None

    def _get_async_client(self) -> httpx.AsyncClient:
        if self._async_client is None or self._async_client.is_closed:
            self._async_client = httpx.AsyncClient(timeout=120)
        return self._async_client

    def _build_options(self, temperature: float, num_predict: int | None = None, num_thread: int | None = None) -> dict:
        return {
            "temperature": temperature,
            "num_ctx": getattr(self._settings, "rag_max_context_tokens", 1024),
            "num_predict": num_predict if num_predict is not None else getattr(self._settings, "rag_num_predict", 96),
            "repeat_penalty": 1.05,
            "top_k": 30,
            "top_p": 0.9,
            "num_thread": num_thread if num_thread is not None else _auto_detect_threads(),
        }

    def _build_payload(
        self,
        messages: list,
        stream: bool,
        temperature: float,
        num_predict: int | None = None,
        num_thread: int | None = None,
        model: str | None = None,
    ) -> dict:
        formatted_messages = [
            {"role": msg.role, "content": msg.content} for msg in messages
        ]
        return {
            "model": model or self.model,
            "messages": formatted_messages,
            "stream": stream,
            "keep_alive": "30m",
            "options": self._build_options(temperature, num_predict=num_predict, num_thread=num_thread),
        }

    def generate(self, messages, temperature=0.2, num_predict: int | None = None, num_thread: int | None = None, model: str | None = None):
        payload = self._build_payload(messages, stream=False, temperature=temperature, num_predict=num_predict, num_thread=num_thread, model=model)

        try:
            start = time.perf_counter()

            response = self._client.post(
                f"{self.base_url}/api/chat",
                json=payload,
            )

            response.raise_for_status()

            elapsed = time.perf_counter() - start

            data = response.json()

            return LLMResponse(
                content=data["message"]["content"],
                model=model or self.model,
                provider="ollama",
                prompt_tokens=None,
                completion_tokens=None,
            )

        except Exception as exc:
            raise LLMProviderError(
                f"Ollama request failed: {exc}"
            ) from exc

    async def generate_stream(self, messages, temperature=0.2, num_predict: int | None = None, num_thread: int | None = None, model: str | None = None):
        payload = self._build_payload(messages, stream=True, temperature=temperature, num_predict=num_predict, num_thread=num_thread, model=model)
        client = self._get_async_client()

        try:
            start = time.perf_counter()
            request_sent = None
            first_token_ts = None
            metadata = {}

            response = await client.post(
                f"{self.base_url}/api/chat",
                json=payload,
            )
            request_sent = time.perf_counter()

            response.raise_for_status()

            async for line in response.aiter_lines():
                if not line.strip():
                    continue
                data = json.loads(line)
                if "message" in data and "content" in data["message"]:
                    if first_token_ts is None:
                        first_token_ts = time.perf_counter()
                    yield data["message"]["content"]
                if data.get("done"):
                    metadata = {
                        "load_duration": data.get("load_duration"),
                        "prompt_eval_duration": data.get("prompt_eval_duration"),
                        "prompt_eval_count": data.get("prompt_eval_count"),
                        "eval_duration": data.get("eval_duration"),
                        "eval_count": data.get("eval_count"),
                        "total_duration": data.get("total_duration"),
                    }
                    break

            elapsed = time.perf_counter() - start
            first_token_latency = (first_token_ts - start) if first_token_ts else None
            yield f"\n__LLM_LATENCY__:{elapsed:.2f}|first_token:{first_token_latency if first_token_latency is None else f'{first_token_latency:.3f}'}|metadata:{json.dumps(metadata)}"

        except Exception as exc:
            raise LLMProviderError(
                f"Ollama streaming request failed: {exc}"
            ) from exc