import { describe, expect, it } from 'vitest';
import { createRng } from '../../lib/rng';
import { chooseCoGanhMove, type CoGanhLevel } from './ai';
import {
  applyMove,
  captureMoves,
  count,
  idx,
  initialState,
  legalMoves,
  type Cell,
  type CoGanhState,
  type Side,
} from './logic';

const board = (rows: string[]) =>
  rows.flatMap((r) => [...r].map((c) => (c === 'B' ? 1 : c === 'W' ? 2 : 0) as Cell));
const st = (rows: string[], turn: Side): CoGanhState => ({
  board: board(rows),
  turn,
  forced: [],
  quiet: 0,
  seen: {},
  winner: null,
  plies: 0,
});

function playGame(black: CoGanhLevel, white: CoGanhLevel, rand: () => number, maxPlies = 200) {
  let s = initialState();
  const times: number[] = [];
  while (!s.winner && s.plies < maxPlies) {
    const level = s.turn === 1 ? black : white;
    const t0 = performance.now();
    const m = chooseCoGanhMove(s, level, rand);
    times.push(performance.now() - t0);
    const legal = legalMoves(s);
    expect(legal, `illegal AI move at ply ${s.plies}`).toContainEqual(m);
    s = applyMove(s, m)!.state;
  }
  return { s, times };
}

describe('[LG-16] Cờ gánh computer', () => {
  it('always plays a legal move (and so obeys Mở) at every level, over random games', () => {
    const rand = createRng(3);
    for (const level of ['easy', 'medium', 'hard'] as CoGanhLevel[]) {
      for (let g = 0; g < 4; g++) playGame(level, 'easy', rand, 80);
    }
  });

  it('takes a Gánh when one is available (medium and hard)', () => {
    const s = st(['.....', '.....', 'W.W..', '.B...', '....W'], 1);
    for (const level of ['medium', 'hard'] as CoGanhLevel[]) {
      expect(chooseCoGanhMove(s, level, createRng(1))).toEqual({ from: idx(1, 3), to: idx(1, 2) });
    }
  });

  it('prefers the bigger Gánh', () => {
    const s = st(['.....', '.WWW.', '.W.W.', 'WBBW.', 'W.W.W'], 1);
    const gains = captureMoves(s.board, 1).map((m) => applyMove(s, m)!.ganh.length);
    expect(gains.length).toBeGreaterThan(1);
    const best = Math.max(...gains);
    expect(new Set(gains).size, 'captures of different sizes').toBeGreaterThan(1);
    const m = chooseCoGanhMove(s, 'hard', createRng(1));
    expect(applyMove(s, m)!.ganh.length).toBe(best);
  });

  it('hard beats easy clearly and answers in under 300 ms', () => {
    const rand = createRng(11);
    let hardWins = 0;
    let lost = 0;
    const times: number[] = [];
    for (let g = 0; g < 6; g++) {
      const hardIsBlack = g % 2 === 0;
      const { s, times: t } = playGame(
        hardIsBlack ? 'hard' : 'easy',
        hardIsBlack ? 'easy' : 'hard',
        rand,
      );
      times.push(...t);
      if (s.winner === (hardIsBlack ? 1 : 2)) hardWins++;
      if (s.winner === (hardIsBlack ? 2 : 1)) lost++;
    }
    expect(lost).toBe(0);
    expect(hardWins).toBeGreaterThanOrEqual(5);
    const sorted = times.sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    expect(p95, `p95 ${p95.toFixed(0)} ms`).toBeLessThan(300);
  });

  it('medium beats easy more often than not', () => {
    const rand = createRng(5);
    let wins = 0;
    for (let g = 0; g < 6; g++) {
      const mediumIsBlack = g % 2 === 0;
      const { s } = playGame(
        mediumIsBlack ? 'medium' : 'easy',
        mediumIsBlack ? 'easy' : 'medium',
        rand,
      );
      if (s.winner === (mediumIsBlack ? 1 : 2)) wins++;
      expect(count(s.board, 1) + count(s.board, 2)).toBe(16);
    }
    expect(wins).toBeGreaterThanOrEqual(4);
  });
});
