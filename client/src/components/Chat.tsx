import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { getSocket } from '../hooks/useSocket';
import type { ChatMessage } from '../types';
import './Chat.css';

const AVATAR_EMOJIS = ['🦊', '🐺', '🐸', '🦋', '🐬', '🦄', '🐼', '🦁', '🐯', '🦅', '🐙', '🦈', '🐲', '🦊', '🐧', '🦀'];
const AVATAR_COLORS = [
  '#7c5cbf', '#00d4ff', '#00e676', '#ffd60a', '#ff6b35',
  '#e91e8c', '#00bcd4', '#8bc34a', '#ff7043', '#9c27b0',
  '#03a9f4', '#4caf50', '#ffeb3b', '#f44336', '#2196f3', '#ff5722'
];

export const Chat: React.FC = () => {
  const { messages, isDrawer, hasGuessed, gameState, myPlayer } = useGameStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDrawing = gameState?.phase === 'drawing';
  const canGuess = isDrawing && !isDrawer && !hasGuessed;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    const socket = getSocket();

    if (canGuess) {
      socket.emit('guess', { text: input.trim() });
    } else if (!isDrawer) {
      socket.emit('chat', { text: input.trim() });
    }

    setInput('');
  }, [input, canGuess, isDrawer]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMessageClass = (msg: ChatMessage) => {
    if (msg.type === 'correct') return 'msg msg--correct';
    if (msg.type === 'system') return 'msg msg--system';
    if (msg.playerId === myPlayer?.id) return 'msg msg--mine';
    return 'msg';
  };

  return (
    <div className="chat-panel card">
      <div className="chat-header">
        <h3>💬 Chat & Guesses</h3>
        {canGuess && <span className="badge badge-cyan blink-badge">Type your guess!</span>}
        {isDrawer && <span className="badge badge-purple">You're drawing!</span>}
        {hasGuessed && <span className="badge badge-green">✅ Guessed!</span>}
      </div>

      <div className="messages-list">
        {messages.length === 0 && (
          <div className="no-messages">
            <span>🎮</span>
            <p>The game chat will appear here</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={getMessageClass(msg)}>
            {msg.type === 'system' || msg.type === 'correct' ? (
              <span className="msg-text">{msg.text}</span>
            ) : (
              <>
                <div
                  className="msg-avatar"
                  style={{
                    background: msg.avatar !== undefined ? AVATAR_COLORS[msg.avatar % AVATAR_COLORS.length] : '#7c5cbf',
                  }}
                >
                  {msg.avatar !== undefined ? AVATAR_EMOJIS[msg.avatar % AVATAR_EMOJIS.length] : '?'}
                </div>
                <div className="msg-body">
                  <span className="msg-author">{msg.playerName}</span>
                  <span className="msg-text">{msg.text}</span>
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          className={`input chat-input ${canGuess ? 'guess-input' : ''}`}
          placeholder={
            isDrawer ? "You're drawing! 🎨" :
            hasGuessed ? "You guessed it! 🎉" :
            canGuess ? "Type your guess..." :
            "Chat..."
          }
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={isDrawer}
          maxLength={100}
          autoComplete="off"
        />
        <button
          className="btn btn-primary send-btn"
          onClick={sendMessage}
          disabled={isDrawer || !input.trim()}
        >
          ➤
        </button>
      </div>
    </div>
  );
};
