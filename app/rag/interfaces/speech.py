from abc import ABC, abstractmethod

class SpeechProvider(ABC):

    @abstractmethod
    def transcribe(self, audio_path: str) -> str:
        pass