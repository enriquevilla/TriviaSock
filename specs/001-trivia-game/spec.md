# Feature Specification: Competitive Trivia Game

**Feature Branch**: `001-trivia-game`
**Created**: 2026-04-11
**Status**: Draft
**Input**: User description: "Build an application that uses websockets to create a competitive trivia game."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Player Onboarding & Lobby (Priority: P1)

A player opens the site, enters their display name, and arrives in the waiting lobby. They can
see all other connected players and their ready status. Once the player clicks Ready, their status
updates for everyone. When all connected players (minimum 2) are ready, the game starts
automatically and all players transition to the first category vote.

**Why this priority**: This is the entry point for every game. Without it, nothing else functions.
It is also the first impression of the real-time experience.

**Independent Test**: Open the site in two browser tabs, enter different names in each, click
Ready on both. Verify both tabs show consistent player lists and transition to voting simultaneously.

**Acceptance Scenarios**:

1. **Given** a player opens the site, **When** they enter a display name and submit, **Then** they
   appear in the lobby player list visible to all other connected players.
2. **Given** a player is in the lobby, **When** they click Ready, **Then** their status updates to
   "Ready" for all players in real-time.
3. **Given** all connected players (≥2) are ready, **When** the last player clicks Ready, **Then**
   the game starts automatically and all players see the category voting screen.
4. **Given** a player tries to enter a name already taken, **When** they submit, **Then** they are
   prompted to choose a different name before joining.

---

### User Story 2 - Category Voting (Priority: P2)

At the start of each round, all players see the list of remaining (not-yet-played) trivia
categories and cast one vote. The category with the most votes is selected. If there is a tie,
one of the tied categories is chosen at random. Voting ends after 30 seconds; if no votes are
cast, a random remaining category is selected.

**Why this priority**: Category selection drives the entire question phase. It is a core loop
mechanic and a key part of the competitive experience.

**Independent Test**: With 3 players in game, present voting screen, have 2 vote for Category A
and 1 for Category B. Verify Category A is selected and all players transition to the question
phase for that category.

**Acceptance Scenarios**:

1. **Given** a round begins, **When** the voting screen appears, **Then** only categories not yet
   played are shown as options.
2. **Given** the voting screen is active, **When** a player votes, **Then** the live vote tally
   updates in real-time for all players.
3. **Given** voting ends (timer expires or all voted), **When** one category has the most votes,
   **Then** that category is selected and all players move to the question phase.
4. **Given** two or more categories are tied, **When** voting ends, **Then** one of the tied
   categories is selected at random.
5. **Given** the 30-second voting timer expires, **When** no votes have been cast, **Then** a
   random remaining category is selected automatically.

---

### User Story 3 - Question Round (Priority: P2)

Once a category is selected, 5 questions from that category are presented one at a time to all
players. Each question has 4 multiple-choice options and a 30-second timer. The first player to
submit the correct answer earns 1 point; subsequent answers for the same question are rejected.
After all 5 questions, the current scores are displayed briefly before returning to category
voting.

**Why this priority**: This is the primary competitive mechanic of the game. Every other story
exists to support and frame this one.

**Independent Test**: Start a round, answer the first question correctly on one tab before the
other. Verify only the first tab's player receives a point, the score update broadcasts to both
tabs, and the next question is presented automatically.

**Acceptance Scenarios**:

1. **Given** a question is active, **When** a player submits the correct answer first, **Then**
   they receive 1 point and all players see the updated scoreboard.
2. **Given** a player has already earned the point for a question, **When** another player submits
   an answer for the same question, **Then** their answer is rejected with no score change.
3. **Given** a question is active, **When** the 30-second timer expires with no correct answer,
   **Then** the question is marked expired and the next question is presented.
4. **Given** a correct answer is submitted, **When** the point is awarded, **Then** the correct
   answer is revealed to all players along with the point recipient.
5. **Given** 5 questions have been completed, **When** the last question resolves, **Then** the
   round score summary is shown before returning to category voting.

---

### User Story 4 - Game Over & Podium (Priority: P1)

After all available categories have been played, the game ends and a podium screen is displayed
showing the top 3 players and their final scores. All game state is then discarded. Players can
start a fresh game, which returns everyone to the lobby with reset state.

**Why this priority**: This is the resolution state every game must reach. Without it, the game
has no conclusion.

**Independent Test**: Play through all categories until none remain. Verify the podium appears
with the correct top-3 rankings and that returning to lobby resets all scores.

**Acceptance Scenarios**:

1. **Given** the last available category has been fully played, **When** the round ends, **Then**
   the game-over podium screen is shown to all players with final scores.
2. **Given** the podium is displayed, **When** players choose to play again, **Then** all state is
   reset (scores, categories, ready status) and all players return to the lobby.
3. **Given** the game ends, **When** reviewing the podium, **Then** the top 3 players are ranked
   in descending score order with ties broken by arrival order (who joined first).

---

### User Story 5 - Late Joiner Waiting Room (Priority: P3)

A player who arrives while a game is in progress is shown a waiting screen. They can enter their
name to register their intent to play. When the current game ends and the lobby resets, waiting
players automatically appear in the new lobby.

**Why this priority**: This is a fairness and experience concern, not a core mechanic. The game
functions without it, but it is needed for a polished experience.

**Independent Test**: Start a 2-player game, then open a third tab and enter a name. Verify the
third tab sees a waiting screen. Complete the game in the other tabs and verify the third player
appears in the new lobby.

**Acceptance Scenarios**:

1. **Given** a game is in progress, **When** a new player opens the site and enters their name,
   **Then** they see a waiting screen that indicates a game is underway.
2. **Given** a player is in the waiting room, **When** the current game ends and the lobby resets,
   **Then** the waiting player automatically appears in the new lobby.
3. **Given** a player is waiting, **When** the current game ends, **Then** their name is not
   included in the completed game's podium.

---

### User Story 6 - Early End Vote (Priority: P3)

Any player can initiate a vote to end the current game early. If a strict majority (more than 50%)
of active players vote yes, the game ends immediately, the current scores are treated as final,
and the podium is displayed.

**Why this priority**: This is a quality-of-life feature that prevents players from being stuck
in an unwanted game state.

**Independent Test**: With 3 players, one initiates an early-end vote. Have 2 of 3 vote yes.
Verify the game ends and the podium is shown with current scores.

**Acceptance Scenarios**:

1. **Given** a game is in progress, **When** a player initiates an early-end vote, **Then** all
   active players are notified and presented with a yes/no prompt.
2. **Given** an early-end vote is active, **When** strictly more than 50% of active players vote
   yes, **Then** the game ends immediately and the podium is shown with current scores.
3. **Given** an early-end vote is active, **When** the 30-second timer expires or all active
   players have voted, **Then** the current tally is evaluated: if the majority threshold is
   met the game ends immediately; otherwise the vote is dismissed and the game continues from
   where it left off.
4. **Given** only one early-end vote can be active at a time, **When** a vote is already in
   progress, **Then** additional vote initiations are ignored.

---

### Edge Cases

- What happens when a player disconnects mid-game? They are removed from the active player list;
  vote thresholds recalculate based on remaining players; if only 1 player remains, the game ends.
- What happens if all players disconnect? All game state is discarded and the server resets to an
  empty lobby.
- What if two players submit the correct answer at the exact same millisecond? The server processes
  messages in the order they are received; the first to arrive wins the point.
- What if the trivia content source is unavailable when a game starts? Players are shown an error
  and the game cannot begin until the source is reachable.
- What if a player disconnects during the category vote? Their in-progress vote is discarded;
  vote thresholds recalculate based on remaining players.
- What if only 1 player is in the lobby and clicks Ready? The game does not start; a minimum of
  2 players is required.
- What if only 1 category remains for voting? The vote phase is skipped; that category is
  selected automatically and its question round begins immediately.
- What if the early-end vote initiator disconnects before the vote resolves? The vote continues
  with the remaining players; the initiator leaving does not cancel or invalidate the vote.
- What if only 1 active player remains after a mid-game disconnection? The game ends immediately
  and the podium is displayed with that player in 1st place and their current score.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow players to enter a unique display name (1–20 characters,
  printable ASCII only — characters 0x20–0x7E) to join the lobby; duplicate names MUST be
  rejected (case-insensitive); names MUST be HTML-escaped before being rendered in any client.
- **FR-002**: System MUST display all connected lobby players and their ready status in real-time
  to all connected players.
- **FR-003**: Game MUST start automatically when all connected players (minimum 2) have indicated
  Ready; no manual host action is required.
- **FR-004**: System MUST present only the remaining (not-yet-played) categories during each
  voting phase.
- **FR-005**: System MUST select the category with the most votes; ties MUST be broken by random
  selection among the tied categories.
- **FR-006**: Category voting phase MUST automatically resolve after 30 seconds, or immediately
  when all active players have cast their vote, whichever comes first; if no votes are cast,
  a random remaining category MUST be selected.
- **FR-007**: System MUST present exactly 5 questions per category round, one at a time, with 4
  multiple-choice answer options each.
- **FR-008**: Each question MUST have a 30-second answer timer; questions with no correct answer
  submitted within the time limit MUST expire and advance automatically.
- **FR-009**: Only the first player to submit the correct answer for a given question MUST receive
  1 point; all subsequent answers for that question MUST be rejected.
- **FR-010**: System MUST broadcast real-time score updates to all players immediately after each
  point is awarded.
- **FR-011**: After all available categories have been played, system MUST display a final podium
  showing the top 3 players and their scores to all players.
- **FR-012**: Players who join while a game is in progress MUST be placed in a waiting state and
  MUST NOT participate in the current game.
- **FR-013**: Waiting players MUST automatically transition to the new lobby when the current game
  ends.
- **FR-014**: Any active player MUST be able to initiate a vote to end the game early; a strict
  majority (>50%) of active players voting yes MUST end the game immediately.
- **FR-015**: All game state MUST be held in memory only and MUST NOT be persisted to any storage;
  state is discarded when the game ends or the server restarts.
- **FR-016**: System MUST gracefully handle player disconnections at any game phase, recalculating
  all thresholds (ready, vote majority) based on the remaining active player count.
- **FR-017**: System MUST reject a `lobby:join` request with a `LOBBY_FULL` error when the
  active player count has already reached the maximum of 10 players.

### Key Entities

- **Player**: Display name, connection status, ready status, current score, join timestamp.
- **Lobby**: Collection of connected players, game phase (waiting/in-progress), waiting queue.
- **Game Session**: Active players, set of all categories, set of used categories, current scores,
  current game phase (voting/question/results/podium).
- **Category**: Name, identifier, used/available status within the session.
- **Question**: Text, four answer options, correct answer index, active timer state.
- **Vote**: Player reference, voted option (category name or yes/no for early end).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can open the site, enter a name, and appear in the lobby within 5 seconds
  on a standard broadband connection.
- **SC-002**: All connected players see the same game state (votes, scores, question transitions)
  within 500 milliseconds of any state change.
- **SC-003**: A complete game session — from lobby through all categories to podium — completes
  without errors or desynchronization across all connected clients.
- **SC-004**: A player joining during an active game successfully transitions into the new lobby
  immediately when that game ends, without manual intervention.
- **SC-005**: An early-end vote that achieves majority ends the game and displays the podium
  within 2 seconds of the majority threshold being crossed.
- **SC-006**: No player name, score, or game history is retrievable after a game session ends or
  the server process restarts.
- **SC-007**: The game remains functional and consistent when a player disconnects at any point
  during a live session.

## Assumptions

- Trivia content is sourced from the Open Trivia Database public API (no registration required);
  questions are fetched per category at round start, not stored.
- Maximum 10 players per game session; there is a single shared game room (no multi-room support).
- Minimum 2 players must be connected and ready before a game can start.
- 5 questions are presented per category round.
- 30 seconds is the time limit for each question; 30 seconds is the time limit for category voting.
- Majority for early-end vote is defined as strictly more than 50% of currently active (connected)
  players at the moment votes are counted.
- Player display names are case-insensitively unique within the lobby (e.g., "Alice" and "alice"
  are treated as the same name).
- Questions are presented in multiple-choice format with exactly 4 options.
- The number of available categories is determined by what the trivia content source provides;
  all available categories are offered for voting (no pre-filtering).
- Score ties on the podium are broken by earliest join time (first to join ranks higher).
- There is no host, admin panel, or authentication system.

## E2E Testing Approach

Tests use Playwright with two browser contexts running simultaneously to simulate two competing
players. Because trivia content is fetched live from a public API, tests MUST NOT assert on
specific question text or correct answers. Instead, tests assert on:

- **State transitions**: the correct screen/phase class is active on both pages after each event
- **Mechanics**: score increments by exactly 1 for the answering player; no other player's score
  changes; buttons are disabled after an answer is submitted
- **Synchronization**: both pages show identical player lists, scores, and timers within one
  render cycle
- **Edge cases**: disconnecting one page mid-game does not crash the other; waiting room player
  transitions to lobby after game ends

**Dynamic answer strategy**: When a test must trigger a correct or incorrect answer, it clicks
the first available answer button and branches on the resulting DOM state (score changed = correct;
no score change = incorrect). Tests do not require a specific outcome — they verify the system
behaves correctly for either path.
