import os, shutil
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session
from ..database import SessionLocal
from backend.services.music_service import analyze_track, save_track, recommend_ai
from backend.services.music_analyze import analyze_music
from flask import send_from_directory
import re


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


    file = request.files["file"]
    
    raw_filename = file.filename
    safe_filename = sanitize_filename(raw_filename)
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    print("Upload dir:", UPLOAD_DIR)

    try:
        file.save(file_path)
        print(f"File saved to {file_path}")
    except Exception as e:
        return jsonify({"error": f"Cannot save file: {str(e)}"}), 500

    try:
        track_data = analyze_music(file_path)
        track_data["path"] = safe_filename
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

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
