import { NAME_INPUT, JOIN_BTN, READY_BTN, PHASE_INDICATOR, PLAYER_SCORE_ROW } from './selectors.js';

/**
 * Fill the name input and submit to join the lobby.
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 */
export async function joinAs(page, name) {
  await page.fill(NAME_INPUT, name);
  await page.click(JOIN_BTN);
}

/**
 * Click Ready on both pages (order: p1 then p2).
 * @param {import('@playwright/test').Page} p1
 * @param {import('@playwright/test').Page} p2
 */
export async function bothReady(p1, p2) {
  await p1.click(READY_BTN);
  await p2.click(READY_BTN);
}

/**
 * Wait for the screen with the given phase data-attribute or id suffix to become visible.
 * Matches against the active (non-hidden) screen's id, e.g. awaitPhase(page, 'voting').
 * @param {import('@playwright/test').Page} page
 * @param {string} phase  — one of: lobby, waiting, voting, question, round-results, podium
 */
export async function awaitPhase(page, phase) {
  await page.waitForSelector(`#screen-${phase}:not(.hidden)`, { timeout: 10000 });
}

/**
 * Read the displayed score for a named player from the player list DOM.
 * Returns the numeric score, or NaN if the element is not found.
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 */
export async function getScore(page, name) {
  const row = page.locator(PLAYER_SCORE_ROW, { hasText: name });
  const scoreText = await row.locator('.score').textContent();
  return parseInt(scoreText ?? 'NaN', 10);
}
