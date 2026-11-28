import { describe, expect, it } from 'vitest';
import {
  applyCaNguaOnline,
  diceFor,
  dieFor,
  initialCaNguaState,
  packDice,
  toLocal,
  turnUidOf,
  unpackDice,
} from './online';

describe('[LG-29] Cờ cá ngựa online', () => {
  it('two players sit opposite, three or four take the next colours', () => {
    expect(toLocal(initialCaNguaState(['a', 'b'], 1)).colors).toEqual([0, 2]);
    const o = initialCaNguaState(['a', 'b', 'c'], 1, 1);
    expect([o.u0, o.u1, o.u2, o.u3]).toEqual(['a', 'b', 'c', '']);
    expect(turnUidOf(o)).toBe('b');
    expect(toLocal(initialCaNguaState(['a', 'b', 'c', 'd'], 1)).colors).toEqual([0, 1, 2, 3]);
  });

  it('the dice come from the seed: everyone sees the same roll, nobody can roll again', () => {
    const rolls = Array.from({ length: 600 }, (_, i) => dieFor(42, i));
    for (let d = 1; d <= 6; d++) expect(rolls.filter((x) => x === d).length).toBeGreaterThan(70);
    let o = initialCaNguaState(['a', 'b'], 42);
    expect(applyCaNguaOnline(o, 'b', { t: 'roll' })).toBeNull(); // not b's turn
    const r = applyCaNguaOnline(o, 'a', { t: 'roll' })!;
    expect(r.lastRoll?.d).toBe(packDice(diceFor(42, 0)));
    expect(unpackDice(36)).toEqual([3, 6]);
    expect(unpackDice(70)).toBeNull();
    expect(r.rolls).toBe(1);
    // play a long game with random-but-legal actions: always consistent, someone may win
    o = r;
    for (let i = 0; i < 4000 && !o.winner; i++) {
      const who = turnUidOf(o);
      if (o.roll === 0) o = applyCaNguaOnline(o, who, { t: 'roll' })!;
      else {
        const ok = [...Array(16).keys()]
          .map((h) => applyCaNguaOnline(o, who, { t: 'move', horse: h }))
          .find(Boolean);
        expect(ok, 'rolled dice always have a move').toBeTruthy();
        o = ok!;
      }
    }
    expect(o.winner).toBeTruthy();
  });

  it('a player who left is dropped by the others; the last one standing wins', () => {
    const o = initialCaNguaState(['a', 'b', 'c'], 5);
    expect(applyCaNguaOnline(o, 'x', { t: 'drop', uid: 'b' })).toBeNull(); // not in the game
    expect(applyCaNguaOnline(o, 'a', { t: 'drop', uid: 'a' })).toBeNull();
    const d = applyCaNguaOnline(o, 'c', { t: 'drop', uid: 'b' })!;
    expect(d.colors).toBe('02');
    expect(applyCaNguaOnline(d, 'c', { t: 'drop', uid: 'b' })).toBeNull(); // already gone
    expect(applyCaNguaOnline(d, 'c', { t: 'drop', uid: 'a' })!.winner).toBe('c');
  });

  it('rejects broken states', () => {
    const o = initialCaNguaState(['a', 'b'], 5);
    expect(applyCaNguaOnline({ ...o, horses: '1,2' }, 'a', { t: 'roll' })).toBeNull();
    expect(applyCaNguaOnline({ ...o, colors: '' }, 'a', { t: 'roll' })).toBeNull();
  });
});
