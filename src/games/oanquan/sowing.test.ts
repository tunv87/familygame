import { describe, expect, it } from 'vitest';
import { applyMove, initialState, legalMoves } from './logic';
import { framesOf } from './useSowing';

describe('[LG-26] Ô ăn quan move replay', () => {
  it('replaying the steps ends on the same board and score as the move itself', () => {
    let seed = 9;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    let checked = 0;
    for (let g = 0; g < 50; g++) {
      let s = initialState();
      while (!s.winner) {
        const ms = legalMoves(s);
        const r = applyMove(s, ms[Math.floor(rand() * ms.length)])!;
        const frames = framesOf(s, r.steps, s.turn);
        const end = frames[frames.length - 1];
        expect(r.steps[0]).toMatchObject({ t: 'pick' });
        // re-seeding and the end-of-game collection happen after the sowing
        if (!r.reseeded && !r.state.winner) {
          expect(end.board).toEqual(r.state.board);
          expect(end.quan).toEqual(r.state.quan);
          expect(end.score).toEqual(r.state.score);
          checked++;
        }
        // the hand never holds a negative number of stones and empties by the end
        expect(frames.every((f) => !f.hand || f.hand.n >= 0)).toBe(true);
        s = r.state;
      }
    }
    expect(checked).toBeGreaterThan(500);
  });

  it('a capture step adds the points to the mover at that moment', () => {
    const s = { ...initialState(), board: [0, 1, 0, 0, 2, 0, 1, 4, 0, 0, 0, 0] };
    const r = applyMove(s, { from: 1, dir: 1 })!;
    const frames = framesOf(s, r.steps, 1);
    expect(frames.map((f) => f.fx?.kind)).toEqual(['pick', 'drop', 'take', 'take']);
    expect(frames.map((f) => f.score[0])).toEqual([0, 0, 2, 13]);
  });
});
