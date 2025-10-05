import librosa
import json
import sys
from mutagen.mp3 import MP3
from mutagen.id3 import ID3
from backend.services.camelot import detect_camelot

upload_folder = "./uploads"

def analyze_music(file_path: str):
    y, sr = librosa.load(file_path, sr=None)
    duration = librosa.get_duration(y=y, sr=sr)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    bpm = int(round(float(tempo))) if isinstance(tempo, (int, float)) else int(round(float(tempo[0])))
    rms = float(librosa.feature.rms(y=y).mean())
    camelot = detect_camelot(y, sr)

    try:
        audio = MP3(file_path, ID3=ID3)
        artist = audio.get("TPE1")
        genre = audio.get("TCON")
        title = audio.get("TIT2")

        artist = artist.text[0] if artist else "Unknown Artist"
        genre = genre.text[0] if genre else "Unknown Genre"
        title = title.text[0] if title else "Unknown Title"
    except:
        artist = "Unknown Artist"
        genre = "Unknown Genre"
        title = "Unknown Title"

    return {
        "title": title,
        "artist": artist,
        "genre": genre,
        "duration": float(duration),
        "bpm": bpm,
        "rms": rms,
        "camelot": camelot
    }
    
if __name__ == "__main__":
    file_path = sys.argv[1]
    result = analyze_music(file_path)
    print(json.dumps(result))