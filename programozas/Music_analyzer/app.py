from flask import Flask
from backend.database import init_db
from backend.routes.music_routes import music_bp
from flask_cors import CORS
import sys
from pathlib import Path
import os


project_root = Path(__file__).resolve().parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "default_secret_key")
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_SAMESITE="None"
)
init_db()
CORS(app)

# betölti a .env fájl tartalmát
from dotenv import load_dotenv
load_dotenv()

import os
GENIUS_TOKEN = os.getenv("GENIUS_TOKEN")


# Blueprintek regisztrálása
app.register_blueprint(music_bp, url_prefix="/api/music")


@app.route("/")
def home():
    return {"message": "Music recommender API running"}

if __name__ == "__main__":
    app.run(debug=True)
