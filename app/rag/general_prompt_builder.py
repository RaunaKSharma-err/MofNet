from app.rag.models import LLMMessage


GENERAL_SYSTEM_PROMPT = (
    "You are a helpful educational assistant. "
    "Answer the user's question directly and clearly. "
    "Use simple, educational language. "
    "Do not invent specific facts when uncertain. "
    "Do not claim information comes from a curriculum. "
    "Do not mention ChromaDB or model routing. "
    "Keep answers concise but useful. "
    "Aim for approximately 50-90 words unless the question genuinely needs more detail."
)


def build_general_messages(question: str, language: str = "en") -> list[LLMMessage]:
    language_instruction = "Respond in English."
    if language == "ne":
        language_instruction = "Respond in Nepali."

    system_content = f"{GENERAL_SYSTEM_PROMPT}\n\n{language_instruction}"
    user_content = question

    return [
        LLMMessage(role="system", content=system_content),
        LLMMessage(role="user", content=user_content),
    ]
