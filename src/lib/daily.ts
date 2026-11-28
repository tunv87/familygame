/**
 * "Today's challenge": the same puzzle for everyone on the same day (Tìm số board, Nối từ opening
 * word), the day's best result, and a streak of days played in a row. Saved on this device.
 */
import { useSyncExternalStore } from 'react';
import { load, save } from './storage';

export type DailyGame = 'numbers' | 'noitu';

export interface DailyRecord {
  /** last day played, YYYY-MM-DD (local time) */
  last: string;
  /** days in a row up to `last` */
  streak: number;
  /** today's best: time in ms (Tìm số) or 1 = won (Nối từ) */
  best?: number;
}

type DailyStore = Partial<Record<DailyGame, DailyRecord>>;

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function previousDay(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d - 1));
}

/** A seed that is the same for everyone on the same day (and different per game). */
export function dailySeed(game: DailyGame, key = dayKey()) {
  let h = 2166136261;
  for (const ch of `${game}:${key}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

const valid = (r: unknown): r is DailyRecord =>
  !!r &&
  typeof (r as DailyRecord).last === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test((r as DailyRecord).last) &&
  Number.isInteger((r as DailyRecord).streak) &&
  (r as DailyRecord).streak > 0;

let store: DailyStore = (() => {
  const raw = load<DailyStore>('daily', {});
  const out: DailyStore = {};
  for (const g of ['numbers', 'noitu'] as const) if (valid(raw?.[g])) out[g] = raw[g];
  return out;
})();
const listeners = new Set<() => void>();

/**
 * Records a finished challenge. `better(a, b)` says whether result a beats b. Returns the new
 * record and whether today's best improved.
 */
export function finishDaily(
  game: DailyGame,
  result: number,
  better: (a: number, b: number) => boolean,
  today = dayKey(),
) {
  const cur = store[game];
  let next: DailyRecord;
  let improved = false;
  if (cur && cur.last === today) {
    improved = cur.best === undefined || better(result, cur.best);
    next = { ...cur, best: improved ? result : cur.best };
  } else {
    improved = true;
    const streak = cur && cur.last === previousDay(today) ? cur.streak + 1 : 1;
    next = { last: today, streak, best: result };
  }
  store = { ...store, [game]: next };
  save('daily', store);
  listeners.forEach((l) => l());
  return { record: next, improved };
}

/** Today's state: played today? current streak (0 when the streak is broken). */
export function dailyStatus(game: DailyGame, today = dayKey()) {
  const r = store[game];
  if (!r) return { playedToday: false, streak: 0 };
  if (r.last === today) return { playedToday: true, streak: r.streak, best: r.best };
  if (r.last === previousDay(today)) return { playedToday: false, streak: r.streak };
  return { playedToday: false, streak: 0 };
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useDaily(game: DailyGame) {
  useSyncExternalStore(subscribe, () => store);
  return dailyStatus(game);
}

/** Tests only. */
export function resetDailyForTests() {
  store = {};
}
