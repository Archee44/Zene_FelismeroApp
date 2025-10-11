import { Title, Text, Card, Grid, Image, Anchor } from '@mantine/core';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function PopularSongs() {
  const [songs, setSongs] = useState([]);
  const [playlistName, setPlaylistName] = useState("Spotify Top 50 Global");

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/api/music/genius-top")
      .then((res) => {
        console.log("Lekért zenék:", res.data.top_tracks);
        setSongs(res.data.top_tracks);
        setPlaylistName(res.data.playlist_name);
      })
      .catch((err) => {
        console.error("Hiba a playlist lekérésénél:", err);
      });
  }, []);

  return (
    <div>
      <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: "2rem",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #1DB954, #191414)",
          color: "white",
          padding: "4.5rem 4.5rem",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
          textAlign: "center",
          width: "100%",
          maxWidth: "100%",
        }}>
          <Title order={1} style={{ fontSize: "2.5rem", letterSpacing: "1px" }}>
            {playlistName}
          </Title>
          <Text size="lg" mt="sm" c="gray.2"><strong>Top 50 Global Songs</strong></Text>
        </div>
      </div>
      <Grid gutter="lg">
        {Array.isArray(songs) && songs.map((song, index) => (
          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }} key={index}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Card.Section>
                <Image
                  src={song.image}
                  height={180}
                  alt={`${song.title} borítókép`}
                  fit="cover"
                />
              </Card.Section>

              <Text fw={700} mt="md">{song.rank}. {song.title}</Text>
              <Text c="dimmed">{song.artist}</Text>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ justifyContent: 'center', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <img
                  src='/icons/youtube_logo.png'
                  alt='YouTube'
                  width='32px'
                  height='32px'
                  style={{ cursor: 'pointer' }}
                  onClick={async () => {
                    try {
                      const query = `${song.artist} ${song.title}`;
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
                      const query = `${song.artist} ${song.title}`;
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
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </div>
  );
}
