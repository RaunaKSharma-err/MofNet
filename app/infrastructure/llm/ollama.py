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
        "options": {
            "temperature": temperature,
        },
        }

        try:
            response = httpx.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=120,
            )

            response.raise_for_status()

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