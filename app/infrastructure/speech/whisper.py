from functools import lru_cache

from faster_whisper import WhisperModel

from app.rag.interfaces.speech import SpeechProvider


class WhisperSpeechProvider(SpeechProvider):

    def __init__(self):
        self.model = WhisperModel(
            "tiny",
            device="cpu",
            compute_type="int8",
        )

    def transcribe(self, audio_path: str) -> str:
        print(f"[WHISPER] Transcribing: {audio_path}")
        segments, _info = self.model.transcribe(
            audio_path,
            task="translate",
            beam_size=1,
            best_of=1,
            vad_filter=True,
            vad_parameters=dict(
                min_silence_duration_ms=500,
                speech_pad_ms=200,
            ),
            condition_on_previous_text=False,
        )
        text = "".join(segment.text for segment in segments)
        result = text.strip()
        print(f"[WHISPER] Result: {result[:100]}")
        return result


@lru_cache(maxsize=1)
def get_speech_provider() -> WhisperSpeechProvider:
    return WhisperSpeechProvider()