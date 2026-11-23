import { describe, expect, it } from 'vitest';
import { BIG, SMALL, boardFromMoves, outcomeOfMoves, winningLine, type Stone } from './logic';

const at = (size: number, r: number, c: number) => r * size + c;

describe('[LG-01] caro winningLine', () => {
  it('detects horizontal, vertical and both diagonals on 3×3', () => {
    const cases: number[][] = [
      [0, 1, 2],
      [0, 3, 6],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (const line of cases) {
      const b: Stone[] = new Array(9).fill(0);
      line.forEach((i) => (b[i] = 1));
      expect(winningLine(b, SMALL, line[1])?.sort()).toEqual(line.slice().sort());
    }
  });

  it('needs 5 on the big board and handles edges', () => {
    const b: Stone[] = new Array(225).fill(0);
    for (let c = 0; c < 4; c++) b[at(15, 14, c)] = 2;
    expect(winningLine(b, BIG, at(15, 14, 3))).toBeNull();
    b[at(15, 14, 4)] = 2;
    expect(winningLine(b, BIG, at(15, 14, 4))).toHaveLength(5);
  });

  it('does not wrap around rows', () => {
    const b: Stone[] = new Array(225).fill(0);
    [at(15, 0, 12), at(15, 0, 13), at(15, 0, 14), at(15, 1, 0), at(15, 1, 1)].forEach(
      (i) => (b[i] = 1),
    );
    expect(winningLine(b, BIG, at(15, 1, 0))).toBeNull();
  });

  it('detects anti-diagonal on the big board', () => {
    const b: Stone[] = new Array(225).fill(0);
    for (let k = 0; k < 5; k++) b[at(15, 2 + k, 10 - k)] = 1;
    expect(winningLine(b, BIG, at(15, 4, 8))).toHaveLength(5);
  });
});

describe('[LG-01] caro outcome', () => {
  it('X wins, draw, ongoing', () => {
    expect(outcomeOfMoves(SMALL, [0, 3, 1, 4, 2])?.winner).toBe(1);
    // X O X / X O O / O X X  → draw
    expect(outcomeOfMoves(SMALL, [0, 1, 2, 4, 3, 5, 7, 6, 8])?.winner).toBe(0);
    expect(outcomeOfMoves(SMALL, [0, 1])).toBeNull();
  });

  it('boardFromMoves alternates X/O', () => {
    expect(boardFromMoves(3, [4, 0, 8])).toEqual([2, 0, 0, 0, 1, 0, 0, 0, 1]);
  });
});
