/**
 * Player class – represents a single connected player
 */
class Player {
  constructor(id, name, socketId) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.score = 0;
    this.isDrawing = false;
    this.hasGuessed = false;
    this.isHost = false;
    this.isConnected = true;
    this.avatar = Math.floor(Math.random() * 16) + 1; // 1-16 avatar index
    this.roundScore = 0; // score earned this round
  }

  addScore(points) {
    this.score += points;
    this.roundScore += points;
    return this.score;
  }

  resetRound() {
    this.hasGuessed = false;
    this.isDrawing = false;
    this.roundScore = 0;
  }

  reset() {
    this.score = 0;
    this.isDrawing = false;
    this.hasGuessed = false;
    this.roundScore = 0;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      isDrawing: this.isDrawing,
      hasGuessed: this.hasGuessed,
      isHost: this.isHost,
      avatar: this.avatar,
      isConnected: this.isConnected,
    };
  }
}

module.exports = Player;
