import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useSocket } from './hooks/useSocket';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { Game } from './pages/Game';
import './App.css';

function App() {
  const { phase } = useGameStore();
  useSocket(); // Register all socket event listeners

  return (
    <div className="app">
      {phase === 'home' && <Home />}
      {phase === 'lobby' && <Lobby />}
      {phase === 'game' && <Game />}
    </div>
  );
}

export default App;
