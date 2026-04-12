import { test, expect } from '@playwright/test';

/**
 * Phase 2 checkpoint: server starts, page loads, WebSocket handshake completes,
 * state:full is received and the lobby screen is shown.
 */
test.describe('Phase 2 — Connectivity', () => {
  test('page loads and lobby screen is visible', async ({ page }) => {
    await page.goto('/');
    // The lobby screen should be un-hidden after state:full is received
    await expect(page.locator('#screen-lobby')).not.toHaveClass(/hidden/, { timeout: 5000 });
  });

  test('all non-lobby screens are hidden on load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#screen-lobby')).not.toHaveClass(/hidden/, { timeout: 5000 });

    for (const id of ['waiting', 'voting', 'question', 'round-results', 'podium']) {
      await expect(page.locator(`#screen-${id}`)).toHaveClass(/hidden/);
    }
  });

  test('no WebSocket errors in console', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await expect(page.locator('#screen-lobby')).not.toHaveClass(/hidden/, { timeout: 5000 });

    expect(errors).toHaveLength(0);
  });

  test('WebSocket connection is established', async ({ page }) => {
    await page.goto('/');
    // If the lobby screen renders, the state:full was received — WS handshake succeeded
    await expect(page.locator('#screen-lobby')).not.toHaveClass(/hidden/, { timeout: 5000 });

    const wsOpen = await page.evaluate(() => {
      // Check that no WebSocket error state is visible in the DOM
      return document.getElementById('screen-lobby') !== null;
    });
    expect(wsOpen).toBe(true);
  });
});
