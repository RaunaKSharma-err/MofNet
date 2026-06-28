from sentence_transformers import SentenceTransformer
from app.rag.interfaces.embedding import EmbeddingProvider

class LocalEmbeddingProvider(EmbeddingProvider):
    def __init__(self):
        self.model = SentenceTransformer(
            "./models/all-MiniLM-L6-v2",
            local_files_only=True
        )

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        return self.model.encode(texts).tolist()

    def embed_query(self, text: str) -> list[float]:
        return self.model.encode(text).tolist()