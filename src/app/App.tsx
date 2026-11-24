import { useEffect, useRef } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { CaroLocal } from '../games/caro/CaroLocal';
import { CaroSetup } from '../games/caro/CaroSetup';
import { CoGanhLocal } from '../games/coganh/CoGanhLocal';
import { CoGanhSetup } from '../games/coganh/CoGanhSetup';
import { NoiTuLocal } from '../games/noitu/NoiTuLocal';
import { NoiTuSetup } from '../games/noitu/NoiTuSetup';
import { CaNguaSetup } from '../games/cangua/CaNguaSetup';
import { OAQLocal } from '../games/oanquan/OAQLocal';
import { OAQSetup } from '../games/oanquan/OAQSetup';
import { NumbersSetup } from '../games/numbers/NumbersSetup';
import { NumbersSolo } from '../games/numbers/NumbersSolo';
import { createLogger } from '../lib/logger';
import { JoinScreen } from '../online/JoinScreen';
import { RoomScreen } from '../online/RoomScreen';
import { AboutScreen } from './AboutScreen';
import { DebugScreen } from './DebugScreen';
import { Hub } from './Hub';
import { SettingsScreen } from './SettingsScreen';
import { getSettings, useSettings } from './settings';
import { sfx } from '../lib/sound';
import { startMusic, stopMusic } from '../lib/music';
import { THEMES } from './theme';
import { translate } from '../i18n';
import { hideSplash, setStatusBarTheme } from '../lib/native';

const log = createLogger('nav');

function RouteLogger() {
  const loc = useLocation();
  useEffect(() => log.info('route', { path: loc.pathname + loc.search }), [loc]);
  return null;
}

/**
 * Browsers only allow audio after a user gesture: on the first tap, unlock audio,
 * load the theme's sounds and start the music if it is on. Music pauses while the
 * app is hidden (background, other tab) and follows the setting.
 */
function useAudioLifecycle() {
  const { music, theme } = useSettings();
  const unlocked = useRef(false);
  useEffect(() => {
    const onFirstTap = () => {
      unlocked.current = true;
      sfx.unlock();
      if (getSettings().music && !document.hidden) startMusic();
    };
    window.addEventListener('pointerdown', onFirstTap, { once: true, capture: true });
    const onVisibility = () => {
      if (document.hidden) stopMusic();
      else if (unlocked.current && getSettings().music) startMusic();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pointerdown', onFirstTap, { capture: true });
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  useEffect(() => {
    if (!unlocked.current) return;
    if (music) startMusic();
    else stopMusic();
  }, [music]);
  useEffect(() => {
    if (unlocked.current) sfx.unlock(); // load the new theme's sounds
  }, [theme]);
}

export function App() {
  const { bigText, lang, theme } = useSettings();
  useEffect(() => {
    document.documentElement.dataset.bigtext = bigText ? '1' : '0';
    document.documentElement.lang = lang;
    document.documentElement.dataset.theme = theme;
    document.title = translate(lang, 'appName');
    setStatusBarTheme(theme);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEMES[theme].themeColor);
  }, [bigText, lang, theme]);
  useEffect(hideSplash, []);
  useAudioLifecycle();
  return (
    <HashRouter>
      <RouteLogger />
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/caro" element={<CaroSetup />} />
        <Route path="/caro/play" element={<CaroLocal />} />
        <Route path="/coganh" element={<CoGanhSetup />} />
        <Route path="/coganh/play" element={<CoGanhLocal />} />
        <Route path="/oanquan" element={<OAQSetup />} />
        <Route path="/cangua" element={<CaNguaSetup />} />
        <Route path="/oanquan/play" element={<OAQLocal />} />
        <Route path="/noitu" element={<NoiTuSetup />} />
        <Route path="/noitu/play" element={<NoiTuLocal />} />
        <Route path="/numbers" element={<NumbersSetup />} />
        <Route path="/numbers/play" element={<NumbersSolo />} />
        <Route path="/join" element={<JoinScreen />} />
        <Route path="/join/:code" element={<JoinScreen />} />
        <Route path="/room/:code" element={<RoomScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/debug" element={<DebugScreen />} />
        <Route path="/about" element={<AboutScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
