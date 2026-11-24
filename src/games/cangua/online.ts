/**
 * Cờ cá ngựa state as stored in a Firebase room (2–4 players), and action validation run inside
 * a transaction. The die comes from the room's seed and the number of rolls so far, so nobody
 * can roll again for a better number. Rules live in logic.ts.
 */
import { createRng } from '../../lib/rng';
import {
  COLORS,
  applyMove,
  applyRoll,
  initialState,
  removeColor,
  type CaNguaState,
  type Color,
} from './logic';

export interface CaNguaOnlineState {
  /** uid playing each colour ('' = nobody) */
  u0: string;
  u1: string;
  u2: string;
  u3: string;
  /** 16 comma-separated horse positions */
  horses: string;
  /** colours still playing, e.g. "02" */
  colors: string;
  turn: Color;
  /** die to move with, 0 = must roll */
  roll: number;
  rolls: number;
  seed: number;
  lastRoll?: { c: Color; v: number; p?: boolean };
  last?: { h: number; f: number; t: number; k?: number };
  /** uid of the winner */
  winner?: string;
}

export type CaNguaAction = { t: 'roll' } | { t: 'move'; horse: number } | { t: 'drop'; uid: string };

/** Colours for 2, 3 or 4 players: two players sit opposite each other. */
export function colorsFor(n: number): Color[] {
  return n <= 2 ? [0, 2] : n === 3 ? [0, 1, 2] : [0, 1, 2, 3];
}

/** `uids` in seat order; `first` is the index of the player who rolls first. */
export function initialCaNguaState(uids: string[], seed: number, first = 0): CaNguaOnlineState {
  const n = Math.min(4, uids.length);
  const colors = colorsFor(n);
  const seats = ['', '', '', ''];
  colors.forEach((c, i) => (seats[c] = uids[i]));
  const s = initialState(colors);
  s.turn = colors[first % colors.length];
  return toOnline(s, seats, seed);
}

export function dieFor(seed: number, rolls: number) {
  return 1 + Math.floor(createRng((seed ^ Math.imul(rolls + 1, 0x9e3779b1)) >>> 0)() * 6);
}

export const seatsOf = (o: CaNguaOnlineState) => [o.u0 ?? '', o.u1 ?? '', o.u2 ?? '', o.u3 ?? ''];
export const colorOfUid = (o: CaNguaOnlineState, uid: string): Color | null => {
  const i = seatsOf(o).indexOf(uid);
  return i < 0 ? null : (i as Color);
};
export const turnUidOf = (o: CaNguaOnlineState) => seatsOf(o)[o.turn] ?? '';

export function toLocal(o: CaNguaOnlineState): CaNguaState {
  const horses = String(o.horses ?? '')
    .split(',')
    .map(Number);
  if (horses.length !== 16 || horses.some((x) => !Number.isInteger(x) || x < -1 || x > 56))
    throw new Error('bad horses');
  const colors = COLORS.filter((c) => String(o.colors ?? '').includes(String(c)));
  if (colors.length < 1 || !colors.includes(o.turn)) throw new Error('bad colours');
  const winner = o.winner ? colorOfUid(o, o.winner) : null;
  const s: CaNguaState = {
    colors,
    horses,
    turn: o.turn,
    roll: o.roll >= 1 && o.roll <= 6 ? o.roll : null,
    rolls: o.rolls ?? 0,
    winner,
  };
  if (o.lastRoll) s.lastRoll = { color: o.lastRoll.c, value: o.lastRoll.v, passed: !!o.lastRoll.p };
  if (o.last)
    s.last = { horse: o.last.h, from: o.last.f, to: o.last.t, ...(o.last.k !== undefined ? { kick: o.last.k } : {}) };
  return s;
}

function toOnline(s: CaNguaState, seats: string[], seed: number): CaNguaOnlineState {
  const out: CaNguaOnlineState = {
    u0: seats[0],
    u1: seats[1],
    u2: seats[2],
    u3: seats[3],
    horses: s.horses.join(','),
    colors: s.colors.join(''),
    turn: s.turn,
    roll: s.roll ?? 0,
    rolls: s.rolls,
    seed,
  };
  if (s.lastRoll) {
    out.lastRoll = { c: s.lastRoll.color, v: s.lastRoll.value };
    if (s.lastRoll.passed) out.lastRoll.p = true;
  }
  if (s.last) {
    out.last = { h: s.last.horse, f: s.last.from, t: s.last.to };
    if (s.last.kick !== undefined) out.last.k = s.last.kick;
  }
  if (s.winner !== null) out.winner = seats[s.winner];
  return out;
}

/**
 * Validates and applies `uid`'s action. A roll or a move must be the player's own turn; any
 * player still in the room may drop one who has left (their horses go home). Returns null when
 * the action is not allowed.
 */
export function applyCaNguaOnline(
  o: CaNguaOnlineState,
  uid: string,
  a: CaNguaAction,
): CaNguaOnlineState | null {
  if (o.winner) return null;
  let s: CaNguaState;
  try {
    s = toLocal(o);
  } catch {
    return null;
  }
  const seats = seatsOf(o);
  let next: CaNguaState | null = null;
  if (a.t === 'drop') {
    const c = colorOfUid(o, a.uid);
    const me = colorOfUid(o, uid);
    if (c === null || me === null || c === me || !s.colors.includes(me)) return null;
    next = removeColor(s, c);
    if (next === s) return null;
  } else {
    if (turnUidOf(o) !== uid) return null;
    next = a.t === 'roll' ? applyRoll(s, dieFor(o.seed, s.rolls)) : applyMove(s, a.horse);
  }
  return next ? toOnline(next, seats, o.seed) : null;
}
