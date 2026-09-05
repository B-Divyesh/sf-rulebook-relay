import './styles.css';
import {
  BOARD_SIZE,
  COURIERS,
  DEMO_DATE,
  MOVE_LIMIT,
  RULES,
  attemptMove,
  courierAt,
  createDemoState,
  createInitialState,
  fromCell,
  generatePuzzle,
  goalAt,
  type Direction,
  type GameState,
  type Move,
  type Puzzle,
  undoMove,
  utcDateString,
} from './game';

declare global {
  interface Window {
    rulebookRelayMetrics?: { frameTimes: number[] };
  }
}

interface Settings {
  sound: boolean;
  reduceMotion: boolean;
}

interface Stats {
  completedDates: string[];
  rulesSeen: string[];
}

const appRoot = document.querySelector<HTMLDivElement>('#app');
if (appRoot === null) throw new Error('App root is missing.');
const app = appRoot;

const REAL_PREFIX = 'rr:real:';
const DEMO_PREFIX = 'rr:demo:';
const DEFAULT_SETTINGS: Settings = { sound: true, reduceMotion: false };
const META: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Rulebook Relay — Daily courier puzzle',
    description: 'Move three couriers across a 6×6 board while one clear rule changes each day.',
  },
  '/demo': {
    title: 'Demo — Rulebook Relay',
    description: 'Finish a sample Rulebook Relay puzzle without changing your saved daily game.',
  },
  '/settings': {
    title: 'Settings — Rulebook Relay',
    description: 'Set sound and motion, or delete saved Rulebook Relay progress.',
  },
  '/privacy': {
    title: 'Privacy — Rulebook Relay',
    description: 'Learn what Rulebook Relay stores in your browser and how to delete it.',
  },
  '/terms': {
    title: 'Terms — Rulebook Relay',
    description: 'Read the simple terms for playing the free Rulebook Relay browser game.',
  },
  '/404': {
    title: 'Page not found — Rulebook Relay',
    description: 'The requested Rulebook Relay page does not exist.',
  },
};

let puzzle: Puzzle | null = null;
let gameState: GameState | null = null;
let demoMode = false;
let userPaused = false;
let pointerStart: { x: number; y: number } | null = null;
let endDialogShownFor: GameState['status'] | null = null;

function safeParse<T>(value: string | null, guard: (candidate: unknown) => candidate is T): T | null {
  if (value === null) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return guard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isGameState(candidate: unknown): candidate is GameState {
  if (typeof candidate !== 'object' || candidate === null) return false;
  const state = candidate as Partial<GameState>;
  return (
    Array.isArray(state.positions) &&
    state.positions.length === 3 &&
    state.positions.every((cell) => Number.isInteger(cell) && cell >= 0 && cell < BOARD_SIZE * BOARD_SIZE) &&
    Number.isInteger(state.moves) &&
    Number(state.moves) >= 0 &&
    Number(state.moves) <= MOVE_LIMIT &&
    Number.isInteger(state.selected) &&
    Number(state.selected) >= 0 &&
    Number(state.selected) < 3 &&
    ['playing', 'won', 'lost'].includes(String(state.status)) &&
    typeof state.message === 'string' &&
    Array.isArray(state.history)
  );
}

function isSettings(candidate: unknown): candidate is Settings {
  if (typeof candidate !== 'object' || candidate === null) return false;
  const value = candidate as Partial<Settings>;
  return typeof value.sound === 'boolean' && typeof value.reduceMotion === 'boolean';
}

function prefix(): string {
  return demoMode ? DEMO_PREFIX : REAL_PREFIX;
}

function getSettings(): Settings {
  return safeParse(localStorage.getItem(`${prefix()}settings`), isSettings) ?? DEFAULT_SETTINGS;
}

function saveSettings(settings: Settings): void {
  localStorage.setItem(`${prefix()}settings`, JSON.stringify(settings));
  applyMotionSetting(settings);
}

function applyMotionSetting(settings = getSettings()): void {
  document.documentElement.dataset.reduceMotion = settings.reduceMotion ? 'true' : 'false';
}

function gameKey(): string {
  if (demoMode) return `${DEMO_PREFIX}game`;
  return `${REAL_PREFIX}game:${puzzle?.dateLabel ?? utcDateString()}`;
}

function saveGame(): void {
  if (gameState !== null) localStorage.setItem(gameKey(), JSON.stringify(gameState));
}

function getStats(): Stats {
  const guard = (candidate: unknown): candidate is Stats => {
    if (typeof candidate !== 'object' || candidate === null) return false;
    const stats = candidate as Partial<Stats>;
    return Array.isArray(stats.completedDates) && Array.isArray(stats.rulesSeen);
  };
  return safeParse(localStorage.getItem(`${prefix()}stats`), guard) ?? { completedDates: [], rulesSeen: [] };
}

function recordWin(): void {
  if (puzzle === null) return;
  const stats = getStats();
  if (!stats.completedDates.includes(puzzle.dateLabel)) stats.completedDates.push(puzzle.dateLabel);
  if (!stats.rulesSeen.includes(puzzle.rule)) stats.rulesSeen.push(puzzle.rule);
  localStorage.setItem(`${prefix()}stats`, JSON.stringify(stats));
}

function clearPrefix(storagePrefix: string): void {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(storagePrefix)) localStorage.removeItem(key);
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

class GameRuntime {
  private queue: Move[] = [];
  private lastTime = 0;
  private accumulator = 0;
  private paused = false;

  constructor() {
    window.rulebookRelayMetrics = { frameTimes: [] };
    requestAnimationFrame((time) => this.frame(time));
  }

  enqueue(move: Move): void {
    if (!this.paused) this.queue.push(move);
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.queue = [];
  }

  private frame(time: number): void {
    if (this.lastTime === 0) this.lastTime = time;
    const elapsed = Math.min(time - this.lastTime, 100);
    this.lastTime = time;
    const metrics = window.rulebookRelayMetrics;
    if (metrics !== undefined && !document.hidden) {
      metrics.frameTimes.push(elapsed);
      if (metrics.frameTimes.length > 180) metrics.frameTimes.shift();
    }
    if (!this.paused && !document.hidden) {
      this.accumulator += elapsed;
      const step = 1000 / 60;
      while (this.accumulator >= step) {
        const move = this.queue.shift();
        if (move !== undefined) performMove(move);
        this.accumulator -= step;
      }
    }
    requestAnimationFrame((nextTime) => this.frame(nextTime));
  }
}

const runtime = new GameRuntime();

function beep(kind: 'move' | 'win' | 'blocked'): void {
  if (!getSettings().sound) return;
  try {
    const AudioContextClass = window.AudioContext;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = kind === 'win' ? 660 : kind === 'blocked' ? 150 : 280;
    gain.gain.setValueAtTime(0.035, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + (kind === 'win' ? 0.18 : 0.08));
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + (kind === 'win' ? 0.18 : 0.08));
    oscillator.addEventListener('ended', () => void context.close());
  } catch {
    // Sound is optional. A blocked audio context must not block play.
  }
}

function loadSession(): void {
  demoMode = window.location.pathname === '/demo';
  puzzle = generatePuzzle(demoMode ? DEMO_DATE : utcDateString());
  const savedRaw = localStorage.getItem(gameKey());
  const saved = safeParse(savedRaw, isGameState);
  if (saved !== null) {
    gameState = saved;
  } else {
    gameState = demoMode ? createDemoState(puzzle) : createInitialState(puzzle);
    if (savedRaw !== null) gameState.message = 'Saved progress could not be read. A fresh puzzle was loaded.';
    saveGame();
  }
  userPaused = false;
  endDialogShownFor = null;
  applyMotionSetting();
}

function headerMarkup(): string {
  const settingsHref = demoMode ? '/settings?demo=1' : '/settings';
  return `
    <a class="skip-link" href="#main">Skip to game or page content</a>
    <header class="site-header">
      <a class="wordmark" href="/" data-route>
        <span class="wordmark-mark" aria-hidden="true">R↦</span>
        <span>Rulebook Relay</span>
      </a>
      <nav aria-label="Main navigation">
        <a href="/demo" data-route>Demo</a>
        <a href="${settingsHref}" data-route>Settings</a>
        <a href="/privacy" data-route>Privacy</a>
      </nav>
    </header>`;
}

function demoBannerMarkup(): string {
  if (!demoMode) return '';
  return `<aside class="demo-banner" aria-label="Demo status">
    <strong>Demo — sample data, nothing is saved</strong>
    <span class="demo-actions">
      <button type="button" class="text-button" data-reset-demo>Reset demo</button>
      <a href="/" data-start-real data-route>Start for real</a>
    </span>
  </aside>`;
}

function footerMarkup(): string {
  return `<footer class="site-footer">
    <p>Rulebook Relay is a free daily courier puzzle.</p>
    <nav aria-label="Footer navigation">
      <a href="/privacy" data-route>Privacy</a>
      <a href="/terms" data-route>Terms</a>
      <a href="https://sociobot.in" rel="external">Built by Param Factory <span class="visually-hidden">(external site)</span></a>
    </nav>
    <p class="fine-print">Original scene generated for this game. Version 1.0.0.</p>
  </footer>`;
}

function factsMarkup(): string {
  return `<ul class="plain-facts" aria-label="Game facts">
    <li>Free to play.</li>
    <li>Progress stays in this browser.</li>
    <li>Reloads offline after your first visit.</li>
  </ul>`;
}

function gamePageMarkup(): string {
  const heading = demoMode ? 'Finish a sample courier puzzle' : 'Deliver three couriers before 40 moves';
  const audience = demoMode
    ? 'For new players who want to learn today’s rule without changing saved progress.'
    : 'For daily-puzzle players who want a new logic rule instead of another word grid.';
  return `${headerMarkup()}${demoBannerMarkup()}
    <main id="main">
      <section class="hero-shell" aria-labelledby="page-title">
        <picture class="scene-art" aria-hidden="true">
          <source type="image/webp" srcset="/assets/rulebook-relay-scene-720.webp" />
          <img src="/assets/rulebook-relay-scene-720.webp" alt="" width="720" height="480" decoding="async" />
        </picture>
        <div class="hero-copy">
          <p class="eyebrow">Daily 6×6 logic game</p>
          <h1 id="page-title" tabindex="-1">${heading}</h1>
          <p class="audience">${audience}</p>
          <div class="hero-actions">
            ${demoMode
              ? '<a class="primary-action" href="#daily-game">Finish the sample</a><a class="secondary-action" href="/" data-start-real data-route>Play today’s puzzle</a>'
              : '<a class="primary-action" href="/demo" data-route>Try it with sample data</a><a class="secondary-action" href="#daily-game">Play today’s puzzle</a>'}
          </div>
          <p class="action-note">The sample opens partway through a verified route.</p>
          ${factsMarkup()}
        </div>
        <div id="game-mount" class="game-mount"></div>
      </section>
      <section class="steps-section" aria-labelledby="how-heading">
        <h2 id="how-heading">How it works</h2>
        <ol class="steps-list">
          <li><strong>Select a courier.</strong><span>Tap its counter or press 1, 2, or 3.</span></li>
          <li><strong>Move one square.</strong><span>Use arrows, the direction buttons, or swipe the board.</span></li>
          <li><strong>Reach matching goals.</strong><span>Deliver all three before the move count reaches 40.</span></li>
        </ol>
      </section>
      <section class="privacy-summary" aria-labelledby="privacy-heading">
        <h2 id="privacy-heading">Your play stays on this device</h2>
        <p>The game stores today’s board, completed days, sound, and motion settings in this browser. It has no accounts, ads, analytics, or social posting gate.</p>
        <a href="/privacy" data-route>Read the privacy details</a>
      </section>
    </main>${footerMarkup()}
    <div class="network-status" role="status" aria-live="polite" hidden></div>`;
}

function cellMarkup(cell: number): string {
  if (puzzle === null || gameState === null) return '';
  const courier = courierAt(gameState, cell);
  const goal = goalAt(puzzle, cell);
  const { x, y } = fromCell(cell);
  const classes = ['board-cell'];
  if (puzzle.walls.includes(cell)) {
    classes.push('wall');
  }
  if (goal >= 0) {
    classes.push(`goal goal-${goal}`);
  }
  const arrow = puzzle.arrows[cell];
  const gust = puzzle.gusts[cell];
  if (arrow !== undefined) {
    classes.push('one-way');
  }
  if (gust !== undefined) {
    classes.push('gust');
  }
  if (puzzle.ice.includes(cell)) {
    classes.push('ice');
  }
  const featureDirection = arrow ?? gust;
  return `<div class="${classes.join(' ')}">
    ${featureDirection !== undefined ? `<span class="tile-arrow arrow-${featureDirection}" aria-hidden="true">➜</span>` : ''}
    ${puzzle.walls.includes(cell) ? '<span class="wall-mark" aria-hidden="true"></span>' : ''}
    ${goal >= 0 ? `<span class="goal-mark" aria-hidden="true">${COURIERS[goal].short}</span>` : ''}
    ${courier >= 0 ? `<button type="button" class="courier courier-${courier}${gameState.selected === courier ? ' selected' : ''}" data-select="${courier}" aria-pressed="${gameState.selected === courier}" aria-label="Select ${COURIERS[courier].name} courier at row ${y + 1}, column ${x + 1}"><span aria-hidden="true">${COURIERS[courier].short}</span></button>` : ''}
  </div>`;
}

function gameWidgetMarkup(): string {
  if (puzzle === null || gameState === null) return '';
  const delivered = gameState.positions.filter((position, index) => position === puzzle?.goals[index]).length;
  const stats = getStats();
  const required = puzzle.rule === 'relay' ? COURIERS[gameState.moves % COURIERS.length].name : COURIERS[gameState.selected].name;
  const cells = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => cellMarkup(index)).join('');
  const describeCells = (cellsToDescribe: number[]): string => cellsToDescribe.map((cell) => {
    const location = fromCell(cell);
    return `row ${location.y + 1} column ${location.x + 1}`;
  }).join(', ');
  const featureDescription = [
    puzzle.walls.length > 0 ? `Blocked cells: ${describeCells(puzzle.walls)}.` : '',
    Object.entries(puzzle.arrows).length > 0 ? `One-way tiles: ${Object.entries(puzzle.arrows).map(([cell, direction]) => `${describeCells([Number(cell)])} points ${direction}`).join(', ')}.` : '',
    Object.entries(puzzle.gusts).length > 0 ? `Wind tiles: ${Object.entries(puzzle.gusts).map(([cell, direction]) => `${describeCells([Number(cell)])} pushes ${direction}`).join(', ')}.` : '',
    puzzle.ice.length > 0 ? `Ice cells: ${describeCells(puzzle.ice)}.` : '',
  ].filter(Boolean).join(' ');
  const statusClass = gameState.status === 'playing' ? '' : ` status-${gameState.status}`;
  return `<section id="daily-game" class="game-sheet${statusClass}" aria-labelledby="game-heading">
    <div class="game-heading-row">
      <div>
        <p class="seed-label">Seed ${puzzle.seed} · verified in ${puzzle.solutionLength} moves</p>
        <h2 id="game-heading">${demoMode ? 'Sample puzzle' : 'Today’s puzzle'}: ${RULES[puzzle.rule].name}</h2>
      </div>
      ${userPaused ? '' : '<button type="button" class="pause-button" data-pause>Pause game</button>'}
    </div>
    <div class="rule-card">
      <div>
        <p class="rule-label">Today’s rule card</p>
        <h3>${RULES[puzzle.rule].name}</h3>
        <p>${RULES[puzzle.rule].instruction}</p>
      </div>
      <div class="rule-demo" data-rule-demo aria-hidden="true">
        <span class="mini-cell"><span class="mini-courier">C</span></span>
        <span class="mini-cell mini-feature">➜</span>
        <span class="mini-cell mini-finish">✓</span>
      </div>
      <button type="button" class="example-button" data-example>Try the rule</button>
      <p class="example-result" data-example-result aria-live="polite">${RULES[puzzle.rule].example}</p>
    </div>
    <div class="score-strip" aria-label="Puzzle status">
      <span><strong>${gameState.moves}</strong> / ${MOVE_LIMIT} moves</span>
      <span><strong>${delivered}</strong> / 3 delivered</span>
      <span>${stats.rulesSeen.length} rule cards completed</span>
    </div>
    <div class="play-layout">
      <div class="board-wrap${userPaused ? ' is-paused' : ''}">
        <div class="game-board" role="group" aria-label="Six by six courier board" aria-describedby="board-description" tabindex="0" data-board>
          ${cells}
        </div>
        ${userPaused ? '<div class="pause-cover"><strong>Game paused</strong><button type="button" data-resume>Resume game</button></div>' : ''}
      </div>
      <div class="control-panel">
        <p class="control-label">${puzzle.rule === 'relay' ? 'Required courier' : 'Selected courier'}: <strong>${required}</strong></p>
        <div class="courier-picker" aria-label="Select a courier">
          ${COURIERS.map((courier, index) => `<button type="button" class="picker-${index}" data-select="${index}" aria-pressed="${gameState?.selected === index}"><span aria-hidden="true">${courier.short}</span><span>${courier.name}</span></button>`).join('')}
        </div>
        <div class="d-pad" aria-label="Move selected courier">
          <button type="button" data-direction="up" aria-label="Move up">↑</button>
          <button type="button" data-direction="left" aria-label="Move left">←</button>
          <button type="button" data-direction="down" aria-label="Move down">↓</button>
          <button type="button" data-direction="right" aria-label="Move right">→</button>
        </div>
        <button type="button" class="undo-button" data-undo ${gameState.history.length === 0 ? 'disabled' : ''}>Undo last move</button>
        <p class="game-message" role="status" aria-live="polite">${escapeHtml(gameState.message)}</p>
        <p class="keyboard-help">Keyboard: 1–3 selects. Arrow keys move.</p>
      </div>
    </div>
    <div class="board-text visually-hidden" aria-live="polite">${COURIERS.map((courier, index) => {
      const location = fromCell(gameState?.positions[index] ?? 0);
      const done = gameState?.positions[index] === puzzle?.goals[index] ? ', delivered' : '';
      return `${courier.name}: row ${location.y + 1}, column ${location.x + 1}${done}.`;
    }).join(' ')}</div>
    <p id="board-description" class="visually-hidden">Use arrow keys to move the selected courier. ${featureDescription}</p>
    ${gameState.status !== 'playing' ? endDialogMarkup() : ''}
  </section>`;
}

function endDialogMarkup(): string {
  if (gameState === null || puzzle === null) return '';
  const won = gameState.status === 'won';
  return `<dialog class="end-dialog" data-end-dialog aria-labelledby="result-heading" aria-describedby="result-copy">
    <p class="result-stamp">${won ? 'Route complete' : 'Move limit reached'}</p>
    <h2 id="result-heading">${won ? 'All three couriers arrived' : 'This route ran out of moves'}</h2>
    <p id="result-copy">${won
      ? `You solved seed ${puzzle.seed} in ${gameState.moves} moves with ${RULES[puzzle.rule].name.toLowerCase()}.`
      : `Seed ${puzzle.seed} stopped at ${MOVE_LIMIT} moves. Restart to try a shorter route.`}</p>
    <div class="dialog-actions">
      <button type="button" class="primary-action" data-restart>Restart puzzle</button>
      <button type="button" class="secondary-action" data-review>Review board</button>
    </div>
  </dialog>`;
}

function settingsMarkup(): string {
  demoMode = new URLSearchParams(window.location.search).get('demo') === '1';
  const settings = safeParse(localStorage.getItem(`${prefix()}settings`), isSettings) ?? DEFAULT_SETTINGS;
  return `${headerMarkup()}${demoBannerMarkup()}<main id="main" class="text-page">
    <h1 id="page-title" tabindex="-1">Set game motion and sound</h1>
    <p>${demoMode ? 'These sample settings use separate demo storage.' : 'These settings apply to your daily game on this browser.'}</p>
    <form class="settings-form" data-settings-form>
      <label class="toggle-row" for="sound-setting">
        <span><strong>Play move sounds</strong><small>Short tones play only after you press a control.</small></span>
        <input id="sound-setting" name="sound" type="checkbox" ${settings.sound ? 'checked' : ''} />
      </label>
      <label class="toggle-row" for="motion-setting">
        <span><strong>Reduce board motion</strong><small>Movement becomes instant. Your device setting is always respected.</small></span>
        <input id="motion-setting" name="reduceMotion" type="checkbox" ${settings.reduceMotion ? 'checked' : ''} />
      </label>
      <p class="form-status" role="status" aria-live="polite">Settings save when changed.</p>
    </form>
    <section aria-labelledby="data-heading">
      <h2 id="data-heading">Delete saved progress</h2>
      <p>${demoMode ? 'This resets only sample progress and settings. Your daily game stays unchanged.' : 'This removes daily boards, completed days, and settings from this browser. Demo data stays separate.'}</p>
      <button type="button" class="danger-button" data-delete-progress>${demoMode ? 'Reset sample settings' : 'Delete saved progress'}</button>
      <p class="delete-status" role="status" aria-live="polite"></p>
    </section>
  </main>${footerMarkup()}`;
}

function privacyMarkup(): string {
  return `${headerMarkup()}<main id="main" class="text-page legal-page">
    <h1 id="page-title" tabindex="-1">Understand what this game stores</h1>
    <p><strong>Last updated: 5 September 2026.</strong></p>
    <h2>Data stored on your device</h2>
    <p>Rulebook Relay stores the current board, completed dates, seen rule cards, and game settings in browser storage. Demo play uses separate keys.</p>
    <h2>Data sent elsewhere</h2>
    <p>The game has no accounts, analytics, advertising, or third-party scripts. Your browser requests the game files from this site.</p>
    <h2>Delete your data</h2>
    <p>Open Settings and choose “Delete saved progress.” You can also clear this site’s storage in your browser.</p>
    <a class="secondary-action" href="/settings" data-route>Open settings</a>
    <h2>Privacy questions</h2>
    <p>Email <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a> with a question. There is no game account to identify.</p>
  </main>${footerMarkup()}`;
}

function termsMarkup(): string {
  return `${headerMarkup()}<main id="main" class="text-page legal-page">
    <h1 id="page-title" tabindex="-1">Read the terms for playing</h1>
    <p><strong>Last updated: 5 September 2026.</strong></p>
    <h2>Free personal use</h2>
    <p>You may play Rulebook Relay for free. No purchase or account is required.</p>
    <h2>Fair play</h2>
    <p>Do not disrupt the site or use it to harm other people. The game has no player-to-player features.</p>
    <h2>Availability</h2>
    <p>We may fix, change, or stop the game. Saved browser data can be lost when storage is cleared.</p>
    <h2>Questions</h2>
    <p>Email <a href="mailto:support@sociobot.in">support@sociobot.in</a> about these terms.</p>
  </main>${footerMarkup()}`;
}

function notFoundMarkup(): string {
  return `${headerMarkup()}<main id="main" class="not-found-page">
    <div class="misroute-card" aria-hidden="true"><span>←</span><span>?</span><span>→</span></div>
    <h1 id="page-title" tabindex="-1">Return to today’s courier puzzle</h1>
    <p>This page does not exist. Your saved game is still in this browser.</p>
    <a class="primary-action" href="/" data-route>Play today’s puzzle</a>
  </main>${footerMarkup()}`;
}

function updateMetadata(path: string): void {
  const metadata = META[path] ?? META['/404'];
  document.title = metadata.title;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', metadata.description);
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', metadata.title);
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute('content', metadata.description);
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', `https://rulebook-relay.sociobot.in${path === '/' ? '/' : path}`);
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', `https://rulebook-relay.sociobot.in${path === '/' ? '/' : path}`);
}

function renderApp(moveFocus = false): void {
  const path = META[window.location.pathname] !== undefined ? window.location.pathname : '/404';
  updateMetadata(path);
  runtime.setPaused(path !== '/' && path !== '/demo');
  if (path === '/' || path === '/demo') {
    loadSession();
    app.innerHTML = gamePageMarkup();
    renderGameWidget();
  } else if (path === '/settings') {
    app.innerHTML = settingsMarkup();
  } else if (path === '/privacy') {
    app.innerHTML = privacyMarkup();
  } else if (path === '/terms') {
    app.innerHTML = termsMarkup();
  } else {
    app.innerHTML = notFoundMarkup();
  }
  bindPageEvents();
  if (moveFocus) document.querySelector<HTMLElement>('#page-title')?.focus();
}

function renderGameWidget(focusBoard = false): void {
  const mount = document.querySelector<HTMLDivElement>('#game-mount');
  if (mount === null) return;
  mount.innerHTML = gameWidgetMarkup();
  bindGameEvents();
  if (focusBoard) document.querySelector<HTMLElement>('[data-board]')?.focus();
  const currentStatus = gameState?.status;
  if (currentStatus !== undefined && currentStatus !== 'playing' && endDialogShownFor !== currentStatus) {
    const dialog = document.querySelector<HTMLDialogElement>('[data-end-dialog]');
    if (dialog !== null) {
      dialog.showModal();
      endDialogShownFor = currentStatus;
      dialog.querySelector<HTMLElement>('[data-restart]')?.focus();
    }
  }
}

function performMove(move: Move): void {
  if (puzzle === null || gameState === null || userPaused) return;
  const previousStatus = gameState.status;
  const result = attemptMove(gameState, puzzle, move);
  gameState = result.state;
  if (result.accepted) {
    saveGame();
    if (previousStatus === 'playing' && gameState.status === 'won') recordWin();
    beep(gameState.status === 'won' ? 'win' : 'move');
  } else {
    beep('blocked');
  }
  renderGameWidget(true);
}

function selectCourier(index: number): void {
  if (gameState === null || puzzle === null || userPaused) return;
  if (puzzle.rule === 'relay' && index !== gameState.moves % COURIERS.length) {
    gameState = { ...gameState, message: `${COURIERS[gameState.moves % COURIERS.length].name} must move next.` };
    beep('blocked');
  } else {
    gameState = { ...gameState, selected: index, message: `${COURIERS[index].name} is selected. Choose a direction.` };
  }
  saveGame();
  renderGameWidget(false);
  document.querySelector<HTMLElement>(`.courier-picker [data-select="${index}"]`)?.focus();
}

function bindGameEvents(): void {
  document.querySelectorAll<HTMLElement>('[data-select]').forEach((button) => {
    button.addEventListener('click', () => selectCourier(Number(button.dataset.select)));
  });
  document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach((button) => {
    button.addEventListener('click', () => {
      if (gameState !== null) runtime.enqueue({ courier: gameState.selected, direction: button.dataset.direction as Direction });
    });
  });
  document.querySelector<HTMLElement>('[data-board]')?.addEventListener('keydown', handleBoardKey);
  document.querySelector<HTMLElement>('[data-board]')?.addEventListener('pointerdown', (event) => {
    const pointer = event as PointerEvent;
    pointerStart = { x: pointer.clientX, y: pointer.clientY };
  });
  document.querySelector<HTMLElement>('[data-board]')?.addEventListener('pointerup', (event) => {
    if (pointerStart === null || gameState === null) return;
    const pointer = event as PointerEvent;
    const dx = pointer.clientX - pointerStart.x;
    const dy = pointer.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
    const direction: Direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    runtime.enqueue({ courier: gameState.selected, direction });
  });
  document.querySelector<HTMLButtonElement>('[data-pause]')?.addEventListener('click', togglePause);
  document.querySelector<HTMLButtonElement>('[data-resume]')?.addEventListener('click', togglePause);
  document.querySelector<HTMLButtonElement>('[data-undo]')?.addEventListener('click', () => {
    if (gameState === null) return;
    gameState = undoMove(gameState);
    saveGame();
    renderGameWidget(true);
  });
  document.querySelector<HTMLButtonElement>('[data-example]')?.addEventListener('click', () => {
    const result = document.querySelector<HTMLElement>('[data-example-result]');
    if (result !== null && puzzle !== null) {
      result.textContent = `Example complete. ${RULES[puzzle.rule].example}`;
      result.classList.add('example-complete');
      document.querySelector<HTMLElement>('[data-rule-demo]')?.classList.add('ran');
    }
  });
  document.querySelector<HTMLButtonElement>('[data-restart]')?.addEventListener('click', restartGame);
  document.querySelector<HTMLButtonElement>('[data-review]')?.addEventListener('click', () => {
    document.querySelector<HTMLDialogElement>('[data-end-dialog]')?.close();
    document.querySelector<HTMLElement>('[data-board]')?.focus();
  });
}

function handleBoardKey(event: KeyboardEvent): void {
  if (gameState === null) return;
  const directionByKey: Partial<Record<string, Direction>> = {
    ArrowUp: 'up',
    ArrowRight: 'right',
    ArrowDown: 'down',
    ArrowLeft: 'left',
  };
  const direction = directionByKey[event.key];
  if (direction !== undefined) {
    event.preventDefault();
    runtime.enqueue({ courier: gameState.selected, direction });
  } else if (['1', '2', '3'].includes(event.key)) {
    event.preventDefault();
    selectCourier(Number(event.key) - 1);
  }
}

function togglePause(): void {
  userPaused = !userPaused;
  runtime.setPaused(userPaused);
  renderGameWidget(!userPaused);
}

function restartGame(): void {
  if (puzzle === null) return;
  gameState = createInitialState(puzzle);
  gameState.message = 'Puzzle restarted. Coral is selected.';
  endDialogShownFor = null;
  userPaused = false;
  runtime.setPaused(false);
  saveGame();
  document.querySelector<HTMLDialogElement>('[data-end-dialog]')?.close();
  renderGameWidget(true);
}

function resetDemo(): void {
  clearPrefix(DEMO_PREFIX);
  puzzle = generatePuzzle(DEMO_DATE);
  gameState = createDemoState(puzzle);
  saveGame();
  endDialogShownFor = null;
  renderGameWidget(true);
}

function bindPageEvents(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[data-route]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (link.hasAttribute('data-start-real')) clearPrefix(DEMO_PREFIX);
      window.history.pushState({}, '', `${link.pathname}${link.search}`);
      window.scrollTo(0, 0);
      renderApp(true);
    });
  });
  document.querySelector<HTMLButtonElement>('[data-reset-demo]')?.addEventListener('click', resetDemo);
  const settingsForm = document.querySelector<HTMLFormElement>('[data-settings-form]');
  settingsForm?.addEventListener('change', () => {
    const data = new FormData(settingsForm);
    saveSettings({ sound: data.has('sound'), reduceMotion: data.has('reduceMotion') });
    const status = settingsForm.querySelector<HTMLElement>('.form-status');
    if (status !== null) status.textContent = 'Settings saved in this browser.';
  });
  document.querySelector<HTMLButtonElement>('[data-delete-progress]')?.addEventListener('click', () => {
    const storagePrefix = demoMode ? DEMO_PREFIX : REAL_PREFIX;
    const confirmed = window.confirm(demoMode ? 'Reset all sample progress and settings?' : 'Delete all saved daily progress and settings from this browser?');
    const status = document.querySelector<HTMLElement>('.delete-status');
    if (!confirmed) {
      if (status !== null) status.textContent = 'Nothing was deleted.';
      return;
    }
    clearPrefix(storagePrefix);
    applyMotionSetting(DEFAULT_SETTINGS);
    if (status !== null) status.textContent = demoMode ? 'Sample progress and settings were reset.' : 'Saved daily progress and settings were deleted.';
  });
}

function showNetworkStatus(message: string): void {
  const status = document.querySelector<HTMLElement>('.network-status');
  if (status === null) return;
  status.hidden = false;
  status.textContent = message;
}

window.addEventListener('popstate', () => renderApp(true));
window.addEventListener('offline', () => showNetworkStatus('You are offline. The saved puzzle still works.'));
window.addEventListener('online', () => showNetworkStatus('Back online.'));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) runtime.setPaused(true);
  else runtime.setPaused(userPaused);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller !== null) {
            showNetworkStatus('An update is ready. Reload to use it.');
          }
        });
      });
    }).catch(() => {
      // The game remains playable when private browsing blocks service workers.
    });
  });
}

renderApp();
