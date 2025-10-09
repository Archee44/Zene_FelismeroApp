import os
import base64
import requests
from urllib.parse import urlencode
from flask import Blueprint, redirect, request, jsonify
from dotenv import load_dotenv

spotify_auth = Blueprint("spotify_auth", __name__)

# Ensure environment variables from .env are loaded even if app loads later
load_dotenv()

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = "http://localhost:5000/api/spotify/callback"

# 1️⃣ Spotify login
@spotify_auth.route("/login")
def login():
    scope = "user-read-private user-read-email user-library-read"
    params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "scope": scope,
        "redirect_uri": REDIRECT_URI,
        "show_dialog": "true"
    }
    url = "https://accounts.spotify.com/authorize?" + urlencode(params)
    return redirect(url)

# 2️⃣ Callback, amikor a user visszatér
@spotify_auth.route("/callback")
def callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "Missing authorization code"}), 400

    auth_str = f"{CLIENT_ID}:{CLIENT_SECRET}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()

    token_url = "https://accounts.spotify.com/api/token"
    headers = {
        "Authorization": f"Basic {b64_auth}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI
    }

    response = requests.post(token_url, headers=headers, data=data)
    if response.status_code != 200:
        return jsonify({"error": "Failed to get token", "details": response.text}), 400

    token_info = response.json()
    # például: access_token, refresh_token, expires_in

    # Itt akár el is mentheted session-be vagy DB-be
    access_token = token_info.get("access_token")
    refresh_token = token_info.get("refresh_token")

    print("✅ Spotify access token megszerezve:", access_token[:20], "...")

    # Visszairányítjuk a frontend appra
    return redirect(f"http://localhost:3000/spotify-success?token={access_token}")
