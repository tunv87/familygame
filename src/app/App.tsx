import { Suspense, lazy, useEffect, useRef } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
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
import { loadGamesConfig } from './gameConfig';
import { GameGate } from '../ui/GameGate';
import { translate } from '../i18n';
import { hideSplash, setStatusBarTheme } from '../lib/native';

// Each game is its own download, fetched when it is opened (a hidden game is never loaded).
const CaroLocal = lazy(() =>
  import('../games/caro/CaroLocal').then((m) => ({ default: m.CaroLocal })),
);
const CaroSetup = lazy(() =>
  import('../games/caro/CaroSetup').then((m) => ({ default: m.CaroSetup })),
);
const CoGanhLocal = lazy(() =>
  import('../games/coganh/CoGanhLocal').then((m) => ({ default: m.CoGanhLocal })),
);
const CoGanhSetup = lazy(() =>
  import('../games/coganh/CoGanhSetup').then((m) => ({ default: m.CoGanhSetup })),
);
const NoiTuLocal = lazy(() =>
  import('../games/noitu/NoiTuLocal').then((m) => ({ default: m.NoiTuLocal })),
);
const NoiTuSetup = lazy(() =>
  import('../games/noitu/NoiTuSetup').then((m) => ({ default: m.NoiTuSetup })),
);
const CaNguaSetup = lazy(() =>
  import('../games/cangua/CaNguaSetup').then((m) => ({ default: m.CaNguaSetup })),
);
const OAQLocal = lazy(() =>
  import('../games/oanquan/OAQLocal').then((m) => ({ default: m.OAQLocal })),
);
const OAQSetup = lazy(() =>
  import('../games/oanquan/OAQSetup').then((m) => ({ default: m.OAQSetup })),
);
const NumbersSetup = lazy(() =>
  import('../games/numbers/NumbersSetup').then((m) => ({ default: m.NumbersSetup })),
);
const NumbersSolo = lazy(() =>
  import('../games/numbers/NumbersSolo').then((m) => ({ default: m.NumbersSolo })),
);

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

function Loading() {
  return <main className="screen" aria-busy="true" />;
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
  useEffect(loadGamesConfig, []);
  useAudioLifecycle();
  return (
    <HashRouter>
      <RouteLogger />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Hub />} />
          <Route
            path="/caro"
            element={
              <GameGate game="caro">
                <CaroSetup />
              </GameGate>
            }
          />
          <Route
            path="/caro/play"
            element={
              <GameGate game="caro" play>
                <CaroLocal />
              </GameGate>
            }
          />
          <Route
            path="/coganh"
            element={
              <GameGate game="coganh">
                <CoGanhSetup />
              </GameGate>
            }
          />
          <Route
            path="/coganh/play"
            element={
              <GameGate game="coganh" play>
                <CoGanhLocal />
              </GameGate>
            }
          />
          <Route
            path="/oanquan"
            element={
              <GameGate game="oanquan">
                <OAQSetup />
              </GameGate>
            }
          />
          <Route
            path="/cangua"
            element={
              <GameGate game="cangua">
                <CaNguaSetup />
              </GameGate>
            }
          />
          <Route
            path="/oanquan/play"
            element={
              <GameGate game="oanquan" play>
                <OAQLocal />
              </GameGate>
            }
          />
          <Route
            path="/noitu"
            element={
              <GameGate game="noitu">
                <NoiTuSetup />
              </GameGate>
            }
          />
          <Route
            path="/noitu/play"
            element={
              <GameGate game="noitu" play>
                <NoiTuLocal />
              </GameGate>
            }
          />
          <Route
            path="/numbers"
            element={
              <GameGate game="numbers">
                <NumbersSetup />
              </GameGate>
            }
          />
          <Route
            path="/numbers/play"
            element={
              <GameGate game="numbers" play>
                <NumbersSolo />
              </GameGate>
            }
          />
          <Route path="/join" element={<JoinScreen />} />
          <Route path="/join/:code" element={<JoinScreen />} />
          <Route path="/room/:code" element={<RoomScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/debug" element={<DebugScreen />} />
          <Route path="/about" element={<AboutScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
