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

/** horses that can move with each die: [first die, second die] */
const byDie = (s: CaNguaState, d: [number, number], used = 0) => {
  const m = legalMoves(s, d, used);
  return [0, 1].map((i) => m.filter((x) => x.die === i).map((x) => x.horse));
};

describe('[LG-28] Cờ cá ngựa rules (two dice, each die a move of its own)', () => {
  it('a die showing 1 or 6 brings a horse out; other rolls pass the turn', () => {
    const s = initialState([0, 2]);
    expect(legalMoves(s, [6, 3])).toEqual([{ horse: 0, die: 0, to: 0 }]);
    expect(legalMoves(s, [2, 1])).toEqual([{ horse: 0, die: 1, to: 0 }]);
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

  it('each die moves on its own: two horses, or one horse twice', () => {
    const base = at({ 0: 10, 1: 20 });
    let s = applyRoll(base, [3, 5])!;
    expect(byDie(s, [3, 5])).toEqual([
      [0, 1],
      [0, 1],
    ]);
    // horse 0 with the 3, then horse 1 with the 5
    s = applyMove(s, 0, 0)!;
    expect(s.horses[0]).toBe(13);
    expect(s.turn).toBe(0); // the 5 is still to use
    expect(s.used).toBe(1);
    expect(applyMove(s, 1, 0)).toBeNull(); // the 3 is used
    s = applyMove(s, 1, 1)!;
    expect(s.horses[1]).toBe(25);
    expect(s.turn).toBe(2);
    expect(s.roll).toBeNull();
    // or one horse twice, in either order: 10 + 5 + 3
    let t = applyMove(applyRoll(base, [3, 5])!, 0, 1)!;
    expect(t.horses[0]).toBe(15);
    t = applyMove(t, 0, 0)!;
    expect(t.horses[0]).toBe(18);
    expect(t.turn).toBe(2);
  });

  it('a die that cannot move is skipped; the same number on both dice is used twice', () => {
    // 6 brings a horse out; the 2 then moves it (or the other horse)
    let s = applyMove(applyRoll(at({ 0: 48 }), [6, 2])!, 1, 0)!;
    expect(s.horses[1]).toBe(0);
    expect(byDie(s, [6, 2], s.used)).toEqual([[], [0, 1]]);
    // only the 2 can move horse 0 (48 + 6 would pass the gate), nothing else is out
    s = applyMove(applyRoll(at({ 0: 48 }), [6, 2])!, 0, 1)!;
    expect(s.horses[0]).toBe(50);
    expect(s.turn).toBe(0); // the 6 can still bring a horse out
    // 4 and 4: listed once, used twice
    s = applyRoll(at({ 0: 10 }), [4, 4])!;
    expect(legalMoves(s, [4, 4])).toEqual([{ horse: 0, die: 0, to: 14 }]);
    s = applyMove(s, 0)!;
    s = applyMove(s, 0)!;
    expect(s.horses[0]).toBe(18);
    expect(s.turn).toBe(2);
    // after the 4 the 5 has no move (43 + 4 + 5 is past the gate): the turn ends
    s = applyMove(applyRoll(at({ 0: 43 }), [4, 5])!, 0, 0)!;
    expect(s.horses[0]).toBe(47);
    expect(s.turn).toBe(2);
  });

  it('1-1, 1-6, 6-1 and 6-6 roll again once both dice are used', () => {
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
    s = applyMove(s, 0)!; // first horse out
    expect(s.horses[0]).toBe(0);
    expect(applyMove(s, 1)).toBeNull(); // the start cell is taken by red
    s = applyMove(s, 0)!; // so the second 6 moves horse 0 on
    expect(s.horses[0]).toBe(6);
    expect(s.turn).toBe(0); // rolls again
    expect(s.roll).toBeNull();
    expect(applyMove(s, 0)).toBeNull(); // not rolled yet
    expect(applyRoll(applyRoll(s, [6, 1])!, [2, 2])).toBeNull(); // must move before rolling again
  });

  it('on the track a horse moves one die and cannot jump or land on its own colour', () => {
    // red horse 0 on cell 2, red horse 1 on cell 5, green horse 8 on red's cell 8
    const s = at({ 0: 2, 1: 5, 8: 8 - 26 + 52 });
    expect(cellOf(8, s.horses[8])).toBe(8);
    // 4: 2→6 jumps 5, 5→9 jumps 8; 3: 2→5 is red, 5→8 kicks
    expect(byDie(s, [4, 3])).toEqual([[], [1]]);
    expect(legalMoves(s, [4, 3])).toEqual([{ horse: 1, die: 1, to: 8, kick: 8 }]);
    // a 1 can also bring a horse out
    expect(byDie(s, [1, 2])).toEqual([
      [0, 1, 2],
      [0, 1],
    ]);
  });

  it('landing on another colour kicks it back to its stable', () => {
    const s: CaNguaState = { ...at({ 1: 5, 8: 34 }), roll: [3, 2], used: 0 };
    const r = applyMove(s, 1, 0)!;
    expect(r.horses[1]).toBe(8);
    expect(r.horses[8]).toBe(STABLE);
    expect(r.last).toEqual({ horse: 1, from: 5, to: 8, kick: 8 });
  });

  it('coming out onto a start cell kicks a horse waiting there, but not your own', () => {
    expect(legalMoves(at({ 8: 26 }), [6, 4])).toEqual([{ horse: 0, die: 0, to: 0, kick: 8 }]);
    expect(byDie(at({ 1: 0 }), [6, 4])).toEqual([[1], [1]]); // only move it on
  });

  it('no going past the gate; home steps', () => {
    const h0 = (s: CaNguaState, d: [number, number]) =>
      legalMoves(s, d).filter((m) => m.horse === 0);
    expect(h0(at({ 0: 46 }), [6, 6])).toEqual([]); // 46 + 6 > gate
    expect(h0(at({ 0: 46 }), [5, 6])).toEqual([{ horse: 0, die: 0, to: GATE }]);
    // from the gate a die showing n climbs to step n
    expect(legalMoves(at({ 0: GATE }), [4, 2])).toEqual([
      { horse: 0, die: 0, to: HOME + 3 },
      { horse: 0, die: 1, to: HOME + 1 },
    ]);
    // step 2 is taken: only a die showing 1 climbs (to step 1)
    const s = at({ 0: GATE, 1: HOME + 1 });
    expect(legalMoves(s, [1, 4]).filter((m) => m.horse === 0)).toEqual([
      { horse: 0, die: 0, to: HOME },
    ]);
    expect(legalMoves(s, [4, 5])).toEqual([]);
    // on step k a die must show k + 1
    expect(legalMoves(at({ 0: HOME + 1 }), [5, 3])).toEqual([{ horse: 0, die: 1, to: HOME + 2 }]);
    expect(legalMoves(at({ 0: HOME + 1 }), [2, 2])).toEqual([]);
    expect(legalMoves(at({ 0: HOME + 5 }), [6, 6]).filter((m) => m.horse === 0)).toEqual([]);
  });

  it('four horses on steps 3–6 win at once', () => {
    const s: CaNguaState = {
      ...at({ 0: HOME + 5, 1: HOME + 4, 2: HOME + 3, 3: GATE }),
      roll: [3, 5],
      used: 0,
    };
    expect(hasWon(s, 0)).toBe(false);
    const r = applyMove(s, 3, 0)!;
    expect(r.horses[3]).toBe(HOME + 2);
    expect(r.winner).toBe(0);
    expect(r.roll).toBeNull();
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
      const gate = TRACK_CELLS[(c * 13 + 51) % 52];
      const step1 = HOME_CELLS[c][0];
      expect(Math.abs(gate[0] - step1[0]) + Math.abs(gate[1] - step1[1])).toBe(1);
    }
  });
});
