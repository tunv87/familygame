import { describe, expect, it } from 'vitest';
import { createRng } from '../../lib/rng';
import { chooseMove, type AiLevel } from './ai';
import {
  BIG,
  SMALL,
  emptyBoard,
  other,
  winningLine,
  type CaroConfig,
  type Player,
  type Stone,
} from './logic';

const at = (r: number, c: number) => r * 15 + c;

function play(
  cfg: CaroConfig,
  x: (b: Stone[]) => number,
  o: (b: Stone[]) => number,
): { winner: 0 | Player; moves: number } {
  const b = emptyBoard(cfg.size);
  let p: Player = 1;
  for (let n = 0; n < b.length; n++) {
    const idx = (p === 1 ? x : o)(b);
    expect(b[idx]).toBe(0);
    b[idx] = p;
    if (winningLine(b, cfg, idx)) return { winner: p, moves: n + 1 };
    p = other(p);
  }
  return { winner: 0, moves: b.length };
}

const randomPlayer = (rand: () => number) => (b: Stone[]) => {
  const e = b.flatMap((s, i) => (s === 0 ? [i] : []));
  return e[Math.floor(rand() * e.length)];
};

describe('[LG-02] caro AI 3×3', () => {
  it('hard never loses against a random player (as X or O)', () => {
    const rand = createRng(42);
    for (let g = 0; g < 60; g++) {
      const ai = (me: Player) => (b: Stone[]) => chooseMove(b, SMALL, me, 'hard', rand);
      const asX = play(SMALL, ai(1), randomPlayer(rand));
      expect(asX.winner).not.toBe(2);
      const asO = play(SMALL, randomPlayer(rand), ai(2));
      expect(asO.winner).not.toBe(1);
    }
  });

  it('hard vs hard is always a draw', () => {
    const rand = createRng(7);
    const ai = (me: Player) => (b: Stone[]) => chooseMove(b, SMALL, me, 'hard', rand);
    for (let g = 0; g < 10; g++) expect(play(SMALL, ai(1), ai(2)).winner).toBe(0);
  });

  it('easy is beatable by hard', () => {
    const rand = createRng(3);
    let hardWins = 0;
    for (let g = 0; g < 40; g++) {
      const r = play(
        SMALL,
        (b) => chooseMove(b, SMALL, 1, 'hard', rand),
        (b) => chooseMove(b, SMALL, 2, 'easy', rand),
      );
      if (r.winner === 1) hardWins++;
    }
    expect(hardWins).toBeGreaterThan(10);
  });
});

describe('[LG-03] caro AI 15×15', () => {
  const levels: AiLevel[] = ['easy', 'medium', 'hard'];

  it('every level completes its own four to win', () => {
    for (const level of levels) {
      const b = emptyBoard(15);
      [at(7, 3), at(7, 4), at(7, 5), at(7, 6)].forEach((i) => (b[i] = 2));
      [at(3, 3), at(10, 10), at(12, 1)].forEach((i) => (b[i] = 1));
      const m = chooseMove(b, BIG, 2, level, createRng(1));
      expect([at(7, 2), at(7, 7)]).toContain(m);
    }
  });

  it('medium and hard block an opponent four', () => {
    for (const level of ['medium', 'hard'] as AiLevel[]) {
      const b = emptyBoard(15);
      [at(2, 2), at(3, 3), at(4, 4), at(5, 5)].forEach((i) => (b[i] = 1));
      b[at(1, 1)] = 2; // one end already blocked
      b[at(9, 0)] = 2;
      expect(chooseMove(b, BIG, 2, level, createRng(1))).toBe(at(6, 6));
    }
  });

  it('hard blocks an open three', () => {
    const b = emptyBoard(15);
    [at(7, 5), at(7, 6), at(7, 7)].forEach((i) => (b[i] = 1));
    b[at(8, 8)] = 2;
    b[at(6, 9)] = 2;
    const m = chooseMove(b, BIG, 2, 'hard', createRng(1));
    expect([at(7, 4), at(7, 8), at(7, 3), at(7, 9)]).toContain(m);
  });

  it('first move goes to the centre', () => {
    expect(chooseMove(emptyBoard(15), BIG, 1, 'hard')).toBe(at(7, 7));
  });

  it('hard beats easy most of the time and runs fast', () => {
    const rand = createRng(11);
    let wins = 0;
    const t0 = performance.now();
    let moves = 0;
    for (let g = 0; g < 6; g++) {
      const hardIsX = g % 2 === 0;
      const hard = (me: Player) => (b: Stone[]) => chooseMove(b, BIG, me, 'hard', rand);
      const easy = (me: Player) => (b: Stone[]) => chooseMove(b, BIG, me, 'easy', rand);
      const r = hardIsX ? play(BIG, hard(1), easy(2)) : play(BIG, easy(1), hard(2));
      moves += r.moves;
      if (r.winner === (hardIsX ? 1 : 2)) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(5);
    const perMove = (performance.now() - t0) / moves;
    expect(perMove).toBeLessThan(150);
  });
});
