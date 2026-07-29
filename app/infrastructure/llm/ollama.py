import time
import httpx

from app.rag.models import LLMResponse
from app.core.exceptions import LLMProviderError
from app.rag.interfaces.llm import LLMProvider


class OllamaLLMProvider(LLMProvider):
    def __init__(self, settings):
        self.base_url = getattr(
            settings,
            "ollama_base_url",
            "http://localhost:11434",
        )

        self.model = getattr(
            settings,
            "ollama_model",
            "llama3.2:3b",
        )

        # Reuse HTTP connection
        self.client = httpx.Client(timeout=120)

    def generate(self, messages, temperature=0.3):
        formatted_messages = [
            {
                "role": msg.role,
                "content": msg.content,
            }
            for msg in messages
        ]

        payload = {
            "model": self.model,
            "messages": formatted_messages,
            "stream": False,

            # Keep model loaded in RAM
            "keep_alive": "30m",

            "options": {
                "temperature": temperature,

                "num_ctx": 1024,

                # Don't generate huge answers
                "num_predict": 100,

                # Faster decoding
                "top_k": 40,
                "top_p": 0.9,
                "repeat_penalty": 1.1,
                "num_batch": 64,
                "num_gpu": 1,
            },
        }

        try:
            start = time.perf_counter()

            response = self.client.post(
                f"{self.base_url}/api/chat",
                json=payload,
            )

            response.raise_for_status()

            elapsed = time.perf_counter() - start
            print(f"\nOllama inference time: {elapsed:.2f}s")

            data = response.json()

            return LLMResponse(
                content=data["message"]["content"],
                model=self.model,
                provider="ollama",
                prompt_tokens=None,
                completion_tokens=None,
            )

        except Exception as exc:
            raise LLMProviderError(
                f"Ollama request failed: {exc}"
            ) from exc