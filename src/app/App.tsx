import { Suspense, useEffect, useRef } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { GameLoadBoundary, Loading, lazyGame, prefetchGames } from './lazyGames';
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
import { gameStatus, getGamesConfig, loadGamesConfig } from './gameConfig';
import { GameGate } from '../ui/GameGate';
import { translate } from '../i18n';
import { hideSplash, setStatusBarTheme } from '../lib/native';

// Each game is its own download, fetched when it is opened (a hidden game is never loaded).
const CaroLocal = lazyGame(
  'caro',
  () => import('../games/caro/CaroLocal'),
  (m) => m.CaroLocal,
);
const CaroSetup = lazyGame(
  'caro',
  () => import('../games/caro/CaroSetup'),
  (m) => m.CaroSetup,
);
const CoGanhLocal = lazyGame(
  'coganh',
  () => import('../games/coganh/CoGanhLocal'),
  (m) => m.CoGanhLocal,
);
const CoGanhSetup = lazyGame(
  'coganh',
  () => import('../games/coganh/CoGanhSetup'),
  (m) => m.CoGanhSetup,
);
const NoiTuLocal = lazyGame(
  'noitu',
  () => import('../games/noitu/NoiTuLocal'),
  (m) => m.NoiTuLocal,
);
const NoiTuSetup = lazyGame(
  'noitu',
  () => import('../games/noitu/NoiTuSetup'),
  (m) => m.NoiTuSetup,
);
const CaNguaSetup = lazyGame(
  'cangua',
  () => import('../games/cangua/CaNguaSetup'),
  (m) => m.CaNguaSetup,
);
const OAQLocal = lazyGame(
  'oanquan',
  () => import('../games/oanquan/OAQLocal'),
  (m) => m.OAQLocal,
);
const OAQSetup = lazyGame(
  'oanquan',
  () => import('../games/oanquan/OAQSetup'),
  (m) => m.OAQSetup,
);
const NumbersSetup = lazyGame(
  'numbers',
  () => import('../games/numbers/NumbersSetup'),
  (m) => m.NumbersSetup,
);
const NumbersSolo = lazyGame(
  'numbers',
  () => import('../games/numbers/NumbersSolo'),
  (m) => m.NumbersSolo,
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

/** Catches a game that cannot be downloaded; a new page starts with a fresh try. */
function Boundary({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return <GameLoadBoundary resetKey={loc.pathname + loc.search}>{children}</GameLoadBoundary>;
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
  // fetch the playable games in the background, so they open at once and offline
  useEffect(() => {
    const id = setTimeout(
      () => prefetchGames((g) => gameStatus(getGamesConfig(), g) !== 'hidden'),
      800,
    );
    return () => clearTimeout(id);
  }, []);
  useAudioLifecycle();
  return (
    <HashRouter>
      <RouteLogger />
      <Boundary>
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
      </Boundary>
    </HashRouter>
  );
}
