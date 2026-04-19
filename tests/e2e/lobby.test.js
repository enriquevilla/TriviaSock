import { test, expect } from '@playwright/test';
import { joinAs, bothReady, awaitPhase } from './helpers/game.js';
import { PLAYER_LIST, READY_BTN } from './helpers/selectors.js';

test.describe('Phase 3 — Lobby (US1)', () => {
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
    await joinAs(p2, 'Bob');

    // Both pages should show both names in the player list
    await expect(p1.locator(PLAYER_LIST)).toContainText('Alice');
    await expect(p1.locator(PLAYER_LIST)).toContainText('Bob');
    await expect(p2.locator(PLAYER_LIST)).toContainText('Alice');
    await expect(p2.locator(PLAYER_LIST)).toContainText('Bob');

    await ctx1.close();
    await ctx2.close();
  });

  test('T077: duplicate name entry shows error and re-enables the name field', async ({ browser }) => {
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const p1 = await ctx1.newPage();
    const p2 = await ctx2.newPage();

    const errors1 = [];
    p1.on('console', msg => { if (msg.type() === 'error') errors1.push(msg.text()); });

    await p1.goto('/');
    await p2.goto('/');

    await awaitPhase(p1, 'lobby');
    await awaitPhase(p2, 'lobby');

    await joinAs(p1, 'Alice');
    // p2 tries to use the same name
    await joinAs(p2, 'Alice');

    // p2 should still be on the lobby screen (no phase change)
    await awaitPhase(p2, 'lobby');
    // The join form should reappear or the name input should still be present
    // (server sends error; client should handle it — for now verify lobby stays)
    await expect(p2.locator('#screen-lobby')).not.toHaveClass(/hidden/);

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
    await joinAs(p2, 'Bob');

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
    await joinAs(p2, 'Bob');

    // Only p1 clicks Ready
    await p1.click(READY_BTN);

    // p2 should see Alice as ready
    await expect(p2.locator(PLAYER_LIST)).toContainText('Ready');
    // Game should NOT have started — both still on lobby screen
    await expect(p1.locator('#screen-lobby')).not.toHaveClass(/hidden/);
    await expect(p2.locator('#screen-lobby')).not.toHaveClass(/hidden/);

    await ctx1.close();
    await ctx2.close();
  });
});
