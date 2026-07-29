from app.rag.models import LLMMessage, RAGContext, RetrievedChunk


class PromptBuilder:
    SYSTEM_PROMPT = (
        "You are MofNet AI, a teacher for Nepal school students. "
        "Answer using ONLY the curriculum context provided. "
        "If the context lacks sufficient information, say so honestly."
    )

    LANGUAGE_INSTRUCTIONS = {
        "ne": "Respond in Nepali.",
        "en": "Respond in English.",
    }

    def build_messages(self, context: RAGContext) -> list[LLMMessage]:
        language_instruction = self.LANGUAGE_INSTRUCTIONS.get(context.language, "Respond in English.")
        system_content = f"{self.SYSTEM_PROMPT}\n\n{language_instruction}"

        if context.grade:
            system_content += f"\nThe student is in Grade {context.grade}."
        if context.subject:
            system_content += f"\nSubject: {context.subject.replace('_', ' ').title()}."

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
            header = f"[Grade {chunk.grade} | {chunk.subject.replace('_', ' ').title()} | {chunk.title}]"
            context_parts.append(f"{header}\n{chunk.text}")

        context_text = "\n---\n".join(context_parts)
        return (
            f"Context:\n{context_text}\n\n"
            f"Question: {question}\n\n"
            "Answer using only the context above."
        )
