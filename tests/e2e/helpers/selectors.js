// Centralised DOM selectors — update here when the markup changes

export const NAME_INPUT = '#name-input';
export const JOIN_BTN = '#join-btn';
export const READY_BTN = '#ready-btn';
export const PLAYER_LIST = '#player-list';

export const PHASE_INDICATOR = '#app > .screen:not(.hidden)';

export const VOTE_OPTIONS = '.vote-option';
export const VOTE_TALLY = '.vote-tally';
export const VOTE_TIMER = '#vote-timer';

export const QUESTION_TEXT = '#question-text';
export const ANSWER_BTNS = '.answer-btn';
export const QUESTION_TIMER = '#question-timer';
export const CORRECT_INDICATOR = '#correct-indicator';
export const POINT_WINNER = '#point-winner';

export const SCORE = (name) => `[data-player="${CSS.escape(name)}"] .score`;
export const PLAYER_SCORE_ROW = '.player-score-row';

export const PODIUM = '#screen-podium';
export const PODIUM_ENTRIES = '.podium-entry';
export const PLAY_AGAIN_BTN = '#play-again-btn';

export const EARLY_END_BTN = '#early-end-btn';
export const EARLY_END_VOTE_YES = '#early-end-yes';
export const EARLY_END_VOTE_NO = '#early-end-no';
export const EARLY_END_TALLY = '#early-end-tally';

export const WAITING_SCREEN = '#screen-waiting';
export const ROUND_RESULTS_SCREEN = '#screen-round-results';
