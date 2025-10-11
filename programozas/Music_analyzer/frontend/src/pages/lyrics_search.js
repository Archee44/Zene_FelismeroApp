import { useState } from "react";
import { TextInput, Button, Card, Group } from '@mantine/core';

export default function LyricsSearch() {
  const [snippet, setSnippet] = useState("");
  const [songs, setSongs] = useState([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    setError("");
    setSongs([]);
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/music/search-lyrics", {
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
    } finally {setLoading(false);}

  };
  const handleNext = () => {
    if (index < songs.length - 1) setIndex(index + 1);
  };
  const handlePrev = () => {
    if (index > 0) setIndex(index - 1);
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
          color="#0C1A2A"
          size="md"
          mt="md"
          loading={loading}
          style={{ marginTop: 16 }}
          disabled={!snippet.trim()}
        >
          Keresés
        </Button>
      </form>

      {loading && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <p style={{ marginTop: 8 }}>Keresés folyamatban...</p>
        </div>
      )} 

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
            <img
              src='/icons/youtube_logo.png'
              alt='YouTube'
              width='32px'
              height='32px'
              style={{ cursor: 'pointer' }}
              onClick={async () => {
                try {
                  const query = `${currentSong.artist} ${currentSong.title}`;
                  const res = await fetch(`http://127.0.0.1:5000/api/music/youtube?q=${encodeURIComponent(query)}`);
                  const data = await res.json();
                  if (data.video_url) {
                    window.open(data.video_url, '_blank');
                  } else {
                    alert('Nem található konkrét YouTube videó ehhez a zenéhez.');
                  }
                } catch (error) {
                  alert('Hiba történt a YouTube keresés során.');
                  console.error(error);
                }
              }}
            />
            <img
              src='/icons/spotify_logo.png'
              alt='Spotify'
              width='32px'
              height='32px'
              style={{ cursor: 'pointer' }}
              onClick={async () => {
                try {
                  const query = `${currentSong.artist} ${currentSong.title}`;
                  const res = await fetch(`http://127.0.0.1:5000/api/music/spotify?q=${encodeURIComponent(query)}`);
                  const data = await res.json();
                  if (data.track_url) {
                    window.open(data.track_url, '_blank');
                  } else {
                    alert('Nem található a Spotify-on ez a zene.');
                  }
                } catch (error) {
                  alert('Hiba történt a Spotify keresés során.');
                  console.error(error);
                }
              }}
            />
            </div>
          </div>

          {songs.length > 1 && (
            <div style={{ marginTop: 24 }} textAlign="center">
              <Group justify="center" spacing="md">
                <Button
                  onClick={handlePrev}
                  variant="light"
                  color="gray"
                  disabled={index === 0}
                >Előző
                </Button>

                <div style={{ fontWeight: 500 }}>
                  {index + 1} / {songs.length}
                </div>

                <Button
                  onClick={handleNext}
                  variant="light"
                  color="gray"
                  disabled={index >= songs.length - 1}
                >Következő
                </Button>
              </Group>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
