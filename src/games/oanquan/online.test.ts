import { describe, expect, it } from 'vitest';
import { applyOAQOnline, initialOAQState, toLocal, turnUidOf } from './online';

describe('[LG-20] Ô ăn quan online moves', () => {
  it('player 1 moves first; turns alternate; illegal moves are rejected', () => {
    let s = initialOAQState('a', 'b');
    expect(turnUidOf(s)).toBe('a');
    expect(applyOAQOnline(s, 'b', { from: 7, dir: 1 })).toBeNull(); // not b's turn
    expect(applyOAQOnline(s, 'a', { from: 7, dir: 1 })).toBeNull(); // b's field
    s = applyOAQOnline(s, 'a', { from: 1, dir: 1 })!;
    expect(turnUidOf(s)).toBe('b');
    expect(s.path?.length).toBeGreaterThanOrEqual(5);
    expect(s.last).toEqual({ from: 1, dir: 1 });
  });

  it('survives a Firebase round trip (optional fields dropped)', () => {
    const s = initialOAQState('a', 'b');
    const stored = JSON.parse(JSON.stringify(s));
    expect(toLocal(stored).board).toEqual([0, 5, 5, 5, 5, 5, 0, 5, 5, 5, 5, 5]);
    expect(applyOAQOnline(stored, 'a', { from: 5, dir: -1 })).not.toBeNull();
  });

  it('a corrupt state is rejected instead of crashing', () => {
    const s = initialOAQState('a', 'b');
    expect(applyOAQOnline({ ...s, board: '1,2,x' }, 'a', { from: 1, dir: 1 })).toBeNull();
    expect(applyOAQOnline({ ...s, quan: '2' }, 'a', { from: 1, dir: 1 })).toBeNull();
  });

  it('records captures and the winner by uid', () => {
    const s = {
      ...initialOAQState('a', 'b'),
      board: '0,0,0,1,0,0,0,1,1,1,1,1',
      quan: '01',
      s1: 20,
      s2: 10,
    };
    const r = applyOAQOnline(s, 'a', { from: 3, dir: 1 })!;
    expect(r.captured).toEqual([6]);
    expect(r.tookQuan).toBe(true);
    expect(r.winner).toBe('a');
    expect(r.s1).toBe(31);
  });
});
