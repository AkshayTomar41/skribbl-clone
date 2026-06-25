export interface Player {
  id: string;
  name: string;
  score: number;
  isDrawing: boolean;
  hasGuessed: boolean;
  isHost: boolean;
  avatar: number;
  isConnected: boolean;
}

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordCount: number;
  hints: number;
  isPrivate: boolean;
  customWords: string[];
  category: string | null;
}

export interface GameState {
  round: number;
  totalRounds: number;
  drawerId: string | null;
  drawerName: string | null;
  phase: 'waiting' | 'choosing' | 'drawing' | 'roundEnd' | 'gameOver';
  timeLeft: number;
  hint: string | null;
  wordLength: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  type: 'chat' | 'guess' | 'system' | 'correct';
  avatar?: number;
  timestamp: number;
}

export interface StrokeData {
  type: 'start' | 'move' | 'end';
  x?: number;
  y?: number;
  color?: string;
  size?: number;
  tool?: 'pen' | 'eraser';
}

export type GamePhase = 'home' | 'lobby' | 'game';
