import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout';
import MusicAnalyzer from './pages/music_analyzer';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<div>Welcome to the main page!</div>} />
        <Route path="music-analyzer" element={<MusicAnalyzer />} />
        {/* További route-ok ide */}
      </Route>
    </Routes>
  );
}

export default App;
