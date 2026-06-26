import hashlib
import re
from pathlib import Path

from app.config.settings import Settings
from app.rag.constants import PREVIEW_MAX_CHARS
from app.rag.models import CurriculumChunk


def build_chroma_id(grade: int, subject: str, source_file: str, chunk_index: int) -> str:
    stem = Path(source_file).stem.replace(" ", "_").lower()
    return f"g{grade}_{subject}_{stem}_{chunk_index}"


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def make_preview(text: str, max_chars: int = PREVIEW_MAX_CHARS) -> str:
    normalized = " ".join(text.split())
    if len(normalized) <= max_chars:
        return normalized
    return f"{normalized[: max_chars - 3]}..."


def estimate_token_count(text: str) -> int:
    return max(1, len(text.split()))


class CurriculumChunker:
    def __init__(self, settings: Settings) -> None:
        self._chunk_size = settings.rag_chunk_size
        self._chunk_overlap = settings.rag_chunk_overlap

    def chunk_file(
        self,
        file_path: Path,
        grade: int,
        subject: str,
        language: str = "en",
    ) -> list[CurriculumChunk]:
        raw_text = file_path.read_text(encoding="utf-8")
        sections = self._split_into_sections(raw_text)
        chunks: list[CurriculumChunk] = []
        chunk_index = 0

        for section_title, section_body in sections:
            section_chunks = self._split_text(section_body)
            for piece in section_chunks:
                if not piece.strip():
                    continue
                chunks.append(
                    CurriculumChunk(
                        text=piece.strip(),
                        title=section_title,
                        subject=subject,
                        grade=grade,
                        chapter=section_title,
                        source_file=str(file_path.as_posix()),
                        language=language,
                        chunk_index=chunk_index,
                        token_count=estimate_token_count(piece),
                    )
                )
                chunk_index += 1

        return chunks

    def _split_into_sections(self, text: str) -> list[tuple[str, str]]:
        lines = text.splitlines()
        sections: list[tuple[str, str]] = []
        current_title = "Introduction"
        current_lines: list[str] = []

        heading_pattern = re.compile(r"^#{1,3}\s+(.+)$")

        for line in lines:
            match = heading_pattern.match(line.strip())
            if match:
                if current_lines:
                    sections.append((current_title, "\n".join(current_lines)))
                current_title = match.group(1).strip()
                current_lines = []
            else:
                current_lines.append(line)

        if current_lines:
            sections.append((current_title, "\n".join(current_lines)))

        if not sections:
            sections.append(("Introduction", text))

        return sections

    def _split_text(self, text: str) -> list[str]:
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
        if not paragraphs:
            return []

        chunks: list[str] = []
        current = ""

        for paragraph in paragraphs:
            if len(current) + len(paragraph) + 2 <= self._chunk_size:
                current = f"{current}\n\n{paragraph}".strip()
            else:
                if current:
                    chunks.append(current)
                if len(paragraph) <= self._chunk_size:
                    current = paragraph
                else:
                    chunks.extend(self._split_long_paragraph(paragraph))
                    current = ""

        if current:
            chunks.append(current)

        return self._apply_overlap(chunks)

    def _split_long_paragraph(self, paragraph: str) -> list[str]:
        words = paragraph.split()
        chunks: list[str] = []
        current_words: list[str] = []

        for word in words:
            candidate = " ".join(current_words + [word])
            if len(candidate) <= self._chunk_size:
                current_words.append(word)
            else:
                if current_words:
                    chunks.append(" ".join(current_words))
                current_words = [word]

        if current_words:
            chunks.append(" ".join(current_words))

        return chunks

    def _apply_overlap(self, chunks: list[str]) -> list[str]:
        if self._chunk_overlap <= 0 or len(chunks) <= 1:
            return chunks

        overlapped: list[str] = [chunks[0]]
        for idx in range(1, len(chunks)):
            prev_words = chunks[idx - 1].split()
            overlap_words = prev_words[-self._chunk_overlap :]
            merged = f"{' '.join(overlap_words)}\n\n{chunks[idx]}".strip()
            overlapped.append(merged)

        return overlapped
