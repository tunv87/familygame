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

async function withRetry<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (e) {
    if (isLeaving()) throw e;
    log.warn('game load failed, retrying', String(e));
    await new Promise((r) => setTimeout(r, 600));
    return load();
  }
}

export function lazyGame<M>(
  game: GameId,
  load: () => Promise<M>,
  pick: (m: M) => ComponentType,
) {
  loaders.set(game, [...(loaders.get(game) ?? []), load]);
  return lazy(() => withRetry(load).then((m) => ({ default: pick(m) })));
}

let prefetched = false;
/** Downloads the games that can be played, in the background (once per app start). */
export function prefetchGames(visible: (g: GameId) => boolean) {
  if (prefetched) return;
  prefetched = true;
  for (const [game, list] of loaders)
    if (visible(game)) for (const load of list) load().catch(() => {}); // opened later: retried
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
