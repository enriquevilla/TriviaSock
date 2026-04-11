# Quickstart: Competitive Trivia Game

**Date**: 2026-04-11

## Prerequisites

- Node.js 20 or later
- npm 9 or later
- Internet access (for Open Trivia Database API calls)

---

## Development Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Run the WebSocket server (Terminal 1)

```bash
npm run dev:server
```

Server starts on `http://localhost:3001`. WebSocket endpoint: `ws://localhost:3001`.

### 3. Run the Vite frontend (Terminal 2)

```bash
npm run dev:client
```

Frontend available at `http://localhost:5173`.

### 4. Play the game

Open `http://localhost:5173` in two or more browser tabs (or different browsers).
Each tab represents a separate player.

---

## Production Build

### 1. Build the frontend

```bash
npm run build
```

Output goes to `dist/`.

### 2. Start the server

```bash
npm start
```

The server serves `dist/` as static files AND handles WebSocket connections on port 3001.
Open `http://localhost:3001` in your browser.

---

## Project Structure

```text
triviasock/
├── server/
│   ├── index.js         # Entry point: HTTP + WebSocket server
│   ├── game.js          # Game state machine and state object
│   ├── trivia.js        # Open Trivia DB API client
│   ├── handlers.js      # Incoming WebSocket message dispatch
│   ├── broadcast.js     # Outgoing message helpers
│   └── validate.js      # Inline message schema validator
├── src/
│   ├── main.js          # Frontend entry: WS connection, screen routing
│   ├── ws.js            # WebSocket client wrapper
│   ├── state.js         # Client display state (read-only mirror)
│   └── screens/
│       ├── lobby.js     # Lobby & ready-up screen
│       ├── waiting.js   # Waiting room screen
│       ├── voting.js    # Category voting screen
│       ├── question.js  # Question & answer screen
│       ├── results.js   # Round results screen
│       └── podium.js    # Game over & podium screen
├── index.html           # Single-page app shell
├── style.css            # All styles
├── vite.config.js       # Vite configuration
└── package.json
```

---

## Configuration

All configuration is in `server/index.js` as module-level constants:

| Constant | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | WebSocket + HTTP server port |
| `MIN_PLAYERS` | `2` | Minimum players to start a game |
| `MAX_PLAYERS` | `10` | Maximum active players |
| `QUESTIONS_PER_ROUND` | `5` | Questions fetched per category |
| `QUESTION_TIMER_SECS` | `30` | Seconds per question |
| `VOTE_TIMER_SECS` | `30` | Seconds for category and early-end votes |
| `RESULT_PAUSE_SECS` | `3` | Pause after question result |
| `ROUND_END_PAUSE_SECS` | `5` | Pause after round end before next vote |

---

## Validation

Run through this checklist after setup:

- [ ] Two browser tabs can join with different names and both appear in the lobby
- [ ] Duplicate name entry is rejected with an error message
- [ ] Both players clicking Ready starts the game
- [ ] Category voting shows live tallies and resolves on timer expiry
- [ ] Answering correctly first awards a point; the other tab cannot earn a point for the same
  question
- [ ] All 5 questions complete and return to voting
- [ ] All categories played → podium shown
- [ ] Opening a 3rd tab during a game shows the waiting screen
- [ ] After game ends, the waiting player appears in the new lobby
- [ ] Closing a tab mid-game does not crash the server
