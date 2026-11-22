import { createRng, shuffle } from '../../lib/rng';

export type NumbersLevel = 'easy' | 'medium' | 'hard';

export const LEVELS: Record<NumbersLevel, { total: number; cols: number; rows: number }> = {
  easy: { total: 30, cols: 5, rows: 6 },
  medium: { total: 60, cols: 6, rows: 10 },
  hard: { total: 100, cols: 8, rows: 13 },
};

export const COLORS = ['#e63946', '#1d4ed8', '#2a9d8f', '#9d4edd', '#e76f51', '#386641'];

export interface NumberTile {
  n: number;
  /** centre position, 0..1 of board width / height */
  x: number;
  y: number;
  /** diameter as a fraction of one grid cell */
  size: number;
  rotate: number;
  color: string;
}

export interface Layout {
  cols: number;
  rows: number;
  tiles: NumberTile[];
}

export const JITTER = 0.1;
export const BASE_SIZE = 0.7;
export const MAX_SCALE = 1.1;

/**
 * Scatter numbers 1..total on a jittered grid. Deterministic for a given seed so that
 * both players see the same board. Jitter + size bounds guarantee tiles never overlap.
 */
export function makeLayout(level: NumbersLevel, seed: number): Layout {
  const { total, cols, rows } = LEVELS[level];
  const rand = createRng(seed);
  const cells = shuffle(
    Array.from({ length: cols * rows }, (_, i) => i),
    rand,
  ).slice(0, total);
  const tiles = cells.map((cell, k) => {
    const col = cell % cols;
    const row = Math.floor(cell / cols);
    const jx = (rand() * 2 - 1) * JITTER;
    const jy = (rand() * 2 - 1) * JITTER;
    const scale = 0.8 + rand() * (MAX_SCALE - 0.8);
    return {
      n: k + 1,
      x: (col + 0.5 + jx) / cols,
      y: (row + 0.5 + jy) / rows,
      size: BASE_SIZE * scale,
      rotate: Math.round((rand() * 2 - 1) * 30),
      color: COLORS[Math.floor(rand() * COLORS.length)],
    };
  });
  return { cols, rows, tiles };
}

export interface NumbersState {
  level: NumbersLevel;
  seed: number;
  total: number;
  /** next number to find */
  next: number;
  /** who found each number: owner[n] = uid */
  owner: Record<string, string>;
  scores: Record<string, number>;
  done: boolean;
  startedAt: number;
}

export function initialState(
  level: NumbersLevel,
  seed: number,
  uids: string[],
  now: number,
): NumbersState {
  return {
    level,
    seed,
    total: LEVELS[level].total,
    next: 1,
    owner: {},
    scores: Object.fromEntries(uids.map((u) => [u, 0])),
    done: false,
    startedAt: now,
  };
}

/** Returns the new state if `uid` correctly claimed `n`, or null if it was not the next number. */
export function applyClaim(state: NumbersState, uid: string, n: number): NumbersState | null {
  if (state.done || n !== state.next || !(uid in state.scores)) return null;
  const owner = normalizeOwner(state.owner);
  const next = n + 1;
  return {
    ...state,
    next,
    owner: { ...owner, [n]: uid },
    scores: { ...state.scores, [uid]: (state.scores[uid] ?? 0) + 1 },
    done: next > state.total,
  };
}

/** Winner uid, 'draw', or null while playing. */
export function numbersWinner(state: NumbersState): string | 'draw' | null {
  if (!state.done) return null;
  const entries = Object.entries(state.scores).sort((a, b) => b[1] - a[1]);
  if (entries.length < 2 || entries[0][1] === entries[1][1]) return 'draw';
  return entries[0][0];
}

/** RTDB turns objects with integer keys into (sparse) arrays, and drops empty objects. */
export function normalizeOwner(owner: unknown): Record<string, string> {
  if (!owner) return {};
  if (Array.isArray(owner)) {
    const out: Record<string, string> = {};
    owner.forEach((v, i) => {
      if (v) out[i] = v;
    });
    return out;
  }
  return owner as Record<string, string>;
}
