import { useState } from "react";
import { TextInput, Button, Card, Group, Box, Image, Loader } from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';

export default function LyricsSearch() {
  const [snippet, setSnippet] = useState("");
  const [songs, setSongs] = useState([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

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
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => { if (index < songs.length - 1) setIndex(index + 1); };
  const handlePrev = () => { if (index > 0) setIndex(index - 1); };
  const currentSong = songs[index];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "calc(100vh - 100px)", marginTop: "50px" }}>
      <Card shadow="xl" padding="xl" radius="lg" withBorder
        style={{ width: "100%", maxWidth: 800, backgroundColor: dark ? "#0C1A2A" : "#FFF8E7", color: dark ? "#FFFFFF" : "#0C1A2A",
        borderColor: dark ? "#483d8b" : "#FFD966" }}>
        
        <h1 style={{ textAlign: "center", marginBottom: 32, fontSize: "3rem", fontWeight: 700 }}>
          Dalszöveg alapú kereső
        </h1>

        <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Box style={{ position: "relative" }}>
            <Box style={{ position: "absolute", top: 0, left: 0, width: 55, height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: dark ? "#483d8b" : "#FFD966", borderTopLeftRadius: 10, borderBottomLeftRadius: 10, zIndex: 1 }}>
              <Image src="/icons/New_MeloDive.png" width={28} height={28} radius="md" />
            </Box>

            <TextInput value={snippet} onChange={(e) => setSnippet(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="Írj be egy dalszövegrészletet..." size="lg" radius="md"
              styles={{ input: { paddingLeft: 65, fontSize: "1.1rem", height: "60px", backgroundColor: dark ? "#2C2E33" : "#FFFFFF", color: dark ? "#FFFFFF" : "#0C1A2A", 
              borderColor: focused ? (dark ? "#a78bfa" : "#FFD966") : (dark ? "#483d8b" : "#FFD966"),
              boxShadow: focused ? (dark ? "0 0 8px 2px rgba(167, 139, 250, 0.5)" : "0 0 8px 2px rgba(255, 217, 102, 0.6)") : "none", transition: "box-shadow 0.3s ease, border-color 0.3s ease"
              }}}/>
          </Box>
        </form>

        {loading && (
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Loader color={dark ? "violet" : "yellow"} />
          </div>
        )}


      {error && (
      <div style={{ color: "red", marginTop: 16, textAlign: "center" }}>
        {error}
      </div>
      )}

      {currentSong && (
        <div style={{ marginTop: 40, textAlign: "center" }}>
          {currentSong.cover && (
            <img src={currentSong.cover} alt="Borítókép"
              style={{ width: 250, borderRadius: 12, marginBottom: 20 }} />
          )}
          <h2 style={{ fontSize: "1.6rem", marginBottom: 4 }}>{currentSong.title}</h2>
          <p style={{ fontSize: "1.1rem", opacity: 0.8 }}>{currentSong.artist}</p>

          <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 20 }}>
            <img
              src='/icons/youtube_logo.png'
              alt='YouTube'
              width={40}
              height={40}
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
              width={40}
              height={40}
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

          {songs.length > 1 && (
            <Group justify="center" spacing="md" style={{ marginTop: 30 }}>
              <Button onClick={handlePrev} disabled={index === 0} size="md" radius="md"
                style={{ backgroundColor: dark ? "#483d8b" : "#FFD966", color: dark ? "#FFFFFF" : "#0C1A2A" }}>
                Előző
              </Button>
              <div style={{ fontWeight: 600, fontSize: "1rem" }}>
                {index + 1} / {songs.length}
              </div>
              <Button onClick={handleNext} disabled={index >= songs.length - 1} size="md" radius="md"
                style={{ backgroundColor: dark ? "#483d8b" : "#FFD966", color: dark ? "#FFFFFF" : "#0C1A2A" }}>
                Következő
              </Button>
            </Group>
          )}
        </div>
      )}

      {error && (
        <p style={{ marginTop: 24, textAlign: "center", color: "#d9534f", fontWeight: 600 }}>{error}</p>
      )}
        <Box style={{ maxWidth: 800, textAlign: "center", marginTop: 60, marginBottom: 80, color: dark ? "#D1D5DB" : "#333" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: 12 }}>Hogyan működik?</h2>
          <p style={{ fontSize: "1.2rem", lineHeight: 1.6 }}>
            Van egy dal, ami nem megy ki a fejedből?
            Talán csak a szöveg egy részére emlékszel, például: „Egy dalt keresek, ami így szól…”
            Ez az eszköz segít megtalálni azokat a dalokat, amelyek tartalmazzák az általad felidézett dalszöveget!
          </p>
          <p style={{ fontSize: "1.2rem", lineHeight: 1.6 }}>
            Írd be a dalszöveg egy részét, és az oldal megpróbálja felismerni, melyik dalról van szó.  
            Nem kell tudnod az előadót, és a szöveg sem kell pontos legyen.
          </p>
          <p style={{ fontSize: "1.2rem", marginTop: 8, lineHeight: 1.6 }}>
            Ezután kiválaszthatod a legjobb egyezést.
            A találatoknál megjelenik a borítókép, az előadó és a cím.
            Lehetőséget kapsz arra is, hogy meghallgasd a dalt YouTube-on vagy Spotify-on.  
          </p>
        </Box>
      </Card>
    </div>
  );
}

export { LyricsSearch };