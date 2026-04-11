# Implementation Plan: Competitive Trivia Game

**Branch**: `master` | **Date**: 2026-04-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-trivia-game/spec.md`

## Summary

Build a real-time, browser-based competitive trivia game using WebSockets. Players join a shared
lobby, vote on trivia categories, race to answer questions first, and compete for the top-3
podium. All state is held in memory with no persistence. Stack: Node.js WebSocket server (`ws`
library) + Vite-powered vanilla JS frontend.

## Technical Context

**Language/Version**: JavaScript — Node.js 20+ (server), vanilla ES modules (client)
**Primary Dependencies**: `ws` ^8.x (WebSocket server); `vite` ^5.x (frontend build, devDep)
**Storage**: None — all state is in-memory; discarded on game end or server restart
**Testing**: Not specified — manual validation per quickstart.md checklist
**Target Platform**: Modern web browser (client); Node.js 20+ process (server)
**Project Type**: Web application — Node.js WebSocket server + Vite vanilla JS frontend
**Performance Goals**: State broadcast latency <500ms; stable under 10 concurrent players
**Constraints**: No persistence, no auth, single game room, max 10 players, no database
**Scale/Scope**: 1 game room, up to 10 simultaneous players

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — Simplicity First ✅

- Vanilla JS with no UI framework — passes.
- Single `ws` dependency for server WebSockets — passes.
- No database, no ORM, no auth system — passes.
- Native `fetch` (Node 20+) for trivia API — no HTTP client library needed — passes.
- Vite used only as a build/dev tool, not as a runtime dependency — passes.
- Single game room (no multi-room complexity) — passes.
- Any abstraction added during implementation MUST be justified by a concrete need, not
  anticipated future use.

### Principle II — WebSocket Security ✅

- All incoming messages MUST be JSON-parsed in try/catch; malformed JSON returns typed error.
- All messages MUST be validated against a schema (type + payload fields) before processing.
- Player name MUST be sanitized: trimmed, length-checked (1–20), HTML-entity-safe.
- `correctIndex` MUST NOT be included in question broadcasts during `question_active` phase.
- Internal player IDs (UUIDs) MUST NOT be sent to clients.
- No sensitive fields (tokens, internals) in any broadcast message.
- All error responses are unicast to the sender only.

### Principle III — State Consistency & Synchronization ✅

- Single global `GameState` object on server — server is sole authority.
- Node.js event loop processes all WebSocket message callbacks sequentially — no concurrency
  issues within handlers.
- Every state change triggers a full `state:full` broadcast to all active clients.
- New connections receive immediate `state:full` on connect.
- Reconnecting waiting players receive a `waiting` message followed by `state:full` on game end.
- All timers (question, vote) run server-side; clients display the `timerRemaining` value
  broadcast each second.

**Post-design re-check**: All three principles hold after Phase 1 design. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-trivia-game/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── websocket-protocol.md   # Phase 1 output
│   └── trivia-api.md           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created here)
```

### Source Code (repository root)

```text
triviasock/
├── server/
│   ├── index.js         # HTTP + WebSocket server setup, static file serving
│   ├── game.js          # GameState singleton, state machine, phase transitions
│   ├── trivia.js        # Open Trivia DB API client (fetch categories + questions)
│   ├── handlers.js      # Incoming message dispatch (one function per message type)
│   ├── broadcast.js     # Outgoing message helpers (unicast + broadcast)
│   └── validate.js      # Minimal inline message schema validator
├── src/
│   ├── main.js          # Entry point: WS connect, global message router
│   ├── ws.js            # WebSocket client wrapper (connect, send, on)
│   ├── state.js         # Client display state (updated from server broadcasts)
│   └── screens/
│       ├── lobby.js     # Name entry + player list + ready button
│       ├── waiting.js   # Waiting room during active game
│       ├── voting.js    # Category vote list + live tally + timer
│       ├── question.js  # Question text + 4 answer buttons + timer
│       ├── results.js   # Round score summary
│       └── podium.js    # Game over, top-3 display, play again button
├── index.html           # Single HTML page, <div id="app"> root
├── style.css            # All styles (no CSS framework)
├── vite.config.js       # Vite config (port 5173 dev, output to dist/)
└── package.json         # Single package: ws + vite
```

**Structure Decision**: Web application layout. The `server/` directory holds all Node.js
runtime code. `src/` is the Vite-compiled frontend. No monorepo, no workspaces — a single
`package.json` at the root keeps the setup simple.

## Complexity Tracking

> No constitution violations requiring justification.

| Accepted Deviation | Rationale | Condition for Revisiting |
|--------------------|-----------|--------------------------|
| No test tasks (Quality Gates clause) | This is a solo/small-team build where manual validation via the quickstart.md checklist is the primary QA mechanism; automated test infrastructure would add complexity exceeding the benefit at current scale | Add test tasks if the team grows, CI is introduced, or a regression is found that a test would have caught |
| Reconnection = new waiting player (Constitution III reconnection clause) | Consistent with the no-persistence rule; a dropped player re-enters the waiting queue on reconnect and joins the next game; no session state is retained | If user feedback shows mid-game drops are frequent (flaky networks), add a name-match grace window (~30s) as an incremental change — it does not require architectural changes, only a new server-side timer and a `reconnect:resume` message type |
