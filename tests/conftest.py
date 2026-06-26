import pytest

from app.config.settings import Settings


@pytest.fixture
def settings() -> Settings:
    return Settings()
