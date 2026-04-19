import { WebSocket } from 'ws';
import { htmlEscape } from './validate.js';

/**
 * Send a typed message to a single WebSocket client.
 * Silently skips if the socket is not open.
 * @param {WebSocket} ws
 * @param {string} type
 * @param {object} payload
 */
export function unicast(ws, type, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

/**
 * Send a typed message to every WebSocket in the iterable.
 * @param {Iterable<WebSocket>} clients
 * @param {string} type
 * @param {object} payload
 */
export function broadcast(clients, type, payload) {
  for (const ws of clients) {
    unicast(ws, type, payload);
  }
}

/**
 * Build the state:full payload for the LOBBY phase.
 * Player names are HTML-escaped before leaving the server.
 * @param {import('./game.js').GameState} state
 */
export function serializeLobbyState(state) {
  return {
    phase: state.phase,
    players: [...state.players.values()].map(p => ({
      name: htmlEscape(p.name),
      score: p.score,
      ready: p.ready,
    })),
    waitingCount: state.waitingQueue.size,
    round: null,
    vote: null,
  };
}
