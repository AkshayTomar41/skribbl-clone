import React from 'react';
import { useGameStore } from '../store/gameStore';
import './HintBar.css';

export const HintBar: React.FC = () => {
  const { hint, word, isDrawer, gameState } = useGameStore();

  if (!gameState || gameState.phase === 'waiting' || gameState.phase === 'choosing') {
    return (
      <div className="hint-bar hint-bar--waiting">
        <span className="hint-label">🎲 Waiting for drawer to pick a word...</span>
      </div>
    );
  }

  const display = isDrawer ? word : hint;
  if (!display) return null;

  // Build the visual display
  const chars = display.split('');

  return (
    <div className="hint-bar">
      <div className="hint-chars">
        {chars.map((char, i) => (
          char === ' ' ? (
            <span key={i} className="hint-space" />
          ) : char === '_' ? (
            <span key={i} className="hint-blank" />
          ) : (
            <span key={i} className={`hint-letter ${isDrawer ? 'hint-letter--drawer' : ''}`}>
              {char}
            </span>
          )
        ))}
      </div>
      {isDrawer && (
        <span className="hint-you-know badge badge-purple">You know the word!</span>
      )}
      {!isDrawer && hint && (
        <span className="hint-word-length">
          {hint.replace(/ /g, '').length} letters
        </span>
      )}
    </div>
  );
};
