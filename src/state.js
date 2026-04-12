/**
 * Client-side display state — a read-only mirror of the server's serialized state.
 * Updated by applyState() on every state:full message received from the server.
 * Screen modules read from this object to render the UI.
 */
export const clientState = {
  phase: null,        // GamePhase string (see server/game.js GamePhase enum)
  players: [],        // SerializedPlayer[] — active players only
  waitingCount: 0,    // number of players in the waiting queue
  round: null,        // SerializedRound | null
  vote: null,         // SerializedVote | null
};

/**
 * Merge an incoming state:full payload into clientState.
 * Replaces all top-level fields so the client always reflects server state exactly.
 * @param {object} incoming  — payload from a state:full message
 */
export function applyState(incoming) {
  Object.assign(clientState, incoming);
}
