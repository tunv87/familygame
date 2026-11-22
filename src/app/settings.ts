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

function createStore<T>(key: string, fallback: T) {
  let value = load(key, fallback);
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

const settingsStore = createStore<Settings>('settings', {
  sound: true,
  bigText: false,
  lang: detectLang(),
  theme: 'classic',
});
const profileStore = createStore<Profile>('profile', {
  name: '',
  avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
});

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
