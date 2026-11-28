/**
 * Rule audit (Google Sheet tab Test_Cases, TC-16 … TC-21): edge cases of each game's rules that
 * the per-game tests did not pin down yet. Each block names the sheet case it answers.
 */
import { describe, expect, it } from 'vitest';
import * as cn from '../games/cangua/logic';
import { BIG, SMALL, outcomeOfMoves, winningLine, type Stone } from '../games/caro/logic';
import * as cg from '../games/coganh/logic';
import * as nt from '../games/noitu/logic';
import * as num from '../games/numbers/logic';
import * as oaq from '../games/oanquan/logic';

describe('[TC-16] Cờ cá ngựa rule audit', () => {
  /** red (0) against green (2), red to move, some horses placed */
  const at = (place: Record<number, number>): cn.CaNguaState => {
    const s = cn.initialState([0, 2]);
    for (const [h, p] of Object.entries(place)) s.horses[Number(h)] = p;
    return s;
  };
  const red = (s: cn.CaNguaState, d: cn.Dice, used = 0) =>
    cn.legalMoves(s, d, used).filter((m) => m.horse < 4);

  it('BUG-004: each die is used on its own, for one horse or two', () => {
    let s = cn.applyRoll(at({ 0: 10, 1: 20 }), [3, 5])!;
    s = cn.applyMove(s, 0, 0)!; // horse 0 takes the 3
    s = cn.applyMove(s, 1, 1)!; // horse 1 takes the 5
    expect([s.horses[0], s.horses[1]]).toEqual([13, 25]);
    let t = cn.applyRoll(at({ 0: 10, 1: 20 }), [3, 5])!;
    t = cn.applyMove(cn.applyMove(t, 0, 0)!, 0, 1)!; // one horse takes both
    expect(t.horses[0]).toBe(18);
  });

  it('BUG-005: a horse leaving its stable stands on the first cell next to the stable', async () => {
    const { TRACK_CELLS, STABLE_AT } = await import('../games/cangua/geometry');
    for (const c of cn.COLORS) {
      const [r, col] = TRACK_CELLS[cn.startCell(c)];
      const [sr, sc] = STABLE_AT[c];
      // the start cell touches the stable's 6 × 6 square (side or corner)
      const dr = Math.max(sr - r, 0, r - (sr + 5));
      const dc = Math.max(sc - col, 0, col - (sc + 5));
      expect(Math.max(dr, dc), `colour ${c}`).toBe(1);
      // a horse just out of the stable (position 0) stands on that cell
      expect(cn.cellOf(c * 4, 0)).toBe(cn.startCell(c));
    }
  });

  it('a horse right in front (sát nút) is kicked with a 1', () => {
    // red horse 0 on cell 10, green horse 8 on cell 11 (green position 11 − 26 + 52 = 37)
    const s = at({ 0: 10, 8: 37 });
    expect(red(s, [1, 4]).find((m) => m.die === 0)).toEqual({
      horse: 0,
      die: 0,
      to: 11,
      kick: 8,
    });
    // with a 4 it would have to jump over the green horse: blocked (cản)
    expect(red(s, [1, 4]).filter((m) => m.die === 1 && m.horse === 0)).toEqual([]);
  });

  it('horses on the home steps can never be kicked and do not block the track', () => {
    // green horse 8 on its home step 2; red horse 0 passes the cells near green's gate
    const s = at({ 0: 20, 8: cn.HOME + 1 });
    expect(red(s, [5, 3]).map((m) => m.to)).toEqual([25, 23]);
    expect(cn.cellOf(8, cn.HOME + 1)).toBeNull();
  });

  it('a horse on its home steps climbs one step only with the next number (6-5-4-3 to win)', () => {
    const s = at({ 0: cn.HOME + 3 }); // step 4
    expect(red(s, [5, 2]).filter((m) => m.horse === 0)).toEqual([
      { horse: 0, die: 0, to: cn.HOME + 4 },
    ]);
    expect(red(s, [6, 3]).filter((m) => m.horse === 0)).toEqual([]);
    // three horses on 6, 5, 4 and one on step 2 is not a win yet
    expect(
      cn.hasWon(at({ 0: cn.HOME + 5, 1: cn.HOME + 4, 2: cn.HOME + 3, 3: cn.HOME + 1 }), 0),
    ).toBe(false);
    expect(
      cn.hasWon(at({ 0: cn.HOME + 5, 1: cn.HOME + 4, 2: cn.HOME + 3, 3: cn.HOME + 2 }), 0),
    ).toBe(true);
  });

  it('a bonus roll (1-1, 1-6, 6-6) is kept even when nothing could move', () => {
    // red horses on steps 6, 5, 4 and 2: a 1 climbs none of them, and none is in the stable
    const s = at({ 0: cn.HOME + 5, 1: cn.HOME + 4, 2: cn.HOME + 3, 3: cn.HOME + 1 });
    const r = cn.applyRoll(s, [1, 1])!;
    expect(r.lastRoll?.passed).toBe(true);
    expect(r.turn).toBe(0);
  });
});

describe('[TC-17] Cờ gánh rule audit', () => {
  // Gánh, Chẹt, Mở and the end of the game are checked case by case in
  // src/games/coganh/logic.test.ts (LG-11 … LG-15), against the rules R1–R10 in the plan.
  it('the game opens with Black to move and legal moves available', () => {
    const s = cg.initialState();
    expect(cg.legalMoves(s).length).toBeGreaterThan(0);
    expect(s.turn).toBe(1); // Black moves first
  });
});

describe('[TC-18] Ô ăn quan rule audit', () => {
  const make = (board: number[], extra: Partial<oaq.OAQState> = {}): oaq.OAQState => ({
    ...oaq.initialState(),
    board,
    ...extra,
  });

  it('sowing to the right (clockwise) wraps past the quan cell 6 into the other side', () => {
    // field 5 has 2, dir +1 → 6 (quan), 7; next 8 empty → capture 9
    const s = make([0, 1, 1, 1, 1, 2, 0, 1, 0, 3, 1, 1]);
    const r = oaq.applyMove(s, { from: 5, dir: 1 })!;
    expect(r.path).toEqual([6, 7]);
    expect(r.captured).toEqual([9]);
    expect(r.gained).toBe(3);
  });

  it('a quan cell with few stones (quan non) can be captured: it scores 10 plus its stones', () => {
    // side 2 plays field 9 (1 stone) clockwise → 10; field 11 is empty → takes quan cell 0
    const u = make([2, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0], { quan: [true, true], turn: 2 });
    const v = oaq.applyMove(u, { from: 9, dir: 1 })!;
    expect(v.captured).toEqual([0]);
    expect(v.tookQuan).toBe(true);
    expect(v.gained).toBe(oaq.QUAN_VALUE + 2);
    expect(v.state.quan[0]).toBe(false);
  });

  it('the game ends once both quan cells are taken; fields left go to their owners', () => {
    // side 1 plays field 3 (1 stone) clockwise → 4; field 5 is empty → takes the last quan (6)
    const s = make([0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0], {
      quan: [false, true],
      turn: 1,
      score: [10, 10],
    });
    const r = oaq.applyMove(s, { from: 3, dir: 1 })!;
    expect(r.tookQuan).toBe(true);
    // side 1: 10 + 10 (quan) + fields 1 and 4; side 2: 10 + fields 7 and 8
    expect(r.state.score).toEqual([22, 12]);
    expect(r.state.winner).toBe(1);
  });
});

describe('[TC-19] Nối từ rule audit', () => {
  const dict = nt.makeDict([
    ['học sinh', 'pupil', 0],
    ['sinh viên', 'student', 0],
    ['viên phấn', 'chalk', 0],
    ['phấn khởi', 'excited', 0],
    ['khởi đầu', 'start', 0],
    ['phấn sinh', 'x', 3],
  ]);

  it('a word already played in this game is refused', () => {
    const chain = ['học sinh', 'sinh viên', 'viên phấn'];
    expect(nt.check(dict, chain, 'phấn khởi').ok).toBe(true);
    expect(nt.check(dict, ['sinh viên', 'viên phấn', 'phấn sinh'], 'sinh viên')).toEqual({
      ok: false,
      reason: 'used',
    });
  });

  it('a nonsense word is refused; running out of time loses', () => {
    expect(nt.check(dict, ['học sinh'], 'sinh xyz')).toMatchObject({ ok: false });
    const s = nt.lose(nt.initialState('học sinh'), 'timeout');
    expect(s.winner).toBe(2);
    expect(s.reason).toBe('timeout');
    expect(nt.TURN_SECONDS).toBeGreaterThanOrEqual(30);
  });
});

describe('[TC-20] Cờ ca rô rule audit', () => {
  const N = 15;
  const at = (r: number, c: number) => r * N + c;
  const line = (cells: number[], who: Stone = 1) => {
    const b: Stone[] = new Array(N * N).fill(0);
    cells.forEach((i) => (b[i] = who));
    return b;
  };

  it('five in a row wins in all four directions, along every edge and into every corner', () => {
    const runs: [number, number, number, number][] = [
      [0, 0, 0, 1], // top edge →
      [14, 10, 0, 1], // bottom edge, ending in the corner
      [0, 0, 1, 0], // left edge ↓
      [10, 14, 1, 0], // right edge, ending in the corner
      [0, 0, 1, 1], // main diagonal from the top-left corner
      [10, 10, 1, 1], // main diagonal into the bottom-right corner
      [0, 14, 1, -1], // anti-diagonal from the top-right corner
      [10, 4, 1, -1], // anti-diagonal into the bottom-left corner
    ];
    for (const [r, c, dr, dc] of runs) {
      const cells = [0, 1, 2, 3, 4].map((k) => at(r + dr * k, c + dc * k));
      for (const last of cells) {
        expect(winningLine(line(cells), BIG, last)?.sort(), `${r},${c} ${dr},${dc}`).toEqual(
          cells.slice().sort((a, b) => a - b),
        );
      }
      // four is not enough
      expect(winningLine(line(cells.slice(0, 4)), BIG, cells[3])).toBeNull();
    }
  });

  it('free-style rule (as the help says): a five blocked at both ends still wins; so does six', () => {
    const five = [3, 4, 5, 6, 7].map((c) => at(7, c));
    const b = line(five, 1);
    b[at(7, 2)] = 2;
    b[at(7, 8)] = 2;
    expect(winningLine(b, BIG, at(7, 5))).not.toBeNull();
    const six = [3, 4, 5, 6, 7, 8].map((c) => at(7, c));
    expect(winningLine(line(six), BIG, at(7, 8))).not.toBeNull();
  });

  it('a full 3 × 3 board without a line is a draw', () => {
    // X: 0 2 3 7 5? → X O X / X O O / O X X
    // X O X / X O O / O X X
    expect(outcomeOfMoves(SMALL, [0, 1, 2, 4, 3, 5, 7, 6, 8])).toEqual({ winner: 0, line: [] });
  });
});

describe('[TC-21] Tìm số rule audit', () => {
  it('only the next number counts: a wrong tap changes nothing; finishing ends the game', () => {
    let s = num.initialState('easy', 7, ['a', 'b'], 0);
    s = num.applyClaim(s, 'a', 1)!;
    expect(num.applyClaim(s, 'a', 3)).toBeNull(); // skipping ahead
    expect(num.applyClaim(s, 'a', 1)).toBeNull(); // tapping a taken number again
    expect(s.next).toBe(2);
    const total = num.LEVELS.easy.total;
    for (let n = 2; n <= total; n++) s = num.applyClaim(s, n % 2 ? 'a' : 'b', n)!;
    expect(s.done).toBe(true);
    expect(num.numbersWinner(s)).toBe(total % 2 === 0 ? 'draw' : 'a');
  });

  it("today's board is the same layout for everyone (the daily seed decides it)", () => {
    expect(num.makeLayout('easy', 12345)).toEqual(num.makeLayout('easy', 12345));
    expect(num.makeLayout('easy', 12345)).not.toEqual(num.makeLayout('easy', 54321));
  });
});
