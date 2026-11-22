import { describe, expect, it } from 'vitest';
import { applyCaroMove, initialCaroState, turnUid } from './online';

describe('caro online moves', () => {
  it('enforces turns and empty cells, detects a win', () => {
    let s = initialCaroState(3, 'x', 'o');
    expect(turnUid(s)).toBe('x');
    expect(applyCaroMove(s, 'o', 0)).toBeNull();
    s = applyCaroMove(s, 'x', 0)!;
    expect(applyCaroMove(s, 'o', 0)).toBeNull();
    s = applyCaroMove(s, 'o', 3)!;
    s = applyCaroMove(s, 'x', 1)!;
    s = applyCaroMove(s, 'o', 4)!;
    s = applyCaroMove(s, 'x', 2)!;
    expect(s.winner).toBe('x');
    expect(s.line).toEqual([0, 1, 2]);
    expect(applyCaroMove(s, 'o', 5)).toBeNull();
  });

  it('handles RTDB dropping the empty moves array', () => {
    const s = { size: 3, xUid: 'x', oUid: 'o' };
    expect(applyCaroMove(s, 'x', 4)?.moves).toEqual([4]);
  });

  it('declares a draw on a full board', () => {
    let s = initialCaroState(3, 'x', 'o');
    const order = [0, 1, 2, 4, 3, 5, 7, 6, 8];
    order.forEach((idx, i) => (s = applyCaroMove(s, i % 2 ? 'o' : 'x', idx)!));
    expect(s.winner).toBe('draw');
  });
});
