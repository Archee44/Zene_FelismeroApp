import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout';
import MusicAnalyzer from './pages/music_analyzer';
import LyricsSearch from './pages/lyrics_search';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<div>Welcome to the main page!</div>} />
        <Route path="music-analyzer" element={<MusicAnalyzer />} />
        <Route path="lyrics-search" element={<LyricsSearch />} />
        {/* További route-ok ide */}
      </Route>
    </Routes>
  );
}

export default App;
