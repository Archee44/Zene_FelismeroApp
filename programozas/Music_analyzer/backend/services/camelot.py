import librosa
import numpy as np


Camelot_map = {
    "C:maj": "8B", "G:maj": "9B", "D:maj": "10B", "A:maj": "11B", "E:maj": "12B",
    "B:maj": "1B", "F#:maj": "2B", "C#:maj": "3B", "Ab:maj": "4B", "Eb:maj": "5B",
    "Bb:maj": "6B", "F:maj": "7B",
    "A:min": "8A", "E:min": "9A", "B:min": "10A", "F#:min": "11A", "C#:min": "12A",
    "G#:min": "1A", "D#:min": "2A", "A#:min": "3A", "F:min": "4A", "C:min": "5A",
    "G:min": "6A", "D:min": "7A"
}

# Krumhansl–Schmuckler kulcsbecslés egyszerű megvalósítása
MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09,
                          2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53,
                          2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

# Index -> hangnév leképezés a Camelot_map kulcsaihoz illesztve
MAJOR_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
MINOR_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def estimate_key_mode(y, sr):
    try:
        y_harm = librosa.effects.harmonic(y)
        chroma = librosa.feature.chroma_cqt(y=y_harm, sr=sr)
        chroma_mean = chroma.mean(axis=1)
        if not np.any(chroma_mean):
            return None, None
        # normalizálás
        v = chroma_mean / (np.linalg.norm(chroma_mean) + 1e-8)

        best_score = -np.inf
        best_key = None
        best_mode = None  # 1=major, 0=minor

        for r in range(12):
            score_maj = np.dot(v, np.roll(MAJOR_PROFILE, r))
            score_min = np.dot(v, np.roll(MINOR_PROFILE, r))
            if score_maj > best_score:
                best_score = score_maj
                best_key = r
                best_mode = 1
            if score_min > best_score:
                best_score = score_min
                best_key = r
                best_mode = 0
        return best_key, best_mode
    except Exception:
        return None, None


def detect_camelot(y, sr):
    key_idx, mode = estimate_key_mode(y, sr)
    if key_idx is None or mode is None:
        return "Unknown"

    if mode == 1:
        name = MAJOR_NAMES[key_idx]
        key_str = f"{name}:maj"
    else:
        name = MINOR_NAMES[key_idx]
        key_str = f"{name}:min"

    return Camelot_map.get(key_str, "Unknown")
