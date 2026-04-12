import { WebSocket } from 'ws';

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
