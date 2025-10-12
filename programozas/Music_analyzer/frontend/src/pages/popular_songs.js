import { Text, Card, Grid, Image, Container, Flex, Group, Button } from '@mantine/core';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { IconCards, IconList } from '@tabler/icons-react';

export default function PopularSongs() {
  const [songs, setSongs] = useState([]);
  const [value, setValue] = useState("Lista");

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/api/music/genius-top")
      .then((res) => {
        console.log("Lekért zenék:", res.data.top_tracks);
        setSongs(res.data.top_tracks);
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
        marginTop: "3rem"
      }}>
        <div style={{
          background: "linear-gradient(135deg, #fae3aeff, #1883c1ff)",
          color: "white",
          padding: "4.5rem 4.5rem",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
          textAlign: "center",
          width: "100%",
          maxWidth: "100%"
        }}>
          <Text size="50px" mt="sm" c="gray.2"><strong>Top 50 Global Songs</strong></Text>
        </div>
      </div>

        <Button variant="light" leftSection={value === "Lista" ? <IconList size={18} /> : <IconCards size={18} />}
        onClick={() => setValue( value === "Lista" ? "Kártya" : "Lista")}
        style={{ position: "absolute", top: "115px", right:"30px", backgroundColor: "rgba(255,255,255,0.5)", color: "white", border: "2px solid rgba(255,255,255,0.3)", backdropFilter: "blur(5px)" }}>
          {value === "Lista" ? "Lista" : "Kártya"}
        </Button>

      {value === "Kártya" ? (
      <Container size="lg">
        <Grid gutter="sm">
          {Array.isArray(songs) && songs.map((song, index) => (
            <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }} key={index}>
              <Card shadow="sm" padding="lg" radius="md" withBorder backgroundColor="white" style={{ border: " 2px solid white", height: "350px", display: "flex", flexDirection: "column"}}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                <div>
                  <Card.Section>
                    <Image
                      src={song.image}
                      height={180}
                      alt={`${song.title} borítókép`}
                      fit="cover"
                    />
                  </Card.Section>
                  <Text fw={700} mt="md">
                    <Text span c="yellow"><strong>{song.rank}. </strong></Text>
                    <Text span c="yellow"><strong>{song.title}</strong></Text>
                  </Text>
                  <Text c="black"><strong>{song.artist}</strong></Text>
                </div>

                <div style={{
                  marginTop: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '1rem',
                  paddingBottom: '0.5rem'
                }}>
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
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Container>
    ) : (
    <Container fluid style={{ width: "80vw", margin: "0 auto", padding: "0 2rem" }}>
        {Array.isArray(songs) && songs.map((song, index) => (
          <Flex
            key={index}
            align="center"
            justify="space-between"
            style={{
              width: "100%",
              padding: "14px 0",
              borderBottom: "2.5px solid #e0e0e0",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
            <Text fw={700} w={30}><strong>{song.rank}. </strong></Text>

            <img
              src={song.image}
              width="50px"
              height="50px"
              radius="sm"
              alt={`${song.title} borítókép`}
              fit="cover"
            />

            <div style={{ flex: 1, marginLeft: "1rem" }}>
              <Text c="yellow" fw={600}><strong>{song.title}</strong></Text>
              <Text c="white" size="sm"><strong>{song.artist}</strong></Text>
            </div>

            <Group gap="sm">
              <img
                src="/icons/youtube_logo.png"
                alt="YouTube"
                width="30px"
                height="30px"
                style={{ cursor: "pointer" }}
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
                src="/icons/spotify_logo.png"
                alt="Spotify"
                width="30px"
                height="30px"
                style={{ cursor: "pointer" }}
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
            </Group>
          </Flex>
        ))}
      </Container>
    )}
    </div>
  );
}

