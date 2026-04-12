// Derive WebSocket URL dynamically:
//   dev  — Vite serves on 5173; WS server is on 3001 of the same hostname
//   prod — single server serves both HTTP and WS on the same origin
const isDev = window.location.port === '5173';
const wsUrl = isDev
  ? `ws://${window.location.hostname}:3001`
  : `ws://${window.location.host}`;

/**
 * Open a WebSocket connection and return a simple { send, on } interface.
 *
 * @returns {{ send: (type: string, payload?: object) => void,
 *             on:   (type: string, handler: (payload: object) => void) => void }}
 */
export function connect() {
  const ws = new WebSocket(wsUrl);
  const handlers = {};

  ws.addEventListener('message', (event) => {
    let msg;
    try { msg = JSON.parse(event.data); } catch { return; }
    const handler = handlers[msg.type];
    if (handler) handler(msg.payload);
  });

  return {
    send(type, payload = {}) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, payload }));
      }
    },
    on(type, handler) {
      handlers[type] = handler;
    },
  };
}
