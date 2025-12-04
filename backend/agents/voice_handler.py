import os
from dataclasses import dataclass
from typing import Optional

import numpy as np
from faster_whisper import WhisperModel
import pyttsx3

# Initialize Whisper model (medium/large may be slower). We'll use 'small' by default.
# Make sure model files are available or faster-whisper will download them.
_whisper_model = WhisperModel("small", device="cpu", compute_type="int8")

def transcribe_audio_file(filepath, language=None):
    """
    Returns plain text transcription from file.
    """
    segments, info = _whisper_model.transcribe(filepath, language=language, beam_size=5)
    text = " ".join([seg.text.strip() for seg in segments])
    return text

_tts_engine = pyttsx3.init()
def speak_text(text):
    """
    Speak agent text locally on server (useful for demos). For production,
    consider sending text to frontend TTS or using better cloud TTS.
    """
    _tts_engine.say(text)
    _tts_engine.runAndWait()


@dataclass
class StreamingConfig:
    sample_rate: int = 16000
    chunk_seconds: int = 3


class StreamingVoiceProcessor:
    """Incrementally transcribes streamed audio using the shared Whisper model."""

    def __init__(self, config: Optional[StreamingConfig] = None) -> None:
        self.config = config or StreamingConfig()
        self._buffer = np.array([], dtype=np.float32)

    def reset(self) -> None:
        self._buffer = np.array([], dtype=np.float32)

    def add_frame(self, pcm_frame: bytes | np.ndarray) -> Optional[str]:
        """
        Append a PCM16 frame to the internal buffer. When enough audio is
        accumulated, run Whisper and return the transcription chunk.
        """

        if isinstance(pcm_frame, bytes):
            frame = np.frombuffer(pcm_frame, dtype=np.int16).astype(np.float32) / 32768.0
        else:
            frame = pcm_frame.astype(np.float32)

        self._buffer = np.concatenate([self._buffer, frame])

        threshold = self.config.sample_rate * self.config.chunk_seconds
        if self._buffer.size < threshold:
            return None

        chunk = self._buffer[:threshold]
        self._buffer = self._buffer[threshold:]

        segments, _ = _whisper_model.transcribe(
            chunk.reshape(1, -1),
            language="en",
            beam_size=5,
        )
        text = " ".join(seg.text.strip() for seg in segments)
        return text or None
