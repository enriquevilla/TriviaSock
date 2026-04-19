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
