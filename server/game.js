import { broadcast } from './broadcast.js';
import { htmlEscape } from './validate.js';

export const GamePhase = {
  LOBBY:           'lobby',
  VOTING:          'voting',
  QUESTION_ACTIVE: 'question_active',
  QUESTION_RESULT: 'question_result',
  ROUND_END:       'round_end',
  GAME_OVER:       'game_over',
};

/**
 * Returns a fresh, empty GameState object.
 * All Maps and Sets are new instances so state is never accidentally shared.
 *
 * players and waitingQueue are keyed by WebSocket reference (not player UUID),
 * matching the pattern described in data-model.md.
 */
export function createInitialState() {
  return {
    phase: GamePhase.LOBBY,
    players: new Map(),       // Map<ws, Player>
    categories: [],           // Category[] — populated on game start
    usedCategoryIds: new Set(),
    currentRound: null,       // RoundState | null
    votes: null,              // VoteState | null
    waitingQueue: new Map(),  // Map<ws, Player>
  };
}

/** Singleton game state — the single source of truth for the server. */
export const state = createInitialState();

/**
 * Serialize the current state for broadcast to active clients.
 * Phase-sensitive fields (correctIndex, pointWinner) are omitted during
 * QUESTION_ACTIVE — added back in QUESTION_RESULT by the question handler.
 */
export function serializeState(s) {
  const serialized = {
    phase: s.phase,
    players: [...s.players.values()].map(p => ({
      name: htmlEscape(p.name),
      score: p.score,
      ready: p.ready,
    })),
    waitingCount: s.waitingQueue.size,
    round: null,
    vote: null,
  };

  if (s.currentRound) {
    const q = s.currentRound.questions[s.currentRound.currentIndex];
    const questionPayload = {
      text: q.text,
      options: q.options,
    };
    if (s.phase === GamePhase.QUESTION_RESULT) {
      questionPayload.correctIndex = q.correctIndex;
      questionPayload.pointWinner = q.pointWinner;
    }
    serialized.round = {
      category: s.currentRound.category,
      questionIndex: s.currentRound.currentIndex + 1,
      totalQuestions: s.currentRound.questions.length,
      question: questionPayload,
      timerRemaining: s.currentRound.timerRemaining,
    };
  }

  if (s.votes) {
    if (s.votes.type === 'category') {
      const tally = {};
      for (const catName of s.votes.votes.values()) {
        tally[catName] = (tally[catName] ?? 0) + 1;
      }
      serialized.vote = {
        type: 'category',
        categories: s.categories
          .filter(c => !s.usedCategoryIds.has(c.id))
          .map(c => ({ name: c.name, votes: tally[c.name] ?? 0 })),
        timerRemaining: s.votes.timerRemaining,
      };
    } else if (s.votes.type === 'early_end') {
      let yes = 0, no = 0;
      for (const v of s.votes.votes.values()) {
        v === true ? yes++ : no++;
      }
      serialized.vote = {
        type: 'early_end',
        tally: { yes, no },
        timerRemaining: s.votes.timerRemaining,
        initiatedBy: s.votes.initiatedBy,
      };
    }
  }

  return serialized;
}

// ---------------------------------------------------------------------------
// Stub functions — filled in by later tasks as each phase is implemented.
// These stubs exist so that handleMidGameDisconnect and other Phase 2 code
// can reference them without forward-declaration errors.
// ---------------------------------------------------------------------------

/** Ends the current game and transitions to GAME_OVER. Filled in: T047 (Phase 6). */
export function endGame() { /* stub */ }

/** Resolves the active category vote. Filled in: T030 (Phase 4). */
export function resolveVote() { /* stub */ }

/** Resolves the active early-end vote. Filled in: T062 (Phase 8). */
export function resolveEarlyEndVote() { /* stub */ }

// ---------------------------------------------------------------------------
// Disconnect handling
// ---------------------------------------------------------------------------

/**
 * Handle a WebSocket disconnection that occurs while a game is in progress
 * (any phase other than LOBBY and GAME_OVER).
 *
 * Responsibilities:
 *  - Remove the player from state.players (and waitingQueue if present)
 *  - End the game immediately if ≤1 active players remain
 *  - Re-evaluate vote thresholds if a category or early-end vote is active
 *  - Broadcast updated state:full to remaining active clients
 *
 * Called from server/index.js on WebSocket 'close' event.
 * @param {import('ws').WebSocket} ws
 */
export function handleMidGameDisconnect(ws) {
  // Remove from waiting queue (no further action needed for waiting players)
  if (state.waitingQueue.has(ws)) {
    state.waitingQueue.delete(ws);
    return;
  }

  // Remove from active players
  if (!state.players.has(ws)) return;
  state.players.delete(ws);

  const activePlayers = state.players.size;

  // If only 0 or 1 players remain, end the game immediately
  if (activePlayers <= 1) {
    endGame();
    return;
  }

  // Re-evaluate category vote threshold
  if (state.votes?.type === 'category') {
    const voted = state.votes.votes;
    // Remove the disconnected player's vote if present
    voted.delete(ws);
    // Check if all remaining players have now voted
    if (voted.size >= activePlayers) {
      resolveVote();
      return;
    }
  }

  // Re-evaluate early-end vote threshold
  if (state.votes?.type === 'early_end') {
    state.votes.votes.delete(ws);
    resolveEarlyEndVote();
    return;
  }

  // Broadcast updated state to remaining active clients
  broadcast(state.players.keys(), 'state:full', serializeState(state));
}
