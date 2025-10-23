import os
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
