/**
 * Thin layer over Capacitor plugins. Everything here is a no-op (or falls back
 * to the web API) in the browser, so the same code runs on web, iOS and Android.
 */
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { Share } from '@capacitor/share';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { createLogger } from './logger';

const log = createLogger('native');

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

// ---------------------------------------------------------------------------
// Haptics

export const haptic = {
  tap() {
    if (isNative) void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  },
  wrong() {
    if (isNative) void Haptics.notification({ type: NotificationType.Error }).catch(() => {});
    else if ('vibrate' in navigator) navigator.vibrate(60);
  },
  win() {
    if (isNative) void Haptics.notification({ type: NotificationType.Success }).catch(() => {});
  },
};

// ---------------------------------------------------------------------------
// Share sheet

/** Opens the native share sheet; returns false if sharing is unavailable. */
export async function shareInvite(opts: { title: string; text: string; url: string }) {
  if (isNative) {
    try {
      await Share.share({ ...opts, dialogTitle: opts.title });
      return true;
    } catch (e) {
      // user cancelled → treat as handled
      log.info('share closed', String(e));
      return true;
    }
  }
  if (navigator.share) {
    try {
      await navigator.share(opts);
      return true;
    } catch (e) {
      return (e as Error).name === 'AbortError';
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Persistent storage: iOS may evict WKWebView localStorage under storage pressure,
// so on native we mirror our keys into Preferences (UserDefaults / SharedPreferences)
// and restore them before the app renders.

const PREFIX = 'fg:';

export async function restoreStorage() {
  if (!isNative) return;
  try {
    const { keys } = await Preferences.keys();
    for (const key of keys.filter((k) => k.startsWith(PREFIX))) {
      if (localStorage.getItem(key) !== null) continue;
      const { value } = await Preferences.get({ key });
      if (value !== null) localStorage.setItem(key, value);
    }
  } catch (e) {
    log.warn('restore failed', String(e));
  }
}

export function persist(key: string, value: string) {
  if (isNative) void Preferences.set({ key, value }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Android back button: the top-most handler wins (e.g. "leave this game?"),
// otherwise go back, and from the home screen leave the app.

type BackHandler = () => void;
const backHandlers: BackHandler[] = [];

export function pushBackHandler(fn: BackHandler): () => void {
  backHandlers.push(fn);
  return () => {
    const i = backHandlers.lastIndexOf(fn);
    if (i >= 0) backHandlers.splice(i, 1);
  };
}

export async function setupNative() {
  if (!isNative) return;
  document.documentElement.dataset.platform = platform;
  App.addListener('backButton', () => {
    const top = backHandlers[backHandlers.length - 1];
    if (top) top();
    else if (location.hash === '' || location.hash === '#/' || location.hash === '#')
      void App.minimizeApp();
    else history.back();
  });
  // Resuming the app: let listeners (e.g. online rooms) refresh.
  App.addListener('resume', () => log.info('resume'));
}

export function hideSplash() {
  if (isNative) void SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {});
}

export function setStatusBarTheme(theme: 'classic' | 'cute') {
  if (!isNative) return;
  void StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  if (platform === 'android') {
    void StatusBar.setBackgroundColor({ color: theme === 'cute' ? '#fff0f7' : '#fff8e7' }).catch(
      () => {},
    );
  }
}
