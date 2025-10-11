import React, { useState } from "react";
import { Button, FileInput, Loader, Text, Card, Box, Progress } from "@mantine/core";
import { useMantineColorScheme } from "@mantine/core";

export default function MusicAnalyzer() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  const { setRbLoading }= useState(false);
  const { setSpotifyId } = useState("");

  const fetchReccobeatsById = async (id) => {
    if (!id) return;
    try {
      setRbLoading(true);
      const res = await fetch(`http://127.0.0.1:5000/api/music/reccobeats-features?spotify_id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (res.ok && data && Array.isArray(data.content) && data.content.length > 0) {
        const feat = data.content[0];
        setResult((prev) => ({ ...(prev || {}), ...feat }));
      }
    } catch (e) {
      console.error("ReccoBeats fetch error", e);
    } finally {
      setRbLoading(false);
    }
  };

  const resolveSpotifyIdAndFetch = async (artist, title) => {
    try {
      const q = `${artist} ${title}`;
      const res = await fetch(`http://127.0.0.1:5000/api/music/spotify?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok && data && data.track_url) {
        const url = data.track_url;
        const idx = url.indexOf('/track/');
        if (idx !== -1) {
          const after = url.substring(idx + 7);
          const id = after.split('?')[0].split('/')[0];
          if (id) {
            setSpotifyId(id);
            await fetchReccobeatsById(id);
          }
        }
      }
    } catch (e) {
      console.error("Spotify ID resolve error", e);
    }
  };


  const handleAnalyze = async () => {
    if (!file) return alert("Válassz egy MP3 fájlt!");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/music/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Hiba történt az elemzés során");
      }

      const data = await res.json();
      setResult(data);
      if (data && data.artist && data.title) {
        resolveSpotifyIdAndFetch(data.artist, data.title);
      }
    } catch (err) {
      console.error(err);
      alert("Nem sikerült elemezni a fájlt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 100px)", marginTop: "15px" }}>
      <Card shadow="xl" padding="xl" radius="lg" withBorder
        style={{ width: "100%", maxWidth: 800 ,backgroundColor: dark ? "#0C1A2A" : "#FFF8E7", color: dark ? "#FFFFFF" : "#0C1A2A",
        borderColor: dark ? "#483d8b" : "#FFD966" }}>
        
        <h1 style={{ textAlign: "center", marginBottom: 28, fontSize: "3rem", fontWeight: 700 }}>
          Zeneelemző
        </h1>

        <Text size="lg" style={{ textAlign: "center", opacity: 0.8, marginBottom: 30 }}>
          Tölts fel egy MP3 fájlt, hogy elemezzük a zenei jellemzőit.
        </Text>

        <Box style={{ position: "relative" }}>
          <FileInput accept="audio/*" placeholder="Válassz egy MP3 fájlt" value={file} onChange={setFile} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            styles={{ input: {  height: 60, fontSize: "1.1rem", backgroundColor: dark ? "#2C2E33" : "#FFFFFF", color: dark ? "#FFFFFF" : "#0C1A2A",
                borderColor: focused ? dark ? "#a78bfa" : "#FFD966" : dark ? "#483d8b" : "#FFD966", boxShadow: focused ? dark ? "0 0 8px 2px rgba(167, 139, 250, 0.5)" : "0 0 8px 2px rgba(255, 217, 102, 0.6)" : "none",
                transition: "box-shadow 0.3s ease, border-color 0.3s ease"
              }}}/>
        </Box>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Button onClick={handleAnalyze} disabled={loading || !file} size="md" radius="md"
            style={{ backgroundColor: dark ? "#483d8b" : "#FFD966", color: dark ? "#FFFFFF" : "#0C1A2A", width: "200px", height: "45px" }}>
            {loading ? <Loader size="sm" color={dark ? "violet" : "yellow"} /> : "Elemzés indítása"}
          </Button> 
          </div>
      {result && (
        <div style={{ marginTop: '20px' }}>
          <h2>Elemzett adatok</h2>
          <Text><strong>Cím:</strong> {result.title}</Text>
          <Text><strong>Előadó:</strong> {result.artist}</Text>
          <Text><strong>BPM:</strong> {result.bpm}</Text>
          <Text><strong>Hossz:</strong> {result.duration.toFixed(2)} mp</Text>
          <Text><strong>RMS:</strong> {result.rms.toFixed(4)}</Text>
          <Text><strong>Camelot:</strong> {result.camelot}</Text>



          {(result.danceability !== undefined || result.energy !== undefined || result.valence !== undefined) && (
            <div style={{ marginTop: 12 }}>
              <Text size="sm" style={{ marginBottom: 8 }}><strong>ReccoBeats jellemzők</strong></Text>
              {[{ key: 'danceability', label: 'Danceability' },
                { key: 'energy', label: 'Energy' },
                { key: 'valence', label: 'Valence' },
                { key: 'acousticness', label: 'Acousticness' },
                { key: 'instrumentalness', label: 'Instrumentalness' },
                { key: 'liveness', label: 'Liveness' },
                { key: 'speechiness', label: 'Speechiness' }].map((f) => (
                result[f.key] !== undefined && (
                  <div key={f.key} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text size="sm">{f.label}</Text>
                      <Text size="sm" color="dimmed">{Number(result[f.key]).toFixed(3)}</Text>
                    </div>
                    <Progress value={Math.max(0, Math.min(100, Number(result[f.key]) * 100))} radius="sm" />
                  </div>
                )
              ))}
            </div>
          )}


          {result.path && (
            <div style={{ marginTop: '1rem' }}>
              <Text><strong>Lejátszás:</strong></Text>
              <audio
                controls
                src={`http://127.0.0.1:5000/api/music/uploads/${result.path}`} />
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
                    const query = `${result.artist} ${result.title}`;
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
          )} 
        </div>
            )}
      </Card>
    </div>
  );
}

export { MusicAnalyzer };