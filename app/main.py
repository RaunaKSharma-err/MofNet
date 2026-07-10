from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.core.dependencies import get_rag_service
from app.schemas.ask import AskRequest

app = FastAPI(
    title="MofNet AI API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_service = get_rag_service()


@app.get("/")
async def root():
    return {
        "message": "MofNet AI API running"
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