import { useSyncExternalStore } from 'react';
import { load, save } from '../lib/storage';

export type Lang = 'vi' | 'en';
export type ThemeId = 'classic' | 'cute';

export interface Settings {
  sound: boolean;
  bigText: boolean;
  lang: Lang;
  theme: ThemeId;
}

export interface Profile {
  name: string;
  avatar: string;
}

/** First launch: Vietnamese devices get Vietnamese, everyone else English. */
function detectLang(): Lang {
  const langs =
    typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language]);
  return langs.some((l) => l?.toLowerCase().startsWith('vi')) ? 'vi' : 'en';
}

export const AVATARS = ['🐶', '🐱', '🐰', '🐻', '🐼', '🦊', '🐯', '🐸', '🐵', '🦄', '🐧', '🐢'];

function createStore<T>(key: string, fallback: T, clean: (v: T) => T) {
  let value = clean(load(key, fallback));
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (patch: Partial<T>) => {
      value = { ...value, ...patch };
      save(key, value);
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

const pick = <V>(v: unknown, allowed: readonly V[], fallback: V): V =>
  allowed.includes(v as V) ? (v as V) : fallback;
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);

/** Saved data can be old, hand-edited or corrupt: keep only valid values. */
export function cleanSettings(s: Settings): Settings {
  return {
    sound: bool(s.sound, true),
    bigText: bool(s.bigText, false),
    lang: pick(s.lang, ['vi', 'en'] as const, detectLang()),
    theme: pick(s.theme, ['classic', 'cute'] as const, 'classic'),
  };
}

export function cleanProfile(p: Profile): Profile {
  return {
    name: typeof p.name === 'string' ? p.name.slice(0, 20) : '',
    avatar: pick(p.avatar, AVATARS, AVATARS[0]),
  };
}

const settingsStore = createStore<Settings>(
  'settings',
  { sound: true, bigText: false, lang: detectLang(), theme: 'classic' },
  cleanSettings,
);
const profileStore = createStore<Profile>(
  'profile',
  { name: '', avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)] },
  cleanProfile,
);

export const getSettings = settingsStore.get;
export const setSettings = settingsStore.set;
export const getProfile = profileStore.get;
export const setProfile = profileStore.set;

export function useSettings(): Settings {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.get);
}

export function useProfile(): Profile {
  return useSyncExternalStore(profileStore.subscribe, profileStore.get);
}
