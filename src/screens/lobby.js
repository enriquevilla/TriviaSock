import { ws } from '../main.js';

const screen = document.getElementById('screen-lobby');

let joined = false;
let joinForm = null;

function buildJoinForm() {
  const form = document.createElement('form');
  form.id = 'join-form';

  const input = document.createElement('input');
  input.id = 'name-input';
  input.type = 'text';
  input.placeholder = 'Your name';
  input.maxLength = 20;
  input.autocomplete = 'off';
  input.required = true;

  const btn = document.createElement('button');
  btn.id = 'join-btn';
  btn.type = 'submit';
  btn.textContent = 'Join';

  form.appendChild(input);
  form.appendChild(btn);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = input.value.trim();
    if (!name) return;
    ws.send('lobby:join', { name });
    form.remove();
    joinForm = null;
    joined = true;
  });

  return form;
}

export function renderLobby(state) {
  if (!joined && !joinForm) {
    joinForm = buildJoinForm();
    screen.prepend(joinForm);
  }
}

export function updateLobbyPlayers(players) {
  let list = document.getElementById('player-list');
  if (!list) {
    list = document.createElement('ul');
    list.id = 'player-list';
    screen.appendChild(list);
  }

  list.innerHTML = '';
  for (const player of players) {
    const li = document.createElement('li');
    li.className = 'player-score-row';
    li.dataset.player = player.name;

    const nameEl = document.createElement('span');
    nameEl.className = 'player-name';
    nameEl.textContent = player.name;

    const statusEl = document.createElement('span');
    statusEl.className = 'ready-status';
    statusEl.textContent = player.ready ? 'Ready' : 'Not ready';

    const scoreEl = document.createElement('span');
    scoreEl.className = 'score';
    scoreEl.textContent = player.score;

    li.appendChild(nameEl);
    li.appendChild(statusEl);
    li.appendChild(scoreEl);
    list.appendChild(li);
  }
}
