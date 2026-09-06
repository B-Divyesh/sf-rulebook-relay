import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createDemoState, DEMO_DATE, findSolution, generatePuzzle } from '../../../src/game.ts';

const base = 'https://rulebook-relay.sociobot.in';
const output = new URL('./', import.meta.url).pathname;
await mkdir(output, { recursive: true });

function check(value, message) {
  if (!value) throw new Error(message);
}

async function score(page) {
  return (await page.locator('.score-strip span').first().innerText()).replace(/\s+/g, ' ').trim();
}

async function touchTap(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  check(box, 'Touch target had no box.');
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

const browser = await chromium.launch();
const evidence = {
  runAt: new Date().toISOString(),
  base,
  desktop: {},
  phone: {},
  accessibility: [],
  keyboard: {},
  reducedMotion: {},
  offline: {},
  deletion: {},
  routes: [],
  errors: [],
};

try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  const page = await context.newPage();
  const requests = [];
  page.on('request', request => requests.push({ method: request.method(), url: request.url() }));
  page.on('console', message => { if (message.type() === 'error') evidence.errors.push(`desktop console: ${message.text()}`); });
  page.on('pageerror', error => evidence.errors.push(`desktop page: ${error.message}`));
  await page.addInitScript(() => {
    localStorage.setItem('rr:real:review3', 'keep-real');
    localStorage.setItem('rr:demo:settings', JSON.stringify({ sound: false, reduceMotion: false }));
  });
  const homeResponse = await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  const homeBoard = await page.locator('[data-board]').boundingBox();
  evidence.desktop.home = {
    status: homeResponse?.status(),
    title: await page.title(),
    h1: await page.locator('h1').innerText(),
    audience: await page.locator('.audience').innerText(),
    firstAction: await page.getByRole('link', { name: 'Try it with sample data' }).innerText(),
    facts: await page.locator('.plain-facts li').allInnerTexts(),
    boardTop: homeBoard?.y,
    viewportHeight: 900,
    horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  };
  check(evidence.desktop.home.h1 === 'Deliver three couriers before 40 moves', 'Home job heading changed.');
  check((homeBoard?.y ?? 901) < 900, 'Desktop board is outside the first screen.');
  await page.screenshot({ path: `${output}desktop-first-screen.png` });

  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.waitForURL(`${base}/demo`);
  evidence.desktop.sample = {
    label: await page.getByText('Demo — sample data, nothing is saved').innerText(),
    score: await score(page),
    rule: await page.locator('#game-heading').innerText(),
    seed: await page.locator('.seed-label').innerText(),
  };
  check(evidence.desktop.sample.score.startsWith('8 / 40'), 'Sample did not open at move 8.');
  await page.screenshot({ path: `${output}desktop-sample.png` });

  await page.locator('.courier-picker [data-select="0"]').click();
  evidence.desktop.invalid = {
    score: await score(page),
    message: await page.locator('.game-message').innerText(),
  };
  check(evidence.desktop.invalid.score.startsWith('8 / 40'), 'Invalid selection changed the move count.');
  check(evidence.desktop.invalid.message === 'Gold must move next.', 'Invalid selection did not explain recovery.');

  const puzzle = generatePuzzle(DEMO_DATE);
  const sample = createDemoState(puzzle);
  const solution = findSolution(puzzle, sample);
  check(solution?.length === 10, 'Expected a ten-move sample finish.');
  for (const move of solution) {
    await page.locator(`.courier-picker [data-select="${move.courier}"]`).click();
    await page.locator(`[data-direction="${move.direction}"]`).click();
    await page.waitForTimeout(190);
  }
  await page.getByRole('heading', { name: 'All three couriers arrived' }).waitFor();
  evidence.desktop.win = {
    score: await score(page),
    heading: await page.getByRole('heading', { name: 'All three couriers arrived' }).innerText(),
    copy: await page.locator('#result-copy').innerText(),
    focused: await page.evaluate(() => document.activeElement?.textContent?.trim()),
  };
  check(evidence.desktop.win.score.startsWith('18 / 40'), 'Win did not occur at move 18.');
  check(evidence.desktop.win.focused === 'Restart puzzle', 'Result focus did not move to restart.');
  await page.screenshot({ path: `${output}win-end-screen.png` });

  await page.getByRole('button', { name: 'Restart puzzle' }).click();
  evidence.desktop.restartScore = await score(page);
  check(evidence.desktop.restartScore.startsWith('0 / 40'), 'Restart did not return to move zero.');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  evidence.desktop.reset = {
    score: await score(page),
    realValue: await page.evaluate(() => localStorage.getItem('rr:real:review3')),
  };
  check(evidence.desktop.reset.score.startsWith('8 / 40'), 'Reset did not reseed the sample.');
  check(evidence.desktop.reset.realValue === 'keep-real', 'Reset changed real data.');
  await page.evaluate(() => localStorage.setItem('rr:demo:review3', 'remove-demo'));
  await page.getByRole('link', { name: 'Start for real' }).click();
  evidence.desktop.exitDemo = await page.evaluate(() => ({
    pathname: location.pathname,
    realValue: localStorage.getItem('rr:real:review3'),
    demoKeys: Object.keys(localStorage).filter(key => key.startsWith('rr:demo:')),
  }));
  check(evidence.desktop.exitDemo.pathname === '/', 'Start for real did not open the daily puzzle.');
  check(evidence.desktop.exitDemo.realValue === 'keep-real', 'Start for real changed real data.');
  check(evidence.desktop.exitDemo.demoKeys.length === 0, 'Start for real did not discard demo data.');
  evidence.desktop.network = {
    origins: [...new Set(requests.map(request => new URL(request.url).origin))],
    methods: [...new Set(requests.map(request => request.method))],
  };
  check(evidence.desktop.network.origins.length === 1 && evidence.desktop.network.origins[0] === base, 'Sample contacted another origin.');
  check(evidence.desktop.network.methods.every(method => method === 'GET'), 'Sample made a non-GET request.');
  await context.tracing.stop({ path: `${output}complete-run-trace.zip` });
  await context.close();

  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const phone = await phoneContext.newPage();
  phone.on('console', message => { if (message.type() === 'error') evidence.errors.push(`phone console: ${message.text()}`); });
  phone.on('pageerror', error => evidence.errors.push(`phone page: ${error.message}`));
  await phone.goto(`${base}/`, { waitUntil: 'networkidle' });
  const phoneHomeBoard = await phone.locator('[data-board]').boundingBox();
  evidence.phone.home = {
    h1: await phone.locator('h1').innerText(),
    audience: await phone.locator('.audience').innerText(),
    firstAction: await phone.getByRole('link', { name: 'Try it with sample data' }).innerText(),
    boardTop: phoneHomeBoard?.y,
    viewportHeight: 664,
    horizontalOverflow: await phone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  };
  check((phoneHomeBoard?.y ?? 665) <= 600, 'Phone home board does not show 64px in the first screen.');
  await phone.screenshot({ path: `${output}phone-first-screen.png` });
  await touchTap(phone, phone.getByRole('link', { name: 'Try it with sample data' }));
  await phone.waitForURL(`${base}/demo`);
  const phoneDemoBoard = await phone.locator('[data-board]').boundingBox();
  evidence.phone.sample = {
    label: await phone.getByText('Demo — sample data, nothing is saved').innerText(),
    score: await score(phone),
    boardTop: phoneDemoBoard?.y,
  };
  check((phoneDemoBoard?.y ?? 665) <= 600, 'Phone demo board does not show 64px in the first screen.');
  await phone.screenshot({ path: `${output}phone-sample.png` });

  await touchTap(phone, phone.locator('.courier-picker [data-select="2"]'));
  await touchTap(phone, phone.locator('[data-direction="right"]'));
  await phone.waitForFunction(() => document.querySelector('.score-strip span')?.textContent?.includes('9'));
  await touchTap(phone, phone.locator('.courier-picker [data-select="0"]'));
  const board = phone.locator('[data-board]');
  await board.scrollIntoViewIfNeeded();
  const boardBox = await board.boundingBox();
  check(boardBox, 'Phone board had no box for swipe.');
  const session = await phoneContext.newCDPSession(phone);
  const x = boardBox.x + boardBox.width / 2;
  const y = boardBox.y + boardBox.height / 2;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + 80, radiusX: 4, radiusY: 4, force: 1, id: 1 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await phone.waitForFunction(() => document.querySelector('.score-strip span')?.textContent?.includes('10'));
  evidence.phone.realTouch = { tapScore: '9 / 40 moves', swipeScore: await score(phone) };
  const targetFailures = await phone.locator('a, button').evaluateAll(elements => elements.flatMap(element => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const visible = style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0;
    return visible && (box.width < 43.99 || box.height < 43.99)
      ? [{ name: element.getAttribute('aria-label') ?? element.textContent?.trim(), width: box.width, height: box.height }]
      : [];
  }));
  evidence.phone.undersizedTargets = targetFailures;
  check(targetFailures.length === 0, 'Phone has undersized touch targets.');
  await phoneContext.close();

  const keyboardContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const keyboard = await keyboardContext.newPage();
  await keyboard.goto(`${base}/`);
  await keyboard.keyboard.press('Tab');
  const firstFocus = await keyboard.evaluate(() => document.activeElement?.textContent?.trim());
  await keyboard.keyboard.press('Enter');
  await keyboard.keyboard.press('Tab');
  const afterSkip = await keyboard.evaluate(() => document.activeElement?.textContent?.trim());
  await keyboard.goto(`${base}/demo`);
  await keyboard.locator('[data-board]').focus();
  await keyboard.keyboard.press('3');
  await keyboard.locator('[data-board]').focus();
  await keyboard.keyboard.press('ArrowRight');
  await keyboard.waitForFunction(() => document.querySelector('.score-strip span')?.textContent?.includes('9'));
  await keyboard.getByRole('link', { name: 'Privacy', exact: true }).first().click();
  const privacyFocus = await keyboard.evaluate(() => document.activeElement?.tagName === 'H1' && document.activeElement?.textContent?.trim());
  await keyboard.goBack();
  const backFocus = await keyboard.evaluate(() => document.activeElement?.tagName === 'H1' && document.activeElement?.textContent?.trim());
  evidence.keyboard = { firstFocus, afterSkip, moveScore: await score(keyboard), privacyFocus, backFocus };
  check(firstFocus === 'Skip to game or page content', 'Skip link was not first.');
  check(afterSkip === 'Try it with sample data', 'Skip link did not move past repeated navigation.');
  check(privacyFocus === 'Understand what this game stores', 'Route change did not focus the Privacy h1.');
  check(backFocus === 'Finish a sample courier puzzle', 'Back navigation did not focus the Demo h1.');
  await keyboardContext.close();

  const motionContext = await browser.newContext({ reducedMotion: 'reduce' });
  const motion = await motionContext.newPage();
  await motion.goto(`${base}/demo`);
  await motion.getByRole('button', { name: 'Try the rule' }).click();
  evidence.reducedMotion = {
    transitionDuration: await motion.locator('.mini-courier').evaluate(element => getComputedStyle(element).transitionDuration),
    result: await motion.locator('[data-example-result]').innerText(),
  };
  check(Number.parseFloat(evidence.reducedMotion.transitionDuration) <= 0.01, 'Reduced motion retained a movement transition.');
  await motionContext.close();

  const zoomContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const zoom = await zoomContext.newPage();
  await zoom.goto(`${base}/demo`);
  await zoom.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  evidence.phone.text200 = {
    overflow: await zoom.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    boardVisible: await zoom.locator('[data-board]').isVisible(),
    controlsVisible: await zoom.getByRole('button', { name: 'Move up' }).isVisible(),
  };
  check(evidence.phone.text200.overflow <= 1 && evidence.phone.text200.boardVisible && evidence.phone.text200.controlsVisible, '200% text lost content or caused overflow.');
  await zoomContext.close();

  const offlineContext = await browser.newContext();
  const offline = await offlineContext.newPage();
  await offline.goto(`${base}/demo`);
  await offline.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await offline.waitForFunction(async () => (await caches.keys()).length > 0);
  await offlineContext.setOffline(true);
  const offlineResponse = await offline.reload({ waitUntil: 'domcontentloaded' });
  await offline.getByRole('button', { name: 'Try the rule' }).click();
  evidence.offline = {
    reloadResponse: offlineResponse?.status() ?? null,
    heading: await offline.locator('h1').innerText(),
    example: await offline.locator('[data-example-result]').innerText(),
  };
  check(evidence.offline.example.startsWith('Example complete.'), 'Offline sample was not operable.');
  await offlineContext.close();

  const deleteContext = await browser.newContext();
  const deletion = await deleteContext.newPage();
  await deletion.addInitScript(() => {
    localStorage.setItem('rr:real:review3', 'delete-me');
    localStorage.setItem('rr:demo:review3', 'keep-demo');
  });
  await deletion.goto(`${base}/settings`);
  deletion.once('dialog', dialog => dialog.dismiss());
  await deletion.getByRole('button', { name: 'Delete saved progress' }).click();
  const cancelText = await deletion.locator('.delete-status').innerText();
  deletion.once('dialog', dialog => dialog.accept());
  await deletion.getByRole('button', { name: 'Delete saved progress' }).click();
  evidence.deletion = await deletion.evaluate(cancelTextValue => ({
    cancelText: cancelTextValue,
    finalText: document.querySelector('.delete-status')?.textContent?.trim(),
    realKeys: Object.keys(localStorage).filter(key => key.startsWith('rr:real:')),
    demoValue: localStorage.getItem('rr:demo:review3'),
  }), cancelText);
  check(evidence.deletion.cancelText === 'Nothing was deleted.', 'Delete cancellation lacked recovery text.');
  check(evidence.deletion.realKeys.length === 0 && evidence.deletion.demoValue === 'keep-demo', 'Delete did not isolate daily and sample storage.');
  await deleteContext.close();

  const auditContext = await browser.newContext({ viewport: { width: 1366, height: 900 }, serviceWorkers: 'block' });
  const audit = await auditContext.newPage();
  for (const [route, expectedTitle, expectedStatus] of [
    ['/', 'Rulebook Relay — Daily courier puzzle', 200],
    ['/demo', 'Demo — Rulebook Relay', 200],
    ['/settings', 'Settings — Rulebook Relay', 200],
    ['/privacy', 'Privacy — Rulebook Relay', 200],
    ['/terms', 'Terms — Rulebook Relay', 200],
    ['/missing-review-3', 'Page not found — Rulebook Relay', 404],
  ]) {
    const response = await audit.goto(`${base}${route}`, { waitUntil: 'networkidle' });
    const axe = await new AxeBuilder({ page: audit }).analyze();
    const routeResult = {
      route,
      status: response?.status(),
      title: await audit.title(),
      h1: await audit.locator('h1').innerText(),
      h1Count: await audit.locator('h1').count(),
      mainCount: await audit.locator('main').count(),
      lang: await audit.locator('html').getAttribute('lang'),
      violations: axe.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.length })),
      headerLinks: await audit.getByRole('banner').locator('a').allInnerTexts(),
      footerText: (await audit.getByRole('contentinfo').innerText()).replace(/\s+/g, ' ').trim(),
    };
    evidence.routes.push(routeResult);
    evidence.accessibility.push({ route, violations: routeResult.violations });
    check(routeResult.status === expectedStatus, `${route} had the wrong HTTP status.`);
    check(routeResult.title === expectedTitle, `${route} had the wrong title.`);
    check(routeResult.h1Count === 1 && routeResult.mainCount === 1 && routeResult.lang === 'en', `${route} had invalid page structure.`);
    check(routeResult.violations.length === 0, `${route} had Axe violations.`);
    check(routeResult.headerLinks.some(text => text.trim() === 'Settings'), `${route} lacked shared Settings navigation.`);
    check(/Built by Param Factory/.test(routeResult.footerText) && /Version 1\.0\.0/.test(routeResult.footerText), `${route} lacked shared footer content.`);
    if (expectedStatus === 404) await audit.screenshot({ path: `${output}designed-404.png` });
  }
  await auditContext.close();

  check(evidence.errors.length === 0, `Browser errors occurred: ${evidence.errors.join('; ')}`);
  await writeFile(`${output}live-review.json`, `${JSON.stringify(evidence, null, 2)}\n`);
} finally {
  await browser.close();
}

console.log(JSON.stringify(evidence, null, 2));
