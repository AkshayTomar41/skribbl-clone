import React from 'react';
import { useGameStore } from '../store/gameStore';
import type { Player } from '../types';
import './Scoreboard.css';

const AVATAR_EMOJIS = ['🦊', '🐺', '🐸', '🦋', '🐬', '🦄', '🐼', '🦁', '🐯', '🦅', '🐙', '🦈', '🐲', '🦊', '🐧', '🦀'];
const AVATAR_COLORS = [
  '#7c5cbf', '#00d4ff', '#00e676', '#ffd60a', '#ff6b35',
  '#e91e8c', '#00bcd4', '#8bc34a', '#ff7043', '#9c27b0',
  '#03a9f4', '#4caf50', '#ffeb3b', '#f44336', '#2196f3', '#ff5722'
];

const RANK_ICONS = ['🥇', '🥈', '🥉'];

interface Props {
  compact?: boolean;
}

export const Scoreboard: React.FC<Props> = ({ compact = false }) => {
  const { players, myPlayer, gameState } = useGameStore();

  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className={`scoreboard card ${compact ? 'scoreboard--compact' : ''}`}>
      <div className="scoreboard-header">
        <h3>🏆 Leaderboard</h3>
        {gameState && (
          <span className="round-badge badge badge-purple">
            Round {gameState.round}/{gameState.totalRounds}
          </span>
        )}
      </div>

      <div className="score-list">
        {sorted.map((player, index) => (
          <ScoreRow
            key={player.id}
            player={player}
            rank={index + 1}
            isMe={player.id === myPlayer?.id}
          />
        ))}
      </div>
    </div>
  );
};

const ScoreRow: React.FC<{ player: Player; rank: number; isMe: boolean }> = ({ player, rank, isMe }) => {
  return (
    <div className={`score-row ${isMe ? 'score-row--me' : ''} ${player.isDrawing ? 'score-row--drawing' : ''} ${player.hasGuessed ? 'score-row--guessed' : ''}`}>
      <span className="score-rank">
        {rank <= 3 ? RANK_ICONS[rank - 1] : `#${rank}`}
      </span>
      <div
        className="score-avatar"
        style={{ background: AVATAR_COLORS[player.avatar % AVATAR_COLORS.length] }}
      >
        {AVATAR_EMOJIS[player.avatar % AVATAR_EMOJIS.length]}
      </div>
      <div className="score-info">
        <span className="score-name">
          {player.name}
          {isMe && <span className="you-tag"> (you)</span>}
        </span>
        <div className="score-status">
          {player.isDrawing && <span className="status-tag drawing">🎨 Drawing</span>}
          {player.hasGuessed && <span className="status-tag guessed">✅ Guessed</span>}
          {!player.isConnected && <span className="status-tag offline">⚠️ Offline</span>}
        </div>
      </div>
      <span className="score-points">{player.score}</span>
    </div>
  );
};
