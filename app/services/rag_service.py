import hashlib
import os
import time
import uuid
from dataclasses import dataclass

from app.config.settings import Settings
from app.core.logging import get_logger
from app.rag.interfaces.llm import LLMProvider
from app.rag.models import LLMResponse, RAGContext, RetrievalResult
from app.rag.prompt_builder import PromptBuilder
from app.rag.retriever import ContextRetriever
from app.rag.router import route_question, build_prompt_for_mode

logger = get_logger(__name__)

DEV_MODE = os.environ.get("MOFNET_DEV", "0") == "1"


def _log_timing(label: str, elapsed: float) -> None:
    if DEV_MODE:
        print(f"{label} : {elapsed:.2f}s")


@dataclass(frozen=True)
class RAGAnswer:
    answer: str
    retrieval: RetrievalResult
    llm_response: LLMResponse | None
    latency_ms: int
    from_cache: bool = False
    ollama_skipped: bool = False
    mode: str = "curriculum"
    model: str | None = None


def _normalize_text(text: str) -> str:
    return " ".join(text.split()).strip().lower()


def _deduplicate_chunks(chunks: list) -> list:
    seen: set[str] = set()
    result: list = []
    for chunk in chunks:
        normalized = _normalize_text(chunk.text)
        if normalized and normalized not in seen:
            seen.add(normalized)
            result.append(chunk)
    return result


_FALLBACK_PREFIX = (
    "The provided curriculum context does not contain enough information "
    "to answer this question"
)


def _strip_llm_fallback(answer: str) -> str:
    if not answer.startswith(_FALLBACK_PREFIX):
        return answer
    remainder = answer[len(_FALLBACK_PREFIX):].lstrip("\n :")
    if not remainder:
        return answer
    return remainder


class RAGService:
    """
    End-to-end RAG pipeline with model routing:

    Question → Embedding → Vector Search → Context Retrieval
             → Router (curriculum/general/safety)
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

    def _filter_context_chunks(self, chunks: list, min_score: float, top_score: float) -> list:
        threshold = top_score * 0.25
        return [
            chunk
            for chunk in chunks
            if chunk.relevance_score >= min_score and chunk.relevance_score >= threshold
        ]

    def _route_question(self, question: str, retrieval: RetrievalResult) -> dict:
        from app.rag.router import route_question
        return route_question(question, retrieval, self._settings)

    def ask(
        self,
        question: str,
        grade: int | None = None,
        subject: str | None = None,
        language: str = "en",
    ) -> RAGAnswer:
        total_start = time.perf_counter()
        request_id = uuid.uuid4().hex[:8]
        print(f"\n[{request_id}] RAG START: {question[:60]}")

        emb_start = time.perf_counter()
        retrieval = self._retriever.retrieve(
            question=question,
            grade=grade,
            subject=subject,
        )
        emb_elapsed = time.perf_counter() - emb_start
        _log_timing("Embedding+Retrieval", emb_elapsed)

        ret_elapsed = retrieval.retrieval_duration_ms / 1000.0
        _log_timing("Retrieval", ret_elapsed)

        route = route_question(question, retrieval, self._settings)
        mode = route["mode"]
        selected_model = route["model"]
        top_score = route["top_score"]

        print(f"[{request_id}] ROUTER mode={mode} model={selected_model} top_score={top_score:.3f}")

        if mode == "safety":
            total_elapsed = time.perf_counter() - total_start
            print(f"[{request_id}] SAFETY BLOCKED")
            return RAGAnswer(
                answer=route["answer"],
                retrieval=retrieval,
                llm_response=None,
                latency_ms=int(total_elapsed * 1000),
                ollama_skipped=True,
                mode="safety",
                model=None,
            )

        if mode == "general":
            messages = build_prompt_for_mode(
                mode="general",
                question=question,
                chunks=[],
                grade=grade,
                subject=subject,
                language=language,
            )
        else:
            filtered_chunks = self._filter_context_chunks(
                retrieval.chunks,
                min_score=getattr(self._settings, "rag_min_score", 0.45),
                top_score=top_score,
            )
            messages = build_prompt_for_mode(
                mode="curriculum",
                question=question,
                chunks=filtered_chunks,
                grade=grade,
                subject=subject,
                language=language,
            )

        prompt_start = time.perf_counter()
        prompt_elapsed = time.perf_counter() - prompt_start
        _log_timing("Prompt", prompt_elapsed)

        temperature = self._settings.rag_llm_temperature
        num_predict = getattr(self._settings, "rag_num_predict", 96)
        if mode == "general":
            num_predict = getattr(self._settings, "general_num_predict", num_predict)

        llm_start = time.perf_counter()
        llm_response = self._llm_provider.generate(
            messages=messages,
            temperature=temperature,
            num_predict=num_predict,
            model=selected_model,
        )
        llm_elapsed = time.perf_counter() - llm_start
        _log_timing("LLM", llm_elapsed)

        total_elapsed = time.perf_counter() - total_start
        latency_ms = int(total_elapsed * 1000)
        _log_timing("Total", total_elapsed)

        logger.info(
            "RAG answer generated in %dms with mode=%s via %s/%s",
            latency_ms,
            mode,
            llm_response.provider,
            llm_response.model,
        )

        return RAGAnswer(
            answer=_strip_llm_fallback(llm_response.content),
            retrieval=retrieval,
            llm_response=llm_response,
            latency_ms=latency_ms,
            mode=mode,
            model=selected_model,
        )

    def _confidence_gate(self, chunks: list) -> dict:
        if not chunks:
            return {
                "accepted": False,
                "reason": "no_chunks",
                "answer": (
                    "I couldn't find enough information about this topic "
                    "in the available curriculum."
                ),
            }

        top_score = chunks[0].relevance_score
        threshold = getattr(self._settings, "rag_confidence_threshold", 0.35)

        if top_score < threshold:
            return {
                "accepted": False,
                "reason": f"low_relevance({top_score:.3f} < {threshold})",
                "answer": (
                    "I couldn't find enough information about this topic "
                    "in the available curriculum."
                ),
            }

        return {"accepted": True, "reason": "ok", "answer": ""}
