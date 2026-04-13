# TriviaSock

A real-time, browser-based competitive trivia game powered by WebSockets. Players join a shared lobby, vote on trivia categories, and race to answer questions first. The first correct answer earns a point — everyone else is too late.

Questions are sourced live from the [Open Trivia Database](https://opentdb.com/).

## How it works

1. Open the site and enter a display name to join the lobby
2. Once all connected players (minimum 2) click Ready, the game starts
3. Players vote on a trivia category — most votes wins, ties broken randomly
4. Five questions from that category are presented one at a time; first correct answer earns a point
5. Repeat until all categories are played, then a top-3 podium is shown
6. Players can vote to end the game early at any time

Late joiners are placed in a waiting room and automatically enter the next game.

## Prerequisites

- Node.js 20+
- npm 9+

## Getting started

```bash
npm install
```

### Development

Run the WebSocket server and Vite dev server in separate terminals:

```bash
npm run dev:server   # WebSocket server on http://localhost:3001
npm run dev:client   # Vite frontend on http://localhost:5173
```

Open `http://localhost:5173` in two or more browser tabs to play.

### Production

```bash
npm run build   # builds frontend to dist/
npm start       # serves dist/ and WebSocket on http://localhost:3001
```

## Running tests

```bash
npm test
```

Playwright E2E tests spin up both servers automatically. Tests use deterministic fixture data (no live API calls) for predictable results.
