import { createLogger } from './logger';
import { persist } from './native';

const log = createLogger('storage');
const PREFIX = 'fg:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    // Only merge saved objects; anything else (null, arrays, strings…) is corrupt → defaults.
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback;
    return { ...fallback, ...(parsed as Partial<T>) };
  } catch (e) {
    log.warn('load failed', { key, e: String(e) });
    return fallback;
  }
}

export function save<T>(key: string, value: T) {
  try {
    const json = JSON.stringify(value);
    localStorage.setItem(PREFIX + key, json);
    persist(PREFIX + key, json);
  } catch (e) {
    log.warn('save failed', { key, e: String(e) });
  }
}
