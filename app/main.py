from fastapi import FastAPI, HTTPException

from app.core.dependencies import get_rag_service
from app.schemas.ask import AskRequest

app = FastAPI(
    title="HimalMesh API",
    version="1.0.0"
)

rag_service = get_rag_service()


@app.get("/")
async def root():
    return {
        "message": "HimalMesh API running"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy"
    }


@app.post("/ask")
async def ask(payload: AskRequest):
    try:
        result = rag_service.ask(
            question=payload.question,
            grade=payload.grade,
            subject=payload.subject,
            language=payload.language,
        )

        return {
            "answer": result.answer,
            "latency_ms": result.latency_ms,
            "sources": [
                {
                    "title": c.title,
                    "chapter": c.chapter,
                    "subject": c.subject,
                    "grade": c.grade,
                    "score": c.relevance_score,
                    "text": c.text[:300],
                }
                for c in result.retrieval.chunks
            ]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )