from pathlib import Path

from app.config.settings import Settings
from app.rag.chunker import CurriculumChunker


def test_chunker_splits_grade_8_science(settings: Settings) -> None:
    chunker = CurriculumChunker(settings)
    file_path = Path("data/curriculum/grade_8/science/overview.md")
    chunks = chunker.chunk_file(file_path=file_path, grade=8, subject="science")

    assert len(chunks) >= 3
    assert all(chunk.grade == 8 for chunk in chunks)
    assert all(chunk.subject == "science" for chunk in chunks)
    assert any("photosynthesis" in chunk.text.lower() or "friction" in chunk.text.lower() for chunk in chunks)


def test_chunker_finds_all_curriculum_files() -> None:
    root = Path("data/curriculum")
    files = list(root.glob("grade_*/**/overview.md"))
    assert len(files) == 9
