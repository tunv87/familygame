/**
 * Play counter shared by everyone: stats/plays/<game> is a number that goes up by one when a
 * game starts (a new round on one device, or a new online round, counted once by the host).
 * Nothing about the player is stored. It uses plain HTTPS requests (no live database
 * connection on pages without online play) and is best-effort: offline or blocked, a play is
 * skipped silently and the numbers are simply not shown.
 */
import { useEffect, useRef, useState } from 'react';
import { createLogger } from '../lib/logger';
import { idToken, isOnlineConfigured, restUrl } from './firebase';
import type { GameId } from './types';

const log = createLogger('plays');

export type PlayCounts = Partial<Record<GameId, number>>;

const online = () =>
  isOnlineConfigured && (typeof navigator === 'undefined' || navigator.onLine !== false);

/**
 * Adds one play with the database's own increment: one request, no read first, and plays
 * from many devices at the same moment never overwrite each other.
 */
async function addOne(game: GameId) {
  const token = await idToken(true);
  const res = await fetch(restUrl(`stats/plays/${game}`, token), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ '.sv': { increment: 1 } }),
  });
  if (!res.ok) throw new Error(`write ${res.status}`);
}

/**
 * Counting waits a moment after the game opens: the game screen appears without extra work
 * (signing in, starting Firebase), and a page reloaded at once sends nothing instead of a
 * request cut off halfway, which Safari reports as an error. Returns a cancel function.
 */
const DELAY_MS = 1000;

export function countPlay(game: GameId): () => void {
  const id = setTimeout(() => {
    if (!online()) return;
    addOne(game).catch((e) => log.info('play not counted', { game, e: String(e) }));
  }, DELAY_MS);
  return () => clearTimeout(id);
}

/** Counts a play each time `round` changes (once per round, also under StrictMode). */
export function useCountPlay(game: GameId, round: number, enabled = true) {
  const last = useRef<number | null>(null);
  useEffect(() => {
    if (!enabled || last.current === round) return;
    last.current = round;
    countPlay(game);
  }, [game, round, enabled]);
}

/** Play counts of every game, read when the page opens; null until known (or when offline). */
export function usePlayCounts(): PlayCounts | null {
  const [counts, setCounts] = useState<PlayCounts | null>(null);
  useEffect(() => {
    let live = true;
    const id = setTimeout(() => {
      if (!online()) return;
      fetch(restUrl('stats/plays'))
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`read ${r.status}`))))
        .then((v: PlayCounts | null) => live && setCounts(v ?? {}))
        .catch((e) => log.info('play counts unavailable', String(e)));
    }, 300); // not during the page's first render, and not for pages left at once
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, []);
  return counts;
}

export function totalPlays(c: PlayCounts) {
  return Object.values(c).reduce<number>((a, n) => a + (Number(n) || 0), 0);
}
