from app.database.base import Base
from app.database.models.document import Document  # noqa: F401
from app.database.session import engine


def init_db() -> None:
    """Create tables used by the ingestion pipeline."""
    Base.metadata.create_all(bind=engine)
