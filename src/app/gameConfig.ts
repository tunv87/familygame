/**
 * Which games and modes are available, set by the owner in the Firebase console:
 *
 *   config/games/<game> = { "status": "on" | "off" | "hidden",
 *                           "modes": { "solo": …, "local": …, "online": …, "practice": … } }
 *
 * "off" shows the game (or mode) greyed out as "under maintenance"; "hidden" removes it.
 * Anything missing or unknown counts as "on". The app reads the config over HTTPS when it
 * starts, keeps the last copy on the device for offline use, and never writes it (the
 * database rules make it read-only).
 */
import { useSyncExternalStore } from 'react';
import { createLogger } from '../lib/logger';
import { load, save } from '../lib/storage';
import { isOnlineConfigured, restUrl } from '../online/firebase';
import type { GameId } from '../online/types';

const log = createLogger('config');

export type Availability = 'on' | 'off' | 'hidden';
export type ModeKey = 'solo' | 'local' | 'online' | 'practice';
interface GameEntry {
  status?: Availability;
  modes?: Partial<Record<ModeKey, Availability>>;
}
export type GamesConfig = Partial<Record<GameId, GameEntry>>;

const KEY = 'game-config';
const LEVELS: Availability[] = ['on', 'off', 'hidden'];
const asAvailability = (v: unknown): Availability =>
  LEVELS.includes(v as Availability) ? (v as Availability) : 'on';

/** Keeps only well-formed entries (the config is typed by hand in the console). */
export function cleanConfig(raw: unknown): GamesConfig {
  const out: GamesConfig = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, e] of Object.entries(raw as Record<string, unknown>)) {
    if (!e || typeof e !== 'object') continue;
    const entry = e as Record<string, unknown>;
    const g: GameEntry = { status: asAvailability(entry.status) };
    if (entry.modes && typeof entry.modes === 'object') {
      g.modes = {};
      for (const [m, v] of Object.entries(entry.modes as Record<string, unknown>))
        if (['solo', 'local', 'online', 'practice'].includes(m))
          g.modes[m as ModeKey] = asAvailability(v);
    }
    out[id as GameId] = g;
  }
  return out;
}

let config: GamesConfig = cleanConfig(load<unknown>(KEY, {}));
const listeners = new Set<() => void>();

export function setGamesConfig(c: GamesConfig) {
  config = c;
  save(KEY, c);
  listeners.forEach((l) => l());
}

let loaded = false;
/** Reads the latest config once per app start; offline, the saved copy stays in use. */
export function loadGamesConfig() {
  if (loaded || !isOnlineConfigured) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  loaded = true;
  fetch(restUrl('config/games'))
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`read ${r.status}`))))
    .then((v: unknown) => {
      setGamesConfig(cleanConfig(v));
      log.info('game config', v as object);
    })
    .catch((e) => {
      loaded = false; // try again next time
      log.info('game config unavailable', String(e));
    });
}

/** the current config, outside React */
export const getGamesConfig = () => config;

export function gameStatus(c: GamesConfig, game: GameId): Availability {
  return c[game]?.status ?? 'on';
}

/** A mode is only as available as its game. */
export function modeStatus(c: GamesConfig, game: GameId, mode: ModeKey): Availability {
  const g = gameStatus(c, game);
  if (g !== 'on') return g;
  return c[game]?.modes?.[mode] ?? 'on';
}

export function useGamesConfig(): GamesConfig {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => config,
  );
}
