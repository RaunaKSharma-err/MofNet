from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import Optional

from piper.voice import PiperVoice

from app.core.exceptions import LLMProviderError
from app.infrastructure.speech.whisper import get_speech_provider
from app.rag.interfaces.speech import SpeechProvider


class SpeechService:

    def __init__(self, provider: Optional[SpeechProvider] = None) -> None:
        self.provider = provider or get_speech_provider()
        self._piper_model_path = os.getenv("PIPER_MODEL_PATH", "")
        self._piper_config_path = os.getenv("PIPER_CONFIG_PATH", "")
        self._voice: PiperVoice | None = None

    def transcribe(self, path: str) -> str:
        return self.provider.transcribe(path)

    def _load_piper_voice(self) -> PiperVoice:
        if self._voice is not None:
            return self._voice

        if not self._piper_model_path or not self._piper_config_path:
            raise LLMProviderError(
                "PIPER_MODEL_PATH and PIPER_CONFIG_PATH must be configured for offline TTS."
            )

        model_path = Path(self._piper_model_path)
        config_path = Path(self._piper_config_path)

        if not model_path.exists() or not config_path.exists():
            raise LLMProviderError(
                "Piper TTS voice model not found. Download a Nepali voice model first."
            )

        self._voice = PiperVoice.load(str(model_path), str(config_path))
        return self._voice

    def synthesize(self, text: str, output_path: Optional[str] = None) -> str:
        voice = self._load_piper_voice()

        if not output_path:
            fd, output_path = tempfile.mkstemp(suffix=".wav")
            os.close(fd)

        with open(output_path, "wb") as wav_file:
            voice.synthesize(text, wav_file)

        return output_path
