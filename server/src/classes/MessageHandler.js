const Room = require('./Room');

class MessageHandler {
  constructor(io, rooms) {
    this.io = io;
    this.rooms = rooms;
  }

  handleConnection(socket) {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on('create_room', (data) => this.onCreateRoom(socket, data));
    socket.on('join_room', (data) => this.onJoinRoom(socket, data));
    socket.on('start_game', (data) => this.onStartGame(socket, data));
    socket.on('word_chosen', (data) => this.onWordChosen(socket, data));
    socket.on('draw_start', (data) => this.onDrawStart(socket, data));
    socket.on('draw_move', (data) => this.onDrawMove(socket, data));
    socket.on('draw_end', (data) => this.onDrawEnd(socket, data));
    socket.on('canvas_clear', () => this.onCanvasClear(socket));
    socket.on('draw_undo', () => this.onDrawUndo(socket));
    socket.on('guess', (data) => this.onGuess(socket, data));
    socket.on('chat', (data) => this.onChat(socket, data));
    socket.on('disconnect', () => this.onDisconnect(socket));
    socket.on('get_room_state', (data) => this.onGetRoomState(socket, data));
    socket.on('kick_player', (data) => this.onKickPlayer(socket, data));
  }

  onCreateRoom(socket, data) {
    try {
      const { playerName, settings } = data;
      if (!playerName || !playerName.trim()) {
        socket.emit('error', { message: 'Player name is required' });
        return;
      }

      const room = new Room(this.io, playerName.trim(), socket.id, settings || {});
      this.rooms.set(room.id, room);

      socket.join(room.id);
      socket.data.roomId = room.id;

      const player = room.getPlayerBySocketId(socket.id);

      socket.emit('room_created', {
        roomId: room.id,
        player: player.toJSON(),
        settings: room.settings,
        players: room.getScores(),
      });

      console.log(`[Room] Created: ${room.id} by ${playerName}`);
    } catch (err) {
      console.error('[create_room error]', err);
      socket.emit('error', { message: 'Failed to create room' });
    }
  }

  onJoinRoom(socket, data) {
    try {
      const { roomId, playerName } = data;
      if (!playerName || !playerName.trim()) {
        socket.emit('error', { message: 'Player name is required' });
        return;
      }

      const room = this.rooms.get(roomId?.toUpperCase());
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const result = room.addPlayer(playerName.trim(), socket.id);
      if (result.error) {
        socket.emit('error', { message: result.error });
        return;
      }

      socket.join(room.id);
      socket.data.roomId = room.id;

      const player = result.player;

      socket.emit('room_joined', {
        roomId: room.id,
        player: player.toJSON(),
        settings: room.settings,
        players: room.getScores(),
        state: room.state,
      });

      room.broadcastExcept(socket.id, 'player_joined', {
        player: player.toJSON(),
        players: room.getScores(),
      });

      console.log(`[Room] ${playerName} joined room ${room.id}`);
    } catch (err) {
      console.error('[join_room error]', err);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  onStartGame(socket, data) {
    const room = this.getRoomBySocket(socket);
    if (!room) return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player || !player.isHost) {
      socket.emit('error', { message: 'Only the host can start the game' });
      return;
    }

    const result = room.startGame();
    if (result.error) {
      socket.emit('error', { message: result.error });
      return;
    }

    room.broadcast('game_started', {
      settings: room.settings,
      players: room.getScores(),
    });
  }

  onWordChosen(socket, data) {
    const room = this.getRoomBySocket(socket);
    if (!room || !room.game) return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player || !player.isDrawing) return;

    const { word } = data;
    if (!word) return;

    room.game.wordChosen(word);
  }

  onDrawStart(socket, data) {
    const room = this.getRoomBySocket(socket);
    if (!room || !room.game) return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player || !player.isDrawing) return;

    const stroke = { type: 'start', ...data };
    room.game.addStroke(stroke);
    room.broadcastExcept(socket.id, 'draw_data', { type: 'start', ...data });
  }

  onDrawMove(socket, data) {
    const room = this.getRoomBySocket(socket);
    if (!room || !room.game) return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player || !player.isDrawing) return;

    const stroke = { type: 'move', ...data };
    room.game.addStroke(stroke);
    room.broadcastExcept(socket.id, 'draw_data', { type: 'move', ...data });
  }

  onDrawEnd(socket, data) {
    const room = this.getRoomBySocket(socket);
    if (!room || !room.game) return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player || !player.isDrawing) return;

    const stroke = { type: 'end' };
    room.game.addStroke(stroke);
    room.broadcastExcept(socket.id, 'draw_data', { type: 'end' });
  }

  onCanvasClear(socket) {
    const room = this.getRoomBySocket(socket);
    if (!room || !room.game) return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player || !player.isDrawing) return;

    room.game.clearStrokes();
    room.broadcastExcept(socket.id, 'canvas_clear', {});
  }

  onDrawUndo(socket) {
    const room = this.getRoomBySocket(socket);
    if (!room || !room.game) return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player || !player.isDrawing) return;

    const remainingStrokes = room.game.undoLastStroke();
    room.broadcastExcept(socket.id, 'draw_undo', { strokes: remainingStrokes });
  }

  onGuess(socket, data) {
    const room = this.getRoomBySocket(socket);
    if (!room || !room.game) return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player) return;

    const { text } = data;
    if (!text || !text.trim()) return;

    if (player.isDrawing) return;

    const isCorrect = room.game.checkGuess(player.id, text.trim());

    if (!isCorrect) {
      const word = room.game.word;
      const guess = text.trim().toLowerCase();
      const isClose = word && this.isCloseGuess(guess, word);

      if (isClose) {
        socket.emit('close_guess', { text: 'So close!' });
      }

      room.broadcast('chat_message', {
        playerId: player.id,
        playerName: player.name,
        text: text.trim(),
        type: 'guess',
        avatar: player.avatar,
      });
    }
  }

  isCloseGuess(guess, word) {
    if (Math.abs(guess.length - word.length) > 2) return false;
    let diff = 0;
    const len = Math.max(guess.length, word.length);
    for (let i = 0; i < len; i++) {
      if (guess[i] !== word[i]) diff++;
    }
    return diff === 1;
  }

  onChat(socket, data) {
    const room = this.getRoomBySocket(socket);
    if (!room) return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player) return;

    const { text } = data;
    if (!text || !text.trim()) return;

    room.broadcast('chat_message', {
      playerId: player.id,
      playerName: player.name,
      text: text.trim(),
      type: 'chat',
      avatar: player.avatar,
    });
  }

  onGetRoomState(socket, data) {
    const { roomId } = data || {};
    const room = roomId ? this.rooms.get(roomId) : this.getRoomBySocket(socket);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    const gameState = room.game ? room.game.getState() : null;

    socket.emit('game_state', {
      roomId: room.id,
      state: room.state,
      settings: room.settings,
      players: room.getScores(),
      game: gameState,
    });
  }

  onKickPlayer(socket, data) {
    const room = this.getRoomBySocket(socket);
    if (!room) return;

    const kicker = room.getPlayerBySocketId(socket.id);
    if (!kicker || !kicker.isHost) return;

    const { playerId } = data;
    const target = room.getPlayerById(playerId);
    if (!target || target.isHost) return;

    const targetSocket = this.io.sockets.sockets.get(target.socketId);
    if (targetSocket) {
      targetSocket.emit('kicked', { message: 'You were kicked by the host' });
      targetSocket.leave(room.id);
    }

    room.removePlayer(target.socketId);
    room.broadcast('player_left', {
      playerId: target.id,
      playerName: target.name,
      players: room.getScores(),
    });
  }

  onDisconnect(socket) {
    const room = this.getRoomBySocket(socket);
    if (!room) return;

    const player = room.removePlayer(socket.id);
    if (!player) return;

    room.broadcast('player_left', {
      playerId: player.id,
      playerName: player.name,
      players: room.getScores(),
    });

    if (room.isEmpty()) {
      if (room.game) room.game.cleanup();
      this.rooms.delete(room.id);
      console.log(`[Room] Deleted empty room: ${room.id}`);
    }

    console.log(`[Socket] Disconnected: ${socket.id} (${player.name})`);
  }

  getRoomBySocket(socket) {
    const roomId = socket.data.roomId;
    if (!roomId) return null;
    return this.rooms.get(roomId) || null;
  }
}

module.exports = MessageHandler;
