_SAFETY_PATTERNS = [
    "medicine for fever",
    "medicine should i take",
    "what medicine",
    "chest pain",
    "severe chest pain",
    "heart attack",
    "stroke",
    "bleeding badly",
    "severe injury",
    "urgent care",
    "call emergency",
    "suicide",
    "self-harm",
    "overdose",
    "poisoning",
    "ambulance",
]


def _is_safety_question(question: str) -> bool:
    lower = question.lower()
    return any(pattern in lower for pattern in _SAFETY_PATTERNS)


_SAFETY_RESPONSE = (
    "I can provide general educational information, but I can't diagnose a condition "
    "or recommend specific treatment or medication. For a serious or urgent situation, "
    "contact a qualified healthcare professional or local emergency service."
)


def check_safety(question: str) -> dict:
    if _is_safety_question(question):
        return {
            "mode": "safety",
            "blocked": True,
            "answer": _SAFETY_RESPONSE,
        }
    return {
        "mode": "general",
        "blocked": False,
        "answer": None,
    }
