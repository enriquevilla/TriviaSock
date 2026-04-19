import { connect } from './ws.js';
import { clientState, applyState } from './state.js';
import { renderLobby, updateLobbyPlayers } from './screens/lobby.js';

const ws = connect();

// Map GamePhase values to screen div id suffixes
const SCREEN_MAP = {
  lobby:           'lobby',
  waiting:         'waiting',
  voting:          'voting',
  question_active: 'question',
  question_result: 'question',
  round_end:       'round-results',
  game_over:       'podium',
};

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
  document.getElementById(`screen-${id}`)?.classList.remove('hidden');
}

/**
 * Route to the correct screen based on clientState.phase.
 * Screen-specific render functions are imported and wired up as each
 * screen module is implemented (Phase 3 onward).
 */
function route() {
  const screenId = SCREEN_MAP[clientState.phase];
  if (screenId) showScreen(screenId);

  if (clientState.phase === 'lobby') {
    renderLobby(clientState);
    updateLobbyPlayers(clientState.players ?? []);
  }
}

ws.on('state:full', (payload) => {
  applyState(payload);
  route();
});

ws.on('waiting', () => {
  showScreen('waiting');
});

export { ws };
