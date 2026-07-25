import os

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.core.dependencies import get_rag_service
from app.rag.interfaces.speech import SpeechProvider
from app.schemas.ask import AskRequest
from app.services.speech_services import SpeechService

app = FastAPI(
    title="MofNet AI API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_service = get_rag_service()

speech_service = SpeechService()


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


@app.post("/speech/transcribe")
async def transcribe_speech(file: UploadFile = File(...)):
    try:
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        text = speech_service.transcribe(tmp_path)
        os.unlink(tmp_path)
        return {"text": text, "language": "en"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/speech/chat")
async def voice_chat(file: UploadFile = File(...), grade: int | None = None, subject: str | None = None):
    try:
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        english_text = speech_service.transcribe(tmp_path)
        os.unlink(tmp_path)

        rag_result = rag_service.ask(
            question=english_text,
            grade=grade,
            subject=subject,
            language="en",
        )

        audio_response_path = None
        try:
            audio_response_path = speech_service.synthesize(rag_result.answer)
        except Exception:
            audio_response_path = None

        return {
            "transcription": english_text,
            "answer": rag_result.answer,
            "language": "en",
            "audio_url": audio_response_path,
            "sources": [
                {
                    "title": c.title,
                    "chapter": c.chapter,
                    "subject": c.subject,
                    "grade": c.grade,
                    "score": c.relevance_score,
                }
                for c in rag_result.retrieval.chunks
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/speech/audio/{filename}")
async def get_speech_audio(filename: str):
    path = f"./data/audio/{filename}"
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(path, media_type="audio/wav", filename=filename)
