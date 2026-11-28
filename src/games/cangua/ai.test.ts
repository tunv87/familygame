import { describe, expect, it } from 'vitest';
import { createRng } from '../../lib/rng';
import { chooseMove } from './ai';
import {
  applyMove,
  applyRoll,
  initialState,
  legalMoves,
  type CaNguaState,
  type Dice,
  type Move,
} from './logic';

/** Plays a whole game; `pick` chooses the move (die and horse) for each colour. */
function play(colors: (0 | 1 | 2 | 3)[], seed: number, pick: (s: CaNguaState, d: Dice) => Move) {
  const rng = createRng(seed);
  let s = initialState(colors);
  for (let i = 0; i < 20000 && s.winner === null; i++) {
    const d: Dice = [1 + Math.floor(rng() * 6), 1 + Math.floor(rng() * 6)];
    const r = applyRoll(s, d);
    if (!r) throw new Error('roll refused');
    s = r;
    while (s.roll !== null) {
      const p = pick(s, s.roll);
      const m = applyMove(s, p.horse, p.die);
      if (!m) throw new Error('move refused');
      s = m;
    }
  }
  return s;
}

describe('[LG-31] Cờ cá ngựa computer player', () => {
  it('always picks a legal horse, or null when there is none', () => {
    const rng = createRng(7);
    let s = initialState([0, 1, 2, 3]);
    for (let i = 0; i < 3000 && s.winner === null; i++) {
      const d: Dice = [1 + Math.floor(rng() * 6), 1 + Math.floor(rng() * 6)];
      if (legalMoves(s, d).length === 0) expect(chooseMove(s, d, rng)).toBeNull();
      s = applyRoll(s, d)!;
      while (s.roll !== null) {
        const legal = legalMoves(s, s.roll, s.used);
        const m = chooseMove(s, s.roll, rng, s.used)!;
        expect(legal).toContainEqual(m);
        s = applyMove(s, m.horse, m.die)!;
      }
    }
  });

  it('kicks a horse when it can', () => {
    const s = initialState([0, 2]);
    s.horses[0] = 10; // red on track cell 10
    s.horses[1] = 20; // another red horse that could move instead
    s.horses[8] = 39; // green (starts at cell 26) on track cell 13, three cells ahead of red
    expect(legalMoves(s, [3, 2]).some((m) => m.kick === 8)).toBe(true);
    expect(chooseMove(s, [3, 2], () => 0)).toMatchObject({ horse: 0, die: 0, kick: 8 });
  });

  it('every game between computers ends with a winner', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = play([0, 1, 2, 3], seed, (st, d) => chooseMove(st, d, Math.random, st.used)!);
      expect(s.winner).not.toBeNull();
    }
  });

  it('beats a player who moves at random most of the time', () => {
    let wins = 0;
    const games = 120;
    for (let seed = 1; seed <= games; seed++) {
      const rnd = createRng(seed * 31);
      const s = play([0, 2], seed, (st, d) => {
        if (st.turn === 0) return chooseMove(st, d, rnd, st.used)!;
        const legal = legalMoves(st, d, st.used);
        return legal[Math.floor(rnd() * legal.length)];
      });
      if (s.winner === 0) wins++;
    }
    expect(wins / games).toBeGreaterThan(0.6);
  });
});
