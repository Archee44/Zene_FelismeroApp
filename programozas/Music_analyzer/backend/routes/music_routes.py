import os, shutil
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session
from ..database import SessionLocal
from backend.services.music_service import analyze_track, save_track, recommend_ai
from backend.services.music_analyze import analyze_music
from flask import send_from_directory
import re
import requests
import base64
from flask import redirect, session
import pandas as pd
import io


music_bp = Blueprint("music", __name__)
#UPLOAD_DIR = "./backend/uploads"
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'uploads'))
os.makedirs(UPLOAD_DIR, exist_ok=True)

def sanitize_filename(filename):
    return re.sub(r'[^\w\-_\.]', '_', filename)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@music_bp.route("/analyze", methods=["POST"])
def analyze():
    db: Session = next(get_db())
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    try:
        file = request.files["file"]
    
        raw_filename = file.filename
        safe_filename = sanitize_filename(raw_filename)
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        print("Upload dir:", UPLOAD_DIR)

        file.save(file_path)
        print(f"File saved to {file_path}")


        track_data = analyze_music(file_path)
        track_data["path"] = safe_filename
        return jsonify(track_data)
    except Exception as e:
        print("Analyze error:", str(e))
        return jsonify({"error": f"Analyze failed: {str(e)}"}), 500

    try:
        print("Track data:", track_data)
        track = save_track(db, track_data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Saving problem:", str(e))
        return jsonify({"error": f"DB save failed: {str(e)}"}), 500

    return jsonify({
        "id": track.id,
        "title": track.title,
        "artist": track.artist,
        "genre": track.genre,
        "bpm": track.bpm,
        "duration": track.duration,
        "rms": track.rms,
        "camelot": track.camelot,
        "path": track.path
    })


@music_bp.route("/uploads/<path:filename>")
def uploaded_file(filename):
    full_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(full_path):
        return jsonify({"error": "File not found"}), 404
    return send_from_directory(UPLOAD_DIR, filename, mimetype='audio/mpeg')


@music_bp.route("/recommend/<int:track_id>", methods=["GET"])
def recommend(track_id):
    strict = request.args.get("strict", "false").lower() == "true"
    db: Session = next(get_db())
    recommendations = recommend_ai(db, track_id, strict)
    return jsonify(recommendations)


GENIUS_TOKEN = os.getenv("GENIUS_TOKEN")

@music_bp.route("/search-lyrics", methods=["POST"])
def search_lyrics():
    print("Genius token:", GENIUS_TOKEN)
    data = request.json
    snippet = data.get("snippet")
    if not snippet:
        return jsonify({"error": "No lyrics snippet provided"}), 400

    url = "https://api.genius.com/search"
    headers = {"Authorization": f"Bearer {GENIUS_TOKEN}"}
    params = {"q": snippet}

    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        results = response.json()["response"]["hits"]
        if not results:
            return jsonify({"error": "No results found"}), 404

        songs = []
        for hit in results[:10]:
            song = hit["result"]
            songs.append({
                "title": song["title"],
                "artist": song["primary_artist"]["name"],
                "url": song["url"],
                "cover": song.get("song_art_image_url")
            })
        return jsonify({"songs": songs})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
YOUTUBE_API_KEY = "AIzaSyC9oWbK7x2qZDKWjGGvAkrnuO8XzTNoyQI"

@music_bp.route("/youtube", methods=["GET"])
def youtube_search():
    query = request.args.get("q")
    if not query:
        return jsonify({"error": "Missing query"}), 400

    url = (
        f"https://www.googleapis.com/youtube/v3/search"
        f"?part=snippet&type=video&maxResults=1&q={query}&key={YOUTUBE_API_KEY}"
    )
    res = requests.get(url)
    data = res.json()

    if "items" not in data or not data["items"]:
        return jsonify({"error": "No results"}), 404

    video_id = data["items"][0]["id"]["videoId"]
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    return jsonify({"video_url": video_url})


SPOTIFY_CLIENT_ID = "15a835f82b7144e59792a71699f26b7e"
SPOTIFY_CLIENT_SECRET = "feb7cfe529ad4ddfa6bdd0a098797979"
"""  """ """
SPOTIFY_CLIENT_ID = "8c2fe85d5d78418ba2144554abdc2fba"
SPOTIFY_CLIENT_SECRET = "2a0b0a2d127e49ebbb775fc02b2ee35a"
REDIRECT_URI = "https://inappropriate-cody-primsie.ngrok-free.dev/api/music/callback"
SCOPES = "playlist-read-private playlist-read-collaborative" """


def get_spotify_token():
    auth_str = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
    b64_auth_str = base64.b64encode(auth_str.encode()).decode()
    headers = {"Authorization": f"Basic {b64_auth_str}"}
    data = {"grant_type": "client_credentials"}

    res = requests.post("https://accounts.spotify.com/api/token", headers=headers, data=data)
    res.raise_for_status()
    return res.json()["access_token"]

@music_bp.route("/spotify", methods=["GET"])
def spotify_search():
    query = request.args.get("q")
    if not query:
        return jsonify({"error": "Missing query"}), 400

    try:
        token = get_spotify_token()
        headers = {"Authorization": f"Bearer {token}"}
        params = {"q": query, "type": "track", "limit": 1}
        res = requests.get("https://api.spotify.com/v1/search", headers=headers, params=params)
        data = res.json()

        if "tracks" not in data or not data["tracks"]["items"]:
            return jsonify({"error": "No results"}), 404

        track = data["tracks"]["items"][0]
        track_url = track["external_urls"]["spotify"]

        return jsonify({"track_url": track_url})

    except Exception as e:
        print("Spotify search error:", e)
        return jsonify({"error": "Spotify API error"}), 500



def refresh_spotify_token():
    refresh_token = session.get("refresh_token")
    if not refresh_token:
        return None
    payload = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    res = requests.post("https://accounts.spotify.com/api/token", data=payload, headers=headers)
    token_data = res.json()
    session["access_token"] = token_data.get("access_token")
    return token_data.get("access_token")



def spotify_top_tracks():
    try:
        token = get_spotify_token()
        headers = {"Authorization": f"Bearer {token}"}
        params = {"q": "Top 50 Global", "type": "track", "limit": 50}
        res = requests.get("https://api.spotify.com/v1/search", headers=headers, params=params)
        res.raise_for_status()
        data = res.json()

        top_tracks = []
        for idx, track in enumerate(data["tracks"]["items"]):
            top_tracks.append({
                "title": track["name"],
                "artist": ", ".join([a["name"] for a in track["artists"]]),
                "spotify_url": track["external_urls"]["spotify"],
                "image": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
                "rank": idx + 1
            })
        return jsonify({"top_tracks": top_tracks})

    except Exception as e:
        print("Spotify top tracks error:", e)
        return jsonify({"error": "Failed to fetch top tracks"}), 500




""" @music_bp.route("/spotify-top", methods=["GET"])
def spotify_top_tracks():
    try:
        # Get access token using client credentials
        token = get_spotify_token()
        headers = {"Authorization": f"Bearer {token}"}

        # Top 50 Global playlist ID
        playlist_id = "37i9dQZEVXbMDoHDwVN2tF"
        res = requests.get(f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks", headers=headers)
        res.raise_for_status()
        data = res.json()

        top_tracks = []
        for idx, item in enumerate(data["items"]):
            track = item["track"]
            top_tracks.append({
                "title": track["name"],
                "artist": ", ".join([a["name"] for a in track["artists"]]),
                "spotify_url": track["external_urls"]["spotify"],
                "image": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
                "rank": idx + 1
            })

        return jsonify({"top_tracks": top_tracks})

    except Exception as e:
        print("Spotify top tracks error:", e)
        return jsonify({"error": "Failed to fetch top tracks"}), 500

 """



""" @music_bp.route("/spotify-top", methods=["GET"])
def spotify_top_tracks():
    try:
        url = "https://charts-spotify-com-service.spotify.com/api/charts?operationName=getChart&variables=%7B%22country%22%3A%22global%22%2C%22type%22%3A%22regional%22%2C%22date%22%3A%22latest%22%2C%22limit%22%3A50%2C%22offset%22%3A0%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%227e6b84c72683a53bafef9d8db68db7cc1cb8e5127b73313cda0c0c62496f9a59%22%7D%7D"

        headers = {"User-Agent": "Mozilla/5.0"}
        res = requests.get(url, headers=headers)
        res.raise_for_status()
        data = res.json()

        top_tracks = []
        for entry in data["entries"]:
            meta = entry["trackMetadata"]
            chart = entry["chartEntryData"]
            top_tracks.append({
                "title": meta["trackName"],
                "artist": meta["artistName"],
                "spotify_url": "https://open.spotify.com/track/" + meta["trackUri"].split(":")[-1],
                "image": meta["displayImageUri"],
                "rank": chart["currentRank"]
            })
        return jsonify({"top_tracks":top_tracks})
    
    except Exception as e:  
        print("Spotify top tracks error:", e)
        return jsonify({"error": "Failed to fetch top tracks"}), 500 """    
""" 
@music_bp.route("/login")
def login():
    auth_url = (
        "https://accounts.spotify.com/authorize"
        f"?response_type=code&client_id={SPOTIFY_CLIENT_ID}"
        f"&scope={SCOPES}&redirect_uri={REDIRECT_URI}"
    )
    return redirect(auth_url)
 """
""" 

@music_bp.route("/callback")
def callback():
    code = request.args.get("code")
    token_url = "https://accounts.spotify.com/api/token"
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    res = requests.post(token_url, data=payload, headers=headers)
    token_data = res.json()
    session["access_token"] = token_data.get("access_token")
    session["refresh_token"] = token_data.get("refresh_token")
    #return jsonify(token_data)
    return redirect("/api/music/my-playlists") """


""" @music_bp.route("/my-playlists")
def my_playlists():
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "No access token"}), 401
    headers = {"Authorization": f"Bearer {access_token}"}
    res = requests.get("https://api.spotify.com/v1/me/playlists", headers=headers)
    
    if res.status_code == 401:
        access_token = refresh_spotify_token()
        if not access_token:
            return jsonify({"error": "Token refresh failed"}), 401
        headers = {"Authorization": f"Bearer {access_token}"}
        res = requests.get("https://api.spotify.com/v1/me/playlists", headers=headers)
    
    return jsonify(res.json())

 """