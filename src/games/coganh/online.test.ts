import { describe, expect, it } from 'vitest';
import { idx } from './logic';
import { applyCoGanhOnline, initialCoGanhState, toLocal, turnUidOf } from './online';

describe('[LG-17] Cờ gánh online moves', () => {
  it('Black (first player) moves first; turns alternate; illegal moves are rejected', () => {
    let s = initialCoGanhState('a', 'b');
    expect(turnUidOf(s)).toBe('a');
    expect(applyCoGanhOnline(s, 'b', { from: idx(4, 2), to: idx(3, 2) })).toBeNull(); // not b's turn
    expect(applyCoGanhOnline(s, 'a', { from: idx(0, 0), to: idx(2, 2) })).toBeNull(); // not a step
    s = applyCoGanhOnline(s, 'a', { from: idx(0, 2), to: idx(1, 2) })!;
    expect(turnUidOf(s)).toBe('b');
    expect(s.board[idx(1, 2)]).toBe('1');
    expect(s.last).toEqual({ from: idx(0, 2), to: idx(1, 2) });
  });
  it('survives a Firebase round trip (empty arrays and objects are dropped)', () => {
    const s = initialCoGanhState('a', 'b');
    const stored = JSON.parse(JSON.stringify({ ...s, forced: undefined, seen: undefined }));
    expect(toLocal(stored).forced).toEqual([]);
    expect(applyCoGanhOnline(stored, 'a', { from: idx(0, 2), to: idx(1, 2) })).not.toBeNull();
  });
  it('a corrupt board is rejected instead of crashing', () => {
    const s = { ...initialCoGanhState('a', 'b'), board: '12x' };
    expect(applyCoGanhOnline(s, 'a', { from: 0, to: 1 })).toBeNull();
  });
  it('records conversions and the winner by uid', () => {
    const board = '00100' + '02220' + '02020' + '02120' + '00000';
    const s = { ...initialCoGanhState('a', 'b'), board };
    const r = applyCoGanhOnline(s, 'a', { from: idx(2, 3), to: idx(2, 2) })!;
    expect(r.ganh).toHaveLength(6);
    expect(r.winner).toBe('a');
  });
});
