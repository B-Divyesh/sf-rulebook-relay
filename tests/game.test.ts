import { describe, expect, test } from 'vitest';
import {
  DEMO_DATE,
  MOVE_LIMIT,
  attemptMove,
  createDemoState,
  createInitialState,
  findSolution,
  generatePuzzle,
  isWon,
  toCell,
  type Puzzle,
  type RuleKind,
} from '../src/game';

function simplePuzzle(rule: RuleKind): Puzzle {
  return {
    seed: 'test',
    dateLabel: '2026-01-01',
    rule,
    starts: [toCell(0, 0), toCell(0, 2), toCell(0, 4)],
    goals: [toCell(5, 0), toCell(5, 2), toCell(5, 4)],
    walls: [],
    arrows: {},
    gusts: {},
    ice: [],
    solutionLength: 15,
  };
}

describe('daily puzzle generator', () => {
  test('@claim:daily-solvable every daily seed is independently solved under 40 moves', () => {
    const start = Date.UTC(2026, 0, 1);
    for (let offset = 0; offset < 42; offset += 1) {
      const date = new Date(start + offset * 86_400_000).toISOString().slice(0, 10);
      const puzzle = generatePuzzle(date);
      const solution = findSolution(puzzle);
      expect(solution, date).not.toBeNull();
      expect(solution?.length, date).toBe(puzzle.solutionLength);
      expect(solution?.length, date).toBeLessThan(MOVE_LIMIT);
    }
  }, 30_000);

  test('@claim:seed-repeat the same UTC date always creates the same board and rule', () => {
    expect(generatePuzzle('2026-09-05')).toEqual(generatePuzzle('2026-09-05'));
  });

  test('sample state is populated and still has a route to the win', () => {
    const puzzle = generatePuzzle(DEMO_DATE);
    const state = createDemoState(puzzle);
    expect(state.moves).toBeGreaterThanOrEqual(5);
    const remaining = findSolution(puzzle, state);
    expect(remaining).not.toBeNull();
    let finished = state;
    for (const move of remaining ?? []) finished = attemptMove(finished, puzzle, move).state;
    expect(isWon(finished.positions, puzzle)).toBe(true);
    expect(finished.status).toBe('won');
  });
});

describe('movement outcomes', () => {
  test('a blocked boundary does not spend a move', () => {
    const puzzle = simplePuzzle('tailwind');
    const state = createInitialState(puzzle);
    const result = attemptMove(state, puzzle, { courier: 0, direction: 'left' });
    expect(result.accepted).toBe(false);
    expect(result.state.moves).toBe(0);
    expect(result.state.message).toContain('cannot move left');
  });

  test('a one-way tile rejects entry from the wrong direction', () => {
    const puzzle = simplePuzzle('one-way');
    puzzle.arrows[toCell(1, 0)] = 'left';
    const result = attemptMove(createInitialState(puzzle), puzzle, { courier: 0, direction: 'right' });
    expect(result.accepted).toBe(false);
    expect(result.state.positions[0]).toBe(toCell(0, 0));
  });

  test('wind pushes and ice slides resolve through the normal transition', () => {
    const wind = simplePuzzle('tailwind');
    wind.gusts[toCell(1, 0)] = 'right';
    const windResult = attemptMove(createInitialState(wind), wind, { courier: 0, direction: 'right' });
    expect(windResult.state.positions[0]).toBe(toCell(2, 0));

    const ice = simplePuzzle('ice');
    ice.ice = [toCell(1, 0), toCell(2, 0)];
    const iceResult = attemptMove(createInitialState(ice), ice, { courier: 0, direction: 'right' });
    expect(iceResult.state.positions[0]).toBe(toCell(3, 0));
  });

  test('relay order blocks the wrong courier and echo moves the paired courier', () => {
    const relay = simplePuzzle('relay');
    const blocked = attemptMove(createInitialState(relay), relay, { courier: 1, direction: 'right' });
    expect(blocked.accepted).toBe(false);
    expect(blocked.state.message).toBe('Coral must move next.');

    const echo = simplePuzzle('echo');
    const state = createInitialState(echo);
    state.positions[1] = toCell(2, 2);
    const moved = attemptMove(state, echo, { courier: 0, direction: 'right' });
    expect(moved.state.positions).toEqual([toCell(1, 0), toCell(1, 2), toCell(0, 4)]);
  });

  test('the move limit produces a real loss state', () => {
    const puzzle = simplePuzzle('tailwind');
    const state = createInitialState(puzzle);
    state.moves = MOVE_LIMIT - 1;
    const result = attemptMove(state, puzzle, { courier: 0, direction: 'right' });
    expect(result.state.status).toBe('lost');
    expect(result.state.moves).toBe(MOVE_LIMIT);
  });
});
