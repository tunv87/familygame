import { describe, expect, it } from 'vitest';
import {
  LEVELS,
  applyClaim,
  initialState,
  makeLayout,
  numbersWinner,
  type NumbersLevel,
} from './logic';

describe('numbers layout', () => {
  const levels: NumbersLevel[] = ['easy', 'medium', 'hard'];

  it('contains every number exactly once', () => {
    for (const level of levels) {
      const { tiles } = makeLayout(level, 123);
      expect(tiles.map((t) => t.n).sort((a, b) => a - b)).toEqual(
        Array.from({ length: LEVELS[level].total }, (_, i) => i + 1),
      );
    }
  });

  it('is deterministic for the same seed and differs for another seed', () => {
    expect(makeLayout('hard', 99)).toEqual(makeLayout('hard', 99));
    expect(makeLayout('hard', 99)).not.toEqual(makeLayout('hard', 100));
  });

  it('gives every number the same size (only position/rotation vary)', () => {
    for (const level of levels) {
      const sizes = new Set(makeLayout(level, 7).tiles.map((t) => t.size));
      expect(sizes.size).toBe(1);
    }
  });

  it('never overlaps tiles and stays inside the board', () => {
    for (const level of levels) {
      for (let seed = 0; seed < 30; seed++) {
        const { cols, rows, tiles } = makeLayout(level, seed);
        // work in grid-cell units
        const pts = tiles.map((t) => ({ x: t.x * cols, y: t.y * rows, r: t.size / 2 }));
        for (const p of pts) {
          expect(p.x - p.r).toBeGreaterThanOrEqual(0);
          expect(p.y - p.r).toBeGreaterThanOrEqual(0);
          expect(p.x + p.r).toBeLessThanOrEqual(cols);
          expect(p.y + p.r).toBeLessThanOrEqual(rows);
        }
        for (let i = 0; i < pts.length; i++)
          for (let j = i + 1; j < pts.length; j++) {
            const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
            expect(d).toBeGreaterThan(pts[i].r + pts[j].r);
          }
      }
    }
  });
});

describe('numbers claims', () => {
  it('only the next number can be claimed and scores add up', () => {
    let s = initialState('easy', 1, ['a', 'b'], 0);
    expect(applyClaim(s, 'a', 2)).toBeNull();
    s = applyClaim(s, 'a', 1)!;
    expect(applyClaim(s, 'b', 1)).toBeNull(); // already taken
    s = applyClaim(s, 'b', 2)!;
    expect(s.scores).toEqual({ a: 1, b: 1 });
    expect(s.owner).toEqual({ 1: 'a', 2: 'b' });
    expect(applyClaim(s, 'stranger', 3)).toBeNull();
  });

  it('finishes after the last number and picks the winner', () => {
    let s = initialState('easy', 1, ['a', 'b'], 0);
    for (let n = 1; n <= 30; n++) s = applyClaim(s, n % 3 === 0 ? 'b' : 'a', n)!;
    expect(s.done).toBe(true);
    expect(numbersWinner(s)).toBe('a');
    expect(applyClaim(s, 'a', 31)).toBeNull();
  });

  it('reports a draw on equal scores', () => {
    let s = initialState('easy', 1, ['a', 'b'], 0);
    for (let n = 1; n <= 30; n++) s = applyClaim(s, n % 2 ? 'a' : 'b', n)!;
    expect(numbersWinner(s)).toBe('draw');
  });
});
