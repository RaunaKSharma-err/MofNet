import sys
sys.path.insert(0, "D:/PROGRAMMING/WORKING ON/MofNet")

from app.config.settings import get_settings
from app.infrastructure.embeddings.local import LocalEmbeddingProvider
from app.infrastructure.vector_store.chroma_store import ChromaVectorStore
from app.rag.retriever import ContextRetriever

settings = get_settings()
embedding_provider = LocalEmbeddingProvider()
vector_store = ChromaVectorStore(settings)
retriever = ContextRetriever(settings, embedding_provider, vector_store)

for top_k in [2, 3, 5]:
    result = retriever.retrieve("What is photosynthesis?", grade=None, subject=None)
    print(f"\ntop_k={top_k}: {len(result.chunks)} chunks")
    for i, c in enumerate(result.chunks):
        print(f"  {i+1}. {c.title} (grade {c.grade}) score={c.relevance_score:.3f}")
        print(f"     {c.text[:100]}...")
