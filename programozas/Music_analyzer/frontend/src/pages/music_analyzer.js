import React, { useState } from 'react';
import { Button, FileInput, Loader, Text } from '@mantine/core';

function MusicAnalyzer() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);


  const handleAnalyze = async () => {
    if (!file) return alert('Válassz egy MP3 fájlt!');

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('http://localhost:5000/api/music/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Hiba történt az elemzés során');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert('Nem sikerült elemezni a fájlt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Zeneelemző</h1>
      <Text size="sm" color="dimmed">
        Tölts fel egy MP3 fájlt, hogy elemezzük a zenei jellemzőit.
      </Text>

      <FileInput
        placeholder="Válassz egy MP3 fájlt"
        accept="audio/*"
        value={file}
        onChange={setFile}
        mt="md"
      />

      <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
        <Button
          variant="filled"
          color="#0C1A2A"
          onClick={handleAnalyze}
          disabled={loading || !file}
        >
          {loading ? <Loader size="sm" color="white" /> : 'Elemzés indítása'}
        </Button>
      </div>

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h2>Elemzett adatok</h2>
          <Text><strong>Cím:</strong> {result.title}</Text>
          <Text><strong>Előadó:</strong> {result.artist}</Text>
          <Text><strong>Műfaj:</strong> {result.genre}</Text>
          <Text><strong>BPM:</strong> {result.bpm}</Text>
          <Text><strong>Hossz:</strong> {result.duration.toFixed(2)} mp</Text>
          <Text><strong>RMS:</strong> {result.rms.toFixed(4)}</Text>
          <Text><strong>Camelot:</strong> {result.camelot}</Text>

          {result.path && (
            <div style={{ marginTop: '1rem' }}>
              <Text><strong>Lejátszás:</strong></Text>
              <audio
                controls
                src={`http://localhost:5000/api/music/uploads/${result.path}`} />
            </div>
          )}

          {result.title && result.artist && (
            <div style={{ marginTop: '1rem' }}>
              <Text><strong>Megnyitás külső platformon:</strong></Text>
              <div style={{ justifyContent: 'center', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <img
                src='/icons/youtube_logo.png'
                alt='YouTube'
                width='32px'
                height='32px'
                style={{ cursor: 'pointer' }}
                onClick={async () => {
                  try {
                    const query = `${result.artist} ${result.title}`;
                    const res = await fetch(`http://localhost:5000/api/music/youtube?q=${encodeURIComponent(query)}`);
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
                    const query = `${result.artist} ${result.title}`;
                    const res = await fetch(`http://localhost:5000/api/music/spotify?q=${encodeURIComponent(query)}`);
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
          )}
          
        </div>
      )}
    </div>
  );
}

export default MusicAnalyzer;
