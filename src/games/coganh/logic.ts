/**
 * Cờ gánh rules engine (pure, no UI). Spec: docs/plans/audio-va-co-ganh.md, Part B.
 *
 * Board: 5×5 points, index i = y * 5 + x. Every point connects to its 4 orthogonal
 * neighbours; points with (x + y) even also connect diagonally.
 * Order of one move: move → Gánh → Chẹt → win/draw → forced moves (Mở) for the next turn.
 */

export type Side = 1 | 2; // 1 = Black (moves first), 2 = White
export type Cell = 0 | Side;
export interface Move {
  from: number;
  to: number;
}

export const SIZE = 5;
export const N = SIZE * SIZE;
export const QUIET_LIMIT = 100; // plies without a conversion → draw
export const REPEAT_LIMIT = 3; // same position three times → draw

export const idx = (x: number, y: number) => y * SIZE + x;
export const xy = (i: number) => [i % SIZE, Math.floor(i / SIZE)] as const;
export const other = (s: Side): Side => (s === 1 ? 2 : 1);
const inside = (x: number, y: number) => x >= 0 && x < SIZE && y >= 0 && y < SIZE;
export const hasDiagonals = (i: number) => {
  const [x, y] = xy(i);
  return (x + y) % 2 === 0;
};

/** Static adjacency map: ADJ[i] = neighbours of point i. */
export const ADJ: readonly number[][] = Array.from({ length: N }, (_, i) => {
  const [x, y] = xy(i);
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    ...(hasDiagonals(i)
      ? [
          [1, 1],
          [-1, -1],
          [1, -1],
          [-1, 1],
        ]
      : []),
  ];
  return dirs.filter(([dx, dy]) => inside(x + dx, y + dy)).map(([dx, dy]) => idx(x + dx, y + dy));
});

/** AXES[i] = pairs of opposite neighbours of i (the lines through i used for Gánh). */
export const AXES: readonly (readonly [number, number])[][] = Array.from({ length: N }, (_, i) => {
  const [x, y] = xy(i);
  const axes = [
    [1, 0],
    [0, 1],
    ...(hasDiagonals(i)
      ? [
          [1, 1],
          [1, -1],
        ]
      : []),
  ];
  return axes
    .filter(([dx, dy]) => inside(x - dx, y - dy) && inside(x + dx, y + dy))
    .map(([dx, dy]) => [idx(x - dx, y - dy), idx(x + dx, y + dy)] as const);
});

export function initialBoard(): Cell[] {
  const b: Cell[] = new Array(N).fill(0);
  const black = [
    idx(0, 0),
    idx(1, 0),
    idx(2, 0),
    idx(3, 0),
    idx(4, 0),
    idx(0, 1),
    idx(4, 1),
    idx(0, 2),
  ];
  const white = [
    idx(4, 2),
    idx(0, 3),
    idx(4, 3),
    idx(0, 4),
    idx(1, 4),
    idx(2, 4),
    idx(3, 4),
    idx(4, 4),
  ];
  black.forEach((i) => (b[i] = 1));
  white.forEach((i) => (b[i] = 2));
  return b;
}

export const count = (b: readonly Cell[], s: Side) =>
  b.reduce<number>((n, c) => n + (c === s ? 1 : 0), 0);
const key = (m: Move) => `${m.from}-${m.to}`;

/** Every step of `side` to an adjacent empty point. */
export function movesFor(b: readonly Cell[], side: Side): Move[] {
  const out: Move[] = [];
  for (let from = 0; from < N; from++) {
    if (b[from] !== side) continue;
    for (const to of ADJ[from]) if (b[to] === 0) out.push({ from, to });
  }
  return out;
}

/** Pairs Gánh-ed if `side` has just arrived at `to` on board `b` (after the step). */
export function ganhPairs(
  b: readonly Cell[],
  to: number,
  side: Side,
): (readonly [number, number])[] {
  const opp = other(side);
  return AXES[to].filter(([a, c]) => b[a] === opp && b[c] === opp);
}

/** Moves of `side` that would Gánh at least one pair. */
export function captureMoves(b: readonly Cell[], side: Side): Move[] {
  return movesFor(b, side).filter((m) => {
    const after = b.slice();
    after[m.to] = side;
    after[m.from] = 0;
    return ganhPairs(after, m.to, side).length > 0;
  });
}

/** Groups of `side` (connected through ADJ) with no empty neighbour. */
export function trappedGroups(b: readonly Cell[], side: Side): number[][] {
  const seen = new Set<number>();
  const out: number[][] = [];
  for (let start = 0; start < N; start++) {
    if (b[start] !== side || seen.has(start)) continue;
    const group: number[] = [];
    let free = false;
    const stack = [start];
    seen.add(start);
    while (stack.length) {
      const p = stack.pop()!;
      group.push(p);
      for (const q of ADJ[p]) {
        if (b[q] === 0) free = true;
        else if (b[q] === side && !seen.has(q)) {
          seen.add(q);
          stack.push(q);
        }
      }
    }
    if (!free) out.push(group);
  }
  return out;
}

export interface CoGanhState {
  board: Cell[];
  turn: Side;
  /** Moves the side to play must choose from because of a Mở; empty = free choice. */
  forced: Move[];
  /** Plies since the last conversion. */
  quiet: number;
  /** How often each position (board + side to move + forced) has occurred. */
  seen: Record<string, number>;
  winner: Side | 'draw' | null;
  plies: number;
  last?: Move;
}

const positionKey = (b: readonly Cell[], turn: Side, forced: Move[]) =>
  `${b.join('')}${turn}${forced.map(key).sort().join('')}`;

export function initialState(): CoGanhState {
  const board = initialBoard();
  return {
    board,
    turn: 1,
    forced: [],
    quiet: 0,
    seen: { [positionKey(board, 1, [])]: 1 },
    winner: null,
    plies: 0,
  };
}

/** Legal moves for the side to play (honours a pending Mở). */
export function legalMoves(s: CoGanhState): Move[] {
  if (s.winner) return [];
  return s.forced.length ? s.forced : movesFor(s.board, s.turn);
}

export interface MoveResult {
  state: CoGanhState;
  /** points converted by Gánh, by Chẹt */
  ganh: number[];
  chet: number[];
}

/** Plays a move. Returns null if it is not legal. */
export function applyMove(s: CoGanhState, m: Move): MoveResult | null {
  if (!legalMoves(s).some((l) => l.from === m.from && l.to === m.to)) return null;
  const side = s.turn;
  const opp = other(side);
  const b = s.board.slice();
  b[m.to] = side;
  b[m.from] = 0;

  // 1. Gánh: only the piece that just moved captures; converted pieces do not chain.
  const ganh = ganhPairs(b, m.to, side).flat();
  for (const p of ganh) b[p] = side;

  // 2. Chẹt: once (converting pieces never changes which points are empty).
  const chet = trappedGroups(b, opp).flat();
  for (const p of chet) b[p] = side;

  const converted = ganh.length + chet.length > 0;
  const quiet = converted ? 0 : s.quiet + 1;

  // 3. Mở: Gánh chances the opponent did not have before this move are compulsory.
  const before = new Set(captureMoves(s.board, opp).map(key));
  const forced = captureMoves(b, opp).filter((x) => !before.has(key(x)));

  const pk = positionKey(b, opp, forced);
  const seen = { ...s.seen, [pk]: (s.seen[pk] ?? 0) + 1 };

  let winner: CoGanhState['winner'] = null;
  if (count(b, opp) === 0) winner = side;
  else if (movesFor(b, opp).length === 0)
    winner = side; // cannot happen after Chẹt (R3), kept as a guard
  else if (quiet >= QUIET_LIMIT || seen[pk] >= REPEAT_LIMIT) winner = 'draw';

  return {
    state: {
      board: b,
      turn: opp,
      forced: winner ? [] : forced,
      quiet,
      seen,
      winner,
      plies: s.plies + 1,
      last: m,
    },
    ganh,
    chet,
  };
}
