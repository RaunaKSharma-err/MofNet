from pathlib import Path

from sqlalchemy.orm import Session

from app.config.settings import Settings
from app.core.logging import get_logger
from app.database.session import SessionLocal
from app.rag.chunker import CurriculumChunker
from app.rag.ingestion import CurriculumIngestionPipeline
from app.rag.models import IngestionStats
from app.repositories.document_repository import DocumentRepository

logger = get_logger(__name__)


class IngestionService:
    def __init__(
        self,
        settings: Settings,
        pipeline: CurriculumIngestionPipeline,
    ) -> None:
        self._settings = settings
        self._pipeline = pipeline

    def ingest_curriculum(
        self,
        db: Session,
        curriculum_dir: Path | None = None,
        force: bool = False,
    ) -> IngestionStats:
        logger.info("Starting curriculum ingestion from %s", curriculum_dir or self._settings.curriculum_dir)
        return self._pipeline.ingest_directory(db=db, curriculum_dir=curriculum_dir, force=force)

    def ingest_curriculum_standalone(
        self,
        curriculum_dir: Path | None = None,
        force: bool = False,
    ) -> IngestionStats:
        db = SessionLocal()
        try:
            return self.ingest_curriculum(db=db, curriculum_dir=curriculum_dir, force=force)
        finally:
            db.close()
