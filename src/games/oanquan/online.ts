/**
 * Ô ăn quan state as stored in a Firebase room, and move validation run inside a
 * transaction (like Cờ gánh). Rules live in logic.ts.
 */
import { CELLS, applyMove, initialState, type Move, type OAQState, type Side } from './logic';

export interface OAQOnlineState {
  /** side 1 moves first */
  uid1: string;
  uid2: string;
  /** 12 comma-separated stone counts */
  board: string;
  /** "11": big quan stone still on cell 0 / cell 6 */
  quan: string;
  s1: number;
  s2: number;
  turn: Side;
  plies: number;
  last?: Move;
  /** cells sown / captured by the last move (for the animation) */
  path?: number[];
  captured?: number[];
  gained?: number;
  tookQuan?: boolean;
  reseeded?: boolean;
  /** uid of the winner, or 'draw' */
  winner?: string;
}

export function initialOAQState(uid1: string, uid2: string): OAQOnlineState {
  return toOnline(initialState(), uid1, uid2);
}

export function toLocal(o: OAQOnlineState): OAQState {
  const board = String(o.board ?? '')
    .split(',')
    .map(Number);
  if (board.length !== CELLS || board.some((x) => !Number.isInteger(x) || x < 0))
    throw new Error('bad board');
  const q = String(o.quan ?? '');
  if (!/^[01]{2}$/.test(q)) throw new Error('bad quan');
  const side = (uid?: string): Side | 'draw' | null =>
    !uid ? null : uid === 'draw' ? 'draw' : uid === o.uid1 ? 1 : 2;
  return {
    board,
    quan: [q[0] === '1', q[1] === '1'],
    score: [Number(o.s1) || 0, Number(o.s2) || 0],
    turn: o.turn === 2 ? 2 : 1,
    plies: o.plies ?? 0,
    winner: side(o.winner),
    last: o.last,
  };
}

function toOnline(s: OAQState, uid1: string, uid2: string): OAQOnlineState {
  const out: OAQOnlineState = {
    uid1,
    uid2,
    board: s.board.join(','),
    quan: s.quan.map((x) => (x ? '1' : '0')).join(''),
    s1: s.score[0],
    s2: s.score[1],
    turn: s.turn,
    plies: s.plies,
  };
  if (s.last) out.last = s.last;
  if (s.winner) out.winner = s.winner === 'draw' ? 'draw' : s.winner === 1 ? uid1 : uid2;
  return out;
}

export const turnUidOf = (o: OAQOnlineState) => (o.turn === 1 ? o.uid1 : o.uid2);

/** Validates and applies `uid`'s move. Returns null if it is not their turn or not legal. */
export function applyOAQOnline(o: OAQOnlineState, uid: string, m: Move): OAQOnlineState | null {
  if (o.winner || turnUidOf(o) !== uid) return null;
  let local: OAQState;
  try {
    local = toLocal(o);
  } catch {
    return null;
  }
  const r = applyMove(local, m);
  if (!r) return null;
  const next = toOnline(r.state, o.uid1, o.uid2);
  if (r.path.length) next.path = r.path;
  if (r.captured.length) next.captured = r.captured;
  if (r.gained) next.gained = r.gained;
  if (r.tookQuan) next.tookQuan = true;
  if (r.reseeded) next.reseeded = true;
  return next;
}
