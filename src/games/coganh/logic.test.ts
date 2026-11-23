import { describe, expect, it } from 'vitest';
import { createRng } from '../../lib/rng';
import {
  ADJ,
  AXES,
  QUIET_LIMIT,
  applyMove,
  captureMoves,
  count,
  idx,
  initialState,
  legalMoves,
  movesFor,
  type Cell,
  type CoGanhState,
  type Side,
} from './logic';

/** Board from 5 rows (y = 0 at the top): B = Black, W = White, . = empty. */
function board(rows: string[]): Cell[] {
  return rows.flatMap((r) =>
    [...r.replace(/\s/g, '')].map((c) => (c === 'B' ? 1 : c === 'W' ? 2 : 0) as Cell),
  );
}
function st(rows: string[], turn: Side): CoGanhState {
  return { board: board(rows), turn, forced: [], quiet: 0, seen: {}, winner: null, plies: 0 };
}
const P = idx;
const play = (s: CoGanhState, from: number, to: number) => {
  const r = applyMove(s, { from, to });
  if (!r) throw new Error(`illegal ${from}→${to}`);
  return r;
};

describe('[LG-11] Cờ gánh board and setup', () => {
  it('diagonals only on points with (x + y) even', () => {
    expect([...ADJ[P(1, 0)]].sort((a, b) => a - b)).toEqual([P(0, 0), P(2, 0), P(1, 1)]);
    expect(ADJ[P(1, 1)]).toHaveLength(8);
    expect([...ADJ[P(0, 0)]].sort((a, b) => a - b)).toEqual([P(1, 0), P(0, 1), P(1, 1)]);
    // 40 orthogonal + 16 diagonal lines (one per unit square), each counted from both ends
    expect(ADJ.reduce((n, a) => n + a.length, 0)).toBe(2 * (40 + 16));
    // a point with diagonals has up to 4 axes, others up to 2
    expect(AXES[P(2, 2)]).toHaveLength(4);
    expect(AXES[P(1, 2)]).toHaveLength(2);
  });
  it('8 pieces each, Black first, point-symmetric through the centre', () => {
    const s = initialState();
    expect([count(s.board, 1), count(s.board, 2), s.turn]).toEqual([8, 8, 1]);
    for (let i = 0; i < 25; i++)
      expect(s.board[24 - i]).toBe(s.board[i] === 0 ? 0 : 3 - s.board[i]);
    expect(s.board[P(0, 2)]).toBe(1);
    expect(s.board[P(4, 2)]).toBe(2);
  });
  it('one step to an empty neighbour; no jumps, no diagonal from an odd point', () => {
    const s = st(['.....', '.....', '.B...', '.....', '....W'], 1);
    const tos = legalMoves(s)
      .map((m) => m.to)
      .sort((a, b) => a - b);
    expect(tos).toEqual([P(1, 1), P(0, 2), P(2, 2), P(1, 3)]);
    expect(applyMove(s, { from: P(1, 2), to: P(2, 3) })).toBeNull(); // diagonal from odd point
    expect(applyMove(s, { from: P(1, 2), to: P(3, 2) })).toBeNull(); // two steps
    expect(
      applyMove(st(['.....', '.....', '.BW..', '.....', '....W'], 1), {
        from: P(1, 2),
        to: P(2, 2),
      }),
    ).toBeNull(); // occupied
  });
});

describe('[LG-12] Gánh', () => {
  it('single: moving between two enemies converts both', () => {
    const r = play(st(['.....', '.....', 'W.W..', '.B...', '....W'], 1), P(1, 3), P(1, 2));
    expect(r.ganh.sort()).toEqual([P(0, 2), P(2, 2)].sort());
    expect([r.state.board[P(0, 2)], r.state.board[P(2, 2)]]).toEqual([1, 1]);
  });
  it('several axes at once: chầu 6 on a diagonal point', () => {
    const r = play(st(['.....', '.WWW.', '.W.W.', '.WBW.', '....W'], 1), P(2, 3), P(2, 2));
    // the vertical axis is not a pair: the mover came from (2,3)
    expect(r.ganh).toHaveLength(6);
    expect(count(r.state.board, 2)).toBe(2); // (2,1) and (4,4) are left
  });
  it('arriving at the end of a line does not capture (no custodian capture)', () => {
    const r = play(st(['.....', '.....', 'BW.B.', '.....', '....W'], 1), P(3, 2), P(2, 2));
    expect(r.ganh).toEqual([]);
    expect(r.state.board[P(1, 2)]).toBe(2);
  });
  it('converted pieces do not capture in turn (no chain reaction)', () => {
    // after the Gánh at (1,2), the new Black piece at (2,2) would flank (3,2) with (4,2)… but nothing chains
    const r = play(st(['.....', '.....', 'W.WWB', '.B...', '....W'], 1), P(1, 3), P(1, 2));
    expect(r.state.board[P(3, 2)]).toBe(2);
  });
});

describe('[LG-13] Chẹt (surround)', () => {
  it('a single piece with no free neighbour is converted', () => {
    const r = play(st(['WB...', 'B....', '..B..', '.....', '....W'], 1), P(2, 2), P(1, 1));
    expect(r.ganh).toEqual([]);
    expect(r.chet).toEqual([P(0, 0)]);
  });
  it('a whole connected group is converted', () => {
    const r = play(st(['WWB..', 'W....', 'B.B..', '.....', '....W'], 1), P(2, 2), P(1, 1));
    expect(r.chet.sort((a, b) => a - b)).toEqual([P(0, 0), P(1, 0), P(0, 1)]);
  });
  it('a move that leaves a point gives a trapped group air again', () => {
    const r = play(st(['WB...', 'BB...', '.....', '.....', '....W'], 1), P(1, 1), P(2, 2));
    expect(r.chet).toEqual([]);
    expect(r.state.board[P(0, 0)]).toBe(2);
  });
  it('Gánh runs before Chẹt: a group trapped only after the Gánh is converted too', () => {
    const r = play(st(['WB...', 'W.W..', '.B...', '.....', '....W'], 1), P(1, 2), P(1, 1));
    expect(r.ganh.sort((a, b) => a - b)).toEqual([P(0, 1), P(2, 1)]);
    expect(r.chet).toEqual([P(0, 0)]);
  });
  it("the mover's own trapped pieces stay", () => {
    const r = play(st(['BW...', 'WW...', '....B', '.....', '....W'], 1), P(4, 2), P(4, 1));
    expect(r.state.board[P(0, 0)]).toBe(1);
  });
});

describe('[LG-14] Mở (forced Gánh)', () => {
  it('(a) pulling a piece out opens a gap: the opponent must Gánh there', () => {
    const r = play(st(['.....', '.....', 'WWW..', '.B...', '....B'], 2), P(1, 2), P(1, 1));
    expect(r.state.forced).toEqual([{ from: P(1, 3), to: P(1, 2) }]);
    expect(legalMoves(r.state)).toEqual(r.state.forced); // the far piece at (4,4) may not move
  });
  it('(b) stepping into a flanking position forces the Gánh too', () => {
    const r = play(st(['.....', '.....', 'W..W.', '.B...', '....B'], 2), P(3, 2), P(2, 2));
    expect(r.state.forced).toEqual([{ from: P(1, 3), to: P(1, 2) }]);
  });
  it('a Gánh chance that already existed is not compulsory', () => {
    const s = st(['.....', '.....', 'W.W..', '.B...', '...W.'], 2);
    expect(captureMoves(s.board, 1)).toHaveLength(1);
    const r = play(s, P(3, 4), P(4, 4));
    expect(r.state.forced).toEqual([]);
    expect(legalMoves(r.state).length).toBeGreaterThan(1);
  });
  it('the obligation lasts one turn only', () => {
    const r1 = play(st(['.....', '.....', 'WWW..', '.B...', '...WB'], 2), P(1, 2), P(1, 1));
    const r2 = play(r1.state, P(1, 3), P(1, 2)); // the forced Gánh
    expect(r2.state.turn).toBe(2);
    const r3 = play(r2.state, P(3, 4), P(3, 3));
    expect(r3.state.forced).toEqual([]);
  });
  it('several forced Gánh moves: any one of them may be chosen', () => {
    // White leaves the centre, which sits between White pairs; two Black pieces can enter
    const s = st(['.....', '..W..', '.WWW.', '.BWB.', '.....'], 2);
    const r = play(s, P(2, 2), P(3, 1));
    const forced = r.state.forced.map((m) => m.from).sort((a, b) => a - b);
    expect(forced).toEqual([P(1, 3), P(3, 3)]);
    expect(play(r.state, P(1, 3), P(2, 2)).ganh.length).toBeGreaterThan(0);
    expect(play(r.state, P(3, 3), P(2, 2)).ganh.length).toBeGreaterThan(0);
  });
});

describe('[LG-15] End of the game', () => {
  it('converting every opposing piece wins', () => {
    const r = play(st(['..B..', '.WWW.', '.W.W.', '.WBW.', '.....'], 1), P(2, 3), P(2, 2));
    // 6 by Gánh, then (2,1) has no free neighbour left → Chẹt
    expect(count(r.state.board, 2)).toBe(0);
    expect(r.state.winner).toBe(1);
    expect(legalMoves(r.state)).toEqual([]);
  });
  it(`${QUIET_LIMIT} plies without a conversion is a draw`, () => {
    const s = { ...st(['B....', '.....', '.....', '.....', '....W'], 1), quiet: QUIET_LIMIT - 1 };
    expect(play(s, P(0, 0), P(1, 0)).state.winner).toBe('draw');
  });
  it('the same position three times is a draw', () => {
    let s = st(['B....', '.....', '.....', '.....', '....W'], 1);
    const cycle: [number, number][] = [
      [P(0, 0), P(1, 0)],
      [P(4, 4), P(3, 4)],
      [P(1, 0), P(0, 0)],
      [P(3, 4), P(4, 4)],
    ];
    let plies = 0;
    while (!s.winner && plies < 20) s = play(s, ...cycle[plies++ % 4]).state;
    expect(s.winner).toBe('draw');
    expect(plies).toBe(9);
  });
  it('(R3) in random games the side to move always has a move until the game ends', () => {
    const rand = createRng(7);
    for (let g = 0; g < 200; g++) {
      let s = initialState();
      for (let ply = 0; ply < 300 && !s.winner; ply++) {
        const ms = legalMoves(s);
        expect(ms.length, `game ${g} ply ${ply}`).toBeGreaterThan(0);
        for (const f of s.forced) expect(movesFor(s.board, s.turn)).toContainEqual(f);
        s = applyMove(s, ms[Math.floor(rand() * ms.length)])!.state;
        expect(count(s.board, 1) + count(s.board, 2)).toBe(16);
      }
    }
  });
});
