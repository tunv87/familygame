import { describe, expect, it } from 'vitest';
import {
  CELLS,
  MAX_PLIES,
  applyMove,
  initialState,
  legalMoves,
  valueOf,
  type OAQState,
} from './logic';

/** Builds a state from a 12-number board (index 0..11). */
function make(board: number[], extra: Partial<OAQState> = {}): OAQState {
  return { ...initialState(), board, ...extra };
}
const total = (s: OAQState) =>
  s.board.reduce((a, b) => a + b, 0) +
  s.score[0] +
  s.score[1] +
  (s.quan[0] ? 10 : 0) +
  (s.quan[1] ? 10 : 0);

describe('[LG-18] Ô ăn quan rules', () => {
  it('starts with 5 stones per field, a quan on each end, player 1 to move', () => {
    const s = initialState();
    expect(s.board).toEqual([0, 5, 5, 5, 5, 5, 0, 5, 5, 5, 5, 5]);
    expect(s.quan).toEqual([true, true]);
    expect(valueOf(s, 0)).toBe(10);
    expect(legalMoves(s)).toHaveLength(10); // 5 fields × 2 directions
  });

  it('only your own non-empty fields can be played', () => {
    const s = make([0, 0, 5, 5, 5, 5, 0, 5, 5, 5, 5, 5]);
    expect(applyMove(s, { from: 7, dir: 1 })).toBeNull(); // opponent field
    expect(applyMove(s, { from: 0, dir: 1 })).toBeNull(); // quan cell
    expect(applyMove(s, { from: 1, dir: 1 })).toBeNull(); // empty
    expect(applyMove(s, { from: 2, dir: 2 as 1 })).toBeNull(); // bad direction
  });

  it('sows one stone per cell and stops in front of a quan cell', () => {
    // 1 stone in field 4 → drops in 5; next is quan 6 → turn ends
    const s = make([0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0], { quan: [true, true] });
    const r = applyMove(s, { from: 4, dir: 1 })!;
    expect(r.path).toEqual([5]);
    expect(r.state.board[5]).toBe(1);
    expect(r.gained).toBe(0);
    expect(r.state.turn).toBe(2);
  });

  it('picks up the next non-empty field and keeps sowing', () => {
    // 2 from field 1 → 2,3; next 4 has 2 → pick up → 5, 6(quan cell gets a stone); next 7 has 1 → pick up → 8; next 9 empty, 10 has 3 → capture 3
    const s = make([0, 2, 0, 0, 2, 0, 0, 1, 0, 0, 3, 0]);
    const r = applyMove(s, { from: 1, dir: 1 })!;
    expect(r.path).toEqual([2, 3, 5, 6, 8]);
    // …then 11 empty → capture quan 0 (10), 1 empty → capture 2 (1): ăn liên tiếp
    expect(r.captured).toEqual([10, 0, 2]);
    expect(r.gained).toBe(14);
    expect(r.state.score).toEqual([14, 0]);
    expect(total(r.state)).toBe(total(s));
  });

  it('captures after an empty cell, and chains while empty/full repeats', () => {
    // field 1 has 1 → drops in 2; 3 empty → capture 4 (2); 5 empty → capture quan 6 (10 + 1)
    const s = make([0, 1, 0, 0, 2, 0, 1, 4, 0, 0, 0, 0]);
    const r = applyMove(s, { from: 1, dir: 1 })!;
    expect(r.captured).toEqual([4, 6]);
    expect(r.gained).toBe(13);
    expect(r.tookQuan).toBe(true);
    expect(r.state.quan).toEqual([true, false]);
    expect(total(r.state)).toBe(total(s));
  });

  it('two empty cells in a row end the turn with nothing captured', () => {
    const s = make([0, 1, 0, 0, 0, 3, 0, 2, 2, 2, 2, 2]);
    const r = applyMove(s, { from: 1, dir: 1 })!;
    expect(r.captured).toEqual([]);
    expect(r.state.turn).toBe(2);
  });

  it('sowing counter-clockwise wraps around the quan cell 0', () => {
    // field 1 has 2, dir -1 → 0 (quan cell), 11; next 10 empty → capture 9 (4)
    const s = make([0, 2, 1, 1, 1, 1, 0, 1, 1, 4, 0, 1]);
    const r = applyMove(s, { from: 1, dir: -1 })!;
    expect(r.path).toEqual([0, 11]);
    expect(r.captured).toEqual([9]);
    expect(r.state.board[0]).toBe(1);
  });

  it('a player with all fields empty re-seeds 1 per field from their captures (rải quân)', () => {
    // player 1 moves; player 2's fields are all empty → they pay 5 and get 1 per field
    const s = make([0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], { score: [0, 12] });
    const r = applyMove(s, { from: 4, dir: 1 })!;
    expect(r.reseeded).toBe(true);
    expect(r.state.board.slice(7)).toEqual([1, 1, 1, 1, 1]);
    expect(r.state.score[1]).toBe(7);
  });

  it('borrowing: re-seeding with fewer than 5 points takes the score below zero', () => {
    const s = make([0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], { score: [0, 2] });
    const r = applyMove(s, { from: 4, dir: 1 })!;
    expect(r.state.score[1]).toBe(-3);
  });

  it('game ends when both quan cells are empty; each side collects its own fields', () => {
    // quan 0 already taken; player 1 captures quan 6 → end; P2's fields hold 5
    const s3 = make([0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1], { quan: [false, true], score: [20, 10] });
    const r3 = applyMove(s3, { from: 3, dir: 1 })!; // → 4; 5 empty → capture quan 6 (10)
    expect(r3.captured).toEqual([6]);
    expect(r3.state.winner).toBe(1);
    expect(r3.state.score).toEqual([20 + 10 + 1, 10 + 5]);
    expect(r3.state.board.every((x) => x === 0)).toBe(true);
    expect(applyMove(r3.state, { from: 7, dir: 1 })).toBeNull();
    expect(r3.state.board).toHaveLength(CELLS);
  });

  it('a draw when both sides end with the same score', () => {
    // P1 captures quan 6 (10) and collects field 4 (1): 5 + 11 = 16
    const board = [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0];
    const d = make(board, { quan: [false, true], score: [5, 16] });
    expect(applyMove(d, { from: 3, dir: 1 })!.state.winner).toBe('draw');
    const w = make(board, { quan: [false, true], score: [5, 17] });
    expect(applyMove(w, { from: 3, dir: 1 })!.state.winner).toBe(2);
  });

  it('stones are never created or lost over a whole random game', () => {
    let seed = 42;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let g = 0; g < 50; g++) {
      let s = initialState(g % 2 ? 2 : 1);
      const start = total(s);
      while (!s.winner) {
        const ms = legalMoves(s);
        const r = applyMove(s, ms[Math.floor(rand() * ms.length)])!;
        expect(r).not.toBeNull();
        s = r.state;
        // borrowing moves points from the score, so the total is conserved too
        expect(total(s)).toBe(start);
        expect(s.board.every((x) => x >= 0)).toBe(true);
      }
      expect(s.plies).toBeLessThanOrEqual(MAX_PLIES);
    }
  });
});
