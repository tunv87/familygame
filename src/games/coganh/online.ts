/**
 * Cờ gánh state as stored in a Firebase room, and server-side-safe move validation
 * (run inside a transaction, like applyCaroMove). The rules live in logic.ts.
 */
import {
  applyMove,
  initialState,
  type Cell,
  type CoGanhState,
  type Move,
  type Side,
} from './logic';

export interface CoGanhOnlineState {
  blackUid: string;
  whiteUid: string;
  /** 25 characters: 0 empty, 1 Black, 2 White */
  board: string;
  turn: Side;
  forced?: Move[];
  quiet: number;
  plies: number;
  /** position counts for the threefold-repetition draw (keys are digit strings) */
  seen?: Record<string, number>;
  last?: Move;
  /** points converted by the last move */
  ganh?: number[];
  chet?: number[];
  /** uid of the winner, or 'draw' */
  winner?: string;
  drawQuiet?: boolean;
}

export function initialCoGanhState(blackUid: string, whiteUid: string): CoGanhOnlineState {
  return toOnline(initialState(), blackUid, whiteUid);
}

export function toLocal(o: CoGanhOnlineState): CoGanhState {
  const board = [...(o.board ?? '')].map((c) => Number(c) as Cell);
  if (board.length !== 25 || board.some((c) => c !== 0 && c !== 1 && c !== 2))
    throw new Error('bad board');
  const side = (uid?: string): Side | 'draw' | null =>
    !uid ? null : uid === 'draw' ? 'draw' : uid === o.blackUid ? 1 : 2;
  return {
    board,
    turn: o.turn === 2 ? 2 : 1,
    forced: o.forced ?? [],
    quiet: o.quiet ?? 0,
    seen: o.seen ?? {},
    winner: side(o.winner),
    plies: o.plies ?? 0,
    last: o.last,
  };
}

function toOnline(s: CoGanhState, blackUid: string, whiteUid: string): CoGanhOnlineState {
  const out: CoGanhOnlineState = {
    blackUid,
    whiteUid,
    board: s.board.join(''),
    turn: s.turn,
    quiet: s.quiet,
    plies: s.plies,
    seen: s.seen,
  };
  if (s.forced.length) out.forced = s.forced;
  if (s.last) out.last = s.last;
  if (s.winner) out.winner = s.winner === 'draw' ? 'draw' : s.winner === 1 ? blackUid : whiteUid;
  return out;
}

export const turnUidOf = (o: CoGanhOnlineState) => (o.turn === 1 ? o.blackUid : o.whiteUid);

/** Validates and applies `uid`'s move. Returns null if it is not their turn or not legal. */
export function applyCoGanhOnline(
  o: CoGanhOnlineState,
  uid: string,
  m: Move,
): CoGanhOnlineState | null {
  if (o.winner || turnUidOf(o) !== uid) return null;
  let local: CoGanhState;
  try {
    local = toLocal(o);
  } catch {
    return null;
  }
  const r = applyMove(local, m);
  if (!r) return null;
  const next = toOnline(r.state, o.blackUid, o.whiteUid);
  if (r.ganh.length) next.ganh = r.ganh;
  if (r.chet.length) next.chet = r.chet;
  if (r.state.winner === 'draw' && r.state.quiet >= 100) next.drawQuiet = true;
  return next;
}
