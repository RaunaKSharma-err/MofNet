from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.config.settings import get_settings


def _configure_sqlite(engine: Engine) -> None:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, _connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def create_db_engine():
    settings = get_settings()
    engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False},
        echo=settings.database_echo,
    )
    if settings.database_url.startswith("sqlite"):
        _configure_sqlite(engine)
    return engine


engine = create_db_engine()
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
