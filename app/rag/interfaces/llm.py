from typing import Protocol

from app.rag.models import LLMMessage, LLMResponse


class LLMProvider(Protocol):
    @property
    def provider_name(self) -> str:
        ...

    @property
    def model_name(self) -> str:
        ...

    def generate(self, messages: list[LLMMessage], temperature: float = 0.3) -> LLMResponse:
        ...
