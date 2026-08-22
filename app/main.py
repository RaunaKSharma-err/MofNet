import hashlib
import json
import os
import time
import uuid

import httpx

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse

from app.config.settings import get_settings
from app.core.dependencies import get_rag_service
from app.rag.interfaces.llm import LLMProvider
from app.rag.interfaces.speech import SpeechProvider
from app.rag.models import RAGContext, RetrievalResult
from app.services.rag_service import _strip_llm_fallback
from app.schemas.ask import AskRequest
from app.services.speech_services import SpeechService
from app.infrastructure.llm.ollama import _auto_detect_threads

app = FastAPI(
    title="MofNet AI API",
    version="1.0.0",
)

@app.on_event("startup")
async def startup_event():
    print("[BACKEND] MofNet API starting up...")
    print("[BACKEND] Backend is ready to accept requests")

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
    def __init__(self, maxsize: int = 64) -> None:
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

_ask_cache: dict[str, str] = {}
_ask_cache_keys: list[str] = []
_ASK_CACHE_MAX = 128

_ollama_warm = False
_ollama_warm_lock = __import__("threading").Lock()


def _verify_ollama_model_loaded(model_name: str, base_url: str) -> bool:
    try:
        client = httpx.Client(timeout=5)
        resp = client.get(f"{base_url}/api/tags")
        resp.raise_for_status()
        data = resp.json()
        models = [m.get("name", "") for m in data.get("models", [])]
        client.close()
        return any(model_name in m for m in models)
    except Exception:
        return False


def _warm_up_models_async(settings) -> None:
    global _ollama_warm
    curriculum_model = getattr(settings, "ollama_model", "llama3.2:1b")
    general_model = getattr(settings, "general_model", "qwen2.5:0.5b")
    base_url = settings.ollama_base_url

    curriculum_ready = _verify_ollama_model_loaded(curriculum_model, base_url)
    general_ready = _verify_ollama_model_loaded(general_model, base_url)

    if curriculum_ready and general_ready:
        print(f"[OLLAMA] Both models already loaded: {curriculum_model}, {general_model}")
        _ollama_warm = True
        return

    print("[OLLAMA] Starting warm-up...")

    models_to_warm = []
    if not curriculum_ready:
        models_to_warm.append(curriculum_model)
    if not general_ready:
        models_to_warm.append(general_model)

    for model_name in models_to_warm:
        print(f"[OLLAMA] Warming {model_name}...")
        for attempt in range(5):
            try:
                client = httpx.Client(timeout=60)
                payload = {
                    "model": model_name,
                    "messages": [{"role": "user", "content": "Hi"}],
                    "stream": True,
                    "keep_alive": "30m",
                    "options": {
                        "temperature": 0.2,
                        "num_ctx": 1024,
                        "num_predict": 1,
                        "num_thread": _auto_detect_threads(),
                    },
                }
                resp = client.post(
                    f"{base_url}/api/chat",
                    json=payload,
                )
                resp.raise_for_status()
                for _ in resp.iter_lines():
                    pass
                client.close()

                if _verify_ollama_model_loaded(model_name, base_url):
                    print(f"[OLLAMA] Model {model_name} loaded and verified.")
                else:
                    print(f"[OLLAMA] Attempt {attempt + 1}/5: model not verified after request.")
            except Exception as exc:
                print(f"[OLLAMA] Attempt {attempt + 1}/5 failed for {model_name}: {exc}")

            import time as _time
            _time.sleep(2 ** attempt)

    final_curriculum = _verify_ollama_model_loaded(curriculum_model, base_url)
    final_general = _verify_ollama_model_loaded(general_model, base_url)
    if final_curriculum and final_general:
        print("[OLLAMA] Both models warmed successfully.")
        _ollama_warm = True
    else:
        print("[OLLAMA] Warm-up incomplete. Models will load on first request.")


def _warm_up_models() -> None:
    import threading

    settings = get_settings()
    thread = threading.Thread(
        target=_warm_up_models_async,
        args=(settings,),
        daemon=True,
    )
    thread.start()


@app.on_event("startup")
def startup_event() -> None:
    _warm_up_models()


@app.get("/")
async def root():
    return {
        "message": "MofNet AI API running",
        "ollama_warm": _ollama_warm,
        "model": rag_service._settings.ollama_model,
    }


@app.get("/health")
async def health():
    warm = _verify_ollama_model_loaded(
        rag_service._settings.ollama_model,
        rag_service._settings.ollama_base_url,
    )
    return {
        "status": "healthy",
        "ollama_warm": warm,
        "model": rag_service._settings.ollama_model,
    }


def _make_cache_key(payload: AskRequest, top_k_override: int | None = None, confidence_threshold: float | None = None, num_predict_override: int | None = None, num_thread_override: int | None = None) -> str:
    key_raw = f"{payload.question.strip().lower()}|{payload.grade}|{payload.subject}|{payload.language}|top_k={top_k_override}|conf={confidence_threshold}|np={num_predict_override}|nt={num_thread_override}"
    return hashlib.sha256(key_raw.encode("utf-8")).hexdigest()


def _get_cached(key: str) -> str | None:
    return _ask_cache.get(key)


def _set_cache(key: str, value: str) -> None:
    global _ask_cache_keys
    if key in _ask_cache:
        return
    if len(_ask_cache_keys) >= _ASK_CACHE_MAX:
        oldest = _ask_cache_keys.pop(0)
        _ask_cache.pop(oldest, None)
    _ask_cache_keys.append(key)
    _ask_cache[key] = value


def _print_perf(
    request_id: str,
    question: str,
    cache: str,
    embedding_duration_ms: float | None = None,
    retrieval_duration_ms: float | None = None,
    prompt_duration_ms: float | None = None,
    prompt_tokens: int | None = None,
    ollama_load_s: float | None = None,
    prompt_eval_s: float | None = None,
    ttft_ms: float | None = None,
    generation_duration_ms: float | None = None,
    generated_tokens: int | None = None,
    tokens_per_sec: float | None = None,
    total_ms: float | None = None,
    gate_rejected: bool = False,
    gate_reason: str = "",
    top_score: float = 0.0,
    error: str | None = None,
) -> None:
    lines = [
        "",
        "=" * 50,
        f"REQUEST {request_id}",
        f"Question: {question}",
        "=" * 50,
        f"Cache             : {cache}",
    ]
    if embedding_duration_ms is not None:
        lines.append(f"Embedding         : {embedding_duration_ms:.0f} ms")
    if retrieval_duration_ms is not None:
        lines.append(f"Retrieval         : {retrieval_duration_ms:.0f} ms")
    if prompt_duration_ms is not None:
        lines.append(f"Prompt            : {prompt_duration_ms:.0f} ms")
    if prompt_tokens is not None:
        lines.append(f"Prompt tokens     : {prompt_tokens}")
    if ollama_load_s is not None:
        lines.append(f"Ollama load       : {ollama_load_s:.2f}s")
    if prompt_eval_s is not None:
        lines.append(f"Prompt eval       : {prompt_eval_s:.2f}s")
    if ttft_ms is not None:
        lines.append(f"TTFT              : {ttft_ms:.0f} ms")
    if generation_duration_ms is not None:
        lines.append(f"Generation        : {generation_duration_ms:.0f} ms")
    if generated_tokens is not None:
        lines.append(f"Generated tokens  : {generated_tokens}")
    if tokens_per_sec is not None:
        lines.append(f"Tokens/sec        : {tokens_per_sec:.1f}")
    if gate_rejected:
        lines.append(f"Gate              : REJECTED - {gate_reason} (top_score={top_score:.3f})")
    if error:
        lines.append(f"ERROR             : {error}")
    if total_ms is not None:
        lines.append(f"Total             : {total_ms:.0f} ms")
    lines.append("=" * 50)
    print("\n".join(lines))


@app.post("/ask")
async def ask(payload: AskRequest, stream: bool = True, top_k_override: int | None = None, confidence_threshold: float | None = None, num_predict_override: int | None = None, num_thread_override: int | None = None):
    request_id = uuid.uuid4().hex[:8]
    total_start = time.perf_counter()
    print(f"\n[DEBUG {request_id}] stream={stream} top_k={top_k_override} conf={confidence_threshold} num_predict={num_predict_override} num_thread={num_thread_override}")

    try:
        cache_key = _make_cache_key(payload, top_k_override, confidence_threshold, num_predict_override, num_thread_override)
        cached = _get_cached(cache_key)
        cache_check_time = time.perf_counter() - total_start

        if cached is not None:
            _print_perf(
                request_id=request_id,
                question=payload.question,
                cache="HIT",
                total_ms=cache_check_time * 1000,
            )
            response = {
                "answer": cached,
                "latency_ms": int(cache_check_time * 1000),
                "cached": True,
                "sources": [],
                "mode": "curriculum",
                "model": rag_service._settings.ollama_model,
            }
            return response

        original_top_k = rag_service._settings.rag_top_k
        original_threshold = rag_service._settings.rag_confidence_threshold
        original_num_predict = getattr(rag_service._settings, "rag_num_predict", 96)
        if top_k_override is not None:
            rag_service._settings.rag_top_k = top_k_override
        if confidence_threshold is not None:
            rag_service._settings.rag_confidence_threshold = confidence_threshold
        if num_predict_override is not None:
            rag_service._settings.rag_num_predict = num_predict_override

        try:
            if stream:
                async def _stream():
                    try:
                        # 1. Request received
                        # 2. Embedding start
                        embedding_start = time.perf_counter()
                        retrieval = rag_service._retriever.retrieve(
                            question=payload.question,
                            grade=payload.grade,
                            subject=payload.subject,
                        )
                        embedding_end = time.perf_counter()
                        # 3. Embedding duration
                        embedding_duration_ms = (embedding_end - embedding_start) * 1000
                        # 4-5. ChromaDB retrieval duration
                        retrieval_duration_ms = retrieval.retrieval_duration_ms

                        route = rag_service._route_question(payload.question, retrieval)
                        mode = route["mode"]
                        selected_model = route["model"]
                        top_score = route["top_score"]

                        if mode == "safety":
                            total_elapsed = time.perf_counter() - total_start
                            _print_perf(
                                request_id=request_id,
                                question=payload.question,
                                cache="MISS",
                                embedding_duration_ms=embedding_duration_ms,
                                retrieval_duration_ms=retrieval_duration_ms,
                                total_ms=total_elapsed * 1000,
                                gate_rejected=True,
                                gate_reason="safety",
                                top_score=top_score,
                            )
                            yield f"data: {json.dumps({'chunk': '', 'done': True, 'answer': route['answer'], 'top_score': top_score, 'mode': 'safety', 'model': None})}\n\n"
                            return

                        if mode == "general":
                            from app.rag.general_prompt_builder import build_general_messages
                            messages = build_general_messages(payload.question, payload.language)
                            filtered_chunks = []
                        else:
                            filtered_chunks = rag_service._filter_context_chunks(
                                retrieval.chunks,
                                min_score=rag_service._settings.rag_min_score,
                                top_score=top_score,
                            )
                            from app.rag.models import RAGContext
                            context = RAGContext(
                                question=payload.question,
                                chunks=filtered_chunks,
                                grade=payload.grade,
                                subject=payload.subject,
                                language=payload.language,
                            )
                            messages = rag_service._prompt_builder.build_messages(context)

                        # 6. Prompt construction
                        prompt_start = time.perf_counter()
                        prompt_end = time.perf_counter()
                        prompt_duration_ms = (prompt_end - prompt_start) * 1000

                        # 7. Ollama request start
                        ollama_request_start = time.perf_counter()
                        full_answer: list[str] = []
                        tokens_generated = 0
                        first_token_time = None
                        ollama_meta = {}
                        prompt_tokens = None

                        async for token in rag_service._llm_provider.generate_stream(
                            messages=messages,
                            temperature=rag_service._settings.rag_llm_temperature,
                            num_predict=num_predict_override,
                            num_thread=num_thread_override,
                            model=selected_model,
                        ):
                            if token.startswith("\n__LLM_LATENCY__:"):
                                try:
                                    meta_str = token.split(":", 2)[2]
                                    ollama_meta = json.loads(meta_str)
                                    prompt_tokens = ollama_meta.get("prompt_eval_count")
                                except Exception:
                                    pass
                                continue
                            if first_token_time is None:
                                first_token_time = time.perf_counter() - total_start
                            tokens_generated += 1
                            full_answer.append(token)
                            yield f"data: {json.dumps({'chunk': token, 'mode': mode, 'model': selected_model})}\n\n"

                        answer = "".join(full_answer)
                        answer = _strip_llm_fallback(answer)
                        _set_cache(cache_key, answer)

                        total_elapsed = time.perf_counter() - total_start
                        generation_time = time.perf_counter() - ollama_request_start
                        generation_duration_ms = generation_time * 1000
                        tokens_per_sec = tokens_generated / generation_time if generation_time > 0 else 0

                        ollama_load_s = ollama_meta.get("load_duration", 0) / 1e9 if ollama_meta.get("load_duration") else None
                        prompt_eval_s = ollama_meta.get("prompt_eval_duration", 0) / 1e9 if ollama_meta.get("prompt_eval_duration") else None
                        ttft_ms = first_token_time * 1000 if first_token_time else None

                        _print_perf(
                            request_id=request_id,
                            question=payload.question,
                            cache="MISS",
                            embedding_duration_ms=embedding_duration_ms,
                            retrieval_duration_ms=retrieval_duration_ms,
                            prompt_duration_ms=prompt_duration_ms,
                            prompt_tokens=prompt_tokens,
                            ollama_load_s=ollama_load_s,
                            prompt_eval_s=prompt_eval_s,
                            ttft_ms=ttft_ms,
                            generation_duration_ms=generation_duration_ms,
                            generated_tokens=tokens_generated,
                            tokens_per_sec=tokens_per_sec,
                            total_ms=total_elapsed * 1000,
                            top_score=top_score,
                        )

                        yield f"data: {json.dumps({'chunk': '', 'done': True, 'answer': answer, 'top_score': top_score, 'mode': mode, 'model': selected_model})}\n\n"

                    except Exception as exc:
                        yield f"data: {json.dumps({'error': str(exc)})}\n\n"

                return StreamingResponse(
                    _stream(),
                    media_type="text/event-stream",
                    headers={
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                        "X-Accel-Buffering": "no",
                    },
                )

            result = rag_service.ask(
                question=payload.question,
                grade=payload.grade,
                subject=payload.subject,
                language=payload.language,
            )

            if result.ollama_skipped and result.mode == "safety":
                total_elapsed = time.perf_counter() - total_start
                _print_perf(
                    request_id=request_id,
                    question=payload.question,
                    cache="MISS",
                    embedding_duration_ms=result.retrieval.embedding_duration_ms,
                    retrieval_duration_ms=result.retrieval.retrieval_duration_ms,
                    total_ms=total_elapsed * 1000,
                    gate_rejected=True,
                    gate_reason="safety",
                    top_score=result.retrieval.chunks[0].relevance_score if result.retrieval.chunks else 0,
                )
                return {
                    "answer": result.answer,
                    "latency_ms": result.latency_ms,
                    "cached": False,
                    "sources": [],
                    "mode": "safety",
                    "model": None,
                    "top_score": result.retrieval.chunks[0].relevance_score if result.retrieval.chunks else 0,
                }

            _set_cache(cache_key, result.answer)

            total_elapsed = time.perf_counter() - total_start
            ollama_time = result.latency_ms / 1000.0 - result.retrieval.retrieval_duration_ms / 1000.0
            generation_duration_ms = ollama_time * 1000
            tokens_per_sec = result.llm_response.completion_tokens / ollama_time if result.llm_response and result.llm_response.completion_tokens and ollama_time > 0 else 0

            _print_perf(
                request_id=request_id,
                question=payload.question,
                cache="MISS",
                embedding_duration_ms=result.retrieval.embedding_duration_ms,
                retrieval_duration_ms=result.retrieval.retrieval_duration_ms,
                generation_duration_ms=generation_duration_ms,
                generated_tokens=result.llm_response.completion_tokens if result.llm_response else None,
                tokens_per_sec=tokens_per_sec,
                total_ms=total_elapsed * 1000,
                top_score=result.retrieval.chunks[0].relevance_score if result.retrieval.chunks else 0,
            )

            return {
                "answer": result.answer,
                "latency_ms": result.latency_ms,
                "cached": False,
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
                ],
                "top_score": result.retrieval.chunks[0].relevance_score if result.retrieval.chunks else 0,
                "mode": result.mode,
                "model": result.model,
            }
        finally:
            if top_k_override is not None:
                rag_service._settings.rag_top_k = original_top_k
            if confidence_threshold is not None:
                rag_service._settings.rag_confidence_threshold = original_threshold
            if num_predict_override is not None:
                rag_service._settings.rag_num_predict = original_num_predict

    except Exception as e:
        total_elapsed = time.perf_counter() - total_start
        _print_perf(
            request_id=request_id,
            question=payload.question,
            cache="MISS",
            total_ms=total_elapsed * 1000,
            error=str(e),
        )
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.post("/speech/transcribe")
async def transcribe_speech(file: UploadFile = File(...)):
    tmp_path: str | None = None
    try:
        import tempfile
        content = await file.read()

        print(f"[SPEECH] /speech/transcribe received file: {file.filename}, size: {len(content)} bytes")

        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")

        if len(content) > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Audio file too large (max 50MB)")

        suffix = ".wav"
        if file.filename:
            ext = file.filename.rsplit(".", 1)[-1].lower()
            if ext in ("wav", "mp3", "ogg", "m4a", "webm"):
                suffix = f".{ext}"

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        print(f"[SPEECH] Saved audio to: {tmp_path}")
        text = speech_service.transcribe(tmp_path)
        print(f"[SPEECH] Transcription result: {text[:100]}")
        return {"text": text, "language": "en"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[SPEECH] /speech/transcribe error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.post("/speech/chat")
async def voice_chat(file: UploadFile = File(...), grade: int | None = None, subject: str | None = None):
    tmp_path: str | None = None
    try:
        import tempfile
        content = await file.read()

        print(f"[SPEECH] /speech/chat received file: {file.filename}, size: {len(content)} bytes")

        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")

        if len(content) > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Audio file too large (max 50MB)")

        suffix = ".wav"
        if file.filename:
            ext = file.filename.rsplit(".", 1)[-1].lower()
            if ext in ("wav", "mp3", "ogg", "m4a", "webm"):
                suffix = f".{ext}"

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        print(f"[SPEECH] Saved audio to: {tmp_path}")
        english_text = speech_service.transcribe(tmp_path)
        print(f"[SPEECH] Transcription: {english_text[:100]}")

        if not english_text.strip():
            raise HTTPException(status_code=400, detail="Could not transcribe audio. Please try again.")

        cache_key = english_text.strip().lower()
        cached = _voice_cache.get(cache_key)
        if cached is not None:
            print(f"[SPEECH] Cache hit for: {english_text[:50]}")
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

        _voice_cache.set(cache_key, rag_result.answer)

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
    except HTTPException:
        raise
    except Exception as e:
        print(f"[SPEECH] /speech/chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.post("/speech/chat/stream")
async def voice_chat_stream(file: UploadFile = File(...), grade: int | None = None, subject: str | None = None, num_predict_override: int | None = None, num_thread_override: int | None = None):
    tmp_path: str | None = None
    try:
        import tempfile
        content = await file.read()

        print(f"[SPEECH] /speech/chat/stream received file: {file.filename}, size: {len(content)} bytes")

        if len(content) == 0:
            async def _err():
                yield f"data: {json.dumps({'error': 'Empty audio file'})}\n\n"
            return StreamingResponse(_err(), media_type="text/event-stream")

        if len(content) > 50 * 1024 * 1024:
            async def _err():
                yield f"data: {json.dumps({'error': 'Audio file too large (max 50MB)'})}\n\n"
            return StreamingResponse(_err(), media_type="text/event-stream")

        suffix = ".wav"
        if file.filename:
            ext = file.filename.rsplit(".", 1)[-1].lower()
            if ext in ("wav", "mp3", "ogg", "m4a", "webm"):
                suffix = f".{ext}"

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        print(f"[SPEECH] Saved audio to: {tmp_path}")
        english_text = speech_service.transcribe(tmp_path)
        print(f"[SPEECH] Transcription: {english_text[:100]}")

        if not english_text.strip():
            async def _err():
                yield f"data: {json.dumps({'error': 'Could not transcribe audio. Please try again.'})}\n\n"
            return StreamingResponse(_err(), media_type="text/event-stream")

        cache_key = english_text.strip().lower()
        cached = _voice_cache.get(cache_key)
        if cached is not None:
            async def _cached():
                yield f"data: {json.dumps({'transcription': english_text, 'answer': cached, 'cached': True})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
            return StreamingResponse(_cached(), media_type="text/event-stream")

        temperature = rag_service._settings.rag_llm_temperature
        num_thread = num_thread_override or _auto_detect_threads()
        num_predict = num_predict_override or rag_service._settings.rag_num_predict

        async def _stream():
            try:
                embedding_start = time.perf_counter()
                retrieval = rag_service._retriever.retrieve(
                    question=english_text,
                    grade=grade,
                    subject=subject,
                )
                embedding_duration_ms = (time.perf_counter() - embedding_start) * 1000
                retrieval_duration_ms = retrieval.retrieval_duration_ms
                top_score = retrieval.chunks[0].relevance_score if retrieval.chunks else 0.0

                route = rag_service._route_question(english_text, retrieval)
                mode = route["mode"]
                selected_model = route["model"]

                if mode == "safety":
                    yield f"data: {json.dumps({'chunk': '', 'done': True, 'answer': route['answer'], 'transcription': english_text, 'top_score': top_score, 'mode': 'safety', 'model': None})}\n\n"
                    return

                if mode == "general":
                    from app.rag.general_prompt_builder import build_general_messages
                    messages = build_general_messages(english_text, "en")
                    filtered_chunks = []
                else:
                    filtered_chunks = rag_service._filter_context_chunks(
                        retrieval.chunks,
                        min_score=rag_service._settings.rag_min_score,
                        top_score=top_score,
                    )
                    from app.rag.models import RAGContext
                    context = RAGContext(
                        question=english_text,
                        chunks=filtered_chunks,
                        grade=grade,
                        subject=subject,
                        language="en",
                    )
                    messages = rag_service._prompt_builder.build_messages(context)

                prompt_start = time.perf_counter()
                full_answer: list[str] = []
                async for token in rag_service._llm_provider.generate_stream(
                    messages=messages,
                    temperature=temperature,
                    num_predict=num_predict,
                    num_thread=num_thread,
                    model=selected_model,
                ):
                    if token.startswith("\n__LLM_LATENCY__:"):
                        continue
                    full_answer.append(token)
                    yield f"data: {json.dumps({'chunk': token, 'mode': mode, 'model': selected_model})}\n\n"

                answer = "".join(full_answer)
                answer = _strip_llm_fallback(answer)
                _voice_cache.set(cache_key, answer)
                yield f"data: {json.dumps({'chunk': '', 'done': True, 'answer': answer, 'transcription': english_text, 'top_score': top_score, 'mode': mode, 'model': selected_model})}\n\n"

            except Exception as exc:
                yield f"data: {json.dumps({'error': str(exc)})}\n\n"

        return StreamingResponse(
            _stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    except HTTPException:
        raise
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
