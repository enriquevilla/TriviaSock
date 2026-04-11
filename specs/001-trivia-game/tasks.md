---
description: "Task list for Competitive Trivia Game"
---

# Tasks: Competitive Trivia Game

**Input**: Design documents from `/specs/001-trivia-game/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story for independent implementation and testing.
Each story can be developed, verified, and demonstrated without implementing subsequent stories.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)
- File paths use the structure defined in `plan.md`

## Path Conventions

```text
server/            — Node.js server files
src/               — Vite frontend source
src/screens/       — One JS module per game screen
index.html         — SPA shell
style.css          — All styles
vite.config.js     — Vite configuration
package.json       — Single package, root level
```

---

## Phase 1: Setup

**Purpose**: Project scaffolding. No dependencies — start immediately.

- [ ] T001 Create `package.json` with `ws` ^8 dependency and `vite` ^5 devDependency; set `"type": "module"` and scripts: `dev:server`, `dev:client`, `build`, `start`
- [ ] T002 Create directory structure: `server/`, `src/`, `src/screens/`
- [ ] T003 Create `vite.config.js` with `server.port: 5173` and `build.outDir: 'dist'`
- [ ] T004 Create `index.html` as SPA shell: `<div id="app">` root containing one `<div>` per screen (lobby, waiting, voting, question, round-results, podium), all hidden by default via a CSS class

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Server Foundation

- [ ] T005 Create `server/validate.js`: export a `validate(msg, schema)` function that returns `false` if `msg` is not an object or any key in `schema` does not match the expected type; export an `errorResponse(code, message)` helper
- [ ] T006 Create `server/broadcast.js`: export `unicast(ws, type, payload)` that JSON-stringifies and sends only if `ws.readyState === WebSocket.OPEN`; export `broadcast(clients, type, payload)` that calls `unicast` for each client in the set
- [ ] T007 Create `server/game.js`: export the `GamePhase` enum (`LOBBY`, `VOTING`, `QUESTION_ACTIVE`, `QUESTION_RESULT`, `ROUND_END`, `GAME_OVER`) and a `createInitialState()` function returning the empty `GameState` object as defined in `data-model.md`; export a mutable `state` singleton
- [ ] T008 Create `server/trivia.js`: export `fetchCategories()` that calls the Open Trivia DB categories endpoint and returns an array of `{ id, name }` objects; include a `decodeHtml(str)` utility that converts HTML entities (e.g. `&amp;`, `&#039;`) to plain text
- [ ] T009 Create `server/handlers.js`: export a `dispatch(ws, rawMessage, state)` function that parses the raw string as JSON (try/catch → unicast error on failure), looks up the message type in a handler map, and calls the matching handler; unicast `INVALID_MESSAGE` for unknown types
- [ ] T010 Create `server/index.js`: create a `http.createServer` instance; attach a `WebSocketServer` from `ws`; on `connection`, add the client WebSocket to `state.clients` (a `Map<ws, player|null>`); call `dispatch` on each `message` event; handle `close` event per connection; listen on `PORT` constant (default 3001)

### Client Foundation

- [ ] T011 [P] Create `src/ws.js`: export `connect(url)` that opens a WebSocket, wraps it, and returns `{ send(type, payload), on(type, handler) }` — `on` registers a per-type handler called when a message of that type arrives
- [ ] T012 [P] Create `src/state.js`: export a `clientState` object with `phase`, `players`, `waitingCount`, `round`, `vote` fields (matching the serialized format in `data-model.md`); export `applyState(incoming)` that merges the incoming `state:full` payload into `clientState`
- [ ] T013 Create `src/main.js`: import `connect` from `ws.js`; connect to `ws://localhost:3001`; register a `state:full` handler that calls `applyState` then routes to the correct screen based on `clientState.phase`; register a `waiting` handler
- [ ] T014 [P] Add base CSS to `style.css`: CSS reset, `body` layout, a `.hidden` utility class (display:none), and placeholder containers for each screen div matching the IDs in `index.html`

**Checkpoint**: Server starts without error, client loads in browser, WebSocket handshake completes, `state:full` message is received on connection.

---

## Phase 3: User Story 1 — Player Onboarding & Lobby (Priority: P1) 🎯 MVP

**Goal**: Players can enter a name, see each other in the lobby, and start a game when all ready.

**Independent Test**: Open two browser tabs. Enter different names in each. Click Ready on both.
Verify both tabs show consistent player lists and transition to voting simultaneously.

### Server — US1

- [ ] T015 [US1] Add `addPlayer(ws, name)` to `server/game.js`: validate name length (1–20 chars trimmed), reject if case-insensitively duplicate across `state.players` and `state.waitingQueue`; create a player object (`{ name, score: 0, ready: false, joinedAt: Date.now() }`); add to `state.players`; return the player or an error string
- [ ] T016 [US1] Add `lobby:join` handler in `server/handlers.js`: validate payload has `name: 'string'`; call `addPlayer`; on success broadcast updated lobby state; on failure unicast `NAME_TAKEN` or `NAME_INVALID` error
- [ ] T017 [US1] Add `lobby:ready` handler in `server/handlers.js`: reject with `NOT_IN_LOBBY` if phase is not `LOBBY`; find the player by `ws`; set `player.ready = true`; broadcast updated lobby state; then call `checkAllReady()`
- [ ] T018 [US1] Add `checkAllReady()` to `server/game.js`: count active connected players; if all are ready AND count >= `MIN_PLAYERS` (default 2), call `startGame()`; `startGame()` sets phase to `VOTING` and calls `fetchCategories()` to populate `state.categories`; broadcast `state:full` to all active players
- [ ] T019 [US1] Add WebSocket `close` handler in `server/index.js`: find the disconnected `ws` in `state.players`; remove them; if phase is `LOBBY` broadcast updated lobby state; if phase is NOT `LOBBY` or `GAME_OVER` call `handleMidGameDisconnect(ws)` (stub for now — just removes player and broadcasts)
- [ ] T020 [US1] Add `serializeLobbyState()` helper to `server/broadcast.js`: returns the `state:full` payload for lobby phase (player names, ready flags, scores, waitingCount)

### Client — US1

- [ ] T021 [P] [US1] Create `src/screens/lobby.js`: export `renderLobby(state)` that generates and injects a name-entry form into the lobby screen div; on submit, call `ws.send('lobby:join', { name })` and hide the form
- [ ] T022 [US1] Add player list rendering to `src/screens/lobby.js`: export `updateLobbyPlayers(players)` that renders the list of connected players with their ready/not-ready status as DOM nodes
- [ ] T023 [US1] Add Ready button to `src/screens/lobby.js`: once joined (name submitted and accepted), show a "Ready" button; on click send `lobby:ready` and disable the button; display "Waiting for others…" text
- [ ] T024 [US1] Wire lobby screen in `src/main.js`: on `state:full` with `phase === 'lobby'`, call `renderLobby` and `updateLobbyPlayers`; show the lobby screen div, hide all others

**Checkpoint**: US1 is fully functional. Two players can join, see each other, click Ready, and the phase transitions to voting (blank screen is fine at this point).

---

## Phase 4: User Story 2 — Category Voting (Priority: P2)

**Goal**: Players collectively vote on the next trivia category; winning category is selected.

**Independent Test**: With 2+ players in game, vote phase appears. One player votes, live tally
updates on both tabs. Timer expires and the plurality winner is selected.

### Server — US2

- [ ] T025 [US2] Add `fetchQuestions(categoryId)` to `server/trivia.js`: call the Open Trivia DB questions endpoint with `amount=5` and `type=multiple`; decode HTML entities on all text fields; shuffle `[correct_answer, ...incorrect_answers]` into a 4-element `options` array; record `correctIndex`; return an array of question objects as defined in `data-model.md`
- [ ] T026 [US2] Add `startCategoryVote()` to `server/game.js`: set phase to `VOTING`; create a new `VoteState` of type `'category'` with an empty votes Map; compute available categories (all categories not in `state.usedCategoryIds`); if none remain, call `endGame()`; otherwise start a 30-second countdown and broadcast `state:full`
- [ ] T027 [US2] Add `vote:category` handler in `server/handlers.js`: reject if phase is not `VOTING` or vote type is not `'category'`; validate `categoryName` is in the available categories list; record the vote (overwrite if player votes again); broadcast updated `state:full`
- [ ] T028 [US2] Add `resolveVote()` to `server/game.js`: tally votes per category; pick the category with the most votes; break ties by random selection among tied; call `startRound(category)` with the winner; mark category as used
- [ ] T029 [US2] Add server-side vote countdown to `server/game.js`: `startCategoryVote()` sets a `setInterval` ticking every second; each tick decrements `state.votes.timerRemaining` and broadcasts `state:full`; when timer hits 0, clear interval and call `resolveVote()`; if all players vote before timer expires, also call `resolveVote()` immediately

### Client — US2

- [ ] T030 [P] [US2] Create `src/screens/voting.js`: export `renderVoting(state)` that lists available categories from `state.vote.categories` as clickable buttons; on click, send `vote:category` with the category name and disable all buttons
- [ ] T031 [US2] Add live tally display to `src/screens/voting.js`: export `updateVoting(state)` that updates the vote count badge next to each category name from `state.vote.categories[n].votes`
- [ ] T032 [US2] Add timer countdown to `src/screens/voting.js`: display `state.vote.timerRemaining` seconds in the UI; update on each `state:full` message
- [ ] T033 [US2] Wire voting screen in `src/main.js`: on `state:full` with `phase === 'voting'`, call `renderVoting` on first render and `updateVoting` on subsequent ticks; show voting div, hide all others

**Checkpoint**: Category voting works end-to-end. Votes update live. Timer auto-resolves. Phase transitions to question_active (blank screen is fine).

---

## Phase 5: User Story 3 — Question Round (Priority: P2)

**Goal**: 5 questions per category; first correct answer earns a point; scores broadcast live.

**Independent Test**: Start a round. Answer correctly on Tab A before Tab B. Verify only Tab A's
player score increments, both tabs see the updated score, and the next question appears automatically.

### Server — US3

- [ ] T034 [US3] Add `startRound(category)` to `server/game.js`: fetch 5 questions via `fetchQuestions()`; store as `state.currentRound`; set `currentIndex` to 0; call `presentQuestion()`
- [ ] T035 [US3] Add `presentQuestion()` to `server/game.js`: set phase to `QUESTION_ACTIVE`; set `timerRemaining` to 30; broadcast `state:full` WITHOUT `correctIndex` in the payload; start a 30-second countdown timer
- [ ] T036 [US3] Add `question:answer` handler in `server/handlers.js`: reject with `QUESTION_NOT_ACTIVE` if phase is not `QUESTION_ACTIVE`; check answer string against the 4 options (exact match); if incorrect, unicast `INVALID_ANSWER` error; if correct, call `awardPoint(ws, answer)` and stop the question timer
- [ ] T037 [US3] Add `awardPoint(ws, answerText)` to `server/game.js`: find player by ws; increment `player.score`; set `question.pointWinner` to the player name; set phase to `QUESTION_RESULT`; broadcast `state:full` WITH `correctIndex` and `pointWinner` now included
- [ ] T038 [US3] Add question expiry handler to `server/game.js`: when the 30-second question timer fires with no correct answer, set `question.pointWinner` to null; set phase to `QUESTION_RESULT`; broadcast `state:full` with the correct answer revealed; schedule `advanceQuestion()` after 3 seconds
- [ ] T039 [US3] Add `advanceQuestion()` to `server/game.js`: if more questions remain in round, increment `currentIndex` and call `presentQuestion()`; otherwise call `endRound()`
- [ ] T040 [US3] Add `endRound()` to `server/game.js`: set phase to `ROUND_END`; broadcast `state:full` with current scores; after 5 seconds call `startCategoryVote()`

### Client — US3

- [ ] T041 [P] [US3] Create `src/screens/question.js`: export `renderQuestion(state)` that displays the question text and 4 answer buttons from `state.round.question`; on answer button click, send `question:answer` with the option text and immediately disable all buttons
- [ ] T042 [US3] Add timer display to `src/screens/question.js`: show `state.round.timerRemaining` seconds; update on each `state:full` during `question_active` phase
- [ ] T043 [US3] Add question result reveal to `src/screens/question.js`: export `showQuestionResult(state)` called during `question_result` phase; highlight the correct answer button green; if there is a `pointWinner`, show "[name] got it!" banner; if no winner, show "Time's up!" banner
- [ ] T044 [P] [US3] Create `src/screens/results.js`: export `renderResults(state)` that displays the scoreboard (all player names + scores sorted descending) during `round_end` phase
- [ ] T045 [US3] Wire question and results screens in `src/main.js`: route `question_active` and `question_result` to `renderQuestion`/`showQuestionResult`; route `round_end` to `renderResults`

**Checkpoint**: A full 5-question round plays through. Correct answer awards point. Timer expiry works. Scores display correctly. Loops back to voting.

---

## Phase 6: User Story 4 — Game Over & Podium (Priority: P1)

**Goal**: When all categories are exhausted, the final podium appears and state resets on replay.

**Independent Test**: Play through all available categories. Verify podium shows top-3 with correct
scores. Click "Play Again" and verify lobby resets with zeroed scores.

### Server — US4

- [ ] T046 [US4] Add game-over detection to `server/game.js`: in `startCategoryVote()`, after computing available categories, if `usedCategoryIds.size === state.categories.length`, call `endGame()` instead of starting a vote
- [ ] T047 [US4] Add `endGame()` to `server/game.js`: set phase to `GAME_OVER`; compute podium by sorting active players descending by score, then by `joinedAt` ascending for ties; broadcast `state:full` including the top-3 slice
- [ ] T048 [US4] Add `resetLobby()` to `server/game.js`: reset `state` back to initial LOBBY state (clear scores, categories, usedCategoryIds, currentRound, votes); keep connected players but reset their scores and ready flags; add any waiting-queue players to active players; broadcast `state:full`
- [ ] T049 [US4] Add `lobby:reset` handler in `server/handlers.js`: only valid during `GAME_OVER` phase; call `resetLobby()`

### Client — US4

- [ ] T050 [P] [US4] Create `src/screens/podium.js`: export `renderPodium(state)` that displays the top-3 players from `state.players` (sorted by score) with rank labels (1st, 2nd, 3rd) and a "Play Again" button
- [ ] T051 [US4] Add Play Again handler to `src/screens/podium.js`: on "Play Again" button click, send `{ type: 'lobby:reset', payload: {} }` via WebSocket
- [ ] T052 [US4] Wire podium screen in `src/main.js`: route `game_over` phase to `renderPodium`

**Checkpoint**: Full game loop works end-to-end. Lobby → Voting → Questions → Voting (repeat) → Podium → Lobby.

---

## Phase 7: User Story 5 — Late Joiner Waiting Room (Priority: P3)

**Goal**: Players who arrive mid-game see a waiting screen and auto-join the next lobby.

**Independent Test**: Start a 2-player game. Open a 3rd tab, enter a name. Verify waiting screen
appears. Complete the game in the other tabs. Verify the 3rd player appears in the new lobby.

### Server — US5

- [ ] T053 [US5] Update connection handler in `server/index.js`: if phase is NOT `LOBBY`, send `waiting` message to the new client AND unicast the current `state:full`; add the ws to `state.waitingQueue` instead of active players
- [ ] T054 [US5] Add `addToWaitingQueue(ws, name)` to `server/game.js`: validate the name (same rules as `addPlayer`); store player in `state.waitingQueue` keyed by ws; return the player or error
- [ ] T055 [US5] Update `lobby:join` handler in `server/handlers.js`: if the connection is already in the waiting queue, update the queued player's name instead of adding a new active player
- [ ] T056 [US5] Update `resetLobby()` in `server/game.js`: after resetting active player state, move all players from `state.waitingQueue` into `state.players`; broadcast updated `state:full` to all (formerly waiting clients now receive the lobby state)

### Client — US5

- [ ] T057 [P] [US5] Create `src/screens/waiting.js`: export `renderWaiting()` that displays a "Game in progress" message and "You'll be added to the next game automatically." text
- [ ] T058 [US5] Wire waiting screen in `src/main.js`: on `waiting` message type (not `state:full`), show the waiting screen div; when next `state:full` arrives with `phase === 'lobby'`, transition to lobby screen

**Checkpoint**: Late-joining player sees waiting room and seamlessly enters the lobby when the game ends.

---

## Phase 8: User Story 6 — Early End Vote (Priority: P3)

**Goal**: Any player can trigger a majority vote to end the game early.

**Independent Test**: With 3 players, initiate an early-end vote. Have 2 vote yes. Verify game ends
and podium shows current scores.

### Server — US6

- [ ] T059 [US6] Add `vote:early_end:initiate` handler in `server/handlers.js`: reject if phase is `LOBBY` or `GAME_OVER`; reject with `VOTE_ALREADY_ACTIVE` if `state.votes` is not null; create a new `VoteState` of type `'early_end'` with empty votes map and `initiatedBy` set to the player's name; broadcast `state:full`
- [ ] T060 [US6] Add 30-second early-end vote timer to `server/game.js` (reuse vote timer pattern from `startCategoryVote`): tick every second, broadcast `state:full`; on expiry call `resolveEarlyEndVote()`
- [ ] T061 [US6] Add `vote:early_end:cast` handler in `server/handlers.js`: reject if `state.votes?.type !== 'early_end'`; validate payload `vote` is boolean; record the player's vote; if all active players have voted, call `resolveEarlyEndVote()` immediately; otherwise broadcast updated `state:full`
- [ ] T062 [US6] Add `resolveEarlyEndVote()` to `server/game.js`: count yes votes; if yes count > 50% of active player count, call `endGame()`; otherwise clear `state.votes` and broadcast `state:full` to resume the previous game state
- [ ] T063 [US6] Update `handleMidGameDisconnect(ws)` stub in `server/index.js`: if an early-end vote is active, re-evaluate the majority threshold with the reduced player count; auto-resolve if new majority is met

### Client — US6

- [ ] T064 [P] [US6] Add "End Game Early" button to `src/screens/voting.js` and `src/screens/question.js`: show button only when `state.vote?.type !== 'early_end'` (i.e., no early-end vote already active); on click send `vote:early_end:initiate`
- [ ] T065 [US6] Add early-end vote overlay to `src/main.js`: when `state.vote?.type === 'early_end'` is detected in `state:full`, inject an overlay or banner on the current screen showing the vote tally, timer, and Yes/No buttons; on button click send `vote:early_end:cast`; hide overlay when `state.vote` becomes null

**Checkpoint**: Early-end vote initiates from any in-game screen, updates live, and correctly ends or dismisses.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, UX polish, and validation across all stories.

- [ ] T066 [P] Add heartbeat ping/pong to `server/index.js`: every 30 seconds send a `ping` to all clients; terminate any client that has not responded since the last ping; use `ws.isAlive` flag pattern
- [ ] T067 [P] Add `handleMidGameDisconnect(ws)` full implementation in `server/game.js`: if 1 or 0 active players remain after disconnect, call `endGame()`; if a question is active and the disconnecting player was the only answerer, no change needed; recalculate ready/vote thresholds
- [ ] T068 [P] Add error message display to `src/main.js`: register an `error` message handler on the WebSocket; display the error message to the user (e.g., a dismissible toast/banner) without disrupting the current screen
- [ ] T069 Implement complete CSS styling in `style.css`: style each screen (lobby player list, voting category cards, question text + answer buttons, scoreboard, podium top-3 layout, waiting message); use CSS transitions for screen switches
- [ ] T070 [P] Add `TRIVIA_UNAVAILABLE` error handling to `server/game.js`: if `fetchCategories()` fails on game start, broadcast an error to all players and reset to LOBBY; if `fetchQuestions()` fails when a round begins, mark the category as used and return to voting
- [ ] T071 [P] Add connection status indicator to `src/ws.js` and `src/main.js`: show a "Disconnected — reconnecting…" banner when the WebSocket closes unexpectedly; attempt reconnect after 3 seconds
- [ ] T072 Run the quickstart.md validation checklist end-to-end and fix any regressions found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — no story dependencies
- **US2 (Phase 4)**: Depends on US1 (lobby → voting transition)
- **US3 (Phase 5)**: Depends on US2 (voting → question transition)
- **US4 (Phase 6)**: Depends on US3 (all questions → game over)
- **US5 (Phase 7)**: Depends on US1 (lobby exists); can proceed after US1 in parallel with US2+
- **US6 (Phase 8)**: Depends on US2 (voting phase) and US3 (question phase) being present
- **Polish (Phase N)**: Depends on all desired stories being complete

### Within Each User Story

- Server model/state changes before handlers
- Handlers before client render
- Client render before screen wiring in main.js

### Parallel Opportunities

- All Phase 1 tasks are short and sequential (4 tasks, ~1 dev hour)
- Within Phase 2: T005–T010 (server) and T011–T014 (client) can be split across two developers
- Within each story phase: server tasks and client tasks are in different files and can be worked in parallel
- T066, T067, T068, T070, T071 in Polish phase are all independent files

---

## Parallel Example: Phase 2 (Foundational)

```text
Developer A (server):
  T005 validate.js → T006 broadcast.js → T007 game.js → T008 trivia.js → T009 handlers.js → T010 index.js

Developer B (client):
  T011 ws.js  (parallel with T005)
  T012 state.js  (parallel with T006)
  T014 style.css base  (parallel with T007)
  T013 main.js  (after T011 + T012)
```

---

## Implementation Strategy

### MVP (US1 + US2 + US3 + US4 only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T014) — CRITICAL
3. Complete Phase 3: US1 — Lobby (T015–T024)
4. **STOP AND VALIDATE**: Two players can join and click Ready
5. Complete Phase 4: US2 — Voting (T025–T033)
6. **VALIDATE**: Categories appear, voting works, phase transitions
7. Complete Phase 5: US3 — Questions (T034–T045)
8. **VALIDATE**: Full question round plays, scoring works
9. Complete Phase 6: US4 — Podium (T046–T052)
10. **VALIDATE**: Complete game loop works end-to-end
11. Deploy / demo

### Incremental Delivery

- After US1: Basic multiplayer lobby is live
- After US2+US3: Core competitive game mechanic is live
- After US4: Complete playable game is live
- After US5: Late-joiner experience is complete
- After US6: Full feature set is live

---

## Notes

- `[P]` = different files, no blocking dependencies — safe to work on simultaneously
- `[Story]` label maps each task to a testable user story increment
- Server handlers must never trust client input — validate before processing
- `correctIndex` must NEVER appear in `state:full` broadcasts during `question_active` phase
- Commit after each phase checkpoint (at minimum)
- If the Trivia API is unavailable, US2 and US3 cannot be manually tested — have a fallback stub in `server/trivia.js` for local dev if needed
