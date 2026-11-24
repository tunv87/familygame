/**
 * Cờ cá ngựa rules engine (pure, no React).
 *
 * Board: a cross-shaped track of 52 cells around the centre, walked clockwise. Each of the four
 * colours (0 red, 1 blue, 2 green, 3 yellow) has a stable (chuồng) in a corner, a start cell on
 * the track and a home column of 6 steps (bậc 1–6) leading to the centre.
 *
 * A horse's position is stored relative to its own colour:
 *   -1        in the stable
 *   0 … 50    on the track, 0 = its start cell, 50 = its gate (the cell in front of its home)
 *   51 … 56   home steps 1 … 6
 * Its track cell is (13 × colour + position) mod 52.
 *
 * Rules (as chosen for this app, common Vietnamese family rules, one die):
 *  - Roll the die. A 6 or a 1 lets a horse leave the stable onto its start cell.
 *  - A horse moves exactly the number rolled. It may not jump over any horse, may not land on
 *    a horse of its own colour, and may not go past its gate.
 *  - Landing exactly on another colour's horse kicks it back to its stable (đá).
 *  - From the gate, a roll of n climbs straight to step n (steps 1 … n must be free). On step
 *    k, only a roll of k + 1 climbs one more step.
 *  - A 6 gives another roll. With no possible move, the turn passes (a 6 still rolls again).
 *  - The first colour with its four horses on steps 3, 4, 5 and 6 wins.
 */

export type Color = 0 | 1 | 2 | 3;
export const COLORS: Color[] = [0, 1, 2, 3];
export const TRACK = 52;
export const ARM = 13; // track cells between two start cells
export const GATE = 50;
export const HOME = 51; // position of home step 1
export const STEPS = 6;
export const HORSES = 4;
export const STABLE = -1;
/** guard against endless games (every roll counts) */
export const MAX_ROLLS = 3000;

export interface Move {
  horse: number; // 0 … 15 (colour × 4 + i)
  to: number;
  /** index of the horse that is kicked back to its stable */
  kick?: number;
}

export interface CaNguaState {
  /** colours that play, in turn order */
  colors: Color[];
  /** 16 positions, see above (horses of colours not playing stay in their stable) */
  horses: number[];
  turn: Color;
  /** the die the player must now move with, or null when they must roll */
  roll: number | null;
  rolls: number;
  winner: Color | null;
  /** last roll and move, for the screen */
  lastRoll?: { color: Color; value: number; passed?: boolean };
  last?: { horse: number; from: number; to: number; kick?: number };
}

export const colorOf = (horse: number) => Math.floor(horse / HORSES) as Color;
export const horsesOf = (c: Color) => [0, 1, 2, 3].map((i) => c * HORSES + i);
export const startCell = (c: Color) => c * ARM;
/** absolute track cell of a horse, or null when it is in its stable or home column */
export function cellOf(horse: number, pos: number): number | null {
  if (pos < 0 || pos > GATE) return null;
  return (startCell(colorOf(horse)) + pos) % TRACK;
}

export function initialState(colors: Color[]): CaNguaState {
  const list = COLORS.filter((c) => colors.includes(c));
  if (list.length < 2) throw new Error('needs two colours');
  return {
    colors: list,
    horses: Array(16).fill(STABLE),
    turn: list[0],
    roll: null,
    rolls: 0,
    winner: null,
  };
}

/** horse standing on a track cell, if any */
function onCell(s: CaNguaState, cell: number): number | null {
  for (let h = 0; h < 16; h++) if (cellOf(h, s.horses[h]) === cell) return h;
  return null;
}

/** Every legal move for the player to move with die value `d`. */
export function legalMoves(s: CaNguaState, d: number): Move[] {
  if (s.winner !== null) return [];
  const c = s.turn;
  const out: Move[] = [];
  let leftStable = false;
  for (const h of horsesOf(c)) {
    const p = s.horses[h];
    if (p === STABLE) {
      if ((d !== 6 && d !== 1) || leftStable) continue;
      leftStable = true; // one choice is enough: the horses in the stable are all the same
      const other = onCell(s, startCell(c));
      if (other !== null && colorOf(other) === c) continue;
      out.push(other === null ? { horse: h, to: 0 } : { horse: h, to: 0, kick: other });
    } else if (p < GATE) {
      const to = p + d;
      if (to > GATE) continue; // cannot go past the gate
      let blocked = false;
      for (let q = p + 1; q < to && !blocked; q++)
        blocked = onCell(s, (startCell(c) + q) % TRACK) !== null;
      if (blocked) continue;
      const other = onCell(s, (startCell(c) + to) % TRACK);
      if (other !== null && colorOf(other) === c) continue;
      out.push(other === null ? { horse: h, to } : { horse: h, to, kick: other });
    } else if (p === GATE) {
      const to = GATE + d; // step d
      const busy = horsesOf(c).some((o) => s.horses[o] > GATE && s.horses[o] <= to);
      if (!busy) out.push({ horse: h, to });
    } else {
      const step = p - GATE;
      if (step >= STEPS || d !== step + 1) continue;
      if (!horsesOf(c).some((o) => s.horses[o] === p + 1)) out.push({ horse: h, to: p + 1 });
    }
  }
  return out;
}

export function nextColor(s: CaNguaState, c: Color = s.turn): Color {
  const i = s.colors.indexOf(c);
  return s.colors[(i + 1) % s.colors.length];
}

export function hasWon(s: CaNguaState, c: Color) {
  const top = horsesOf(c)
    .map((h) => s.horses[h])
    .sort((a, b) => a - b);
  return top.join() === [HOME + 2, HOME + 3, HOME + 4, HOME + 5].join();
}

/** The player to move rolls `d`. With no legal move the turn passes at once. */
export function applyRoll(s: CaNguaState, d: number): CaNguaState | null {
  if (s.winner !== null || s.roll !== null || !Number.isInteger(d) || d < 1 || d > 6) return null;
  const rolls = s.rolls + 1;
  const moves = legalMoves(s, d);
  if (moves.length > 0)
    return { ...s, roll: d, rolls, lastRoll: { color: s.turn, value: d }, last: undefined };
  const out: CaNguaState = {
    ...s,
    roll: null,
    rolls,
    turn: d === 6 ? s.turn : nextColor(s),
    lastRoll: { color: s.turn, value: d, passed: true },
    last: undefined,
  };
  return rolls >= MAX_ROLLS ? { ...out, winner: leader(out) } : out;
}

/** Moves `horse` with the rolled die. */
export function applyMove(s: CaNguaState, horse: number): CaNguaState | null {
  if (s.roll === null || s.winner !== null) return null;
  const m = legalMoves(s, s.roll).find((x) => x.horse === horse);
  if (!m) return null;
  const horses = s.horses.slice();
  const from = horses[horse];
  horses[horse] = m.to;
  if (m.kick !== undefined) horses[m.kick] = STABLE;
  const next: CaNguaState = {
    ...s,
    horses,
    roll: null,
    turn: s.roll === 6 ? s.turn : nextColor(s),
    last: m.kick !== undefined ? { horse, from, to: m.to, kick: m.kick } : { horse, from, to: m.to },
  };
  if (hasWon(next, s.turn)) return { ...next, winner: s.turn, turn: s.turn };
  if (next.rolls >= MAX_ROLLS) return { ...next, winner: leader(next) };
  return next;
}

/** Progress of a colour (for the safety cap): sum of its horses' positions. */
export function progress(s: CaNguaState, c: Color) {
  return horsesOf(c).reduce((sum, h) => sum + s.horses[h] + 1, 0);
}

function leader(s: CaNguaState): Color {
  return s.colors.reduce((best, c) => (progress(s, c) > progress(s, best) ? c : best));
}

/** A player left: their horses go back to the stable and the others play on. */
export function removeColor(s: CaNguaState, c: Color): CaNguaState {
  if (!s.colors.includes(c) || s.winner !== null) return s;
  const colors = s.colors.filter((x) => x !== c);
  const horses = s.horses.slice();
  for (const h of horsesOf(c)) horses[h] = STABLE;
  const turn = s.turn === c ? nextColor(s) : s.turn;
  const out: CaNguaState = {
    ...s,
    colors,
    horses,
    turn,
    roll: s.turn === c ? null : s.roll,
  };
  return colors.length === 1 ? { ...out, winner: colors[0], roll: null } : out;
}
