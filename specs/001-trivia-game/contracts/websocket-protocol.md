# WebSocket Protocol Contract

**Date**: 2026-04-11
**Feature**: Competitive Trivia Game

All messages are JSON-encoded strings. Every message follows the envelope:

```json
{ "type": "<message_type>", "payload": { ... } }
```

---

## Connection Lifecycle

1. Client opens WebSocket to `ws://host:3001`.
2. Server immediately sends `state:full` — the client is now a **read-only observer** (can see
   the player list and game phase, but cannot send game action messages).
3. Client renders the current state (player list visible) alongside the name-entry form.
4. Client sends `lobby:join` with player name to register.
5. Server responds with updated `state:full` (lobby) or `waiting` (game in progress).
6. Client is now **authenticated** — all game action messages are accepted.

Any game action message sent before a successful `lobby:join` (steps 1–3) MUST be rejected
with `NOT_AUTHENTICATED`.

---

## Client → Server Messages

### `lobby:join`
Player enters the lobby with a display name.

```json
{
  "type": "lobby:join",
  "payload": { "name": "string (1–20 chars)" }
}
```

### `lobby:ready`
Player marks themselves as ready to start.

```json
{
  "type": "lobby:ready",
  "payload": {}
}
```

### `vote:category`
Player casts their vote during category voting.

```json
{
  "type": "vote:category",
  "payload": { "categoryName": "string" }
}
```

### `question:answer`
Player submits an answer to the current question.

```json
{
  "type": "question:answer",
  "payload": { "answer": "string (must match one of the 4 options exactly)" }
}
```

### `vote:early_end:initiate`
Player initiates a vote to end the game early.

```json
{
  "type": "vote:early_end:initiate",
  "payload": {}
}
```

### `vote:early_end:cast`
Player casts their early-end vote.

```json
{
  "type": "vote:early_end:cast",
  "payload": { "vote": true }
}
```
or
```json
{
  "type": "vote:early_end:cast",
  "payload": { "vote": false }
}
```

---

## Server → Client Messages

### `state:full`
Full game state broadcast. Sent on connection, after any state change, and on reconnection.

```json
{
  "type": "state:full",
  "payload": {
    "phase": "lobby | voting | question_active | question_result | round_end | game_over",
    "players": [
      { "name": "string", "score": 0, "ready": false }
    ],
    "waitingCount": 0,
    "round": null,
    "vote": null
  }
}
```

`round` when active (VOTING → ROUND_END phases):
```json
{
  "category": { "id": 9, "name": "General Knowledge" },
  "questionIndex": 1,
  "totalQuestions": 5,
  "question": {
    "text": "What is the capital of France?",
    "options": ["Paris", "Berlin", "Madrid", "Rome"]
  },
  "timerRemaining": 28
}
```

`round.question` during QUESTION_RESULT phase additionally includes:
```json
{
  "correctIndex": 0,
  "pointWinner": "Alice"
}
```
(`pointWinner` is `null` if the question expired with no correct answer.)

`vote` when active:
```json
{
  "type": "category",
  "categories": [
    { "name": "Science: Computers", "votes": 2 },
    { "name": "History", "votes": 1 }
  ],
  "timerRemaining": 22
}
```
or for early-end vote:
```json
{
  "type": "early_end",
  "tally": { "yes": 1, "no": 0 },
  "timerRemaining": 25,
  "initiatedBy": "Bob"
}
```

### `waiting`
Sent to a player who joins while a game is in progress.

```json
{
  "type": "waiting",
  "payload": { "message": "A game is in progress. You'll join the next one." }
}
```

### `error`
Typed error response. Always sent only to the sender.

```json
{
  "type": "error",
  "payload": {
    "code": "NAME_TAKEN | NAME_INVALID | INVALID_MESSAGE | NOT_YOUR_TURN | GAME_NOT_ACTIVE | ...",
    "message": "Human-readable description."
  }
}
```

**Error codes**:

| Code | Trigger |
|------|---------|
| `NAME_TAKEN` | Chosen name (case-insensitive) already in use |
| `NAME_INVALID` | Name is empty, too long (>20), or contains disallowed characters |
| `INVALID_MESSAGE` | Malformed JSON or unknown message type |
| `INVALID_PAYLOAD` | Message type known but payload schema invalid |
| `NOT_IN_LOBBY` | `lobby:ready` sent outside lobby phase |
| `VOTE_NOT_ACTIVE` | Vote message sent when no vote is active |
| `INVALID_CATEGORY` | Voted category not in available list |
| `INVALID_ANSWER` | Answer does not match any of the 4 options |
| `QUESTION_NOT_ACTIVE` | Answer sent outside question_active phase |
| `VOTE_ALREADY_ACTIVE` | Early-end initiate sent while a vote is already in progress |
| `TRIVIA_UNAVAILABLE` | Trivia API unreachable or returned no questions |
| `NOT_AUTHENTICATED` | Game action sent before successful `lobby:join` |
| `LOBBY_FULL` | `lobby:join` sent when active player count has reached maximum (10) |

---

## Timing

| Event | Duration |
|-------|----------|
| Category voting | 30 seconds |
| Question timer | 30 seconds |
| Question result display | 3 seconds (auto-advance) |
| Round end display | 5 seconds (auto-advance) |
| Early-end voting | 30 seconds |

Server sends `state:full` every second while a timer is active (timer tick), updating
`timerRemaining` in the round or vote object. Clients render the countdown from this value.

---

## State Broadcast Policy

- Every state change triggers a `state:full` broadcast to all **active** clients.
- `waiting` players receive `state:full` only when they first connect and when the game ends
  (lobby reset).
- `error` messages are always unicast (sent only to the originating client).
- Correct answer (`correctIndex`) is NEVER included in `question.options` context during
  `question_active` phase. It is only present in `state:full` during `question_result` phase.
