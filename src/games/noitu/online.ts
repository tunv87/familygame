/**
 * Nối từ state as stored in a Firebase room. Moves are checked inside a transaction against
 * the dictionary (bundled with the app), like the other games.
 *
 * Time: each turn has a deadline (ms, server-corrected clock). The player on turn loses when
 * their own timer runs out; if their app is gone, the opponent may claim the win once the
 * deadline has passed by GRACE_MS.
 */
import { TURN_SECONDS, check, type Dict, type NoiTuState, type Side } from './logic';

export const GRACE_MS = 5000;

export interface NoiTuOnlineState {
  uid1: string;
  uid2: string;
  chain: string[];
  turn: Side;
  /** when the player on turn runs out of time */
  deadline: number;
  winner?: string;
  reason?: 'timeout' | 'giveup';
}

export function initialNoiTuState(
  uid1: string,
  uid2: string,
  start: string,
  now: number,
): NoiTuOnlineState {
  return { uid1, uid2, chain: [start], turn: 1, deadline: now + TURN_SECONDS * 1000 };
}

export const turnUidOf = (o: NoiTuOnlineState) => (o.turn === 1 ? o.uid1 : o.uid2);

export function toLocal(o: NoiTuOnlineState): NoiTuState {
  const chain = Array.isArray(o.chain) ? o.chain.filter((w) => typeof w === 'string') : [];
  if (!chain.length) throw new Error('bad chain');
  return {
    chain,
    turn: o.turn === 2 ? 2 : 1,
    winner: !o.winner ? null : o.winner === o.uid1 ? 1 : 2,
    reason: o.reason,
  };
}

/** `uid` says `input`. Returns the new state, or null if not their turn / not a valid word. */
export function applyNoiTuWord(
  o: NoiTuOnlineState,
  uid: string,
  input: string,
  dict: Dict,
  now: number,
): NoiTuOnlineState | null {
  if (o.winner || turnUidOf(o) !== uid) return null;
  let s: NoiTuState;
  try {
    s = toLocal(o);
  } catch {
    return null;
  }
  const v = check(dict, s.chain, input);
  if (!v.ok) return null;
  return {
    ...o,
    chain: [...s.chain, v.word],
    turn: o.turn === 1 ? 2 : 1,
    deadline: now + TURN_SECONDS * 1000,
  };
}

/**
 * The player on turn gives up / runs out of time (by themselves), or the opponent claims a
 * win after the deadline has clearly passed. Returns null if not allowed.
 */
export function applyNoiTuLose(
  o: NoiTuOnlineState,
  uid: string,
  reason: 'timeout' | 'giveup',
  now: number,
): NoiTuOnlineState | null {
  if (o.winner) return null;
  const onTurn = turnUidOf(o);
  const otherUid = o.turn === 1 ? o.uid2 : o.uid1;
  if (uid === onTurn) return { ...o, winner: otherUid, reason };
  if (uid === otherUid && reason === 'timeout' && now > o.deadline + GRACE_MS)
    return { ...o, winner: otherUid, reason };
  return null;
}
