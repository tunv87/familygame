import { boardFromMoves, configFor, winningLine } from './logic';

export interface CaroOnlineState {
  size: number;
  /** ordered cell indices; even positions are X */
  moves?: number[];
  xUid: string;
  oUid: string;
  /** uid of the winner, 'draw', or absent while playing */
  winner?: string;
  line?: number[];
}

export function initialCaroState(size: number, xUid: string, oUid: string): CaroOnlineState {
  return { size, moves: [], xUid, oUid };
}

export function turnUid(s: CaroOnlineState): string {
  return (s.moves?.length ?? 0) % 2 === 0 ? s.xUid : s.oUid;
}

/** Validate and apply a move. Returns null if it is not `uid`'s turn or the cell is taken. */
export function applyCaroMove(
  s: CaroOnlineState,
  uid: string,
  idx: number,
): CaroOnlineState | null {
  const moves = s.moves ?? [];
  const cfg = configFor(s.size);
  if (s.winner || turnUid(s) !== uid) return null;
  if (idx < 0 || idx >= s.size * s.size || moves.includes(idx)) return null;
  const nextMoves = [...moves, idx];
  const board = boardFromMoves(s.size, nextMoves);
  const line = winningLine(board, cfg, idx);
  const next: CaroOnlineState = { ...s, moves: nextMoves };
  if (line) {
    next.winner = uid;
    next.line = line;
  } else if (nextMoves.length === s.size * s.size) {
    next.winner = 'draw';
  }
  return next;
}
