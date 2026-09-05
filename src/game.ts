export const BOARD_SIZE = 6;
export const MOVE_LIMIT = 40;

export type Direction = 'up' | 'right' | 'down' | 'left';
export type RuleKind = 'tailwind' | 'one-way' | 'ice' | 'relay' | 'echo' | 'remix';
export type GameStatus = 'playing' | 'won' | 'lost';

export interface Move {
  courier: number;
  direction: Direction;
}

export interface Puzzle {
  seed: string;
  dateLabel: string;
  rule: RuleKind;
  starts: number[];
  goals: number[];
  walls: number[];
  arrows: Record<number, Direction>;
  gusts: Record<number, Direction>;
  ice: number[];
  solutionLength: number;
}

export interface GameState {
  positions: number[];
  moves: number;
  selected: number;
  status: GameStatus;
  message: string;
  history: Array<{ positions: number[]; moves: number; selected: number; message: string }>;
}

export interface MoveResult {
  accepted: boolean;
  state: GameState;
}

export const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left'];
export const COURIERS = [
  { name: 'Coral', short: 'C' },
  { name: 'Teal', short: 'T' },
  { name: 'Gold', short: 'G' },
] as const;

export const RULES: Record<RuleKind, { name: string; instruction: string; example: string }> = {
  tailwind: {
    name: 'Tailwind tiles',
    instruction: 'Enter a wind tile and its arrow pushes that courier one extra square when the route is clear.',
    example: 'A courier enters the marked square, then follows its arrow once.',
  },
  'one-way': {
    name: 'One-way tiles',
    instruction: 'A courier may enter an arrow tile only while moving in the arrow’s direction.',
    example: 'The right arrow accepts a courier moving right and blocks every other entry.',
  },
  ice: {
    name: 'Ice tiles',
    instruction: 'A courier that enters ice keeps moving until it leaves the ice or meets a block.',
    example: 'One right move crosses the joined ice squares and stops on dry ground.',
  },
  relay: {
    name: 'Relay order',
    instruction: 'Move Coral, then Teal, then Gold. The required courier is shown above the controls.',
    example: 'After Coral moves, Teal must take the next move.',
  },
  echo: {
    name: 'Echo pair',
    instruction: 'After a courier moves, the next courier tries to move one square in the opposite direction.',
    example: 'Coral moves right, then Teal tries to move left. A wall can stop the echo.',
  },
  remix: {
    name: 'Wind and one-way remix',
    instruction: 'One-way tiles restrict entry. Wind tiles then push a courier one extra square.',
    example: 'Enter arrows in their direction, and follow any wind arrow after landing.',
  },
};

const OFFSETS: Record<Direction, [number, number]> = {
  up: [0, -1],
  right: [1, 0],
  down: [0, 1],
  left: [-1, 0],
};

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  right: 'left',
  down: 'up',
  left: 'right',
};

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function sample<T>(values: T[], random: () => number): T {
  return values[Math.floor(random() * values.length)] as T;
}

function shuffled<T>(values: T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other] as T, result[index] as T];
  }
  return result;
}

export function toCell(x: number, y: number): number {
  return y * BOARD_SIZE + x;
}

export function fromCell(cell: number): { x: number; y: number } {
  return { x: cell % BOARD_SIZE, y: Math.floor(cell / BOARD_SIZE) };
}

function dateToDayNumber(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

export function utcDateString(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function ruleForDate(date: string): RuleKind {
  const rules: RuleKind[] = ['tailwind', 'one-way', 'ice', 'relay', 'echo', 'remix'];
  const day = dateToDayNumber(date);
  return rules[((day % rules.length) + rules.length) % rules.length] as RuleKind;
}

function nextCell(cell: number, direction: Direction): number | null {
  const { x, y } = fromCell(cell);
  const [dx, dy] = OFFSETS[direction];
  const nextX = x + dx;
  const nextY = y + dy;
  if (nextX < 0 || nextY < 0 || nextX >= BOARD_SIZE || nextY >= BOARD_SIZE) return null;
  return toCell(nextX, nextY);
}

function canEnter(
  cell: number | null,
  direction: Direction,
  positions: number[],
  movingCourier: number,
  puzzle: Puzzle,
): cell is number {
  if (cell === null || puzzle.walls.includes(cell)) return false;
  if (positions.some((position, index) => index !== movingCourier && position === cell)) return false;
  if ((puzzle.rule === 'one-way' || puzzle.rule === 'remix') && puzzle.arrows[cell] !== undefined) {
    return puzzle.arrows[cell] === direction;
  }
  return true;
}

function moveCourier(
  positions: number[],
  courier: number,
  direction: Direction,
  puzzle: Puzzle,
): { moved: boolean; positions: number[] } {
  const nextPositions = [...positions];
  const first = nextCell(nextPositions[courier] as number, direction);
  if (!canEnter(first, direction, nextPositions, courier, puzzle)) return { moved: false, positions };
  nextPositions[courier] = first;

  if ((puzzle.rule === 'tailwind' || puzzle.rule === 'remix') && puzzle.gusts[first] !== undefined) {
    const gustDirection = puzzle.gusts[first] as Direction;
    const pushed = nextCell(first, gustDirection);
    if (canEnter(pushed, gustDirection, nextPositions, courier, puzzle)) nextPositions[courier] = pushed;
  }

  if (puzzle.rule === 'ice') {
    let current = first;
    while (puzzle.ice.includes(current)) {
      const slide = nextCell(current, direction);
      if (!canEnter(slide, direction, nextPositions, courier, puzzle)) break;
      current = slide;
      nextPositions[courier] = current;
    }
  }

  return { moved: true, positions: nextPositions };
}

export function isWon(positions: number[], puzzle: Puzzle): boolean {
  return positions.every((position, index) => position === puzzle.goals[index]);
}

export function createInitialState(puzzle: Puzzle): GameState {
  return {
    positions: [...puzzle.starts],
    moves: 0,
    selected: 0,
    status: 'playing',
    message: `${COURIERS[0].name} is selected. Choose a direction.`,
    history: [],
  };
}

export function attemptMove(state: GameState, puzzle: Puzzle, move: Move): MoveResult {
  if (state.status !== 'playing') return { accepted: false, state };
  if (move.courier < 0 || move.courier >= COURIERS.length) return { accepted: false, state };

  if (puzzle.rule === 'relay' && move.courier !== state.moves % COURIERS.length) {
    const required = COURIERS[state.moves % COURIERS.length].name;
    return { accepted: false, state: { ...state, message: `${required} must move next.` } };
  }

  const primary = moveCourier(state.positions, move.courier, move.direction, puzzle);
  if (!primary.moved) {
    return {
      accepted: false,
      state: { ...state, selected: move.courier, message: `${COURIERS[move.courier].name} cannot move ${move.direction}. Try another route.` },
    };
  }

  let positions = primary.positions;
  let echoText = '';
  if (puzzle.rule === 'echo') {
    const echoCourier = (move.courier + 1) % COURIERS.length;
    const echo = moveCourier(positions, echoCourier, OPPOSITE[move.direction], puzzle);
    if (echo.moved) {
      positions = echo.positions;
      echoText = ` ${COURIERS[echoCourier].name} echoed ${OPPOSITE[move.direction]}.`;
    } else {
      echoText = ' The echo was blocked.';
    }
  }

  const moves = state.moves + 1;
  const won = isWon(positions, puzzle);
  const status: GameStatus = won ? 'won' : moves >= MOVE_LIMIT ? 'lost' : 'playing';
  const delivered = positions.filter((position, index) => position === puzzle.goals[index]).length;
  const message = won
    ? `All three couriers arrived in ${moves} moves.`
    : status === 'lost'
      ? `The 40-move limit is reached. Restart and try a shorter route.`
      : `${COURIERS[move.courier].name} moved ${move.direction}.${echoText} ${delivered} of 3 delivered.`;

  return {
    accepted: true,
    state: {
      positions,
      moves,
      selected: puzzle.rule === 'relay' ? moves % COURIERS.length : move.courier,
      status,
      message,
      history: [
        ...state.history,
        { positions: [...state.positions], moves: state.moves, selected: state.selected, message: state.message },
      ].slice(-MOVE_LIMIT),
    },
  };
}

export function undoMove(state: GameState): GameState {
  const previous = state.history.at(-1);
  if (previous === undefined || state.status !== 'playing') {
    return { ...state, message: 'There is no move to undo.' };
  }
  return {
    ...previous,
    status: 'playing',
    message: `Move undone. ${COURIERS[previous.selected].name} is selected.`,
    history: state.history.slice(0, -1),
  };
}

function stateKey(state: GameState, puzzle: Puzzle): string {
  const turn = puzzle.rule === 'relay' ? state.moves % COURIERS.length : 0;
  return `${state.positions.join(',')}|${turn}`;
}

export function findSolution(
  puzzle: Puzzle,
  startState: GameState = createInitialState(puzzle),
  maxMoves = MOVE_LIMIT - startState.moves,
): Move[] | null {
  if (isWon(startState.positions, puzzle)) return [];
  const queue: Array<{ state: GameState; path: Move[] }> = [{ state: { ...startState, history: [] }, path: [] }];
  const visited = new Set<string>([stateKey(startState, puzzle)]);
  let cursor = 0;

  while (cursor < queue.length && cursor < 150_000) {
    const current = queue[cursor++] as { state: GameState; path: Move[] };
    if (current.path.length >= maxMoves) continue;
    for (let courier = 0; courier < COURIERS.length; courier += 1) {
      for (const direction of DIRECTIONS) {
        const move = { courier, direction };
        const result = attemptMove(current.state, puzzle, move);
        if (!result.accepted) continue;
        const path = [...current.path, move];
        if (result.state.status === 'won') return path;
        if (result.state.status !== 'playing') continue;
        const key = stateKey(result.state, puzzle);
        if (visited.has(key)) continue;
        visited.add(key);
        queue.push({ state: { ...result.state, history: [] }, path });
      }
    }
  }
  return null;
}

function candidatePuzzle(date: string, attempt: number): Puzzle {
  const rule = ruleForDate(date);
  const random = mulberry32(hashSeed(`${date}:${attempt}:${rule}`));
  const starts = [toCell(0, 0), toCell(0, 2), toCell(0, 4)];
  const goals = [toCell(5, 1), toCell(5, 3), toCell(5, 5)];
  const protectedCells = new Set([...starts, ...goals]);
  const available = shuffled(
    Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => index).filter((cell) => !protectedCells.has(cell)),
    random,
  );
  const walls = available.splice(0, rule === 'relay' || rule === 'echo' ? 4 : 6).sort((a, b) => a - b);
  const featureCells = available.filter((cell) => !walls.includes(cell)).slice(0, 5);
  const arrows: Record<number, Direction> = {};
  const gusts: Record<number, Direction> = {};
  let ice: number[] = [];

  if (rule === 'one-way' || rule === 'remix') {
    for (const cell of featureCells.slice(0, rule === 'remix' ? 2 : 4)) arrows[cell] = sample(DIRECTIONS, random);
  }
  if (rule === 'tailwind' || rule === 'remix') {
    for (const cell of featureCells.slice(rule === 'remix' ? 2 : 0, rule === 'remix' ? 5 : 4)) {
      gusts[cell] = sample(DIRECTIONS, random);
    }
  }
  if (rule === 'ice') ice = featureCells.slice(0, 5).sort((a, b) => a - b);

  return {
    seed: date.replaceAll('-', ''),
    dateLabel: date,
    rule,
    starts,
    goals,
    walls,
    arrows,
    gusts,
    ice,
    solutionLength: 0,
  };
}

export function generatePuzzle(date: string): Puzzle {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const puzzle = candidatePuzzle(date, attempt);
    const solution = findSolution(puzzle);
    if (solution !== null && solution.length >= 18 && solution.length <= 32) {
      return { ...puzzle, solutionLength: solution.length };
    }
  }
  throw new Error(`No verified puzzle could be generated for ${date}.`);
}

export const DEMO_DATE = '2026-09-01';

export function createDemoState(puzzle = generatePuzzle(DEMO_DATE)): GameState {
  const solution = findSolution(puzzle);
  if (solution === null) throw new Error('The sample puzzle is not solvable.');
  let state = createInitialState(puzzle);
  const sampleMoves = Math.min(8, Math.max(5, solution.length - 7));
  for (const move of solution.slice(0, sampleMoves)) state = attemptMove(state, puzzle, move).state;
  return {
    ...state,
    selected: puzzle.rule === 'relay' ? state.moves % 3 : state.selected,
    message: `Sample route loaded at move ${state.moves}. Finish all three deliveries.`,
    history: [],
  };
}

export function courierAt(state: GameState, cell: number): number {
  return state.positions.findIndex((position) => position === cell);
}

export function goalAt(puzzle: Puzzle, cell: number): number {
  return puzzle.goals.findIndex((goal) => goal === cell);
}
