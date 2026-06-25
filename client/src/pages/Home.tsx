import React, { useState } from 'react';
import { useSocket, getSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';
import './Home.css';

const AVATAR_EMOJIS = ['🦊', '🐺', '🐸', '🦋', '🐬', '🦄', '🐼', '🦁', '🐯', '🦅', '🐙', '🦈', '🐲', '🦊', '🐧', '🦀'];

const CATEGORIES = ['All', 'animals', 'food', 'objects', 'places', 'actions', 'movies', 'sports', 'technology'];

export const Home: React.FC = () => {

  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create room settings
  const [settings, setSettings] = useState({
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    wordCount: 3,
    hints: 2,
    isPrivate: false,
    category: null as string | null,
  });

  const handleCreate = () => {
    if (!playerName.trim()) { setError('Please enter your name'); return; }
    setError('');
    setLoading(true);
    const socket = getSocket();
    socket.connect();
    socket.emit('create_room', {
      playerName: playerName.trim(),
      settings: { ...settings, category: settings.category === 'All' ? null : settings.category },
    });
    setTimeout(() => setLoading(false), 3000);
  };

  const handleJoin = () => {
    if (!playerName.trim()) { setError('Please enter your name'); return; }
    if (!roomCode.trim()) { setError('Please enter a room code'); return; }
    setError('');
    setLoading(true);
    const socket = getSocket();
    socket.connect();
    socket.emit('join_room', {
      roomId: roomCode.trim().toUpperCase(),
      playerName: playerName.trim(),
    });
    socket.once('error', ({ message }: { message: string }) => {
      setError(message);
      setLoading(false);
    });
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="home-page">
      <div className="bg-pattern" />

      {/* Hero */}
      <div className="home-hero">
        <h1 className="home-title">
          <span className="title-gradient">Skribbl</span>
          <span className="title-dot">.io</span>
        </h1>
        <p className="home-subtitle">Draw. Guess. Win. — The ultimate real-time Pictionary game!</p>
      </div>

      {/* Main Card */}
      <div className="home-card card animate-slide-up">
        {/* Name Input */}
        <div className="form-group">
          <label className="label">Your Name</label>
          <div className="name-input-wrapper">
            <span className="name-emoji">{AVATAR_EMOJIS[playerName.length % AVATAR_EMOJIS.length]}</span>
            <input
              className="input name-input"
              placeholder="Enter your player name..."
              value={playerName}
              onChange={e => setPlayerName(e.target.value.slice(0, 20))}
              onKeyDown={e => { if (e.key === 'Enter') tab === 'join' ? handleJoin() : handleCreate(); }}
              maxLength={20}
              autoFocus
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          <button className={`tab-btn ${tab === 'join' ? 'active' : ''}`} onClick={() => setTab('join')}>
            🚪 Join Room
          </button>
          <button className={`tab-btn ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>
            ✨ Create Room
          </button>
        </div>

        {/* Tab Content */}
        {tab === 'join' ? (
          <div className="tab-content animate-fade-in">
            <div className="form-group">
              <label className="label">Room Code</label>
              <input
                className="input code-input"
                placeholder="Enter 6-character code..."
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                maxLength={6}
                style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '20px', fontWeight: 700, textAlign: 'center' }}
              />
            </div>
            {error && <p className="error-msg">⚠️ {error}</p>}
            <button className="btn btn-cyan btn-full btn-lg" onClick={handleJoin} disabled={loading}>
              {loading ? <><span className="loader" /> Joining...</> : '🚀 Join Game'}
            </button>
          </div>
        ) : (
          <div className="tab-content animate-fade-in">
            <div className="settings-grid">
              <div className="form-group">
                <label className="label">Max Players</label>
                <select className="select" value={settings.maxPlayers}
                  onChange={e => setSettings(s => ({ ...s, maxPlayers: +e.target.value }))}>
                  {[2,3,4,5,6,8,10,12,16,20].map(n => <option key={n} value={n}>{n} players</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Rounds</label>
                <select className="select" value={settings.rounds}
                  onChange={e => setSettings(s => ({ ...s, rounds: +e.target.value }))}>
                  {[2,3,4,5,6,8,10].map(n => <option key={n} value={n}>{n} rounds</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Draw Time</label>
                <select className="select" value={settings.drawTime}
                  onChange={e => setSettings(s => ({ ...s, drawTime: +e.target.value }))}>
                  {[30,45,60,80,100,120,180,240].map(n => <option key={n} value={n}>{n}s</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Word Choices</label>
                <select className="select" value={settings.wordCount}
                  onChange={e => setSettings(s => ({ ...s, wordCount: +e.target.value }))}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} words</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Hints</label>
                <select className="select" value={settings.hints}
                  onChange={e => setSettings(s => ({ ...s, hints: +e.target.value }))}>
                  {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n === 0 ? 'No hints' : `${n} hint${n > 1 ? 's' : ''}`}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Category</label>
                <select className="select" value={settings.category || 'All'}
                  onChange={e => setSettings(s => ({ ...s, category: e.target.value === 'All' ? null : e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="private-toggle">
              <label className="toggle-label">
                <input type="checkbox" checked={settings.isPrivate}
                  onChange={e => setSettings(s => ({ ...s, isPrivate: e.target.checked }))} />
                <span className="toggle-slider" />
                <span className="toggle-text">🔒 Private Room</span>
              </label>
            </div>
            {error && <p className="error-msg">⚠️ {error}</p>}
            <button className="btn btn-primary btn-full btn-lg" onClick={handleCreate} disabled={loading}>
              {loading ? <><span className="loader" /> Creating...</> : '✨ Create Room'}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="home-footer">
        <p>Built with ❤️ using React + Socket.IO · Draw, guess, have fun!</p>
      </footer>
    </div>
  );
};
