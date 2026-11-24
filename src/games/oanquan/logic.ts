/**
 * Ô ăn quan rules engine (pure, no React).
 *
 * Board: 12 cells in a ring, indexed counter-clockwise as seen by player 1:
 *
 *        11 10  9  8  7        ← player 2's 5 rice fields (top row)
 *    0                    6    ← the two Mandarin (quan) cells
 *         1  2  3  4  5        ← player 1's 5 rice fields (bottom row)
 *
 * dir = +1 walks 1→2→…→5→6→7…, dir = -1 the other way.
 *
 * Rules (common Northern rules):
 *  - Start: 5 small stones (dân) in every field, 1 big stone (quan, worth 10) in each quan cell.
 *  - A turn: pick up all stones from one of your non-empty fields and sow them one by one in a
 *    chosen direction. Then look at the next cell:
 *      · a field with stones → pick them up and keep sowing;
 *      · a quan cell → the turn ends;
 *      · an empty cell → capture everything in the cell after it (if any). After a capture, if
 *        the next cell is empty and the one after has stones, capture again (ăn liên tiếp).
 *      · two empty cells in a row → the turn ends.
 *  - If all your fields are empty when your turn starts you must "rải quân": put 1 stone from
 *    your captures back in each field (5 points). Short on stones, you borrow (score may go
 *    below 0; it is paid back from the final count).
 *  - The game ends when both quan cells are empty ("hết quan, tàn dân"): each side collects the
 *    stones left in their own fields. The highest score wins. A safety cap of MAX_PLIES turns
 *    also ends the game the same way.
 */

export type Side = 1 | 2;
export type Dir = 1 | -1;
export interface Move {
  from: number;
  dir: Dir;
}

export const CELLS = 12;
export const QUAN_CELLS = [0, 6] as const;
export const FIELDS: Record<Side, number[]> = { 1: [1, 2, 3, 4, 5], 2: [7, 8, 9, 10, 11] };
export const START_STONES = 5;
export const QUAN_VALUE = 10;
export const MAX_PLIES = 200;
/** guard against endless pick-up chains */
const MAX_LAPS = 400;

export interface OAQState {
  /** small stones per cell */
  board: number[];
  /** the big quan stone is still on cell 0 / cell 6 */
  quan: [boolean, boolean];
  /** captured points of side 1 / side 2 (quan = 10, dân = 1) */
  score: [number, number];
  turn: Side;
  plies: number;
  winner: Side | 'draw' | null;
  last?: Move;
}

/** One step of a move, for replaying it on screen. */
export type Step =
  | { t: 'pick'; cell: number; n: number }
  | { t: 'drop'; cell: number }
  | { t: 'take'; cell: number; value: number; quan: boolean }
  | { t: 'reseed'; side: Side };

export interface MoveResult {
  state: OAQState;
  /** the move step by step: pick up, drop one stone per cell, capture */
  steps: Step[];
  /** cells where a stone was dropped, in order (for animation) */
  path: number[];
  /** cells captured, in order */
  captured: number[];
  /** points won by the mover this turn */
  gained: number;
  /** a big quan stone was captured */
  tookQuan: boolean;
  /** the next player had to re-seed their empty fields */
  reseeded: boolean;
}

export const other = (s: Side): Side => (s === 1 ? 2 : 1);
export const isQuan = (i: number) => i === 0 || i === 6;
export const ownerOf = (i: number): Side | null => (isQuan(i) ? null : i < 6 ? 1 : 2);
export const next = (i: number, d: Dir) => (i + d + CELLS) % CELLS;

/** Points sitting in a cell. */
export function valueOf(s: Pick<OAQState, 'board' | 'quan'>, i: number): number {
  const big = i === 0 ? s.quan[0] : i === 6 ? s.quan[1] : false;
  return s.board[i] + (big ? QUAN_VALUE : 0);
}

export function initialState(first: Side = 1): OAQState {
  const board = Array.from({ length: CELLS }, (_, i) => (isQuan(i) ? 0 : START_STONES));
  return { board, quan: [true, true], score: [0, 0], turn: first, plies: 0, winner: null };
}

export function legalMoves(s: OAQState): Move[] {
  if (s.winner) return [];
  const out: Move[] = [];
  for (const i of FIELDS[s.turn])
    if (s.board[i] > 0) {
      out.push({ from: i, dir: 1 });
      out.push({ from: i, dir: -1 });
    }
  return out;
}

const quanGone = (s: Pick<OAQState, 'board' | 'quan'>) =>
  valueOf(s, 0) === 0 && valueOf(s, 6) === 0;

/** "Thu quân": each side takes the stones in its own fields; decide the winner. */
function finish(s: OAQState): OAQState {
  const board = s.board.slice();
  const score: [number, number] = [s.score[0], s.score[1]];
  for (const side of [1, 2] as Side[])
    for (const i of FIELDS[side]) {
      score[side - 1] += board[i];
      board[i] = 0;
    }
  // stones left on quan cells (only possible at the ply cap) are shared by nobody
  const winner = score[0] === score[1] ? 'draw' : score[0] > score[1] ? 1 : 2;
  return { ...s, board, score, winner };
}

/** Applies a move. Returns null if it is not legal. */
export function applyMove(s: OAQState, m: Move): MoveResult | null {
  if (s.winner || (m.dir !== 1 && m.dir !== -1)) return null;
  if (!FIELDS[s.turn].includes(m.from) || !(s.board[m.from] > 0)) return null;
  const board = s.board.slice();
  const quan: [boolean, boolean] = [s.quan[0], s.quan[1]];
  const score: [number, number] = [s.score[0], s.score[1]];
  const path: number[] = [];
  const captured: number[] = [];
  let gained = 0;
  let tookQuan = false;

  const steps: Step[] = [];
  let hand = board[m.from];
  board[m.from] = 0;
  steps.push({ t: 'pick', cell: m.from, n: hand });
  let pos = m.from;
  for (let laps = 0; laps < MAX_LAPS; laps++) {
    while (hand > 0) {
      pos = next(pos, m.dir);
      board[pos]++;
      hand--;
      path.push(pos);
      steps.push({ t: 'drop', cell: pos });
    }
    const n1 = next(pos, m.dir);
    if (isQuan(n1)) break; // never pick up from a quan cell
    if (board[n1] > 0) {
      hand = board[n1];
      board[n1] = 0;
      steps.push({ t: 'pick', cell: n1, n: hand });
      pos = n1;
      continue;
    }
    // n1 is an empty field: capture the cell after it, then keep going while empty-full repeats
    let gap = n1;
    for (;;) {
      const target = next(gap, m.dir);
      const v = valueOf({ board, quan }, target);
      if (v === 0) break;
      gained += v;
      let big = false;
      if (isQuan(target)) {
        const q = target === 0 ? 0 : 1;
        if (quan[q]) {
          quan[q] = false;
          tookQuan = true;
          big = true;
        }
      }
      steps.push({ t: 'take', cell: target, value: v, quan: big });
      board[target] = 0;
      captured.push(target);
      gap = next(target, m.dir);
      if (valueOf({ board, quan }, gap) !== 0) break;
    }
    break;
  }
  score[s.turn - 1] += gained;

  let state: OAQState = {
    board,
    quan,
    score,
    turn: other(s.turn),
    plies: s.plies + 1,
    winner: null,
    last: m,
  };
  let reseeded = false;
  if (quanGone(state) || state.plies >= MAX_PLIES) state = finish(state);
  else {
    const t = state.turn;
    if (FIELDS[t].every((i) => state.board[i] === 0)) {
      // rải quân: 1 stone per field, paid from the captures (may borrow)
      for (const i of FIELDS[t]) state.board[i] = 1;
      state.score[t - 1] -= FIELDS[t].length;
      reseeded = true;
      steps.push({ t: 'reseed', side: t });
    }
  }
  return { state, steps, path, captured, gained, tookQuan, reseeded };
}
