/**
 * Each game is its own download (a hidden game is never loaded). Visible games are fetched in
 * the background soon after the app opens, so they still open offline; a load that fails is
 * tried once more, then the player gets a message with a Reload button, never a blank screen.
 */
import { Component, lazy, useEffect, type ComponentType, type ReactNode } from 'react';
import { useT } from '../i18n';
import { createLogger, isLeaving } from '../lib/logger';
import type { GameId } from '../online/types';

const log = createLogger('games');
const loaders = new Map<GameId, (() => Promise<unknown>)[]>();

/** a promise that never settles: the page is closing, there is nothing left to show */
const never = <T,>() => new Promise<T>(() => {});

async function withRetry<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (e) {
    // a download cut off because the page is closing (reload, leaving) is not an error
    if (isLeaving()) return never<T>();
    log.warn('game load failed, retrying', String(e));
    await new Promise((r) => setTimeout(r, 600));
    return load();
  }
}

export function lazyGame<M>(game: GameId, load: () => Promise<M>, pick: (m: M) => ComponentType) {
  loaders.set(game, [...(loaders.get(game) ?? []), load]);
  return lazy(() => withRetry(load).then((m) => ({ default: pick(m) })));
}

const fetched = new Set<() => Promise<unknown>>();
let running = false;
let active = false; // the home screen is open

/**
 * Downloads the games that can be played, in the background, one after another (so sounds and
 * the screen are not slowed down). Pauses when the home screen closes or the page is leaving,
 * and carries on from where it was the next time.
 */
export async function prefetchGames(visible: (g: GameId) => boolean) {
  if (running) return;
  running = true;
  try {
    for (const [game, list] of loaders) {
      if (!visible(game)) continue;
      for (const load of list) {
        if (fetched.has(load)) continue;
        if (!active || isLeaving()) return;
        await load().catch(() => {}); // opened later: tried again then
        fetched.add(load);
      }
    }
    // for tests and the debug page: every playable game is on the device
    (window as unknown as { __fgGamesReady?: boolean }).__fgGamesReady = true;
  } finally {
    running = false;
  }
}

export function Loading() {
  const t = useT();
  return (
    <main className="screen center" aria-busy="true" data-testid="loading">
      <div className="muted">⏳ {t('connecting')}</div>
    </main>
  );
}

function LoadFailed() {
  const t = useT();
  return (
    <main className="screen center">
      <div className="banner" data-testid="game-load-error">
        📶 {t('gameLoadError')}
      </div>
      <button className="btn" onClick={() => location.reload()}>
        🔄 {t('reload')}
      </button>
    </main>
  );
}

/** Catches a game that could not be downloaded (offline, or a new version replaced it). */
export class GameLoadBoundary extends Component<
  { children: ReactNode; resetKey: string },
  { failed: boolean; key: string }
> {
  state = { failed: false, key: this.props.resetKey };
  static getDerivedStateFromProps(p: { resetKey: string }, s: { failed: boolean; key: string }) {
    return p.resetKey !== s.key ? { failed: false, key: p.resetKey } : null;
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e: unknown) {
    if (!isLeaving()) log.warn('game could not be opened', String(e));
  }
  render() {
    return this.state.failed ? <LoadFailed /> : this.props.children;
  }
}

/**
 * On the home screen, once the browser is idle: fetch the playable games in the background so
 * they open at once and offline. Not while a game is being played (it would slow it down).
 */
export function usePrefetchGames(visible: (g: GameId) => boolean) {
  useEffect(() => {
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    active = true;
    let idle = 0;
    const timer = setTimeout(() => {
      const go = () => void prefetchGames(visible);
      if (w.requestIdleCallback) idle = w.requestIdleCallback(go, { timeout: 3000 });
      else go();
    }, 1500);
    return () => {
      active = false;
      clearTimeout(timer);
      if (idle) w.cancelIdleCallback?.(idle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
