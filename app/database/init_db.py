from app.database.base import Base
from app.database.models import Analytics, Document, Question  # noqa: F401
from app.database.session import engine


def init_db() -> None:
    """Create all tables. Used at startup and by ingestion scripts."""
    Base.metadata.create_all(bind=engine)
