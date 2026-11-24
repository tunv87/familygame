/**
 * Where everything sits on the 15 × 15 Cờ cá ngựa board: [row, col] of each track cell, home
 * step and stable slot. Red (0) is top-left, then clockwise blue (1), green (2), yellow (3).
 */
import { ARM, GATE, HOME, STABLE, colorOf, type Color } from './logic';

export type RC = [number, number];

/** The 52 track cells, clockwise from red's start cell. */
export const TRACK_CELLS: RC[] = (() => {
  const out: RC[] = [];
  const run = (r0: number, c0: number, dr: number, dc: number, n: number) => {
    for (let i = 0; i < n; i++) out.push([r0 + dr * i, c0 + dc * i]);
  };
  run(6, 1, 0, 1, 5); // → along row 6
  run(5, 6, -1, 0, 6); // ↑ col 6
  run(0, 7, 0, 1, 1);
  run(0, 8, 1, 0, 6); // ↓ col 8
  run(6, 9, 0, 1, 6); // → row 6
  run(7, 14, 1, 0, 1);
  run(8, 14, 0, -1, 6); // ← row 8
  run(9, 8, 1, 0, 6); // ↓ col 8
  run(14, 7, 0, -1, 1);
  run(14, 6, -1, 0, 6); // ↑ col 6
  run(8, 5, 0, -1, 6); // ← row 8
  run(7, 0, -1, 0, 1);
  run(6, 0, 0, 1, 1);
  return out;
})();

/** Home steps 1 … 6 of each colour, from its gate towards the centre. */
export const HOME_CELLS: Record<Color, RC[]> = {
  0: [1, 2, 3, 4, 5, 6].map((i) => [7, i] as RC),
  1: [1, 2, 3, 4, 5, 6].map((i) => [i, 7] as RC),
  2: [1, 2, 3, 4, 5, 6].map((i) => [7, 14 - i] as RC),
  3: [1, 2, 3, 4, 5, 6].map((i) => [14 - i, 7] as RC),
};

/** Top-left corner of each 6 × 6 stable. */
export const STABLE_AT: Record<Color, RC> = { 0: [0, 0], 1: [0, 9], 2: [9, 9], 3: [9, 0] };

/** Centre of a horse (in cell units, fractional for the stable slots). */
export function horseAt(horse: number, pos: number): RC {
  const c = colorOf(horse);
  if (pos === STABLE) {
    const [r, col] = STABLE_AT[c];
    const i = horse % 4;
    return [r + 1.75 + Math.floor(i / 2) * 2.5, col + 1.75 + (i % 2) * 2.5];
  }
  const [r, col] = pos > GATE ? HOME_CELLS[c][pos - HOME] : TRACK_CELLS[(c * ARM + pos) % 52];
  return [r + 0.5, col + 0.5];
}
