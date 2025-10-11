import os
import re
import sys
import json
import base64
import time
import numpy as np
import librosa
from mutagen.mp3 import MP3
from mutagen.id3 import ID3
from flask import jsonify
from dotenv import load_dotenv
from backend.services.camelot import detect_camelot
from backend.services.reccobeats import analyze_with_reccobeats

# Betöltjük a .env fájlt (Spotify kulcsokhoz)
load_dotenv()

upload_folder = "./uploads"

# -------------------------------------------
# SEGÉDFÜGGVÉNYEK
# -------------------------------------------

def cleaned_title(title: str) -> str:
    """Tisztítja a fájlneveket és címeket a zavaró kiegészítésektől."""
    title = re.sub(r"[\(\[].*?[\)\]]", "", title)
    title = re.sub(r"\b(official music video|official video|music video|video clip|audio|hq|id\d{3,}|v\d+|mp3|flac|mp3juices\.cc|mp3j\.cc|y2mate\.com|soundcloud rip|youtube download)\b", "", title, flags=re.IGNORECASE)
    # Távolítsuk el a 'feat/ft/featuring ...' végződéseket a cím végéről
    title = re.sub(r"\s*(?:ft\.?|feat\.?|featuring)\s+.+$", "", title, flags=re.IGNORECASE)
    title = title.replace("_", " ")
    title = re.sub(r"\s+", " ", title)
    return title.strip()


# -------------------------------------------
# LOKÁLIS JELLEMZŐK ÉS MŰFAJ HEURISZTIKA
# -------------------------------------------

def compute_local_features(y: np.ndarray, sr: int) -> dict:
    """Számol néhány stabil, olcsó jellemzőt műfajbecsléshez."""
    out = {}
    # Spektrális jellemzők
    try:
        sc = librosa.feature.spectral_centroid(y=y, sr=sr)
        out["spectral_centroid_mean"] = float(np.mean(sc))
        out["spectral_centroid_std"] = float(np.std(sc))
    except Exception:
        out["spectral_centroid_mean"] = None
        out["spectral_centroid_std"] = None

    try:
        roll = librosa.feature.spectral_rolloff(y=y, sr=sr, roll_percent=0.85)
        out["spectral_rolloff_85"] = float(np.mean(roll))
    except Exception:
        out["spectral_rolloff_85"] = None

    # ZCR és onset sűrűség
    try:
        zcr = librosa.feature.zero_crossing_rate(y)
        out["zcr_mean"] = float(np.mean(zcr))
    except Exception:
        out["zcr_mean"] = None

    try:
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)
        duration = librosa.get_duration(y=y, sr=sr)
        out["onset_rate"] = float(len(onsets) / duration) if duration > 0 else 0.0
    except Exception:
        out["onset_rate"] = None

    # Harmonic vs percussive arány
    try:
        y_h, y_p = librosa.effects.hpss(y)
        h_energy = float(np.mean(np.abs(y_h)))
        p_energy = float(np.mean(np.abs(y_p)))
        out["harmonic_percussive_ratio"] = float((h_energy + 1e-8) / (p_energy + 1e-8))
    except Exception:
        out["harmonic_percussive_ratio"] = None

    # Kromatikus változékonyság (harmóniai gazdagság indikátor)
    try:
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        out["chroma_var"] = float(np.mean(np.var(chroma, axis=1)))
    except Exception:
        out["chroma_var"] = None

    return out


def classify_genre_local(bpm: int, rms: float, feats: dict) -> tuple[str, list]:
    """Egyszerű, változatos heurisztika több jelölttel.
    Visszaad: (top_genre, candidates_sorted)
    """
    sc = feats.get("spectral_centroid_mean") or 0.0
    roll = feats.get("spectral_rolloff_85") or 0.0
    zcr = feats.get("zcr_mean") or 0.0
    onset = feats.get("onset_rate") or 0.0
    hpr = feats.get("harmonic_percussive_ratio") or 1.0
    chroma_var = feats.get("chroma_var") or 0.0

    # Normalizálások (durva skálák)
    sc_n = sc / 4000.0  # ~0..3 tipikusan
    roll_n = roll / 6000.0
    zcr_n = zcr * 10.0
    onset_n = min(onset / 6.0, 1.5)
    hpr_n = min(hpr, 3.0)
    chroma_n = min(chroma_var, 1.5)
    rms_n = min(max(rms * 10.0, 0.0), 1.5)

    candidates = []

    # Dance / Electronic
    score_dance = 0.0
    if 118 <= bpm <= 135:
        score_dance += 1.5
    score_dance += 0.6 * onset_n + 0.5 * (1.0 / max(hpr_n, 0.4)) + 0.4 * sc_n
    candidates.append(("Dance/Electronic", score_dance))

    # Hip-Hop / Rap
    score_rap = 0.0
    if 78 <= bpm <= 105:
        score_rap += 1.2
    score_rap += 0.6 * onset_n + 0.3 * (1.2 - sc_n) + 0.2 * zcr_n
    candidates.append(("Hip-Hop/Rap", score_rap))

    # Rock / Metal
    score_rock = 0.0
    if 120 <= bpm <= 180:
        score_rock += 1.0
    score_rock += 0.7 * sc_n + 0.6 * roll_n + 0.5 * zcr_n + 0.3 * onset_n
    candidates.append(("Rock/Metal", score_rock))

    # Pop
    score_pop = 0.0
    if 95 <= bpm <= 130:
        score_pop += 1.0
    score_pop += 0.4 * (1.0 - zcr_n) + 0.3 * (1.0 - roll_n) + 0.4 * chroma_n
    candidates.append(("Pop", score_pop))

    # Acoustic/Folk
    score_acoustic = 0.0
    if bpm <= 120:
        score_acoustic += 0.4
    score_acoustic += 0.7 * (hpr_n / 2.0) + 0.6 * (1.2 - sc_n) + 0.3 * (1.0 - onset_n)
    candidates.append(("Acoustic/Folk", score_acoustic))

    # Jazz/Blues
    score_jazz = 0.0
    if 80 <= bpm <= 160:
        score_jazz += 0.6
    score_jazz += 0.7 * (hpr_n / 2.0) + 0.6 * chroma_n + 0.2 * (1.0 - onset_n)
    candidates.append(("Jazz/Blues", score_jazz))

    # Classical / Orchestral
    score_classical = 0.0
    if bpm <= 100:
        score_classical += 0.5
    score_classical += 0.8 * (hpr_n / 2.0) + 0.6 * (1.4 - sc_n) + 0.4 * (1.0 - onset_n)
    candidates.append(("Classical/Orchestral", score_classical))

    # Electronic (Fast)
    score_fast_edm = 0.0
    if bpm >= 135:
        score_fast_edm += 1.0
    score_fast_edm += 0.6 * onset_n + 0.5 * (1.0 / max(hpr_n, 0.4)) + 0.5 * roll_n
    candidates.append(("Electronic (Fast)", score_fast_edm))

    candidates_sorted = sorted(candidates, key=lambda x: x[1], reverse=True)
    top_genre = candidates_sorted[0][0]
    return top_genre, candidates_sorted


# -------------------------------------------
# ZENE ANALÍZIS
# -------------------------------------------

def analyze_music(file_path: str, user_token=None):
    """Librosa + Spotify alapú elemzés.

    If a user OAuth access token is provided, use it; otherwise fall back
    to app client-credentials token.
    """
    try:
        y, sr = librosa.load(file_path, sr=None)
    except Exception as e:
        print("Librosa hiba:", str(e))
        raise

    duration = librosa.get_duration(y=y, sr=sr)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    bpm = int(round(float(tempo))) if isinstance(tempo, (int, float)) else int(round(float(tempo[0])))
    rms = float(librosa.feature.rms(y=y).mean())
    camelot = detect_camelot(y, sr)
    local_feats = compute_local_features(y, sr)
    genre_local, genre_candidates = classify_genre_local(bpm, rms, local_feats)

    artist = "Unknown Artist"
    genre = "Unknown Genre"
    title = "Unknown Title"

    # Metaadat olvasás
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
            title = cleaned_title(title_tag.text[0])
    except Exception as e:
        print("Metadata hiba:", str(e))

    # Ha hiányzik az előadó/cím, próbáljuk a fájlnévből
    if artist == "Unknown Artist" or title == "Unknown Title":
        filename = os.path.basename(file_path).replace(".mp3", "")
        parts = filename.split("-")
        if len(parts) >= 2:
            if artist == "Unknown Artist":
                artist = parts[0].strip().replace("_", " ")
            if title == "Unknown Title":
                title = cleaned_title(parts[1].strip().replace("_", " "))

    # Optional ReccoBeats enrichment (5MB limit; for larger files create 30s snippet)
    rb_features = {}
    try:
        # Always allow calling ReccoBeats (no API key required per docs)
        api_key = os.getenv("RECCOBEATS_API_KEY")
        target_path = file_path
        try:
            file_size = os.path.getsize(file_path)
        except Exception:
            file_size = 0

        if file_size > 5 * 1024 * 1024:
            try:
                import soundfile as sf
                snip_samples = int(min(30.0, duration) * sr)
                y_snip = y[:snip_samples]
                tmp_out = file_path + ".rb_snip.wav"
                sf.write(tmp_out, y_snip, sr)
                target_path = tmp_out
            except Exception as e:
                print("[ReccoBeats] snippet create failed:", str(e))

        rb = analyze_with_reccobeats(target_path, api_key) or {}

        if target_path != file_path:
            try:
                os.remove(target_path)
            except Exception:
                pass

        for key in [
            "acousticness", "danceability", "energy", "instrumentalness",
            "liveness", "loudness", "speechiness", "tempo", "valence"
        ]:
            if key in rb:
                rb_features[key] = rb[key]
    except Exception as e:
        print("[ReccoBeats] integration error:", str(e))

    # Spotify audio features nem kerülnek lekérésre; csak lokális jellemzők

    # -------------------------------------------
    # Eredmény összeállítás
    # -------------------------------------------
    result = {
        "title": title,
        "artist": artist,
        "genre": genre if genre != "Unknown Genre" else genre_local,
        "genre_local": genre_local,
        "genre_source": "local_heuristic" if genre == "Unknown Genre" else "tag_or_filename",
        "duration": float(duration),
        "bpm": bpm,
        "rms": rms,
        "camelot": camelot,
        **local_feats,
        "genre_candidates": [{"label": g, "score": float(s)} for g, s in genre_candidates]
    }

    if rb_features:
        result.update(rb_features)
    return result


# -------------------------------------------
# PARANCSORI FUTTATÁS TESZTELÉSHEZ
# -------------------------------------------
if __name__ == "__main__":
    file_path = sys.argv[1]
    result = analyze_music(file_path)
    print(json.dumps(result, indent=2, ensure_ascii=False))
