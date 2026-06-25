const { v4: uuidv4 } = require('uuid');
const Player = require('./Player');
const Game = require('./Game');

/**
 * Room class – manages a single game room (lobby + game)
 */
class Room {
  constructor(io, hostName, hostSocketId, settings = {}) {
    this.io = io;
    this.id = this.generateRoomCode();
    this.hostSocketId = hostSocketId;
    this.settings = {
      maxPlayers: settings.maxPlayers || 8,
      rounds: settings.rounds || 3,
      drawTime: settings.drawTime || 80,
      wordCount: settings.wordCount || 3,
      hints: settings.hints || 2,
      isPrivate: settings.isPrivate || false,
      customWords: settings.customWords || [],
      category: settings.category || null,
    };
    this.players = new Map(); // socketId -> Player
    this.state = 'lobby'; // lobby | playing | ended
    this.game = null;
    this.createdAt = Date.now();

    // Create host player
    const hostId = uuidv4();
    const host = new Player(hostId, hostName, hostSocketId);
    host.isHost = true;
    this.players.set(hostSocketId, host);
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  addPlayer(name, socketId) {
    if (this.players.size >= this.settings.maxPlayers) {
      return { error: 'Room is full' };
    }
    if (this.state !== 'lobby') {
      return { error: 'Game already in progress' };
    }

    const playerId = uuidv4();
    const player = new Player(playerId, name, socketId);
    this.players.set(socketId, player);
    return { player };
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (!player) return null;

    player.isConnected = false;

    // If host left, transfer host to next player
    if (socketId === this.hostSocketId) {
      const nextPlayer = [...this.players.values()].find(
        p => p.socketId !== socketId && p.isConnected
      );
      if (nextPlayer) {
        nextPlayer.isHost = true;
        this.hostSocketId = nextPlayer.socketId;
      }
    }

    // During game, don't remove – mark disconnected
    if (this.state === 'playing') {
      // If current drawer disconnected, end round
      if (this.game && this.game.currentDrawer && 
          this.game.currentDrawer.socketId === socketId) {
        this.game.endRound('drawer_left');
      }
    } else {
      this.players.delete(socketId);
    }

    return player;
  }

  getConnectedPlayers() {
    return [...this.players.values()].filter(p => p.isConnected);
  }

  getPlayerById(id) {
    return [...this.players.values()].find(p => p.id === id);
  }

  getPlayerBySocketId(socketId) {
    return this.players.get(socketId);
  }

  getScores() {
    return this.getConnectedPlayers().map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      avatar: p.avatar,
      isDrawing: p.isDrawing,
      hasGuessed: p.hasGuessed,
    })).sort((a, b) => b.score - a.score);
  }

  broadcast(event, data) {
    this.io.to(this.id).emit(event, data);
  }

  broadcastToSocket(socketId, event, data) {
    this.io.to(socketId).emit(event, data);
  }

  broadcastExcept(excludeSocketId, event, data) {
    [...this.players.values()].forEach(player => {
      if (player.socketId !== excludeSocketId && player.isConnected) {
        this.io.to(player.socketId).emit(event, data);
      }
    });
  }

  startGame() {
    if (this.state !== 'lobby') return { error: 'Game already started' };
    if (this.getConnectedPlayers().length < 2) {
      return { error: 'Need at least 2 players to start' };
    }

    this.state = 'playing';
    this.game = new Game(this);
    this.game.start();
    return { success: true };
  }

  toJSON() {
    return {
      id: this.id,
      playerCount: this.getConnectedPlayers().length,
      maxPlayers: this.settings.maxPlayers,
      state: this.state,
      isPrivate: this.settings.isPrivate,
      rounds: this.settings.rounds,
      drawTime: this.settings.drawTime,
    };
  }

  isEmpty() {
    return this.getConnectedPlayers().length === 0;
  }
}

module.exports = Room;
