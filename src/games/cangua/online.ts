/**
 * Cờ cá ngựa state as stored in a Firebase room (2–4 players), and action validation run inside
 * a transaction. The dice come from the room's seed and the number of rolls so far, so nobody
 * can roll again for a better number. Rules live in logic.ts.
 *
 * Two dice are stored as one number: 10 × first + second (e.g. 36 = 3 and 6; 0 = no roll).
 */
import { createRng } from '../../lib/rng';
import {
  COLORS,
  applyMove,
  applyRoll,
  initialState,
  removeColor,
  validDice,
  type CaNguaState,
  type Color,
  type Dice,
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
  /** dice of the current roll (10 × first + second), 0 = must roll */
  roll: number;
  /** dice of the roll already used (bit 0 = first, bit 1 = second) */
  used?: number;
  rolls: number;
  seed: number;
  lastRoll?: { c: Color; d: number; p?: boolean };
  last?: { h: number; f: number; t: number; k?: number };
  /** uid of the winner */
  winner?: string;
}

export type CaNguaAction =
  { t: 'roll' } | { t: 'move'; horse: number; die?: 0 | 1 } | { t: 'drop'; uid: string };

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

/** The two dice of roll number `rolls`. */
export const diceFor = (seed: number, rolls: number): Dice => [
  dieFor(seed, rolls * 2),
  dieFor(seed, rolls * 2 + 1),
];
export const packDice = ([a, b]: Dice) => a * 10 + b;
export function unpackDice(n: unknown): Dice | null {
  if (typeof n !== 'number' || !Number.isInteger(n)) return null;
  const d: Dice = [Math.floor(n / 10), n % 10];
  return validDice(d) ? d : null;
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
  if (horses.length !== 16 || horses.some((x) => !Number.isInteger(x) || x < -1 || x > 57))
    throw new Error('bad horses');
  const colors = COLORS.filter((c) => String(o.colors ?? '').includes(String(c)));
  if (colors.length < 1 || !colors.includes(o.turn)) throw new Error('bad colours');
  const winner = o.winner ? colorOfUid(o, o.winner) : null;
  const s: CaNguaState = {
    colors,
    horses,
    turn: o.turn,
    roll: unpackDice(o.roll),
    used: Number.isInteger(o.used) && o.used! >= 0 && o.used! <= 2 ? o.used! : 0,
    rolls: o.rolls ?? 0,
    winner,
  };
  const lastDice = unpackDice(o.lastRoll?.d);
  if (o.lastRoll && lastDice)
    s.lastRoll = { color: o.lastRoll.c, dice: lastDice, passed: !!o.lastRoll.p };
  if (o.last)
    s.last = {
      horse: o.last.h,
      from: o.last.f,
      to: o.last.t,
      ...(o.last.k !== undefined ? { kick: o.last.k } : {}),
    };
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
    roll: s.roll ? packDice(s.roll) : 0,
    rolls: s.rolls,
    seed,
  };
  if (s.roll && s.used) out.used = s.used;
  if (s.lastRoll) {
    out.lastRoll = { c: s.lastRoll.color, d: packDice(s.lastRoll.dice) };
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
    if (a.t === 'roll') next = applyRoll(s, diceFor(o.seed, s.rolls));
    else {
      if (a.die !== undefined && a.die !== 0 && a.die !== 1) return null;
      next = applyMove(s, a.horse, a.die);
    }
  }
  return next ? toOnline(next, seats, o.seed) : null;
}
