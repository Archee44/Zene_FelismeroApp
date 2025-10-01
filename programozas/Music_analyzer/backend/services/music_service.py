import librosa, numpy as np, mutagen
from mutagen.easyid3 import EasyID3
from sqlalchemy.orm import Session
from backend.models.music import Track

# Camelot mapping
camelot_map = {
    "C": "8B", "Cm": "5A", "C#": "3B", "C#m": "12A",
    "D": "10B", "Dm": "7A", "D#": "5B", "D#m": "2A",
    "E": "12B", "Em": "9A", "F": "7B", "Fm": "4A",
    "F#": "2B", "F#m": "11A", "G": "9B", "Gm": "6A",
    "G#": "4B", "G#m": "1A", "A": "11B", "Am": "8A",
    "A#": "6B", "A#m": "3A", "B": "1B", "Bm": "10A"
}

def detect_key_camelot(y, sr):
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    chroma_mean = np.mean(chroma, axis=1)
    pitch_class = np.argmax(chroma_mean)
    pitch_names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
    is_minor = librosa.feature.tonnetz(y=y, sr=sr).mean() < 0
    key_name = pitch_names[pitch_class] + ('m' if is_minor else '')
    return camelot_map.get(key_name, "Ismeretlen")

def analyze_bpm(y, sr):
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    if isinstance(tempo, (list, np.ndarray)):
        tempo = tempo[0]
    return int(round(float(tempo)))

def analyze_track(file_path: str):
    try:
        audiofile = EasyID3(file_path)
        title = audiofile.get("title", ["Ismeretlen"])[0]
        artist = audiofile.get("artist", ["Ismeretlen"])[0]
        genre = audiofile.get("genre", ["Ismeretlen"])[0]
    except mutagen.id3.ID3NoHeaderError:
        title, artist, genre = "Ismeretlen", "Ismeretlen", "Ismeretlen"

    y, sr = librosa.load(file_path)
    bpm = analyze_bpm(y, sr)
    camelot_key = detect_key_camelot(y, sr)

    return {
        "title": title,
        "artist": artist,
        "genre": genre,
        "bpm": bpm,
        "camelot": camelot_key,
        "path": file_path
    }

def save_track(db: Session, track_data: dict) -> Track:
    track = Track(**track_data)
    db.add(track)
    db.commit()
    db.refresh(track)
    return track

def camelot_compatible(key1, key2):
    if key1 == "Ismeretlen" or key2 == "Ismeretlen":
        return False
    num1, letter1 = int(key1[:-1]), key1[-1]
    num2, letter2 = int(key2[:-1]), key2[-1]
    return (key1 == key2) or (letter1 == letter2 and abs(num1 - num2) in [1, 11])

def recommend_ai(db: Session, input_track_id: int, strict: bool = False):
    input_track = db.query(Track).filter(Track.id == input_track_id).first()
    if not input_track:
        return []

    tracks = db.query(Track).all()
    scored = []
    for track in tracks:
        if track.id == input_track.id:
            continue

        if strict and not camelot_compatible(track.camelot, input_track.camelot):
            continue

        score = 0
        bpm_diff = abs(track.bpm - input_track.bpm)
        score += max(0, 50 - bpm_diff * 5)

        if not strict:
            if camelot_compatible(track.camelot, input_track.camelot):
                score += 30
        else:
            score += 30

        if track.genre.lower() == input_track.genre.lower():
            score += 20

        scored.append({
            "id": track.id,
            "title": track.title,
            "artist": track.artist,
            "genre": track.genre,
            "bpm": track.bpm,
            "camelot": track.camelot,
            "score": score
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:5]
