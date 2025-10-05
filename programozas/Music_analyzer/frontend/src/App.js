import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Demo from './tabs';
import MusicAnalyzer from './pages/music_analyzer';

function App() {
  return (
    <>

      <Demo />


      <div style={{ padding: '2rem' }}>
        <Routes>
          <Route path="/" element={<div>Welcome to the main page!</div>} />
          <Route path="/music-analyzer" element={<MusicAnalyzer />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
