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


class _VoiceCache:
    def __init__(self, maxsize: int = 64):
        self._cache: dict[str, str] = {}
        self._keys: list[str] = []
        self._maxsize = maxsize

    def get(self, key: str) -> str | None:
        return self._cache.get(key)

    def set(self, key: str, value: str) -> None:
        if key in self._cache:
            self._keys.remove(key)
        elif len(self._keys) >= self._maxsize:
            oldest = self._keys.pop(0)
            del self._cache[oldest]
        self._keys.append(key)
        self._cache[key] = value


_voice_cache = _VoiceCache(maxsize=64)


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
    tmp_path: str | None = None
    try:
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        text = speech_service.transcribe(tmp_path)
        return {"text": text, "language": "en"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.post("/speech/chat")
async def voice_chat(file: UploadFile = File(...), grade: int | None = None, subject: str | None = None):
    tmp_path: str | None = None
    try:
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        english_text = speech_service.transcribe(tmp_path)

        cached = _voice_cache.get(english_text.strip().lower())
        if cached is not None:
            return {
                "transcription": english_text,
                "answer": cached,
                "language": "en",
                "cached": True,
                "sources": [],
            }

        rag_result = rag_service.ask(
            question=english_text,
            grade=grade,
            subject=subject,
            language="en",
        )

        _voice_cache.set(english_text.strip().lower(), rag_result.answer)

        return {
            "transcription": english_text,
            "answer": rag_result.answer,
            "language": "en",
            "cached": False,
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
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.get("/speech/audio/{filename}")
async def get_speech_audio(filename: str):
    path = f"./data/audio/{filename}"
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(path, media_type="audio/wav", filename=filename)
