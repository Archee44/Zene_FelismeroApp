import React, { useState } from 'react';
import { Button, FileInput, Loader, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

function MusicAnalyzer() {
  const navigate = useNavigate();
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

      <Button
        variant="filled"
        color="blue"
        mt="md"
        onClick={handleAnalyze}
        disabled={loading || !file}
      >
        {loading ? <Loader size="sm" color="white" /> : 'Elemzés indítása'}
      </Button>

      <Button
            variant="outline"
            color="green"
            mt="xl"
            onClick={() => navigate('/')}
      >
        Vissza a főoldalra
      </Button>

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
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(result.artist + ' ' + result.title)}`}
                  target="_blank"
                  rel="noopener noreferrer">
                  <img src='/icons/youtube_logo.png' alt='YouTube' width='32px' height='32px'/>
                </a>
                <a
                  href={`https://open.spotify.com/search/${encodeURIComponent(result.artist + ' ' + result.title)}`}
                  target="_blank"
                  rel="noopener noreferrer">
                  <img src='/icons/spotify_logo.png' alt='Spotify' width='32px' height='32px'/>
                </a>
              </div>
            </div>
          )}
          
        </div>
      )}
    </div>
  );
}

export default MusicAnalyzer;
