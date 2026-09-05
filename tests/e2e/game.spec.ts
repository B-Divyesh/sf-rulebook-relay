import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  COURIERS,
  DEMO_DATE,
  DIRECTIONS,
  MOVE_LIMIT,
  attemptMove,
  createDemoState,
  findSolution,
  generatePuzzle,
  type GameState,
  type Move,
  type Puzzle,
} from '../../src/game';

async function muteDemo(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('rr:demo:settings', JSON.stringify({ sound: false, reduceMotion: false }));
  });
}

async function playMoves(page: Page, moves: Move[], startMoves: number): Promise<void> {
  let expectedMoves = startMoves;
  for (const move of moves) {
    await page.locator(`.courier-picker [data-select="${move.courier}"]`).click();
    await page.locator(`[data-direction="${move.direction}"]`).click();
    expectedMoves += 1;
    await expect(page.locator('.score-strip span').first()).toContainText(`${expectedMoves} / ${MOVE_LIMIT}`);
  }
}

function lossPath(puzzle: Puzzle, initial: GameState): Move[] {
  const moves: Move[] = [];
  let state = initial;
  while (state.moves < MOVE_LIMIT) {
    let next: { move: Move; state: GameState } | null = null;
    for (let courier = 0; courier < COURIERS.length && next === null; courier += 1) {
      for (const direction of DIRECTIONS) {
        const move = { courier, direction };
        const result = attemptMove(state, puzzle, move);
        if (result.accepted && result.state.status !== 'won') {
          next = { move, state: result.state };
          break;
        }
      }
    }
    if (next === null) throw new Error('Could not construct a playable loss path.');
    moves.push(next.move);
    state = next.state;
  }
  return moves;
}

test('@claim:complete-run a player can finish the sample and reach the win screen', async ({ page }) => {
  await muteDemo(page);
  await page.goto('/demo');
  const puzzle = generatePuzzle(DEMO_DATE);
  const sample = createDemoState(puzzle);
  const solution = findSolution(puzzle, sample);
  expect(solution).not.toBeNull();
  await playMoves(page, solution ?? [], sample.moves);
  const dialog = page.locator('[data-end-dialog]');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'All three couriers arrived' })).toBeVisible();
  await expect(dialog).toHaveScreenshot('completed-sample-end-screen.png');
});

test('@claim:restart-reset restarting after a result restores the whole board', async ({ page }) => {
  await muteDemo(page);
  await page.goto('/demo');
  const puzzle = generatePuzzle(DEMO_DATE);
  const sample = createDemoState(puzzle);
  await playMoves(page, findSolution(puzzle, sample) ?? [], sample.moves);
  await page.getByRole('button', { name: 'Restart puzzle' }).click();
  await expect(page.locator('.score-strip span').first()).toContainText(`0 / ${MOVE_LIMIT}`);
  for (let index = 0; index < COURIERS.length; index += 1) {
    const { x, y } = { x: puzzle.starts[index] % 6, y: Math.floor(puzzle.starts[index] / 6) };
    await expect(page.getByRole('button', { name: new RegExp(`Select ${COURIERS[index].name} courier at row ${y + 1}, column ${x + 1}`) })).toBeVisible();
  }
});

test('@claim:settings-persist sample sound and motion settings survive reload', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await page.getByLabel('Play move sounds').uncheck();
  await page.getByLabel('Reduce board motion').check();
  await page.reload();
  await expect(page.getByLabel('Play move sounds')).not.toBeChecked();
  await expect(page.getByLabel('Reduce board motion')).toBeChecked();
});

test('@claim:demo-isolation sample play and reset never change real progress', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('rr:real:proof', 'keep-this-value');
    localStorage.setItem('rr:real:settings', JSON.stringify({ sound: true, reduceMotion: false }));
  });
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await page.getByRole('button', { name: 'Try the rule' }).click();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  const realData = await page.evaluate(() => ({
    proof: localStorage.getItem('rr:real:proof'),
    settings: localStorage.getItem('rr:real:settings'),
  }));
  expect(realData).toEqual({ proof: 'keep-this-value', settings: JSON.stringify({ sound: true, reduceMotion: false }) });
});

test('@claim:local-only a complete sample interaction contacts only this site', async ({ page }) => {
  const requests: Array<{ method: string; url: string }> = [];
  page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
  await muteDemo(page);
  await page.goto('/demo');
  await expect(page.getByText('Free to play.')).toBeVisible();
  await expect(page.locator('a[href*="checkout"], a[href*="billing"], a[href*="login"], a[href*="signup"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Try the rule' }).click();
  const puzzle = generatePuzzle(DEMO_DATE);
  const sample = createDemoState(puzzle);
  const firstMove = findSolution(puzzle, sample)?.[0];
  expect(firstMove).toBeDefined();
  await playMoves(page, firstMove === undefined ? [] : [firstMove], sample.moves);
  const savedGame = await page.evaluate(() => localStorage.getItem('rr:demo:game'));
  expect(savedGame).toContain(`\"moves\":${sample.moves + 1}`);
  expect(new Set(requests.map((request) => new URL(request.url).origin))).toEqual(new Set(['http://127.0.0.1:4173']));
  expect(requests.every((request) => request.method === 'GET')).toBe(true);
  expect(requests.every((request) => /^(\/$|\/demo$|\/settings$|\/privacy$|\/terms$|\/index\.html$|\/sw\.js$|\/manifest\.webmanifest$|\/icons\/|\/assets\/)/.test(new URL(request.url).pathname))).toBe(true);
});

test('@claim:offline-reload the sample reloads and remains playable offline', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await muteDemo(page);
    await page.goto('http://127.0.0.1:4173/demo');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await page.waitForFunction(async () => {
      const keys = await caches.keys();
      const entries = (await Promise.all(keys.map(async (key) => {
        const cache = await caches.open(key);
        return Promise.all((await cache.keys()).map(async (request) => ({
          url: request.url,
          bytes: (await (await cache.match(request))?.clone().arrayBuffer())?.byteLength ?? 0,
        })));
      }))).flat();
      return entries.some((entry) => entry.url.endsWith('.js') && entry.bytes > 1_000)
        && entries.some((entry) => entry.url.endsWith('.css') && entry.bytes > 1_000);
    });
    await context.setOffline(true);
    await page.waitForTimeout(250);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Finish a sample courier puzzle' })).toBeVisible();
    await page.getByRole('button', { name: 'Try the rule' }).click();
    await expect(page.getByText(/Example complete/)).toBeVisible();
  } finally {
    await context.close();
  }
});

test('@claim:frame-rate board loop stays above 50 fps with four-times CPU slowdown', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  try {
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await muteDemo(page);
    await page.goto('http://127.0.0.1:4173/demo');
    await page.waitForTimeout(2_000);
    const metrics = await page.evaluate(() => {
      const samples = window.rulebookRelayMetrics?.frameTimes.slice(-120) ?? [];
      const elapsed = samples.reduce((sum, value) => sum + value, 0);
      return { frames: samples.length, fps: elapsed > 0 ? (samples.length * 1000) / elapsed : 0 };
    });
    expect(metrics.frames).toBeGreaterThan(50);
    expect(metrics.fps).toBeGreaterThanOrEqual(50);
    await expect(page).toHaveScreenshot('sample-mobile.png', { fullPage: true });
  } finally {
    await context.close();
  }
});

test('@claim:loss-screen the move cap reaches a loss screen through real controls', async ({ page }) => {
  await muteDemo(page);
  await page.goto('/demo');
  const puzzle = generatePuzzle(DEMO_DATE);
  const sample = createDemoState(puzzle);
  await playMoves(page, lossPath(puzzle, sample), sample.moves);
  await expect(page.getByRole('heading', { name: 'This route ran out of moves' })).toBeVisible();
});

test('@claim:input-controls keyboard, pointer controls, and swipe all move the game', async ({ page }) => {
  await muteDemo(page);
  await page.goto('/demo');
  const puzzle = generatePuzzle(DEMO_DATE);
  let state = createDemoState(puzzle);
  const first = findSolution(puzzle, state)?.[0];
  expect(first).toBeDefined();
  const board = page.locator('[data-board]');
  await board.focus();
  await board.press(String((first?.courier ?? 0) + 1));
  const keyName = (first?.direction ?? 'right');
  await board.press(`Arrow${keyName[0].toUpperCase()}${keyName.slice(1)}`);
  state = attemptMove(state, puzzle, first as Move).state;
  await expect(page.locator('.score-strip span').first()).toContainText(`${state.moves} / ${MOVE_LIMIT}`);

  const second = findSolution(puzzle, state)?.[0];
  expect(second).toBeDefined();
  await page.locator(`.courier-picker [data-select="${second?.courier}"]`).click();
  const delta: Record<string, [number, number]> = {
    up: [0, -60], right: [60, 0], down: [0, 60], left: [-60, 0],
  };
  const [dx, dy] = delta[second?.direction ?? 'right'];
  await board.dispatchEvent('pointerdown', { clientX: 120, clientY: 120, pointerId: 1 });
  await board.dispatchEvent('pointerup', { clientX: 120 + dx, clientY: 120 + dy, pointerId: 1 });
  state = attemptMove(state, puzzle, second as Move).state;
  await expect(page.locator('.score-strip span').first()).toContainText(`${state.moves} / ${MOVE_LIMIT}`);

  const third = findSolution(puzzle, state)?.[0];
  expect(third).toBeDefined();
  await page.locator(`.courier-picker [data-select="${third?.courier}"]`).click();
  await page.locator(`[data-direction="${third?.direction}"]`).click();
  state = attemptMove(state, puzzle, third as Move).state;
  await expect(page.locator('.score-strip span').first()).toContainText(`${state.moves} / ${MOVE_LIMIT}`);

  await page.getByRole('button', { name: 'Pause game' }).click();
  await expect(page.getByText('Game paused', { exact: true })).toBeVisible();
  await page.locator('[data-resume]').click();
  await page.getByRole('button', { name: 'Try the rule' }).click();
  await expect(page.getByText(/Example complete/)).toBeVisible();
});

test('malformed saved progress recovers to a playable board', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rr:demo:game', '{broken'));
  await page.goto('/demo');
  await expect(page.getByText('Saved progress could not be read. A fresh puzzle was loaded.')).toBeVisible();
  await expect(page.locator('[data-board]')).toBeVisible();
});

test('desktop routes have unique titles, one h1, landmarks, and no serious axe findings', async ({ page }) => {
  const routes: Array<[string, string]> = [
    ['/', 'Rulebook Relay — Daily courier puzzle'],
    ['/demo', 'Demo — Rulebook Relay'],
    ['/settings', 'Settings — Rulebook Relay'],
    ['/privacy', 'Privacy — Rulebook Relay'],
    ['/terms', 'Terms — Rulebook Relay'],
    ['/missing-page', 'Page not found — Rulebook Relay'],
  ];
  for (const [route, title] of routes) {
    await page.goto(route);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    const results = await new AxeBuilder({ page: page as never }).analyze();
    const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
    expect(serious, `${route}: ${serious.map((item) => item.id).join(', ')}`).toEqual([]);
  }
});

test('phone first screen states the job, audience, action, facts, and shows the board', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4173/');
    await expect(page.getByRole('heading', { name: 'Deliver three couriers before 40 moves' })).toBeVisible();
    await expect(page.getByText(/For daily-puzzle players/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
    await expect(page.getByText('Free to play.')).toBeVisible();
    const boardBox = await page.locator('[data-board]').boundingBox();
    expect(boardBox).not.toBeNull();
    expect(boardBox?.y).toBeLessThan(844);
  } finally {
    await context.close();
  }
});
