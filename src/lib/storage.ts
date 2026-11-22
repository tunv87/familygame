import { createLogger } from './logger';
import { persist } from './native';

const log = createLogger('storage');
const PREFIX = 'fg:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : { ...fallback, ...JSON.parse(raw) };
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
