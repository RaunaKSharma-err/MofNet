from sqlalchemy.orm import Session

from app.database.models.document import Document
from app.models.document import DocumentCreate


class DocumentRepository:
    def get_by_chroma_id(self, db: Session, chroma_id: str) -> Document | None:
        return db.query(Document).filter(Document.chroma_id == chroma_id).one_or_none()

    def get_by_id(self, db: Session, document_id: str) -> Document | None:
        return db.get(Document, document_id)

    def upsert_many(self, db: Session, records: list[DocumentCreate]) -> list[Document]:
        saved: list[Document] = []

        for record in records:
            existing = self.get_by_chroma_id(db, record.chroma_id)
            if existing:
                existing.title = record.title
                existing.subject = record.subject
                existing.grade = record.grade
                existing.chapter = record.chapter
                existing.source_file = record.source_file
                existing.language = record.language
                existing.chunk_index = record.chunk_index
                existing.token_count = record.token_count
                existing.content_preview = record.content_preview
                existing.content_hash = record.content_hash
                saved.append(existing)
            else:
                document = Document(
                    chroma_id=record.chroma_id,
                    title=record.title,
                    subject=record.subject,
                    grade=record.grade,
                    chapter=record.chapter,
                    source_file=record.source_file,
                    language=record.language,
                    chunk_index=record.chunk_index,
                    token_count=record.token_count,
                    content_preview=record.content_preview,
                    content_hash=record.content_hash,
                )
                db.add(document)
                saved.append(document)

        db.commit()
        for document in saved:
            db.refresh(document)

        return saved

    def count(self, db: Session) -> int:
        return db.query(Document).count()
