import os, shutil
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.services.music_service import analyze_track, save_track, recommend_ai

music_bp = Blueprint("music", __name__)
UPLOAD_DIR = "./backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    file.save(file_path)

    track_data = analyze_track(file_path)
    track = save_track(db, track_data)
    return jsonify({
        "id": track.id,
        "title": track.title,
        "artist": track.artist,
        "genre": track.genre,
        "bpm": track.bpm,
        "camelot": track.camelot
    })

@music_bp.route("/recommend/<int:track_id>", methods=["GET"])
def recommend(track_id):
    strict = request.args.get("strict", "false").lower() == "true"
    db: Session = next(get_db())
    recommendations = recommend_ai(db, track_id, strict)
    return jsonify(recommendations)
