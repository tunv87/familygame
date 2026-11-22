/** 0 = empty, 1 = X (goes first), 2 = O */
export type Stone = 0 | 1 | 2;
export type Player = 1 | 2;

export interface CaroConfig {
  size: number;
  winLen: number;
}

export const SMALL: CaroConfig = { size: 3, winLen: 3 };
export const BIG: CaroConfig = { size: 15, winLen: 5 };

export function configFor(size: number): CaroConfig {
  return size === 3 ? SMALL : BIG;
}

export const DIRS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export function emptyBoard(size: number): Stone[] {
  return new Array<Stone>(size * size).fill(0);
}

export function other(p: Player): Player {
  return p === 1 ? 2 : 1;
}

/** Build a board from an ordered list of moves; X always plays first. */
export function boardFromMoves(size: number, moves: readonly number[]): Stone[] {
  const b = emptyBoard(size);
  moves.forEach((idx, i) => {
    b[idx] = i % 2 === 0 ? 1 : 2;
  });
  return b;
}

/**
 * Returns the winning line (cell indices) through `idx` if the stone there completes
 * `winLen` in a row, otherwise null. Free-style: longer lines also win.
 */
export function winningLine(
  board: readonly Stone[],
  cfg: CaroConfig,
  idx: number,
): number[] | null {
  const { size, winLen } = cfg;
  const p = board[idx];
  if (!p) return null;
  const r0 = Math.floor(idx / size);
  const c0 = idx % size;
  for (const [dr, dc] of DIRS) {
    const line = [idx];
    for (const sign of [1, -1]) {
      let r = r0 + dr * sign;
      let c = c0 + dc * sign;
      while (r >= 0 && r < size && c >= 0 && c < size && board[r * size + c] === p) {
        if (sign === 1) line.push(r * size + c);
        else line.unshift(r * size + c);
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (line.length >= winLen) return line;
  }
  return null;
}

export type Outcome = { winner: Player; line: number[] } | { winner: 0; line: [] } | null;

/** Outcome after the last move: a win, a draw (board full), or null (game continues). */
export function outcomeAfter(board: readonly Stone[], cfg: CaroConfig, lastIdx: number): Outcome {
  const line = winningLine(board, cfg, lastIdx);
  if (line) return { winner: board[lastIdx] as Player, line };
  if (board.every((s) => s !== 0)) return { winner: 0, line: [] };
  return null;
}

export function outcomeOfMoves(cfg: CaroConfig, moves: readonly number[]): Outcome {
  if (moves.length === 0) return null;
  return outcomeAfter(boardFromMoves(cfg.size, moves), cfg, moves[moves.length - 1]);
}
