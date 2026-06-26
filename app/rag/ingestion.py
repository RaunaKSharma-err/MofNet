from pathlib import Path

from sqlalchemy.orm import Session

from app.config.settings import Settings
from app.core.logging import get_logger
from app.models.document import DocumentCreate
from app.rag.chunker import CurriculumChunker, build_chroma_id, content_hash, make_preview
from app.rag.constants import SUPPORTED_GRADES, SUPPORTED_SUBJECTS
from app.rag.interfaces.embedding import EmbeddingProvider
from app.rag.interfaces.vector_store import VectorStore
from app.rag.models import CurriculumChunk, IngestionStats
from app.repositories.document_repository import DocumentRepository

logger = get_logger(__name__)

GRADE_DIR_PATTERN = "grade_{grade}"
SUBJECT_ALIASES = {
    "social studies": "social_studies",
    "social_studies": "social_studies",
    "science": "science",
    "mathematics": "mathematics",
    "math": "mathematics",
}


class CurriculumIngestionPipeline:
    def __init__(
        self,
        settings: Settings,
        chunker: CurriculumChunker,
        embedding_provider: EmbeddingProvider,
        vector_store: VectorStore,
        document_repository: DocumentRepository,
    ) -> None:
        self._settings = settings
        self._chunker = chunker
        self._embedding_provider = embedding_provider
        self._vector_store = vector_store
        self._document_repository = document_repository

    def ingest_directory(
        self,
        db: Session,
        curriculum_dir: Path | None = None,
        force: bool = False,
    ) -> IngestionStats:
        root = curriculum_dir or Path(self._settings.curriculum_dir)
        stats = IngestionStats()

        if not root.exists():
            logger.warning("Curriculum directory does not exist: %s", root)
            return stats

        for grade in SUPPORTED_GRADES:
            grade_dir = root / GRADE_DIR_PATTERN.format(grade=grade)
            if not grade_dir.exists():
                continue

            for subject_dir in sorted(grade_dir.iterdir()):
                if not subject_dir.is_dir():
                    continue

                subject = self._normalize_subject(subject_dir.name)
                if subject not in SUPPORTED_SUBJECTS:
                    logger.warning("Skipping unsupported subject directory: %s", subject_dir)
                    continue

                for file_path in sorted(subject_dir.glob("**/*")):
                    if file_path.suffix.lower() not in {".md", ".txt"}:
                        continue

                    file_stats = self.ingest_file(
                        db=db,
                        file_path=file_path,
                        grade=grade,
                        subject=subject,
                        force=force,
                    )
                    stats.files_processed += 1
                    stats.chunks_created += file_stats.chunks_created
                    stats.chunks_skipped += file_stats.chunks_skipped
                    stats.chunks_updated += file_stats.chunks_updated

        logger.info(
            "Ingestion complete: files=%d created=%d skipped=%d updated=%d",
            stats.files_processed,
            stats.chunks_created,
            stats.chunks_skipped,
            stats.chunks_updated,
        )
        return stats

    def ingest_file(
        self,
        db: Session,
        file_path: Path,
        grade: int,
        subject: str,
        force: bool = False,
    ) -> IngestionStats:
        stats = IngestionStats(files_processed=1)
        chunks = self._chunker.chunk_file(
            file_path=file_path,
            grade=grade,
            subject=subject,
        )

        if not chunks:
            return stats

        if force:
            self._vector_store.delete_by_source(str(file_path.as_posix()))

        pending_chunks: list[CurriculumChunk] = []
        pending_ids: list[str] = []
        pending_is_update: list[bool] = []

        for chunk in chunks:
            chroma_id = build_chroma_id(grade, subject, chunk.source_file, chunk.chunk_index)
            chunk_hash = content_hash(chunk.text)

            existing = self._document_repository.get_by_chroma_id(db, chroma_id)
            if existing and existing.content_hash == chunk_hash and not force:
                stats.chunks_skipped += 1
                continue

            pending_chunks.append(chunk)
            pending_ids.append(chroma_id)
            pending_is_update.append(existing is not None)

        if not pending_chunks:
            return stats

        texts = [chunk.text for chunk in pending_chunks]
        embeddings = self._embedding_provider.embed_texts(texts)

        chroma_ids: list[str] = []
        documents: list[str] = []
        metadatas: list[dict[str, str | int]] = []
        document_records: list[DocumentCreate] = []

        for chunk, chroma_id, embedding in zip(pending_chunks, pending_ids, embeddings, strict=True):
            chunk_hash = content_hash(chunk.text)
            preview = make_preview(chunk.text)

            document_records.append(
                DocumentCreate(
                    chroma_id=chroma_id,
                    title=chunk.title,
                    subject=chunk.subject,
                    grade=chunk.grade,
                    chapter=chunk.chapter,
                    source_file=chunk.source_file,
                    language=chunk.language,
                    chunk_index=chunk.chunk_index,
                    token_count=chunk.token_count,
                    content_preview=preview,
                    content_hash=chunk_hash,
                )
            )
            chroma_ids.append(chroma_id)
            documents.append(chunk.text)

        saved_documents = self._document_repository.upsert_many(db, document_records)

        for saved, chunk in zip(saved_documents, pending_chunks, strict=True):
            metadatas.append(
                {
                    "document_id": saved.id,
                    "title": chunk.title,
                    "subject": chunk.subject,
                    "grade": chunk.grade,
                    "chapter": chunk.chapter or "",
                    "source_file": chunk.source_file,
                    "language": chunk.language,
                    "chunk_index": chunk.chunk_index,
                }
            )

        self._vector_store.upsert_chunks(
            chroma_ids=chroma_ids,
            texts=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )

        stats.chunks_created += sum(1 for is_update in pending_is_update if not is_update)
        stats.chunks_updated += sum(1 for is_update in pending_is_update if is_update)

        return stats

    def _normalize_subject(self, directory_name: str) -> str:
        key = directory_name.strip().lower().replace("-", "_")
        return SUBJECT_ALIASES.get(key, key)
