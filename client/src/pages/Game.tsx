import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Canvas } from '../components/Canvas';
import { Chat } from '../components/Chat';
import { Scoreboard } from '../components/Scoreboard';
import { HintBar } from '../components/HintBar';
import { Timer } from '../components/Timer';
import { WordChoice } from '../components/WordChoice';
import { GameOver } from '../components/GameOver';
import './Game.css';

export const Game: React.FC = () => {
  const { gameState, isDrawer, roomId, myPlayer } = useGameStore();

  return (
    <div className="game-page">
      <div className="bg-pattern" />

      {/* Word Choice Modal */}
      <WordChoice />

      {/* Game Over Overlay */}
      <GameOver />

      {/* Top Bar */}
      <div className="game-topbar">
        <div className="topbar-left">
          <span className="game-logo">🎨</span>
          <div className="game-room-info">
            <span className="room-id-tag">{roomId}</span>
            {myPlayer && (
              <span className="my-name-tag">{myPlayer.name}</span>
            )}
          </div>
        </div>

        <div className="topbar-center">
          <HintBar />
        </div>

        <div className="topbar-right">
          <Timer />
        </div>
      </div>

      {/* Main Game Layout */}
      <div className="game-layout">
        {/* Left – Scoreboard */}
        <div className="card game-sidebar-left">
          <Scoreboard />
        </div>

        {/* Center – Canvas */}
        <div className="game-center">
          <Canvas />
          {isDrawer && gameState?.phase === 'choosing' && (
            <div className="drawer-status card">
              <span>🎨 You are the drawer this round! Select your word...</span>
            </div>
          )}
        </div>

        {/* Right – Chat */}
        <div className="card game-sidebar-right">
          <Chat />
        </div>
      </div>
    </div>
  );
};
