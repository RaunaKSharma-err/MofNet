from app.core.dependencies import get_rag_service

rag = get_rag_service()

result = rag.ask(
    question="What is photosynthesis?",
    grade=8,
    subject="science",
)

print("\nANSWER:")
print(result.answer)

print("\nRETRIEVED CHUNKS:")
for chunk in result.retrieval.chunks:
    print("-", chunk.text[:100])