import React, { useState } from "react";
import { Button, FileInput, Loader, Text, Card, Box } from "@mantine/core";
import { useMantineColorScheme } from "@mantine/core";

export default function MusicAnalyzer() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

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
          <div style={{ marginTop: 40, textAlign: "center" }}>
            <h2 style={{ fontSize: "1.8rem", marginBottom: 16 }}>Elemzett adatok</h2>
            <Text><strong>Cím:</strong> {result.title}</Text>
            <Text><strong>Előadó:</strong> {result.artist}</Text>
            <Text><strong>Műfaj:</strong> {result.genre}</Text>
            <Text><strong>BPM:</strong> {result.bpm}</Text>
            <Text><strong>Hossz:</strong> {result.duration?.toFixed(2)} mp</Text>
            <Text><strong>RMS:</strong> {result.rms?.toFixed(4)}</Text>
            <Text><strong>Camelot:</strong> {result.camelot}</Text>

            {result.path && (
              <div style={{ marginTop: "1rem" }}>
                <audio controls src={`http://127.0.0.1:5000/api/music/uploads/${result.path}`}/>
              </div>
            )}

            {result.title && result.artist && (
              <div style={{ marginTop: "1.5rem" }}>
                <Text><strong>Megnyitás külső platformon:</strong></Text>
                <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 10 }}>
                  <img src="/icons/youtube_logo.png" alt="YouTube" width={40} height={40} style={{ cursor: "pointer" }}
                    onClick={async () => {
                      const query = `${result.artist} ${result.title}`;
                      const res = await fetch(
                        `http://127.0.0.1:5000/api/music/youtube?q=${encodeURIComponent(query)}`
                      );
                      const data = await res.json();
                      if (data.video_url) window.open(data.video_url, "_blank");
                      else alert("Nem található YouTube-videó ehhez a zenéhez.");
                    }}/>
                  <img src="/icons/spotify_logo.png" alt="Spotify" width={40} height={40} style={{ cursor: "pointer" }}
                    onClick={async () => {
                      const query = `${result.artist} ${result.title}`;
                      const res = await fetch(
                        `http://127.0.0.1:5000/api/music/spotify?q=${encodeURIComponent(query)}`
                      );
                      const data = await res.json();
                      if (data.track_url) window.open(data.track_url, "_blank");
                      else alert("Nem található Spotify-link ehhez a zenéhez.");
                    }}/>
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