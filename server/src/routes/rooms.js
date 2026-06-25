const express = require('express');
const router = express.Router();

module.exports = (rooms) => {
  // GET /api/rooms – list all public rooms
  router.get('/', (req, res) => {
    const publicRooms = [...rooms.values()]
      .filter(r => !r.settings.isPrivate && r.state === 'lobby')
      .map(r => r.toJSON());
    res.json({ rooms: publicRooms });
  });

  // GET /api/rooms/:id – get specific room info
  router.get('/:id', (req, res) => {
    const room = rooms.get(req.params.id.toUpperCase());
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ room: room.toJSON() });
  });

  return router;
};
