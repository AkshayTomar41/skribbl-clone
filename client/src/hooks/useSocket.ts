import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import type { Player, RoomSettings } from '../types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
  }
  return socket;
};

export const useSocket = () => {
  const store = useGameStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  const connect = useCallback(() => {
    const s = getSocket();
    if (!s.connected) s.connect();
    return s;
  }, []);

  const disconnect = useCallback(() => {
    if (socket?.connected) socket.disconnect();
  }, []);

  useEffect(() => {
    const s = getSocket();

    // ── Room events ──────────────────────────────────────────────
    s.on('room_created', ({ roomId, player, settings, players }: {
      roomId: string; player: Player; settings: RoomSettings; players: Player[];
    }) => {
      storeRef.current.setRoom(roomId, player, settings, players);
      storeRef.current.addMessage({
        playerId: 'system',
        playerName: 'System',
        text: `Room ${roomId} created! Share the code to invite friends.`,
        type: 'system',
      });
    });

    s.on('room_joined', ({ roomId, player, settings, players }: {
      roomId: string; player: Player; settings: RoomSettings; players: Player[]; state: string;
    }) => {
      storeRef.current.setRoom(roomId, player, settings, players);
    });

    s.on('player_joined', ({ player, players }: { player: Player; players: Player[] }) => {
      storeRef.current.setPlayers(players);
      storeRef.current.addMessage({
        playerId: 'system',
        playerName: 'System',
        text: `${player.name} joined the room!`,
        type: 'system',
      });
    });

    s.on('player_left', ({ playerName, players }: { playerId: string; playerName: string; players: Player[] }) => {
      storeRef.current.setPlayers(players);
      storeRef.current.addMessage({
        playerId: 'system',
        playerName: 'System',
        text: `${playerName} left the room.`,
        type: 'system',
      });
    });

    // ── Game events ──────────────────────────────────────────────
    s.on('game_started', ({ players }: { settings: RoomSettings; players: Player[] }) => {
      storeRef.current.setPlayers(players);
      storeRef.current.setPhase('game');
      storeRef.current.addMessage({
        playerId: 'system',
        playerName: 'System',
        text: 'The game has started! 🎮',
        type: 'system',
      });
    });

    s.on('round_start', ({ round, totalRounds, drawerId, drawerName, wordOptions, drawTime }: {
      round: number; totalRounds: number; drawerId: string;
      drawerName: string; wordOptions: string[] | null; drawTime: number;
    }) => {
      storeRef.current.setRoundStart(drawerId, wordOptions, round, totalRounds, drawTime, drawerName);
      storeRef.current.addMessage({
        playerId: 'system',
        playerName: 'System',
        text: `Round ${round}/${totalRounds} – ${drawerName} is drawing!`,
        type: 'system',
      });
    });

    s.on('word_chosen', ({ word, hint, isDrawer }: {
      word: string | null; hint: string; isDrawer: boolean; wordLength: number;
    }) => {
      storeRef.current.setWordChosen(word || null, hint, isDrawer);
    });

    s.on('hint_update', ({ hint }: { hint: string; hintCount: number }) => {
      storeRef.current.updateHint(hint);
      storeRef.current.addMessage({
        playerId: 'system',
        playerName: 'System',
        text: `💡 Hint: ${hint}`,
        type: 'system',
      });
    });

    s.on('timer_update', ({ timeLeft }: { timeLeft: number }) => {
      const gs = storeRef.current.gameState;
      if (gs) {
        storeRef.current.setGameState({ ...gs, timeLeft });
      }
    });

    s.on('round_end', ({ word, scores, round, totalRounds }: {
      word: string; reason: string; scores: Player[]; round: number; totalRounds: number;
    }) => {
      storeRef.current.updateScores(scores);
      storeRef.current.addMessage({
        playerId: 'system',
        playerName: 'System',
        text: `🔚 Round ${round}/${totalRounds} ended! The word was: "${word}"`,
        type: 'system',
      });
      const gs = storeRef.current.gameState;
      if (gs) storeRef.current.setGameState({ ...gs, phase: 'roundEnd' });
    });

    s.on('game_over', ({ winner, leaderboard }: { winner: Player; leaderboard: Player[] }) => {
      storeRef.current.updateScores(leaderboard);
      storeRef.current.addMessage({
        playerId: 'system',
        playerName: 'System',
        text: `🏆 Game over! ${winner.name} wins with ${winner.score} points!`,
        type: 'system',
      });
      const gs = storeRef.current.gameState;
      if (gs) storeRef.current.setGameState({ ...gs, phase: 'gameOver' });
    });

    // ── Chat & Guessing ──────────────────────────────────────────
    s.on('guess_result', ({ correct, playerName, points, scores }: {
      correct: boolean; playerId: string; playerName: string; points: number; scores: Player[];
    }) => {
      storeRef.current.updateScores(scores);
      if (correct) {
        storeRef.current.addMessage({
          playerId: 'system',
          playerName: 'System',
          text: `✅ ${playerName} guessed the word! (+${points} pts)`,
          type: 'correct',
        });
        // Check if it's us
        const myName = storeRef.current.myPlayer?.name;
        if (myName === playerName) {
          storeRef.current.hasGuessed = true;
        }
      }
    });

    s.on('chat_message', ({ playerId, playerName, text, type, avatar }: {
      playerId: string; playerName: string; text: string; type: string; avatar: number;
    }) => {
      storeRef.current.addMessage({
        playerId,
        playerName,
        text,
        type: type as 'chat' | 'guess',
        avatar,
      });
    });

    s.on('close_guess', ({ text }: { text: string }) => {
      storeRef.current.addMessage({
        playerId: 'system',
        playerName: 'System',
        text,
        type: 'system',
      });
    });

    s.on('game_state', (data: any) => {
      if (data.players) storeRef.current.setPlayers(data.players);
      if (data.game) storeRef.current.setGameState(data.game);
    });

    s.on('kicked', () => {
      storeRef.current.reset();
      alert('You were kicked from the room.');
    });

    s.on('error', ({ message }: { message: string }) => {
      console.error('[Socket error]', message);
    });

    return () => {
      s.off('room_created');
      s.off('room_joined');
      s.off('player_joined');
      s.off('player_left');
      s.off('game_started');
      s.off('round_start');
      s.off('word_chosen');
      s.off('hint_update');
      s.off('timer_update');
      s.off('round_end');
      s.off('game_over');
      s.off('guess_result');
      s.off('chat_message');
      s.off('close_guess');
      s.off('game_state');
      s.off('kicked');
      s.off('error');
    };
  }, []);

  return { socket: getSocket(), connect, disconnect };
};
