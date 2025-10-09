import { Title, Text, Card, Grid, Image } from '@mantine/core';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function PopularSongs() {
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/music/spotify-top")
      .then((res) => { 
        console.log("Lekért zenék: ",res.data.top_tracks);
        setSongs(res.data.top_tracks);
      })
      .catch((err) => { console.error("Hiba a playlist lekérésénél:", err); });
  }, []);
  return (
    <div>
      <Title order={2} mb="md">Népszerű zenék</Title>
      <Grid>
        {Array.isArray(songs) && songs.map((song, index) => (
          <Grid.Col span={5} key={index}>
            <Card shadow="sm" padding="lg" mb="md" withBorder>
              <Card.Section>
                <Image
                  src={song.image}
                  height={160}
                  alt={`${song.title} borítókép`}
                  fit="cover"
                />
              </Card.Section>
              <Text fw={700} mt="md">{song.title}</Text>
              <Text c={"dimmed"}>{song.artist}</Text>



            </Card>
          </Grid.Col>        
        ))}
      </Grid>
    </div>
  );
}