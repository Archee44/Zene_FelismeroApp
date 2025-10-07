import { useState } from "react";
import { TextInput, Button, Card } from '@mantine/core';

export default function LyricsSearch() {
  const [snippet, setSnippet] = useState("");
  const [songs, setSongs] = useState([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    setError("");
    setSongs([]);
    try {
      const res = await fetch("http://localhost:5000/api/music/search-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snippet })
      });
      const data = await res.json();
      if (res.status === 404 || (Array.isArray(data.songs) && data.songs.length === 0)) {
        setError("Nem található ilyen dalszövegű zene.");
        setSongs([]);
      } else if (data.songs) {
        setSongs(data.songs);
        setIndex(0);
      } else if (data.error) {
        setError("Nem adott meg dalszöveget");
      }
    } catch (e) {
      setError("Hálózati vagy szerverhiba történt.");
    }
  };
  const handleNext = () => {
    if (index < songs.length - 1) setIndex(index + 1);
  };

  const currentSong = songs[index];


  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder style={{ maxWidth: 400, margin: "32px auto" }}>
      <h1>Dalszöveg alapú kereső</h1>
      <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column"}}>
        <TextInput
          value={snippet}
          onChange={e => setSnippet(e.target.value)}
          placeholder="Írja be a dalszöveget"
          size="md"
        />

        <Button
          onClick={handleSearch}
          variant="filled"
          color="indigo"
          size="md"
          mt="md"
          style={{ marginTop: 16 }}
        >
          Keresés
        </Button>
      </form>

      {error && (
      <div style={{ color: "red", marginTop: 16, textAlign: "center" }}>
        {error}
      </div>
      )}

      {currentSong && (
        <div style={{ marginTop: 24, textAlign: "center" }}>
          {currentSong.cover && (
            <img
              src={currentSong.cover}
              alt="Borítókép"
              style={{ width: 200, borderRadius: 8, marginBottom: 16 }}
            />
          )}
          <h2>{currentSong.title}</h2>
          <p>{currentSong.artist}</p>

          <div style={{ marginTop: '1rem', textAlign: "center" }}>
            <div style={{ fontWeight: "bold", marginBottom: 4 }}>Megnyitás külső platformon:</div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', justifyContent: 'center' }}>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(currentSong.artist + ' ' + currentSong.title)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src='/icons/youtube_logo.png' alt='YouTube' width='32px' height='32px' />
              </a>
              <a
                href={`https://open.spotify.com/search/${encodeURIComponent(currentSong.artist + ' ' + currentSong.title)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src='/icons/spotify_logo.png' alt='Spotify' width='32px' height='32px' />
              </a>
            </div>
          </div>

          {songs.length > 1 && (
            <Button
              onClick={handleNext}
              variant="light"
              color="gray"
              mt="md"
              disabled={index >= songs.length - 1}
              style={{ marginTop: 16 }}
            >
              Következő ({index + 1}/{songs.length})
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}