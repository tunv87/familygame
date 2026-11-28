import { describe, expect, it } from 'vitest';
import {
  GATE,
  HOME,
  STABLE,
  applyMove,
  applyRoll,
  cellOf,
  hasWon,
  initialState,
  legalMoves,
  removeColor,
  rollsAgain,
  type CaNguaState,
} from './logic';

/** a two-colour game (red 0 against green 2) with some horses placed */
function at(place: Record<number, number>, turn: 0 | 1 | 2 | 3 = 0): CaNguaState {
  const s = initialState([0, 2]);
  for (const [h, p] of Object.entries(place)) s.horses[Number(h)] = p;
  return { ...s, turn };
}

describe('[LG-28] Cờ cá ngựa rules (two dice)', () => {
  it('a 1 or a 6 on either die brings a horse out; other rolls pass the turn', () => {
    const s = initialState([0, 2]);
    expect(legalMoves(s, [6, 3])).toEqual([{ horse: 0, to: 0 }]);
    expect(legalMoves(s, [2, 1])).toEqual([{ horse: 0, to: 0 }]);
    for (const d of [
      [2, 3],
      [4, 5],
      [5, 5],
    ] as [number, number][]) {
      const r = applyRoll(s, d)!;
      expect(r.turn).toBe(2);
      expect(r.roll).toBeNull();
      expect(r.lastRoll).toEqual({ color: 0, dice: d, passed: true });
    }
    expect(applyRoll(s, [0, 3])).toBeNull();
    expect(applyRoll(s, [7, 3])).toBeNull();
  });

  it('1-1, 1-6, 6-1 and 6-6 roll again; anything else passes the turn', () => {
    expect([
      rollsAgain([1, 1]),
      rollsAgain([1, 6]),
      rollsAgain([6, 1]),
      rollsAgain([6, 6]),
    ]).toEqual([true, true, true, true]);
    expect([rollsAgain([6, 5]), rollsAgain([2, 2]), rollsAgain([3, 1])]).toEqual([
      false,
      false,
      false,
    ]);
    let s = applyRoll(initialState([0, 2]), [6, 6])!;
    s = applyMove(s, 0)!;
    expect(s.horses[0]).toBe(0);
    expect(s.turn).toBe(0); // rolls again
    s = applyMove(applyRoll(s, [6, 3])!, 0)!;
    expect(s.horses[0]).toBe(9); // moves the sum
    expect(s.turn).toBe(2);
    expect(applyMove(s, 0)).toBeNull(); // not rolled yet
    expect(applyRoll(applyRoll(s, [6, 1])!, [2, 2])).toBeNull(); // must move before rolling again
  });

  it('on the track a horse moves the sum and cannot jump or land on its own colour', () => {
    // red horse 0 on cell 2, red horse 1 on cell 5, green horse 8 on red's cell 8
    const s = at({ 0: 2, 1: 5, 8: 8 - 26 + 52 });
    expect(cellOf(8, s.horses[8])).toBe(8);
    expect(legalMoves(s, [2, 2]).map((m) => m.horse)).toEqual([]); // 2→6 jumps 5, 5→9 jumps 8
    expect(legalMoves(s, [2, 1]).find((m) => m.horse === 1)).toEqual({ horse: 1, to: 8, kick: 8 });
    // 1 + 2: horse 0 would land on its own colour; horse 1 kicks; the 1 lets horse 2 out
    expect(legalMoves(s, [1, 2]).map((m) => m.horse)).toEqual([1, 2]);
  });

  it('landing on another colour kicks it back to its stable', () => {
    const s: CaNguaState = { ...at({ 1: 5, 8: 34 }), roll: [2, 1] };
    const r = applyMove(s, 1)!;
    expect(r.horses[1]).toBe(8);
    expect(r.horses[8]).toBe(STABLE);
    expect(r.last).toEqual({ horse: 1, from: 5, to: 8, kick: 8 });
  });

  it('coming out onto a start cell kicks a horse waiting there, but not your own', () => {
    expect(legalMoves(at({ 8: 26 }), [6, 4])).toEqual([{ horse: 0, to: 0, kick: 8 }]);
    expect(legalMoves(at({ 1: 0 }), [6, 4]).map((m) => m.horse)).toEqual([1]); // only move it on
  });

  it('no going past the gate; home steps use one die', () => {
    expect(legalMoves(at({ 0: 45 }), [3, 4])).toEqual([]); // 45 + 7 > gate
    expect(legalMoves(at({ 0: 45 }), [2, 3])).toEqual([{ horse: 0, to: GATE }]);
    // from the gate: the higher free step of the two dice
    expect(legalMoves(at({ 0: GATE }), [4, 2])).toEqual([{ horse: 0, to: HOME + 3 }]);
    // step 2 is taken: only a die showing 1 climbs (to step 1)
    const s = at({ 0: GATE, 1: HOME + 1 });
    expect(legalMoves(s, [1, 4]).filter((m) => m.horse === 0)).toEqual([{ horse: 0, to: HOME }]);
    expect(legalMoves(s, [4, 5])).toEqual([]);
    // on step k a die must show k + 1
    expect(legalMoves(at({ 0: HOME + 1 }), [5, 3])).toEqual([{ horse: 0, to: HOME + 2 }]);
    expect(legalMoves(at({ 0: HOME + 1 }), [2, 2])).toEqual([]);
    expect(legalMoves(at({ 0: HOME + 5 }), [6, 6]).filter((m) => m.horse === 0)).toEqual([]);
  });

  it('four horses on steps 3–6 win', () => {
    const s: CaNguaState = {
      ...at({ 0: HOME + 5, 1: HOME + 4, 2: HOME + 3, 3: GATE }),
      roll: [3, 5],
    };
    expect(hasWon(s, 0)).toBe(false);
    const r = applyMove(s, 3)!;
    expect(r.horses[3]).toBe(HOME + 2);
    expect(r.winner).toBe(0);
    expect(applyRoll(r, [6, 6])).toBeNull();
  });

  it('turns go round the colours that play; a leaver drops out', () => {
    const s = initialState([3, 0, 1]);
    expect(s.colors).toEqual([0, 1, 3]);
    expect(applyRoll(s, [2, 3])!.turn).toBe(1);
    const r = removeColor({ ...s, turn: 1, horses: s.horses.map((_, h) => (h === 4 ? 9 : -1)) }, 1);
    expect(r.colors).toEqual([0, 3]);
    expect(r.turn).toBe(3);
    expect(r.horses[4]).toBe(STABLE);
    expect(removeColor(r, 3).winner).toBe(0);
    expect(() => initialState([1])).toThrow();
  });
});

describe('[LG-30] Cờ cá ngựa board', async () => {
  const { TRACK_CELLS, HOME_CELLS } = await import('./geometry');
  it('the track is one closed loop of 52 different cells, outside the home columns', () => {
    expect(TRACK_CELLS).toHaveLength(52);
    expect(new Set(TRACK_CELLS.map(String)).size).toBe(52);
    for (let i = 0; i < 52; i++) {
      const [a, b] = [TRACK_CELLS[i], TRACK_CELLS[(i + 1) % 52]];
      // neighbours, or diagonal at the inner corners of the cross
      expect(Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])), `step ${i}`).toBe(1);
    }
    const home = new Set(Object.values(HOME_CELLS).flat().map(String));
    expect(TRACK_CELLS.some((c) => home.has(String(c)))).toBe(false);
  });
  it("each colour's gate is the track cell right in front of its home column", () => {
    for (const c of [0, 1, 2, 3] as const) {
      const gate = TRACK_CELLS[(c * 13 + 50) % 52];
      const step1 = HOME_CELLS[c][0];
      expect(Math.abs(gate[0] - step1[0]) + Math.abs(gate[1] - step1[1])).toBe(1);
    }
  });
});
