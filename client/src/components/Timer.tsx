import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import './Timer.css';

export const Timer: React.FC = () => {
  const { gameState, settings } = useGameStore();
  const timeLeft = gameState?.timeLeft ?? 0;
  const total = settings?.drawTime ?? 80;
  const phase = gameState?.phase;
  const prevTimeRef = useRef(timeLeft);

  const isActive = phase === 'drawing';
  const pct = total > 0 ? (timeLeft / total) * 100 : 0;
  const isLow = timeLeft <= 10 && isActive;
  const isCritical = timeLeft <= 5 && isActive;

  useEffect(() => {
    prevTimeRef.current = timeLeft;
  }, [timeLeft]);

  if (!isActive && phase !== 'choosing') return null;

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const strokeColor = isCritical ? '#ff4757' : isLow ? '#ff6b35' : timeLeft <= total * 0.5 ? '#ffd60a' : '#00d4ff';

  return (
    <div className={`timer-wrapper ${isLow ? 'timer-low' : ''} ${isCritical ? 'timer-critical' : ''}`}>
      <svg className="timer-ring" width="68" height="68" viewBox="0 0 68 68">
        {/* Background circle */}
        <circle cx="34" cy="34" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
        {/* Progress circle */}
        <circle
          cx="34" cy="34" r={radius} fill="none"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 34 34)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
        />
      </svg>
      <div className="timer-text" style={{ color: strokeColor }}>
        {phase === 'choosing' ? '⏳' : timeLeft}
      </div>
    </div>
  );
};
