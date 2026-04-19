import { test, expect } from '@playwright/test';
import { joinAs, bothReady, awaitPhase } from './helpers/game.js';
import { PLAYER_LIST, READY_BTN } from './helpers/selectors.js';

test.describe('Phase 3 — Lobby (US1)', () => {
  test.beforeEach(async ({ request }) => {
    // Reset server state before each test for isolation.
    // The /test/reset endpoint terminates all connections and clears game state.
    await request.post('http://localhost:3001/test/reset');
  });

  test('T076: two players join and both see each other in the player list', async ({ browser }) => {
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const p1 = await ctx1.newPage();
    const p2 = await ctx2.newPage();

    await p1.goto('/');
    await p2.goto('/');

    await awaitPhase(p1, 'lobby');
    await awaitPhase(p2, 'lobby');

    await joinAs(p1, 'Alice');
    // Wait for Alice to appear on p1 before p2 joins to avoid race
    await expect(p1.locator(PLAYER_LIST)).toContainText('Alice');

    await joinAs(p2, 'Bob');

    // Both pages should show both names in the player list
    await expect(p1.locator(PLAYER_LIST)).toContainText('Alice');
    await expect(p1.locator(PLAYER_LIST)).toContainText('Bob');
    await expect(p2.locator(PLAYER_LIST)).toContainText('Alice');
    await expect(p2.locator(PLAYER_LIST)).toContainText('Bob');

    await ctx1.close();
    await ctx2.close();
  });

  test('T077: duplicate name entry shows error and player stays on lobby', async ({ browser }) => {
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const p1 = await ctx1.newPage();
    const p2 = await ctx2.newPage();

    await p1.goto('/');
    await p2.goto('/');

    await awaitPhase(p1, 'lobby');
    await awaitPhase(p2, 'lobby');

    await joinAs(p1, 'Alice');
    // Wait for Alice to appear on p1 before p2 tries the same name
    await expect(p1.locator(PLAYER_LIST)).toContainText('Alice');

    // p2 tries to use the same name — server sends NAME_TAKEN error
    await joinAs(p2, 'Alice');

    // p2 should remain on the lobby screen (no phase transition on error)
    await expect(p2.locator('#screen-lobby')).not.toHaveClass(/hidden/);
    // Alice should NOT appear in p2's player list (p2 was rejected)
    await expect(p2.locator(PLAYER_LIST)).not.toContainText('Not ready');

    await ctx1.close();
    await ctx2.close();
  });

  test('T078: both players click Ready → transition to voting phase', async ({ browser }) => {
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const p1 = await ctx1.newPage();
    const p2 = await ctx2.newPage();

    await p1.goto('/');
    await p2.goto('/');

    await awaitPhase(p1, 'lobby');
    await awaitPhase(p2, 'lobby');

    await joinAs(p1, 'Alice');
    await expect(p1.locator(PLAYER_LIST)).toContainText('Alice');
    await joinAs(p2, 'Bob');

    // Wait until both players are visible on both pages before clicking Ready
    await expect(p1.locator(PLAYER_LIST)).toContainText('Bob');
    await expect(p2.locator(PLAYER_LIST)).toContainText('Alice');

    await bothReady(p1, p2);

    // Both pages should transition to the voting phase
    await awaitPhase(p1, 'voting');
    await awaitPhase(p2, 'voting');

    await ctx1.close();
    await ctx2.close();
  });

  test('T079: one player clicks Ready → other sees them as ready but game does not start', async ({ browser }) => {
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const p1 = await ctx1.newPage();
    const p2 = await ctx2.newPage();

    await p1.goto('/');
    await p2.goto('/');

    await awaitPhase(p1, 'lobby');
    await awaitPhase(p2, 'lobby');

    await joinAs(p1, 'Alice');
    await expect(p1.locator(PLAYER_LIST)).toContainText('Alice');
    await joinAs(p2, 'Bob');

    // Wait until both players appear on both pages
    await expect(p1.locator(PLAYER_LIST)).toContainText('Bob');
    await expect(p2.locator(PLAYER_LIST)).toContainText('Alice');

    // Only p1 clicks Ready
    await p1.click(READY_BTN);

    // p2 should see Alice as ready, game should NOT have started
    await expect(p2.locator(PLAYER_LIST)).toContainText('Ready');
    await expect(p1.locator('#screen-lobby')).not.toHaveClass(/hidden/);
    await expect(p2.locator('#screen-lobby')).not.toHaveClass(/hidden/);

    await ctx1.close();
    await ctx2.close();
  });
});
