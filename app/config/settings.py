from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: str = "development"
    log_level: str = "INFO"

    # SQLite
    database_url: str = "sqlite:///./data/mofnet.db"
    database_echo: bool = False

    # ChromaDB
    chroma_persist_dir: str = "./data/chroma"
    chroma_collection: str = "curriculum"

    # Provider selection
    llm_provider: Literal["openrouter", "ollama"] = "ollama"
    embedding_provider: Literal["openrouter", "ollama"] = "ollama"

    # OpenRouter
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "anthropic/claude-3-haiku"
    openrouter_embedding_model: str = "openai/text-embedding-3-small"
    openrouter_app_name: str = "MofNet AI"
    openrouter_timeout_seconds: float = 60.0

    # Ollama (future)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2:1b"
    ollama_embedding_model: str = "nomic-embed-text"

    # RAG
    curriculum_dir: str = "./data/curriculum"
    rag_top_k: int = 3
    rag_min_score: float = 0.45
    rag_chunk_size: int = 1000
    rag_chunk_overlap: int = 150
    rag_llm_temperature: float = 0.2
    rag_embedding_batch_size: int = 32
    rag_max_context_tokens: int = 1024
    rag_num_predict: int = 96
    rag_confidence_threshold: float = 0.40

    # Model Router
    general_model: str = "qwen2.5:0.5b"
    general_num_predict: int = 96


@lru_cache
def get_settings() -> Settings:
    return Settings()
