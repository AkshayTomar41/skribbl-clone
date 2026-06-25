const WordManager = require('./WordManager');

const wordManager = new WordManager();

class Game {
  constructor(room) {
    this.room = room;
    this.settings = room.settings;
    this.round = 0;
    this.currentDrawerIndex = 0;
    this.currentDrawer = null;
    this.word = null;
    this.wordOptions = [];
    this.revealedIndices = [];
    this.hintCount = 0;
    this.timer = null;
    this.hintTimer = null;
    this.timeLeft = this.settings.drawTime;
    this.phase = 'waiting';
    this.playerOrder = [];
    this.strokes = [];
    this.scores = {};
    this.correctGuessers = 0;
    this.wordChosenAt = null;
    this.startTime = null;
  }

  start() {
    this.playerOrder = this.room.getConnectedPlayers().map(p => p.id);
    this.room.getConnectedPlayers().forEach(p => p.reset());
    this.round = 1;
    this.currentDrawerIndex = 0;
    this.startNextTurn();
  }

  startNextTurn() {
    this.strokes = [];
    this.correctGuessers = 0;

    this.room.broadcast('canvas_clear', {});

    this.room.getConnectedPlayers().forEach(p => p.resetRound());

    const drawerId = this.playerOrder[this.currentDrawerIndex % this.playerOrder.length];
    const drawer = this.room.getPlayerById(drawerId);

    if (!drawer || !drawer.isConnected) {
      this.advanceTurn();
      return;
    }

    this.currentDrawer = drawer;
    drawer.isDrawing = true;

    this.wordOptions = wordManager.getRandomWords(this.settings.wordCount);
    this.phase = 'choosing';
    this.revealedIndices = [];
    this.hintCount = 0;
    this.word = null;

    this.room.broadcastToSocket(drawer.socketId, 'round_start', {
      round: this.round,
      totalRounds: this.settings.rounds,
      drawerId: drawer.id,
      drawerName: drawer.name,
      wordOptions: this.wordOptions,
      drawTime: this.settings.drawTime,
    });

    this.room.broadcastExcept(drawer.socketId, 'round_start', {
      round: this.round,
      totalRounds: this.settings.rounds,
      drawerId: drawer.id,
      drawerName: drawer.name,
      wordOptions: null,
      drawTime: this.settings.drawTime,
    });

    this.wordChoiceTimeout = setTimeout(() => {
      if (this.phase === 'choosing') {
        const autoWord = this.wordOptions[Math.floor(Math.random() * this.wordOptions.length)];
        this.wordChosen(autoWord);
      }
    }, 15000);
  }

  advanceTurn() {
    this.currentDrawerIndex++;
    if (this.currentDrawerIndex >= this.playerOrder.length) {
      this.currentDrawerIndex = 0;
      this.round++;
    }
    
    const totalTurns = this.settings.rounds * this.room.getConnectedPlayers().length;
    const turnsPlayed = (this.round - 1) * this.room.getConnectedPlayers().length + this.currentDrawerIndex;
    
    if (turnsPlayed >= totalTurns) {
      this.endGame();
    } else {
      this.startNextTurn();
    }
  }

  wordChosen(word) {
    clearTimeout(this.wordChoiceTimeout);
    this.word = word.toLowerCase().trim();
    this.phase = 'drawing';
    this.timeLeft = this.settings.drawTime;
    this.wordChosenAt = Date.now();

    const hint = wordManager.generateHint(this.word, []);

    this.room.broadcastToSocket(this.currentDrawer.socketId, 'word_chosen', {
      word: this.word,
      hint: this.word,
      isDrawer: true,
    });

    this.room.broadcastExcept(this.currentDrawer.socketId, 'word_chosen', {
      word: null,
      hint,
      wordLength: this.word.replace(/ /g, '').length,
      isDrawer: false,
    });

    this.startTimer();
    this.scheduleHints();
  }

  startTimer() {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.room.broadcast('timer_update', { timeLeft: this.timeLeft });
      if (this.timeLeft <= 0) {
        this.endRound('timeout');
      }
    }, 1000);
  }

  scheduleHints() {
    clearInterval(this.hintTimer);
    if (this.settings.hints <= 0) return;

    const interval = Math.floor(this.settings.drawTime / (this.settings.hints + 1)) * 1000;

    this.hintTimer = setInterval(() => {
      if (this.hintCount >= this.settings.hints) {
        clearInterval(this.hintTimer);
        return;
      }

      const nextIndex = wordManager.getNextRevealIndex(this.word, this.revealedIndices);
      if (nextIndex === null) {
        clearInterval(this.hintTimer);
        return;
      }

      this.revealedIndices.push(nextIndex);
      this.hintCount++;
      const hint = wordManager.generateHint(this.word, this.revealedIndices);

      this.room.broadcastExcept(this.currentDrawer.socketId, 'hint_update', {
        hint,
        hintCount: this.hintCount,
      });
    }, interval);
  }

  checkGuess(playerId, text) {
    const player = this.room.getPlayerById(playerId);
    if (!player || player.isDrawing || player.hasGuessed) return false;
    if (!this.word || this.phase !== 'drawing') return false;

    const guess = text.toLowerCase().trim();
    const isCorrect = guess === this.word;

    if (isCorrect) {
      player.hasGuessed = true;
      this.correctGuessers++;

      const elapsed = Math.floor((Date.now() - this.wordChosenAt) / 1000);
      const maxScore = 500;
      const points = Math.max(50, maxScore - elapsed * 3);
      player.addScore(points);

      const drawerPoints = Math.floor(points * 0.5);
      if (this.currentDrawer) {
        this.currentDrawer.addScore(drawerPoints);
      }

      this.room.broadcast('guess_result', {
        correct: true,
        playerId,
        playerName: player.name,
        points,
        scores: this.room.getScores(),
      });

      const nonDrawers = this.room.getConnectedPlayers().filter(p => !p.isDrawing);
      if (nonDrawers.every(p => p.hasGuessed)) {
        this.endRound('all_guessed');
      }
    }

    return isCorrect;
  }

  endRound(reason) {
    clearInterval(this.timer);
    clearInterval(this.hintTimer);
    clearTimeout(this.wordChoiceTimeout);

    this.phase = 'roundEnd';

    this.room.broadcast('round_end', {
      word: this.word,
      reason,
      scores: this.room.getScores(),
      round: this.round,
      totalRounds: this.settings.rounds,
    });

    const totalTurns = this.settings.rounds * this.room.getConnectedPlayers().length;
    const turnsPlayed = (this.round - 1) * this.room.getConnectedPlayers().length + this.currentDrawerIndex + 1;

    const isLastTurn = turnsPlayed >= totalTurns;

    if (isLastTurn) {
      setTimeout(() => this.endGame(), 4000);
    } else {
      setTimeout(() => {
        this.currentDrawerIndex++;
        if (this.currentDrawerIndex >= this.playerOrder.length) {
          this.currentDrawerIndex = 0;
          this.round++;
        }
        this.startNextTurn();
      }, 4000);
    }
  }

  endGame() {
    clearInterval(this.timer);
    clearInterval(this.hintTimer);
    this.phase = 'gameOver';

    const scores = this.room.getScores();
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    const winner = sorted[0];

    this.room.broadcast('game_over', {
      winner,
      leaderboard: sorted,
    });
  }

  addStroke(strokeData) {
    this.strokes.push(strokeData);
  }

  clearStrokes() {
    this.strokes = [];
  }

  undoLastStroke() {
    if (this.strokes.length > 0) {
      this.strokes.pop();
    }
    return this.strokes;
  }

  getPhase() {
    return this.phase;
  }

  getState() {
    return {
      round: this.round,
      totalRounds: this.settings.rounds,
      drawerId: this.currentDrawer ? this.currentDrawer.id : null,
      drawerName: this.currentDrawer ? this.currentDrawer.name : null,
      phase: this.phase,
      timeLeft: this.timeLeft,
      hint: this.word ? wordManager.generateHint(this.word, this.revealedIndices) : null,
      wordLength: this.word ? this.word.replace(/ /g, '').length : 0,
    };
  }

  cleanup() {
    clearInterval(this.timer);
    clearInterval(this.hintTimer);
    clearTimeout(this.wordChoiceTimeout);
  }
}

module.exports = Game;
