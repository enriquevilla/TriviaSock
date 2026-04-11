# Research: Competitive Trivia Game

**Date**: 2026-04-11
**Feature**: specs/001-trivia-game/spec.md

---

## 1. Trivia Content Source

**Decision**: Open Trivia Database (opentdb.com) public API

**Rationale**: Free, no registration required, well-documented, stable, returns structured JSON
with multiple-choice questions across many categories. Matches the spec assumption exactly.

**Alternatives considered**:
- Hardcoded questions: Rejected — limited content, maintenance burden.
- Paid APIs (Trivia API, Quiz API): Rejected — unnecessary cost and complexity.

**Key API details**:
- Categories endpoint: `GET https://opentdb.com/api_category.php`
  Returns `{ trivia_categories: [{ id: number, name: string }] }`
- Questions endpoint: `GET https://opentdb.com/api.php?amount=5&category={id}&type=multiple`
  Returns `{ response_code: 0, results: [...] }` (response_code 0 = success)
- Each question: `{ category, type, difficulty, question, correct_answer, incorrect_answers[] }`
- All text fields are HTML-encoded (e.g., `&amp;`, `&#039;`) — MUST be decoded before display.
- No API key required. Rate limit: generous for small-scale use (<5 req/min per IP is safe).
- Session tokens available to avoid repeat questions — not required for our use case.
- `response_code: 1` = insufficient questions for query; handle gracefully.

---

## 2. WebSocket Server: `ws` Library (Node.js)

**Decision**: `ws` npm package (v8.x) with Node.js 20+ native HTTP server

**Rationale**: The `ws` package is the minimal, battle-tested WebSocket library for Node.js.
It requires zero config beyond attaching to an HTTP server. Node.js 20+ includes native `fetch`,
eliminating any HTTP client dependency for trivia API calls.

**Alternatives considered**:
- Socket.io: Rejected — adds significant abstraction (rooms, events, fallback transports) beyond
  what we need. Violates Simplicity First.
- `uWebSockets.js`: Rejected — C++ binding, harder to install, more complexity than needed.
- Node.js native `WebSocketServer` (experimental): Rejected — not stable in Node 20.

**Key patterns**:
- All clients tracked in a `Set` or `Map` (keyed by a generated ID).
- All message processing is synchronous within Node.js single-threaded event loop — no race
  conditions on state reads/writes within a single event handler.
- `ws.send(JSON.stringify(msg))` — always stringify before sending.
- `ws.readyState === WebSocket.OPEN` — always check before sending to avoid errors.
- Heartbeat ping/pong to detect dead connections (every 30s).

---

## 3. Frontend: Vite + Vanilla JS

**Decision**: Vite 5.x with vanilla JS template, single `index.html`, CSS, JS modules

**Rationale**: Vite provides fast HMR in dev and optimized ESM bundles for production with
essentially zero config for vanilla JS. No framework overhead, consistent with Simplicity First.

**Alternatives considered**:
- Create React App / Vite + React: Rejected — unnecessary component model overhead.
- No build tool (raw HTML/JS): Rejected — no module bundling, harder to split code cleanly.
- Parcel: Rejected — Vite is more widely used and better documented for this pattern.

**Key patterns**:
- Single `index.html` with a `<div id="app">` root.
- JS screens implemented as functions that manipulate the DOM directly (no virtual DOM).
- CSS classes toggled to show/hide screens rather than creating/destroying DOM nodes.
- `vite.config.js` configured minimally (just set server proxy for WS if needed in dev).

---

## 4. Project Layout Decision

**Decision**: Single root `package.json`, `server/` for Node.js code, `src/` for frontend

**Rationale**: Keeps everything in one place, one `npm install`, one `package.json`.
Clear separation via directories without monorepo complexity.

**Server port**: 3001 (WebSocket + static file serving in production)
**Vite dev port**: 5173 (default)

In development: two processes (Vite dev server + Node.js WS server).
In production: `vite build` outputs to `dist/`; Node.js serves `dist/` as static files and
handles WebSocket upgrades on the same port.

---

## 5. State Synchronization Strategy

**Decision**: Server-authoritative push model; clients are pure display

**Key decisions**:
- Server maintains a single global state object (no rooms).
- On every state change, server broadcasts the full relevant state slice to all affected clients.
- Clients never mutate game state — they only send user intent messages.
- Node.js single-threaded event loop ensures sequential processing of all WebSocket messages
  without explicit locking.
- Timers (question timer, voting timer) run on server via `setTimeout`/`setInterval`.
  Server broadcasts countdowns every second for display purposes.
- On new connection, server immediately sends full current state to the new client.

---

## 6. Message Validation Strategy

**Decision**: Inline schema validation using a minimal hand-rolled validator

**Rationale**: A full validation library (Zod, Joi, Yup) would add unnecessary dependency weight.
A simple `validate(msg, schema)` function checking type and required fields covers our needs.

**Pattern**:
```js
function validate(msg, schema) {
  if (!msg || typeof msg !== 'object') return false;
  for (const [key, type] of Object.entries(schema)) {
    if (typeof msg[key] !== type) return false;
  }
  return true;
}
```

All incoming messages are parsed with `JSON.parse` wrapped in try/catch. Invalid JSON or
schema mismatches result in a typed `error` response to the sender; no crash, no broadcast.
