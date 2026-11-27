/**
 * Each game is its own download (a hidden game is never loaded). Visible games are fetched in
 * the background soon after the app opens, so they still open offline; a load that fails is
 * tried once more, then the player gets a message with a Reload button, never a blank screen.
 */
import { Component, lazy, type ComponentType, type ReactNode } from 'react';
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

let prefetched = false;
/**
 * Downloads the games that can be played, in the background, one after another (so sounds and
 * the game being played are not slowed down); stops if the page is closing. Once per start.
 */
export async function prefetchGames(visible: (g: GameId) => boolean) {
  if (prefetched) return;
  prefetched = true;
  for (const [game, list] of loaders) {
    if (!visible(game)) continue;
    for (const load of list) {
      if (isLeaving()) return;
      await load().catch(() => {}); // opened later: tried again then
    }
  }
  // for tests and the debug page: every playable game is on the device
  (window as unknown as { __fgGamesReady?: boolean }).__fgGamesReady = true;
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
