# MofNet Agent Instructions

## Project Overview
MofNet is an offline-capable React Native (Expo) mobile app for an ESP8266 offline mesh network educational platform with an integrated backend AI tutor featuring Nepal curriculum RAG, user authentication, and teacher dashboard.

## Architecture

### Backend (Python/FastAPI)
- `app/main.py` — FastAPI app with `/ask`, `/speech/transcribe`, `/speech/chat`, `/speech/audio/{filename}` routes
- `app/infrastructure/speech/whisper.py` — Faster-Whisper `tiny` model, `task="translate"` (Nepali→English)
- `app/services/speech_services.py` — `SpeechService` for transcription and Piper TTS synthesis
- `app/infrastructure/llm/ollama.py` — Ollama LLM provider with offline model
- `app/infrastructure/embeddings/local.py` — Local `all-MiniLM-L6-v2` sentence transformer
- `app/rag/` — RAG pipeline (retriever, prompt builder, models)

### Frontend (Expo/React Native)
- `app/(tabs)/tutor.tsx` — AI tutor screen with VoiceModeOverlay for voice Q&A
- `src/services/speechService.ts` — HTTP calls to backend for voice transcription and chat
- `src/components/` — Shared UI components
- `src/config/api.ts` — API URLs: online `http://192.168.254.9:8000`, offline `http://192.168.4.2:8000`

## Key Design Decisions

### Offline First
- ALL backend models run locally (no external API calls):
  - Faster-Whisper `tiny` for Nepali→English transcription
  - Ollama `llama3.2:3b` for LLM responses
  - `all-MiniLM-L6-v2` for embeddings
  - Piper `ne_NP-chitwan-medium` for TTS
- ESP8266 mesh network uses `http://192.168.4.2:8000`
- Android cleartext HTTP permission required for LAN IP access

### Voice Pipeline (Nepali → English → RAG → English Answer)
1. Student speaks Nepali in VoiceModeOverlay
2. Audio recorded via `expo-av`, sent as multipart to `/speech/chat`
3. Faster-Whisper `tiny` translates Nepali audio → English text (task="translate")
4. English text goes through RAG pipeline (English query → English answer)
5. Answer returned as text (Piper TTS skipped for speed)
6. Student reads the English answer

### Performance Optimizations (Target: <5s response)
- Whisper `tiny` model (3-5x faster than `small`)
- Ollama `num_ctx=1024`, `num_predict=100` (reduced from 2048/180)
- Ollama `num_batch=64`, `num_gpu=1` for faster inference
- Piper TTS skipped for voice chat (text-only response)
- In-memory LRU cache (`_VoiceCache`) for repeated queries (64 entries)
- Temp files cleaned up in `finally` blocks

### UI Layout
- `VoiceModeOverlay` — full-screen recording UI with pulsing red dot, close button (top-left, red-tinted), "Recording" indicator
- `KeyboardAvoidingView` with `behavior="padding"` and `keyboardVerticalOffset=100`
- Input bar at bottom with moderate padding
- Messages scroll above input

## Prerequisites for Offline Use
1. Install Python deps: `pip install -e .`
2. Download Faster-Whisper tiny model: `faster-whisper` downloads automatically on first run
3. Download Ollama `llama3.2:3b` model: `ollama pull llama3.2:3b`
4. Download embedding model: `python download_model.py` (saves to `./models/`)
5. Download Piper Nepali voice: `ne_NP-chitwan-medium` (set via `PIPER_MODEL_PATH` and `PIPER_CONFIG_PATH` in `.env`)
6. Start backend: `uvicorn app.main:app --reload --port 8000`

## File Structure
```
MofNet/
├── app/
│   ├── main.py                  # FastAPI app with all routes
│   ├── infrastructure/
│   │   ├── speech/whisper.py    # Whisper transcription (tiny, translate)
│   │   ├── llm/ollama.py        # Ollama LLM provider
│   │   └── embeddings/local.py  # Local sentence-transformer
│   ├── services/
│   │   ├── speech_services.py   # SpeechService (transcribe + TTS)
│   │   └── rag_service.py       # RAG service
│   ├── rag/                     # RAG pipeline
│   └── core/dependencies.py     # Dependency injection (lru_cache)
├── MofnetClient/
│   ├── app/(tabs)/tutor.tsx     # AI tutor screen
│   ├── src/services/speechService.ts  # Voice HTTP client
│   └── src/config/api.ts        # API URLs
├── download_model.py            # Download embedding model
└── pyproject.toml               # Python project config
```