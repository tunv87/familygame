import { describe, expect, it } from 'vitest';
import { chooseOAQMove, type OAQLevel } from './ai';
import { applyMove, initialState, legalMoves, type OAQState } from './logic';

const seeded = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function playGame(a: OAQLevel, b: OAQLevel, seed: number) {
  const rand = seeded(seed);
  let s: OAQState = initialState();
  while (!s.winner) {
    const m = chooseOAQMove(s, s.turn === 1 ? a : b, rand);
    expect(legalMoves(s)).toContainEqual(m);
    s = applyMove(s, m)!.state;
  }
  return s;
}

describe('[LG-19] Ô ăn quan computer', () => {
  it('always plays a legal move and games finish', () => {
    for (const lv of ['easy', 'medium', 'hard'] as OAQLevel[]) playGame(lv, lv, 7);
  });

  it('takes an obvious quan capture on medium and hard', () => {
    // field 3 has 1: rightwards → 4; 5 empty → capture quan 6 (10). Leftwards → 2; captures nothing.
    const s: OAQState = {
      ...initialState(),
      board: [0, 0, 0, 1, 0, 0, 0, 2, 2, 2, 2, 2],
      quan: [false, true],
    };
    for (const lv of ['medium', 'hard'] as OAQLevel[])
      expect(chooseOAQMove(s, lv, seeded(1))).toEqual({ from: 3, dir: 1 });
  });

  it('hard beats easy most of the time', () => {
    let wins = 0;
    for (let g = 0; g < 10; g++) {
      const s = playGame('hard', 'easy', 100 + g);
      if (s.winner === 1) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(8);
  });

  it('hard answers within a phone-friendly time', () => {
    const t0 = performance.now();
    chooseOAQMove(initialState(), 'hard', seeded(3));
    expect(performance.now() - t0).toBeLessThan(500);
  });
});
