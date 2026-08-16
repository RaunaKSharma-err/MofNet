from app.config.settings import get_settings
from app.rag.models import RetrievalResult
from app.rag.prompt_builder import PromptBuilder
from app.rag.general_prompt_builder import build_general_messages
from app.rag.safety import check_safety


def route_question(
    question: str,
    retrieval: RetrievalResult,
    settings,
) -> dict:
    top_score = retrieval.chunks[0].relevance_score if retrieval.chunks else 0.0
    threshold = getattr(settings, "rag_confidence_threshold", 0.35)

    if top_score >= threshold:
        return {
            "mode": "curriculum",
            "model": getattr(settings, "ollama_model", "llama3.2:1b"),
            "top_score": top_score,
            "use_curriculum_prompt": True,
        }

    safety = check_safety(question)
    if safety["blocked"]:
        return {
            "mode": "safety",
            "model": None,
            "top_score": top_score,
            "use_curriculum_prompt": False,
            "answer": safety["answer"],
        }

    return {
        "mode": "general",
        "model": getattr(settings, "general_model", "qwen2.5:0.5b"),
        "top_score": top_score,
        "use_curriculum_prompt": False,
    }


def build_prompt_for_mode(mode: str, question: str, chunks, grade, subject, language: str):
    if mode == "curriculum":
        from app.rag.models import RAGContext
        context = RAGContext(
            question=question,
            chunks=chunks,
            grade=grade,
            subject=subject,
            language=language,
        )
        return PromptBuilder().build_messages(context)
    return build_general_messages(question, language)
