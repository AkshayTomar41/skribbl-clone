import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getSocket } from '../hooks/useSocket';
import './Lobby.css';

const AVATAR_EMOJIS = ['🦊', '🐺', '🐸', '🦋', '🐬', '🦄', '🐼', '🦁', '🐯', '🦅', '🐙', '🦈', '🐲', '🦊', '🐧', '🦀'];
const AVATAR_COLORS = [
  '#7c5cbf', '#00d4ff', '#00e676', '#ffd60a', '#ff6b35',
  '#e91e8c', '#00bcd4', '#8bc34a', '#ff7043', '#9c27b0',
  '#03a9f4', '#4caf50', '#ffeb3b', '#f44336', '#2196f3', '#ff5722'
];

export const Lobby: React.FC = () => {
  const { roomId, myPlayer, players, settings } = useGameStore();
  const [copied, setCopied] = useState(false);

  const isHost = myPlayer?.isHost;

  const copyCode = () => {
    navigator.clipboard.writeText(roomId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    const socket = getSocket();
    socket.emit('start_game', {});
  };

  const handleKick = (playerId: string) => {
    const socket = getSocket();
    socket.emit('kick_player', { playerId });
  };

  if (!roomId || !myPlayer) return null;

  return (
    <div className="lobby-page">
      <div className="bg-pattern" />

      <div className="lobby-container">
        {/* Header */}
        <div className="lobby-header animate-slide-up">
          <h1 className="lobby-title">🎨 Game Lobby</h1>
          <div className="room-code-section">
            <span className="room-code-label">Room Code</span>
            <div className="room-code-display">
              <span className="room-code">{roomId}</span>
              <button className="btn btn-ghost btn-sm" onClick={copyCode}>
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
            <p className="room-code-hint">Share this code with friends to invite them!</p>
          </div>
        </div>

        <div className="lobby-main">
          {/* Players Panel */}
          <div className="card lobby-players-panel animate-fade-in">
            <div className="panel-header">
              <h2>Players</h2>
              <span className="badge badge-purple">{players.length} / {settings?.maxPlayers}</span>
            </div>

            <div className="players-list">
              {players.map((player, i) => (
                <div key={player.id} className="player-row" style={{ animationDelay: `${i * 60}ms` }}>
                  <div
                    className="avatar"
                    style={{ background: AVATAR_COLORS[player.avatar % AVATAR_COLORS.length], border: `2px solid ${AVATAR_COLORS[player.avatar % AVATAR_COLORS.length]}44` }}
                  >
                    {AVATAR_EMOJIS[player.avatar % AVATAR_EMOJIS.length]}
                  </div>
                  <div className="player-info">
                    <span className="player-name">{player.name}</span>
                    {player.isHost && <span className="badge badge-yellow host-badge">👑 Host</span>}
                    {player.id === myPlayer.id && <span className="badge badge-cyan you-badge">You</span>}
                  </div>
                  {isHost && player.id !== myPlayer.id && (
                    <button className="btn btn-ghost btn-sm kick-btn" onClick={() => handleKick(player.id)}>
                      ✖
                    </button>
                  )}
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: Math.max(0, (settings?.maxPlayers || 8) - players.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="player-row player-row--empty">
                  <div className="avatar avatar--empty">?</div>
                  <span className="player-name--empty">Waiting for player...</span>
                </div>
              ))}
            </div>
          </div>

          {/* Settings Panel */}
          <div className="card lobby-settings-panel animate-fade-in">
            <div className="panel-header">
              <h2>Game Settings</h2>
              {isHost && <span className="badge badge-green">Host</span>}
            </div>

            <div className="settings-list">
              <div className="setting-row">
                <span className="setting-icon">🔄</span>
                <span className="setting-name">Rounds</span>
                <span className="setting-value">{settings?.rounds}</span>
              </div>
              <div className="setting-row">
                <span className="setting-icon">⏱️</span>
                <span className="setting-name">Draw Time</span>
                <span className="setting-value">{settings?.drawTime}s</span>
              </div>
              <div className="setting-row">
                <span className="setting-icon">📝</span>
                <span className="setting-name">Word Choices</span>
                <span className="setting-value">{settings?.wordCount}</span>
              </div>
              <div className="setting-row">
                <span className="setting-icon">💡</span>
                <span className="setting-name">Hints</span>
                <span className="setting-value">{settings?.hints === 0 ? 'Off' : settings?.hints}</span>
              </div>
              <div className="setting-row">
                <span className="setting-icon">👥</span>
                <span className="setting-name">Max Players</span>
                <span className="setting-value">{settings?.maxPlayers}</span>
              </div>
              <div className="setting-row">
                <span className="setting-icon">{settings?.isPrivate ? '🔒' : '🌐'}</span>
                <span className="setting-name">Room Type</span>
                <span className="setting-value">{settings?.isPrivate ? 'Private' : 'Public'}</span>
              </div>
            </div>

            <div className="lobby-divider" />

            {isHost ? (
              <div className="start-section">
                {players.length < 2 ? (
                  <p className="waiting-msg">⏳ Waiting for at least 2 players...</p>
                ) : (
                  <p className="ready-msg">✅ {players.length} players ready!</p>
                )}
                <button
                  className="btn btn-primary btn-full btn-lg"
                  onClick={handleStart}
                  disabled={players.length < 2}
                >
                  🎮 Start Game!
                </button>
              </div>
            ) : (
              <div className="start-section">
                <div className="waiting-host">
                  <div className="waiting-dots">
                    <span /><span /><span />
                  </div>
                  <p>Waiting for host to start the game...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
