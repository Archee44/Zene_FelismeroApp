from flask import Flask
from backend.database import init_db
from backend.routes.music_routes import music_bp


app = Flask(__name__)
init_db()

# Blueprintek regisztrálása
app.register_blueprint(music_bp, url_prefix="/api/music")

@app.route("/")
def home():
    return {"message": "Music recommender API running"}

if __name__ == "__main__":
    app.run(debug=True)
