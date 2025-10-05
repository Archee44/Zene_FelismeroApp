import librosa
import numpy as np
from mutagen.mp3 import MP3
from mutagen.id3 import ID3


Camelot_map = {
    "C:maj": "8B", "G:maj": "9B", "D:maj": "10B", "A:maj": "11B", "E:maj": "12B",
    "B:maj": "1B", "F#:maj": "2B", "C#:maj": "3B", "Ab:maj": "4B", "Eb:maj": "5B",
    "Bb:maj": "6B", "F:maj": "7B",
    "A:min": "8A", "E:min": "9A", "B:min": "10A", "F#:min": "11A", "C#:min": "12A",
    "G#:min": "1A", "D#:min": "2A", "A#:min": "3A", "F:min": "4A", "C:min": "5A",
    "G:min": "6A", "D:min": "7A"
}

def detect_camelot(y, sr):
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    chroma_mean = chroma.mean(axis=1)

    try:
        key = librosa.key.key_to_name(librosa.key.estimate_tuning(y=y, sr=sr))
    except:
        key = None

    if key in Camelot_map:
        return Camelot_map[key]
    else:
        return "Unknown"