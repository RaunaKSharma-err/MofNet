from functools import lru_cache

from app.config.settings import Settings, get_settings
from app.infrastructure.embeddings.local import LocalEmbeddingProvider
from app.infrastructure.llm.ollama import OllamaLLMProvider
from app.infrastructure.vector_store.chroma_store import ChromaVectorStore
from app.rag.chunker import CurriculumChunker
from app.rag.ingestion import CurriculumIngestionPipeline
from app.rag.prompt_builder import PromptBuilder
from app.rag.retriever import ContextRetriever
from app.repositories.document_repository import DocumentRepository
from app.services.ingestion_service import IngestionService
from app.services.rag_service import RAGService


@lru_cache
def get_embedding_provider():
    return LocalEmbeddingProvider()


@lru_cache
def get_llm_provider():
    settings = get_settings()
    return OllamaLLMProvider(settings)


@lru_cache
def get_vector_store() -> ChromaVectorStore:
    return ChromaVectorStore(get_settings())


@lru_cache
def get_chunker() -> CurriculumChunker:
    return CurriculumChunker(get_settings())


@lru_cache
def get_prompt_builder() -> PromptBuilder:
    return PromptBuilder()


@lru_cache
def get_document_repository() -> DocumentRepository:
    return DocumentRepository()


@lru_cache
def get_context_retriever() -> ContextRetriever:
    settings = get_settings()
    return ContextRetriever(
        settings=settings,
        embedding_provider=get_embedding_provider(),
        vector_store=get_vector_store(),
    )


@lru_cache
def get_ingestion_pipeline() -> CurriculumIngestionPipeline:
    settings = get_settings()
    return CurriculumIngestionPipeline(
        settings=settings,
        chunker=get_chunker(),
        embedding_provider=get_embedding_provider(),
        vector_store=get_vector_store(),
        document_repository=get_document_repository(),
    )


@lru_cache
def get_ingestion_service() -> IngestionService:
    return IngestionService(
        settings=get_settings(),
        pipeline=get_ingestion_pipeline(),
    )


@lru_cache
def get_rag_service() -> RAGService:
    settings = get_settings()
    return RAGService(
        settings=settings,
        retriever=get_context_retriever(),
        prompt_builder=get_prompt_builder(),
        llm_provider=get_llm_provider(),
    )
