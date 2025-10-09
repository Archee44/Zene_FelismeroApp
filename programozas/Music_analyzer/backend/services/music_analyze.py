import os
import re
import sys
import json
import base64
import time
import requests
import librosa
from mutagen.mp3 import MP3
from mutagen.id3 import ID3
from flask import jsonify
from dotenv import load_dotenv
from backend.services.camelot import detect_camelot

# Betöltjük a .env fájlt (Spotify kulcsokhoz)
load_dotenv()

upload_folder = "./uploads"
spotify_token_cache = {"token": None, "expires": 0}

# -------------------------------------------
# SEGÉDFÜGGVÉNYEK
# -------------------------------------------

def cleaned_title(title: str) -> str:
    """Tisztítja a fájlneveket és címeket a zavaró kiegészítésektől."""
    title = re.sub(r"[\(\[].*?[\)\]]", "", title)
    title = re.sub(r"\b(official music video|official video|music video|video clip|audio|hq|id\d{3,}|v\d+|mp3|flac|mp3juices\.cc|mp3j\.cc|y2mate\.com|soundcloud rip|youtube download)\b", "", title, flags=re.IGNORECASE)
    title = title.replace("_", " ")
    title = re.sub(r"\s+", " ", title)
    return title.strip()


# -------------------------------------------
# SPOTIFY TOKEN KEZELÉS
# -------------------------------------------

def get_spotify_token():
    """Spotify token lekérése a client credentials flow segítségével."""
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise Exception("Spotify client ID/secret missing in .env file!")

    auth_str = f"{client_id}:{client_secret}"
    b64_auth_str = base64.b64encode(auth_str.encode()).decode()

    headers = {
        "Authorization": f"Basic {b64_auth_str}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials"}

    resp = requests.post("https://accounts.spotify.com/api/token", headers=headers, data=data)
    resp.raise_for_status()
    return resp.json()["access_token"]


def get_spotify_token_cached():
    """Token cache – ne kérjünk új tokent minden fájlhoz."""
    if spotify_token_cache["token"] and spotify_token_cache["expires"] > time.time():
        return spotify_token_cache["token"]

    token = get_spotify_token()
    spotify_token_cache["token"] = token
    spotify_token_cache["expires"] = time.time() + 3500  # ~58 perc
    return token


# -------------------------------------------
# SPOTIFY KERESÉS ÉS AUDIO FEATURE LEKÉRÉS
# -------------------------------------------

def search_spotify_track(title, artist, token):
    """Kétlépcsős keresés – pontos és általános."""
    headers = {"Authorization": f"Bearer {token}"}
    base_url = "https://api.spotify.com/v1/search"

    # 1️⃣ Próbáljuk pontos kereséssel
    params = {"q": f"track:{title} artist:{artist}", "type": "track", "limit": 1}
    resp = requests.get(base_url, headers=headers, params=params)
    if resp.status_code == 200:
        items = resp.json().get("tracks", {}).get("items", [])
        if items:
            return items[0]["id"]


    # 2️⃣ Ha nem talál, próbáljunk lazább keresést
    params = {"q": f"{artist} {title}", "type": "track", "limit": 1}
    resp = requests.get(base_url, headers=headers, params=params)
    if resp.status_code == 200:
        items = resp.json().get("tracks", {}).get("items", [])
        if items:
            return items[0]["id"]

    print(f"⚠️ Spotify nem talált találatot: {artist} - {title}")
    return None


def get_spotify_audio_features(track_id, token):
    """Spotify audio jellemzők lekérése."""
    url = f"https://api.spotify.com/v1/audio-features/{track_id}"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        return resp.json()
    print("⚠️ Spotify feature lekérés sikertelen:", resp.status_code, resp.text)
    print(f"🎧 Spotify track ID lekérve: {track_id}")
    return None


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

    # -------------------------------------------
    # Spotify integráció
    # -------------------------------------------
    # Prefer the user's OAuth access token if provided; otherwise use app token
    spotify_token = user_token or get_spotify_token_cached()
    spotify_features = {}
    track_id = None

    if spotify_token:
        track_id = search_spotify_track(title, artist, spotify_token)
        if track_id:
            spotify_features = get_spotify_audio_features(track_id, spotify_token) or {}

    # -------------------------------------------
    # Eredmény összeállítás
    # -------------------------------------------
    return {
        "title": title,
        "artist": artist,
        "genre": genre,
        "duration": float(duration),
        "bpm": bpm,
        "rms": rms,
        "camelot": camelot,

        # Spotify jellemzők, ha vannak:
        "danceability": spotify_features.get("danceability"),
        "energy": spotify_features.get("energy"),
        "valence": spotify_features.get("valence"),
        "acousticness": spotify_features.get("acousticness"),
        "instrumentalness": spotify_features.get("instrumentalness"),
        "liveness": spotify_features.get("liveness"),
        "speechiness": spotify_features.get("speechiness"),
        "spotify_tempo": spotify_features.get("tempo"),
        "spotify_key": spotify_features.get("key"),
        "mode": spotify_features.get("mode"),
        "time_signature": spotify_features.get("time_signature"),
        "spotify_track_id": track_id
    }


# -------------------------------------------
# PARANCSORI FUTTATÁS TESZTELÉSHEZ
# -------------------------------------------
if __name__ == "__main__":
    file_path = sys.argv[1]
    result = analyze_music(file_path)
    print(json.dumps(result, indent=2, ensure_ascii=False))
