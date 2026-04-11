# Data Model: Competitive Trivia Game

**Date**: 2026-04-11
**Feature**: specs/001-trivia-game/spec.md

All state is held in memory on the server. Nothing is persisted. State is discarded when the
game ends or the server restarts.

---

## Server-Side State

### GameState (singleton, server global)

The single source of truth for the entire application.

```js
{
  phase: GamePhase,              // Current game phase (enum)
  players: Map<id, Player>,      // All connected players (including waiting)
  categories: Category[],        // All available categories (from Trivia API)
  usedCategoryIds: Set<number>,  // Category IDs already played this game
  currentRound: RoundState|null, // Null when not in a round
  votes: VoteState|null,         // Active vote (category or early-end), null otherwise
  waitingQueue: Map<id, Player>, // Players waiting for current game to end
}
```

### GamePhase (enum)

```js
const GamePhase = {
  LOBBY:           'lobby',           // Waiting for players, pre-game
  VOTING:          'voting',          // Players voting on next category
  QUESTION_ACTIVE: 'question_active', // Question presented, accepting answers
  QUESTION_RESULT: 'question_result', // Correct answer revealed, brief pause
  ROUND_END:       'round_end',       // All 5 questions done, scores shown
  GAME_OVER:       'game_over',       // All categories used, podium shown
}
```

### Player

```js
{
  id: string,           // Server-assigned UUID (not shared with other clients)
  name: string,         // Display name (1–20 chars, trimmed, unique case-insensitive)
  score: number,        // Points earned this game (integer, min 0)
  ready: boolean,       // True after player clicks Ready (lobby phase only)
  joinedAt: number,     // Unix timestamp ms (used for tiebreaking)
  ws: WebSocket,        // Live WebSocket connection reference (never sent to clients)
  isActive: boolean,    // True = in-game; false = in waiting queue
}
```

### Category

```js
{
  id: number,     // Open Trivia DB category ID
  name: string,   // Display name (HTML-decoded)
}
```

### RoundState

Active only during VOTING → QUESTION_ACTIVE → QUESTION_RESULT → ROUND_END phases.

```js
{
  category: Category,        // The category being played
  questions: Question[],     // 5 questions fetched for this round
  currentIndex: number,      // Index of the current question (0–4)
  timerHandle: TimerHandle,  // Server timer reference (not serialized)
  timerRemaining: number,    // Seconds remaining on active timer (for broadcasts)
}
```

### Question

```js
{
  text: string,          // Question text (HTML-decoded)
  options: string[],     // 4 shuffled answer options (HTML-decoded)
  correctIndex: number,  // Index of the correct answer in `options`
  pointWinner: string|null, // Player name who earned the point, null if expired
}
```

Note: `correctIndex` and `pointWinner` are included in server broadcasts only after the question
is resolved (QUESTION_RESULT phase). During QUESTION_ACTIVE, they MUST NOT be broadcast.

### VoteState

Covers both category voting and early-end voting.

```js
{
  type: 'category' | 'early_end',
  votes: Map<ws, string|boolean>, // WebSocket reference (same key as state.players Map) → voted category name OR yes/no boolean
  timerHandle: TimerHandle,       // Server timer reference (not serialized)
  timerRemaining: number,         // Seconds remaining
  initiatedBy: string|null,       // Player name (early_end only)
}
```

Note: the Map key is the `ws` WebSocket reference matching the key used in `state.players`,
NOT the player's `id` UUID field (which is internal and never sent to clients).
```

---

## State Transitions

```
LOBBY
  → VOTING         : all active players ready AND count ≥ 2
  
VOTING
  → QUESTION_ACTIVE: voting resolved (all voted OR timer expired) AND questions fetched
  
QUESTION_ACTIVE
  → QUESTION_RESULT: correct answer received OR timer expires
  
QUESTION_RESULT
  → QUESTION_ACTIVE: more questions remain in round (auto, 3s delay)
  → ROUND_END      : all 5 questions exhausted (auto)
  
ROUND_END
  → VOTING         : unused categories remain (auto, after 5s)
  → GAME_OVER      : all categories used (auto)
  
GAME_OVER
  → LOBBY          : players trigger new game

Any phase (except LOBBY and GAME_OVER)
  → GAME_OVER      : early-end vote passes
```

---

## Serialized State (sent to clients)

Player data sent to clients omits `id`, `ws`, and `joinedAt` to protect internal identifiers.

```js
// Player as seen by clients
{
  name: string,
  score: number,
  ready: boolean,
}

// Full state broadcast structure
{
  phase: GamePhase,
  players: SerializedPlayer[],         // Active players only
  waitingCount: number,                // Count of waiting players
  round: SerializedRound|null,
  vote: SerializedVote|null,
}

// SerializedRound (phase-sensitive — see note on correctIndex above)
{
  category: { id: number, name: string },
  questionIndex: number,              // 1-based for display
  totalQuestions: number,             // Always 5
  question: {
    text: string,
    options: string[],
    // correctIndex and pointWinner ONLY present in QUESTION_RESULT phase
    correctIndex?: number,
    pointWinner?: string|null,
  },
  timerRemaining: number,
}

// SerializedVote
{
  type: 'category' | 'early_end',
  categories?: { name: string, votes: number }[], // category type only
  tally?: { yes: number, no: number },            // early_end type only
  timerRemaining: number,
  initiatedBy?: string,                           // early_end type only
}
```

---

## Validation Rules

- `name`: string, 1–20 characters after trimming, must be unique case-insensitively in active
  players and waiting queue combined.
- Incoming answer: string, must match one of the 4 option strings exactly.
- Incoming category vote: string, must match a name in the current available categories list.
- Incoming early-end vote: boolean.
- All other message fields: validated by type and presence check before processing.
