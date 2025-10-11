import os
import mimetypes
import requests


RECCOBEATS_URL = "https://api.reccobeats.com/v1/analysis/audio-features"


def analyze_with_reccobeats(file_path: str, api_key: str | None = None) -> dict | None:
    """Call ReccoBeats audio-features API with an audio file.

    Returns a dict with keys like danceability, energy, valence, tempo, loudness, etc.,
    or None on failure.
    """
    if not os.path.isfile(file_path):
        return None

    filename = os.path.basename(file_path)
    mime = mimetypes.guess_type(filename)[0] or "application/octet-stream"

    headers = {
        "Accept": "application/json",
    }
    # Try both header styles if api_key provided (docs vary):
    if api_key:
        headers["x-api-key"] = api_key
        headers["Authorization"] = f"Bearer {api_key}"

    with open(file_path, "rb") as f:
        files = [
            ("audioFile", (filename, f, mime))
        ]
        try:
            resp = requests.post(RECCOBEATS_URL, headers=headers, files=files, timeout=60)
            if resp.status_code == 200:
                return resp.json()
            # Bubble minimal info for debugging
            print("[ReccoBeats] error:", resp.status_code, resp.text[:300])
            return None
        except Exception as e:
            print("[ReccoBeats] request failed:", str(e))
            return None


def get_features_by_ids(ids: list[str] | tuple[str, ...], api_key: str | None = None) -> dict | None:
    """Fetch audio features for one or more track IDs via GET /v1/audio-features.

    'ids' may be ReccoBeats IDs or Spotify track IDs. Returns the parsed JSON or None.
    """
    if not ids:
        return None
    url = "https://api.reccobeats.com/v1/audio-features"
    headers = {"Accept": "application/json"}
    if api_key:
        headers["x-api-key"] = api_key
        headers["Authorization"] = f"Bearer {api_key}"
    params = {"ids": ",".join(ids)}
    try:
        resp = requests.get(url, headers=headers, params=params, timeout=30)
        if resp.status_code == 200:
            return resp.json()
        print("[ReccoBeats] GET features error:", resp.status_code, resp.text[:300])
        return None
    except Exception as e:
        print("[ReccoBeats] GET features failed:", str(e))
        return None
