import time
from dataclasses import dataclass

from app.config.settings import Settings
from app.core.logging import get_logger
from app.rag.interfaces.llm import LLMProvider
from app.rag.models import LLMResponse, RAGContext, RetrievalResult
from app.rag.prompt_builder import PromptBuilder
from app.rag.retriever import ContextRetriever

logger = get_logger(__name__)


@dataclass(frozen=True)
class RAGAnswer:
    answer: str
    retrieval: RetrievalResult
    llm_response: LLMResponse
    latency_ms: int


class RAGService:
    """
    End-to-end RAG pipeline:

    Question → Embedding → Vector Search → Context Retrieval
             → Prompt Construction → LLM Response
    """

    def __init__(
        self,
        settings: Settings,
        retriever: ContextRetriever,
        prompt_builder: PromptBuilder,
        llm_provider: LLMProvider,
    ) -> None:
        self._settings = settings
        self._retriever = retriever
        self._prompt_builder = prompt_builder
        self._llm_provider = llm_provider

    def ask(
        self,
        question: str,
        grade: int | None = None,
        subject: str | None = None,
        language: str = "en",
    ) -> RAGAnswer:
        start = time.perf_counter()

        retrieval = self._retriever.retrieve(
            question=question,
            grade=grade,
            subject=subject,
        )

        context = RAGContext(
            question=question,
            chunks=retrieval.chunks,
            grade=grade,
            subject=subject,
            language=language,
        )

        messages = self._prompt_builder.build_messages(context)
        llm_response = self._llm_provider.generate(
            messages=messages,
            temperature=self._settings.rag_llm_temperature,
        )

        latency_ms = int((time.perf_counter() - start) * 1000)
        logger.info(
            "RAG answer generated in %dms with %d sources via %s/%s",
            latency_ms,
            len(retrieval.chunks),
            llm_response.provider,
            llm_response.model,
        )

        return RAGAnswer(
            answer=llm_response.content,
            retrieval=retrieval,
            llm_response=llm_response,
            latency_ms=latency_ms,
        )
