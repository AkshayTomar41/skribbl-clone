import React from 'react';
import { useGameStore } from '../store/gameStore';
import { getSocket } from '../hooks/useSocket';
import './WordChoice.css';

export const WordChoice: React.FC = () => {
  const { wordOptions, gameState, isDrawer } = useGameStore();

  const isChoosing = gameState?.phase === 'choosing' && isDrawer;

  if (!isChoosing || wordOptions.length === 0) return null;

  const handleChoice = (word: string) => {
    const socket = getSocket();
    socket.emit('word_chosen', { word });
  };

  return (
    <div className="word-choice-overlay">
      <div className="word-choice-modal card animate-slide-up">
        <div className="wc-header">
          <div className="wc-icon">🎨</div>
          <h2>Choose Your Word</h2>
          <p>You are drawing this round! Pick one word to draw:</p>
        </div>

        <div className="wc-options">
          {wordOptions.map((word, i) => (
            <button
              key={word}
              className="word-option"
              onClick={() => handleChoice(word)}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="word-option-num">{i + 1}</span>
              <span className="word-option-text">{word}</span>
              <span className="word-option-arrow">→</span>
            </button>
          ))}
        </div>

        <p className="wc-hint">⏳ A word will be chosen for you if you don't pick one in time!</p>
      </div>
    </div>
  );
};
