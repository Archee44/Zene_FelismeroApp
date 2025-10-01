import React, { useState } from "react";
import FileUpload from "../components/FileUpload";
import { getRecommendations } from "../api";

export default function MusicPage() {
  const [tracks, setTracks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const handleUpload = (track) => {
    setTracks([...tracks, track]);
  };

  const handleRecommend = async (trackId) => {
    const recs = await getRecommendations(trackId);
    setRecommendations(recs);
  };

  return (
    <div>
      <h1>Zenei kereső</h1>
      <FileUpload onUpload={handleUpload} />
      
      <h2>Zenék</h2>
      <ul>
        {tracks.map((t) => (
          <li key={t.id}>
            {t.title} - {t.artist} 
            <button onClick={() => handleRecommend(t.id)}>Ajánlás</button>
          </li>
        ))}
      </ul>

      <h2>Ajánlott zenék</h2>
      <ul>
        {recommendations.map((r, idx) => (
          <li key={idx}>
            {r.title} - {r.artist} ({r.score} pont)
          </li>
        ))}
      </ul>
    </div>
  );
}
