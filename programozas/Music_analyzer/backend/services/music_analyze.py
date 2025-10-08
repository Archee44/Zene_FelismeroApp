import librosa
import json
import sys
from mutagen.mp3 import MP3
from mutagen.id3 import ID3
from backend.services.camelot import detect_camelot
from flask import jsonify
#import eyed3
import os
import re

upload_folder = "./uploads"

def cleaned_title(title: str) -> str:
    title = re.sub(r"[\(\[].*?[\)\]]", "", title)
    title = re.sub(r"\b(official music video|official video|music video|video clip|audio|hq|id\d{3,}|v\d+|mp3|flac|mp3juices\.cc|mp3j\.cc|y2mate\.com|soundcloud rip|youtube download)\b", "", title, flags=re.IGNORECASE)
    title = title.replace("_", " ")
    title = re.sub(r"\s+", " ", title)
    return title.strip()

def analyze_music(file_path: str):
    try:
        y, sr = librosa.load(file_path, sr=None)
    except Exception as e:
        print("Librosa hiba", str(e))
        raise

    duration = librosa.get_duration(y=y, sr=sr)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    bpm = int(round(float(tempo))) if isinstance(tempo, (int, float)) else int(round(float(tempo[0])))
    rms = float(librosa.feature.rms(y=y).mean())
    camelot = detect_camelot(y, sr)

    artist = "Unknown Artist"
    genre = "Unknown Genre"
    title = "Unknown Title"

    try:
        
        audio = MP3(file_path, ID3=ID3)
        artist_tag = audio.get("TPE1")
        genre_tag = audio.get("TCON")
        title_tag = audio.get("TIT2")

        if artist_tag and artist_tag.text:
            artist = artist_tag.text[0]
        if genre_tag and genre_tag.text:
            genre = genre_tag.text[0]
        if title_tag and title_tag.text:
            title = title_tag.text[0]
            title = cleaned_title(title)
    except Exception as e:
        print("Metadata hiba", str(e))
        return jsonify({"error": f"Metadata read error: {str(e)}"}), 500

    if artist == "Unknown Artist" or title == "Unknown Title":
        filename = os.path.basename(file_path).replace(".mp3", "")
        parts = filename.split("-")
        if len(parts) >= 2:
            from_title_artist = parts[0].strip().replace("_", " ")
            from_title_title = parts[1].strip().replace("_", " ")
            if artist == "Unknown Artist":
                artist = from_title_artist
            if title == "Unknown Title":
                title = from_title_title
                title = cleaned_title(title)

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