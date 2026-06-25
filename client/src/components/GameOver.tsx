import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Scoreboard } from '../components/Scoreboard';
import { getSocket } from '../hooks/useSocket';
import './GameOver.css';

const AVATAR_EMOJIS = ['🦊', '🐺', '🐸', '🦋', '🐬', '🦄', '🐼', '🦁', '🐯', '🦅', '🐙', '🦈', '🐲', '🦊', '🐧', '🦀'];
const AVATAR_COLORS = [
  '#7c5cbf', '#00d4ff', '#00e676', '#ffd60a', '#ff6b35',
  '#e91e8c', '#00bcd4', '#8bc34a', '#ff7043', '#9c27b0',
  '#03a9f4', '#4caf50', '#ffeb3b', '#f44336', '#2196f3', '#ff5722'
];

export const GameOver: React.FC = () => {
  const { gameState, players, myPlayer, reset } = useGameStore();

  if (gameState?.phase !== 'gameOver') return null;

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const iWon = winner?.id === myPlayer?.id;

  const handlePlayAgain = () => {
    const socket = getSocket();
    socket.emit('start_game', {});
  };

  const handleLeave = () => {
    const socket = getSocket();
    socket.disconnect();
    reset();
  };

  return (
    <div className="gameover-overlay">
      <div className="gameover-modal card animate-slide-up">
        {/* Winner Banner */}
        <div className="gameover-banner">
          <div className="trophy-icon">{iWon ? '🏆' : '🎮'}</div>
          <h1 className="gameover-title">
            {iWon ? '🎉 You Won!' : 'Game Over!'}
          </h1>
          {winner && (
            <div className="winner-section">
              <p className="winner-label">Winner</p>
              <div className="winner-card">
                <div
                  className="winner-avatar"
                  style={{ background: AVATAR_COLORS[winner.avatar % AVATAR_COLORS.length] }}
                >
                  {AVATAR_EMOJIS[winner.avatar % AVATAR_EMOJIS.length]}
                </div>
                <div className="winner-info">
                  <span className="winner-name">{winner.name}</span>
                  <span className="winner-score">{winner.score} pts</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="gameover-board">
          <h2>Final Scores</h2>
          <div className="final-scores">
            {sorted.map((player, index) => (
              <div
                key={player.id}
                className={`final-score-row ${player.id === myPlayer?.id ? 'final-score-row--me' : ''} ${index === 0 ? 'final-score-row--winner' : ''}`}
              >
                <span className="final-rank">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </span>
                <div
                  className="final-avatar"
                  style={{ background: AVATAR_COLORS[player.avatar % AVATAR_COLORS.length] }}
                >
                  {AVATAR_EMOJIS[player.avatar % AVATAR_EMOJIS.length]}
                </div>
                <span className="final-name">{player.name}{player.id === myPlayer?.id ? ' (you)' : ''}</span>
                <span className="final-score">{player.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="gameover-actions">
          {myPlayer?.isHost && (
            <button className="btn btn-primary btn-lg" onClick={handlePlayAgain}>
              🔄 Play Again
            </button>
          )}
          <button className="btn btn-ghost" onClick={handleLeave}>
            🚪 Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};
