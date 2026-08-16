from app.rag.models import LLMMessage, RAGContext, RetrievedChunk


class PromptBuilder:
    SYSTEM_PROMPT = (
        "You are a Nepal curriculum tutor. "
        "Answer using ONLY the curriculum context below. "
        "Do NOT use external knowledge. "
        "Do NOT invent facts or examples. "
        "If the context contains relevant information, provide a complete answer. "
        "If the context is completely unrelated to the question, say exactly: "
        "'The provided curriculum context does not contain enough information to answer this question.' "
        "Structure: definition - explanation - example (only if context provides one). "
        "Be descriptive and educational."
    )

    LANGUAGE_INSTRUCTIONS = {
        "ne": "Respond in Nepali.",
        "en": "Respond in English.",
    }

    def build_messages(self, context: RAGContext) -> list[LLMMessage]:
        language_instruction = self.LANGUAGE_INSTRUCTIONS.get(
            context.language, "Respond in English."
        )
        system_content = (
            f"{self.SYSTEM_PROMPT}\n\n{language_instruction}"
        )

        if context.grade:
            system_content += f"\nGrade: {context.grade}."
        if context.subject:
            system_content += (
                f"\nSubject: {context.subject.replace('_', ' ').title()}."
            )

        user_content = self._build_user_prompt(context.question, context.chunks)
        return [
            LLMMessage(role="system", content=system_content),
            LLMMessage(role="user", content=user_content),
        ]

    def _build_user_prompt(self, question: str, chunks: list[RetrievedChunk]) -> str:
        if not chunks:
            return (
                "No curriculum context found.\n"
                f"Student question: {question}\n"
                "The topic is not yet in the local curriculum library."
            )

        context_parts: list[str] = []
        for chunk in chunks:
            context_parts.append(chunk.text)

        context_text = "\n---\n".join(context_parts)
        return (
            "Curriculum context (use ONLY this):\n"
            f"{context_text}\n\n"
            f"Question: {question}\n\n"
            "Answer using ONLY the context above. "
            "If the context does not contain the answer, say so explicitly."
        )
