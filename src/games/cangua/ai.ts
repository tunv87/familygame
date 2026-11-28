/**
 * Computer player for Cờ cá ngựa. Picks one of the legal moves for the rolled dice with simple
 * family-game priorities: climb home, kick a horse, bring a horse out, stay out of reach of
 * horses behind, then run the horse that is furthest along. A little randomness keeps it from
 * being predictable.
 */
import {
  GATE,
  HOME,
  STABLE,
  TRACK,
  cellOf,
  colorOf,
  horsesOf,
  legalMoves,
  rollsAgain,
  startCell,
  type CaNguaState,
  type Dice,
  type Color,
} from './logic';

/** How many enemy horses (or stable exits) could land on `cell` with one roll. */
function threats(s: CaNguaState, me: Color, cell: number, ignore: number): number {
  let n = 0;
  for (const c of s.colors) {
    if (c === me) continue;
    for (const h of horsesOf(c)) {
      if (h === ignore) continue;
      const p = s.horses[h];
      if (p === STABLE) {
        // a horse leaving its stable lands on its start cell
        if (startCell(c) === cell) n++;
        continue;
      }
      const from = cellOf(h, p);
      if (from === null) continue;
      const dist = (cell - from + TRACK) % TRACK;
      if (dist >= 1 && dist <= 6 && p + dist <= GATE) n++;
    }
  }
  return n;
}

function score(s: CaNguaState, dice: Dice, horse: number, to: number, kick?: number) {
  const me = colorOf(horse);
  const from = s.horses[horse];
  let v = 0;
  if (to >= HOME) v += 100 + to; // climbing the home steps
  if (kick !== undefined) v += 60 + Math.max(0, s.horses[kick]);
  if (from === STABLE) v += 40;
  if (to === GATE) v += 30;
  // danger where it lands, and danger it escapes from
  const landing = to <= GATE ? cellOf(horse, to) : null;
  if (landing !== null) v -= 25 * threats(s, me, landing, kick ?? -1);
  const now = from >= 0 && from <= GATE ? cellOf(horse, from) : null;
  if (now !== null && threats(s, me, now, -1) > 0) v += 15;
  // otherwise move the horse that is furthest along
  v += Math.max(0, to) * 0.4;
  // another roll is coming: no need to hurry a horse out of the stable onto a busy start
  if (rollsAgain(dice) && from === STABLE && landing !== null) v -= 5 * threats(s, me, landing, -1);
  return v;
}

/** The horse the computer moves with the rolled dice, or null when there is no legal move. */
export function chooseMove(s: CaNguaState, dice: Dice, rng: () => number = Math.random) {
  const moves = legalMoves(s, dice);
  if (moves.length === 0) return null;
  let best = moves[0].horse;
  let bestV = -Infinity;
  for (const m of moves) {
    const v = score(s, dice, m.horse, m.to, m.kick) + rng() * 4;
    if (v > bestV) {
      bestV = v;
      best = m.horse;
    }
  }
  return best;
}
