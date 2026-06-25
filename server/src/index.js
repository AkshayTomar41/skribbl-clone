const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const MessageHandler = require('./classes/MessageHandler');
const roomsRoute = require('./routes/rooms');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
});

// In-memory room store: Map<roomId, Room>
const rooms = new Map();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// REST API
app.use('/api/rooms', roomsRoute(rooms));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    uptime: process.uptime(),
  });
});

// Serve static React build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Socket.IO handlers
const messageHandler = new MessageHandler(io, rooms);

io.on('connection', (socket) => {
  messageHandler.handleConnection(socket);
});

// Periodic cleanup of stale rooms
setInterval(() => {
  const now = Date.now();
  rooms.forEach((room, id) => {
    // Remove rooms older than 2 hours with no players
    if (room.isEmpty() || now - room.createdAt > 2 * 60 * 60 * 1000) {
      if (room.game) room.game.cleanup();
      rooms.delete(id);
      console.log(`[Cleanup] Removed stale room: ${id}`);
    }
  });
}, 5 * 60 * 1000); // Every 5 minutes

server.listen(PORT, () => {
  console.log(`\n🚀 Skribbl Clone Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = { app, server, io };
