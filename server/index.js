import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { dispatch } from './handlers.js';
import { unicast, broadcast, serializeLobbyState } from './broadcast.js';
import { state, GamePhase, serializeState, handleMidGameDisconnect, resetState } from './game.js';

const PORT = 3001;
const PROD = process.env.NODE_ENV === 'production';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'dist');

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

const MOCK = process.env.TRIVIA_MOCK === 'true';

const server = http.createServer((req, res) => {
  // Test-only reset endpoint: terminates all connections and wipes state.
  if (MOCK && req.method === 'POST' && req.url === '/test/reset') {
    resetState();
    res.writeHead(200);
    res.end('ok');
    return;
  }

  if (!PROD) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  // Serve static files from dist/ in production
  let filePath = path.join(DIST_DIR, req.url === '/' ? '/index.html' : req.url);
  // Prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end();
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Fall back to index.html for SPA client-side routing
      fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, html) => {
        if (err2) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  // New connection: send current state immediately (read-only observer)
  unicast(ws, 'state:full', serializeState(state));

  ws.on('message', (raw) => {
    dispatch(ws, raw.toString(), state);
  });

  ws.on('close', () => {
    if (state.phase === GamePhase.LOBBY) {
      state.players.delete(ws);
      state.waitingQueue.delete(ws);
      broadcast(state.players.keys(), 'state:full', serializeLobbyState(state));
    } else if (state.phase !== GamePhase.GAME_OVER) {
      handleMidGameDisconnect(ws);
    } else {
      state.players.delete(ws);
      state.waitingQueue.delete(ws);
    }
  });
});

server.listen(PORT, () => {
  console.log(`TriviaSock server listening on port ${PORT}`);
});
