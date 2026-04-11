# TriviaSock Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-11

## Active Technologies

- JavaScript — Node.js 20+ (server), vanilla ES modules (client) + `ws` ^8.x (WebSocket server); `vite` ^5.x (frontend build, devDep) (master)

## Project Structure

```text
server/          # Node.js WebSocket server (game.js, trivia.js, handlers.js, broadcast.js, validate.js)
src/             # Vite vanilla JS frontend (screens/, ws.js, state.js, main.js)
src/screens/     # One JS module per game screen (lobby, waiting, voting, question, results, podium)
index.html       # SPA shell
style.css        # All styles (no CSS framework)
vite.config.js   # Vite configuration
```

## Commands

- Dev server: `node server/index.js` (port 3001)
- Dev frontend: `npx vite` (port 5173)
- Build: `npx vite build`

## Code Style

- Vanilla ES modules throughout (no transpilation quirks; `"type": "module"` in package.json)
- No UI framework — direct DOM manipulation only
- Server state: single `GameState` object, mutated in-place, always broadcast after change
- All WebSocket messages: `{ type: string, payload: object }` envelope

## Recent Changes

- master: Added JavaScript — Node.js 20+ (server), vanilla ES modules (client) + `ws` ^8.x (WebSocket server); `vite` ^5.x (frontend build, devDep)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
