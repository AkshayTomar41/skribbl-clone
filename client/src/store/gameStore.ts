import { create } from 'zustand';
import type { Player, RoomSettings, GameState, ChatMessage } from '../types';

interface GameStore {
  // Room & player info
  roomId: string | null;
  myPlayer: Player | null;
  players: Player[];
  settings: RoomSettings | null;
  roomState: 'lobby' | 'playing' | 'ended';

  // Game state
  gameState: GameState | null;
  word: string | null;       // only set for drawer
  hint: string | null;       // the ___ display
  wordOptions: string[];     // drawer's word choices
  isDrawer: boolean;
  hasGuessed: boolean;

  // Chat
  messages: ChatMessage[];

  // UI
  phase: 'home' | 'lobby' | 'game';

  // Actions
  setRoom: (roomId: string, player: Player, settings: RoomSettings, players: Player[]) => void;
  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  setGameState: (gameState: GameState) => void;
  setRoundStart: (drawerId: string, wordOptions: string[] | null, round: number, totalRounds: number, drawTime: number, drawerName: string) => void;
  setWordChosen: (word: string | null, hint: string, isDrawer: boolean) => void;
  updateHint: (hint: string) => void;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateScores: (players: Player[]) => void;
  setPhase: (phase: 'home' | 'lobby' | 'game') => void;
  setRoomState: (state: 'lobby' | 'playing' | 'ended') => void;
  resetGame: () => void;
  reset: () => void;
}

const defaultSettings: RoomSettings = {
  maxPlayers: 8,
  rounds: 3,
  drawTime: 80,
  wordCount: 3,
  hints: 2,
  isPrivate: false,
  customWords: [],
  category: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  roomId: null,
  myPlayer: null,
  players: [],
  settings: null,
  roomState: 'lobby',
  gameState: null,
  word: null,
  hint: null,
  wordOptions: [],
  isDrawer: false,
  hasGuessed: false,
  messages: [],
  phase: 'home',

  setRoom: (roomId, player, settings, players) => set({
    roomId,
    myPlayer: player,
    settings,
    players,
    phase: 'lobby',
    roomState: 'lobby',
  }),

  setPlayers: (players) => set({ players }),

  addPlayer: (player) => set(state => ({
    players: [...state.players.filter(p => p.id !== player.id), player],
  })),

  removePlayer: (playerId) => set(state => ({
    players: state.players.filter(p => p.id !== playerId),
  })),

  setGameState: (gameState) => set({ gameState }),

  setRoundStart: (drawerId, wordOptions, round, totalRounds, drawTime, drawerName) => {
    const myId = get().myPlayer?.id;
    const isDrawer = drawerId === myId;
    set({
      gameState: {
        round,
        totalRounds,
        drawerId,
        drawerName,
        phase: 'choosing',
        timeLeft: drawTime,
        hint: null,
        wordLength: 0,
      },
      wordOptions: isDrawer ? (wordOptions || []) : [],
      isDrawer,
      word: null,
      hint: null,
      hasGuessed: false,
      phase: 'game',
    });
  },

  setWordChosen: (word, hint, isDrawer) => set(state => ({
    word,
    hint,
    isDrawer,
    wordOptions: [],
    gameState: state.gameState ? { ...state.gameState, phase: 'drawing', hint } : null,
  })),

  updateHint: (hint) => set(state => ({
    hint,
    gameState: state.gameState ? { ...state.gameState, hint } : null,
  })),

  addMessage: (msg) => set(state => ({
    messages: [...state.messages, {
      ...msg,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    }],
  })),

  updateScores: (players) => set({ players }),

  setPhase: (phase) => set({ phase }),

  setRoomState: (roomState) => set({ roomState }),

  resetGame: () => set({
    gameState: null,
    word: null,
    hint: null,
    wordOptions: [],
    isDrawer: false,
    hasGuessed: false,
  }),

  reset: () => set({
    roomId: null,
    myPlayer: null,
    players: [],
    settings: null,
    roomState: 'lobby',
    gameState: null,
    word: null,
    hint: null,
    wordOptions: [],
    isDrawer: false,
    hasGuessed: false,
    messages: [],
    phase: 'home',
  }),
}));
