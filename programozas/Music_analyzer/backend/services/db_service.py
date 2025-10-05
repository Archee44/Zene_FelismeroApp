from backend.models.music import Track

def save_track(db, track_data, file_path: str):
    track = Track(
        title=track_data.get("title"),
        artist=track_data.get("artist"),
        genre=track_data.get("genre"),
        bpm=track_data.get("bpm"),
        duration=track_data.get("duration"),
        rms=track_data.get("rms"),
        camelot=track_data.get("camelot"),
        path=file_path
    )
    db.add(track)
    db.commit()
    db.refresh(track)
    return track