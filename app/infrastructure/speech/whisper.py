from functools import lru_cache

from faster_whisper import WhisperModel

from app.rag.interfaces.speech import SpeechProvider


class WhisperSpeechProvider(SpeechProvider):

    def __init__(self):
        self.model = WhisperModel(
            "small",
            device="cpu",
            compute_type="int8",
        )

    def transcribe(self, audio_path: str) -> str:
        segments, _info = self.model.transcribe(
            audio_path,
            task="translate",
        )
        return "".join(segment.text for segment in segments)


@lru_cache(maxsize=1)
def get_speech_provider() -> WhisperSpeechProvider:
    return WhisperSpeechProvider()