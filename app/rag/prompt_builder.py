from app.rag.models import LLMMessage, RAGContext, RetrievedChunk


class PromptBuilder:
    SYSTEM_PROMPT = (
        "You are HimalMesh, a patient and accurate teacher for students in remote "
        "schools in Nepal. Answer using ONLY the curriculum context provided below. "
        "If the context does not contain enough information, say honestly that the "
        "curriculum materials do not cover the topic yet. Use clear, age-appropriate "
        "language. When possible, mention the chapter or topic name from the context."
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
            system_content += f"\nSubject focus: {context.subject.replace('_', ' ').title()}."

        user_content = self._build_user_prompt(context.question, context.chunks)
        return [
            LLMMessage(role="system", content=system_content),
            LLMMessage(role="user", content=user_content),
        ]

    def _build_user_prompt(self, question: str, chunks: list[RetrievedChunk]) -> str:
        if not chunks:
            return (
                "No curriculum context was retrieved.\n\n"
                f"Student question: {question}\n\n"
                "Tell the student the topic is not yet available in the local curriculum library."
            )

        context_blocks: list[str] = []
        for chunk in chunks:
            header = (
                f"[Source {chunk.rank} | Grade {chunk.grade} | "
                f"{chunk.subject.replace('_', ' ').title()} | {chunk.title}]"
            )
            context_blocks.append(f"{header}\n{chunk.text}")

        context_text = "\n\n---\n\n".join(context_blocks)
        return (
            f"Curriculum context:\n\n{context_text}\n\n"
            f"Student question: {question}\n\n"
            "Provide a helpful educational answer grounded in the context above."
        )
