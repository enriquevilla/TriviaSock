import { unicast, broadcast, serializeLobbyState } from './broadcast.js';
import { validate, errorPayload } from './validate.js';
import { addPlayer, GamePhase, checkAllReady } from './game.js';

/**
 * Handler registry — populated by registerHandler() as each phase is implemented.
 * Key: message type string  Value: (ws, payload, state) => void
 */
const handlers = {};

/**
 * Register a handler for a given message type.
 * Called during server startup by each feature module (lobby, voting, etc.).
 * @param {string} type
 * @param {(ws: WebSocket, payload: object, state: object) => void} fn
 */
export function registerHandler(type, fn) {
  handlers[type] = fn;
}

/**
 * Parse and dispatch an incoming WebSocket message.
 *
 * Flow:
 *  1. Parse JSON — unicast INVALID_MESSAGE on failure
 *  2. Validate that `type` is a string — unicast INVALID_MESSAGE on failure
 *  3. Check authentication: if ws is not in state.players or state.waitingQueue
 *     and type is not 'lobby:join', unicast NOT_AUTHENTICATED and return
 *  4. Look up handler — unicast INVALID_MESSAGE for unknown types
 *  5. Call handler(ws, payload, state)
 *
 * @param {import('ws').WebSocket} ws
 * @param {string} rawMessage
 * @param {import('./game.js').GameState} state
 */
export function dispatch(ws, rawMessage, state) {
  let msg;
  try {
    msg = JSON.parse(rawMessage);
  } catch {
    unicast(ws, 'error', errorPayload('INVALID_MESSAGE', 'Malformed JSON.'));
    return;
  }

  if (!validate(msg, { type: 'string' })) {
    unicast(ws, 'error', errorPayload('INVALID_MESSAGE', 'Message must include a string "type" field.'));
    return;
  }

  const { type, payload = {} } = msg;

  const isAuthenticated = state.players.has(ws) || state.waitingQueue.has(ws);
  if (!isAuthenticated && type !== 'lobby:join') {
    unicast(ws, 'error', errorPayload('NOT_AUTHENTICATED', 'Send lobby:join before any other message.'));
    return;
  }

  const handler = handlers[type];
  if (!handler) {
    unicast(ws, 'error', errorPayload('INVALID_MESSAGE', `Unknown message type: "${type}".`));
    return;
  }

  handler(ws, payload, state);
}

// ---------------------------------------------------------------------------
// Lobby handlers
// ---------------------------------------------------------------------------

registerHandler('lobby:join', (ws, payload, state) => {
  if (!validate(payload, { name: 'string' })) {
    unicast(ws, 'error', errorPayload('NAME_INVALID', 'Payload must include a string "name" field.'));
    return;
  }

  const result = addPlayer(ws, payload.name);
  if (typeof result === 'string') {
    unicast(ws, 'error', errorPayload(result, `Could not join: ${result}.`));
    return;
  }

  broadcast(state.players.keys(), 'state:full', serializeLobbyState(state));
});

registerHandler('lobby:ready', (ws, payload, state) => {
  if (state.phase !== GamePhase.LOBBY) {
    unicast(ws, 'error', errorPayload('NOT_IN_LOBBY', 'lobby:ready is only valid during the lobby phase.'));
    return;
  }

  const player = state.players.get(ws);
  if (!player) {
    unicast(ws, 'error', errorPayload('NOT_AUTHENTICATED', 'Player not found in lobby.'));
    return;
  }

  player.ready = true;
  broadcast(state.players.keys(), 'state:full', serializeLobbyState(state));
  checkAllReady();
});
