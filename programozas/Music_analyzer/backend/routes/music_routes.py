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