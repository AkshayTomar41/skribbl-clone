# 🎨 Skribbl.io Clone

A fully-featured, real-time multiplayer drawing and guessing game — a clone of [skribbl.io](https://skribbl.io).

## 🚀 Live Demo

> **[https://your-skribbl-clone.onrender.com](https://your-skribbl-clone.onrender.com)**
> _(Deploy to Render and update this link)_

---

## ✨ Features

- **Multiplayer rooms** — Create public or private rooms; join via 6-character code
- **Real-time drawing** — Canvas strokes sync instantly via Socket.IO
- **Turn-based gameplay** — Round-robin drawer order across configurable rounds  
- **Word selection** — Drawer picks from N random words  
- **Hint system** — Letters revealed progressively over time  
- **Scoring** — Time-based points; more points for early correct guesses  
- **Leaderboard** — Live rankings in-game + final game-over screen  
- **Full drawing toolbox** — Colors, brush sizes, eraser, undo, clear canvas  
- **Chat & guessing** — Unified chat panel with guess detection  
- **Host controls** — Kick players, start game  
- **Room settings** — Max players, rounds, draw time, word count, hints, category

---

## 🏗️ Architecture

```
skribbl-clone/
├── client/          # React 18 + Vite + TypeScript
│   └── src/
│       ├── pages/         # Home, Lobby, Game
│       ├── components/    # Canvas, Chat, Scoreboard, Timer, HintBar…
│       ├── hooks/         # useSocket, useCanvas
│       ├── store/         # Zustand game store
│       └── types/         # Shared TypeScript types
│
└── server/          # Node.js + Express + Socket.IO
    └── src/
        ├── classes/       # Room, Player, Game, WordManager, MessageHandler
        ├── routes/        # REST API (rooms list)
        └── index.js       # Server entry point
```

### Key Architectural Decisions

| Concern | Solution |
|---------|----------|
| Real-time drawing | Mouse/touch events → Socket.IO `draw_start/move/end` → broadcast to viewers |
| Game state | OOP classes: `Room` owns `Game`, `Game` manages turns/timer/hints |
| Frontend state | Zustand store with actions mapped from Socket.IO events |
| Scoring | `max(50, 500 - elapsed_seconds * 3)` — rewards fast guessers |
| Word hints | Timer-based reveal of random character indices |
| Undo | ImageData snapshot stack (client) + stroke array replay (server) |

---

## 🔌 WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `create_room` | C→S | Create new room |
| `join_room` | C→S | Join by room code |
| `start_game` | C→S | Host starts game |
| `round_start` | S→C | New round; drawer gets word choices |
| `word_chosen` | C→S | Drawer selected word |
| `draw_start/move/end` | C→S | Drawing strokes |
| `draw_data` | S→C | Broadcast strokes to viewers |
| `canvas_clear/draw_undo` | both | Clear or undo |
| `guess` | C→S | Player sends guess |
| `guess_result` | S→C | Correct/incorrect + points |
| `hint_update` | S→C | New letter revealed |
| `round_end/game_over` | S→C | Round/game finished |

---

## 🛠️ Local Setup

### Prerequisites
- Node.js 18+
- npm

### 1. Clone & Install

```bash
# In the server directory
cd server
npm install

# In the client directory  
cd client
npm install
```

### 2. Start the Server

```bash
cd server
npm run dev
# Server runs on http://localhost:3001
```

### 3. Start the Client

```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

### 4. Open two browser tabs

1. Go to `http://localhost:5173`
2. Create a room in tab 1 — copy the 6-character room code
3. Open a second tab, enter the room code, join
4. Host starts the game — enjoy!

---

## 🚢 Deployment (Render)

1. Push to a GitHub repository
2. Create a new **Web Service** on [Render](https://render.com)
3. Set:
   - **Build command**: `cd client && npm install && npm run build && cd ../server && npm install`
   - **Start command**: `node server/src/index.js`
   - **Environment**: `NODE_ENV=production`
4. The Express server will serve the React build statically
5. WebSocket connections work natively on Render

---

## 🎮 How to Play

1. **Create** a room with your desired settings, or **join** a friend's room
2. Wait in the lobby — host clicks **Start Game**
3. Each round, one player is the **Drawer** — they pick a word
4. The drawer **draws** the word; others **type guesses** in chat
5. Correct guesses earn points (faster = more points)
6. Hints are revealed over time if no one guesses
7. After all rounds, the **leaderboard** shows the winner!

---

## 🧑‍💻 OOP Design

| Class | Responsibility |
|-------|---------------|
| `Player` | Score, state, avatar, connected status |
| `Room` | Player management, broadcast helpers, host transfer |
| `Game` | Round lifecycle, timer, hint scheduling, scoring |
| `WordManager` | 400+ categorized words, hint generation |
| `MessageHandler` | All Socket.IO event routing → Room/Game delegation |
