import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout';
import MusicAnalyzer from './pages/music_analyzer';
import LyricsSearch from './pages/lyrics_search';
import PopularSongs from './pages/popular_songs';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<PopularSongs/>} />
        <Route path="music-analyzer" element={<MusicAnalyzer />} />
        <Route path="lyrics-search" element={<LyricsSearch />} />
        {/* További route-ok ide */}
      </Route>
    </Routes>
  );
}

export default App;
