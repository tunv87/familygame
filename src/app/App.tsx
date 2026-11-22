import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { CaroLocal } from '../games/caro/CaroLocal';
import { CaroSetup } from '../games/caro/CaroSetup';
import { NumbersSetup } from '../games/numbers/NumbersSetup';
import { NumbersSolo } from '../games/numbers/NumbersSolo';
import { createLogger } from '../lib/logger';
import { JoinScreen } from '../online/JoinScreen';
import { RoomScreen } from '../online/RoomScreen';
import { DebugScreen } from './DebugScreen';
import { Hub } from './Hub';
import { SettingsScreen } from './SettingsScreen';
import { useSettings } from './settings';
import { THEMES } from './theme';
import { translate } from '../i18n';

const log = createLogger('nav');

function RouteLogger() {
  const loc = useLocation();
  useEffect(() => log.info('route', { path: loc.pathname + loc.search }), [loc]);
  return null;
}

export function App() {
  const { bigText, lang, theme } = useSettings();
  useEffect(() => {
    document.documentElement.dataset.bigtext = bigText ? '1' : '0';
    document.documentElement.lang = lang;
    document.documentElement.dataset.theme = theme;
    document.title = translate(lang, 'appName');
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEMES[theme].themeColor);
  }, [bigText, lang, theme]);
  return (
    <HashRouter>
      <RouteLogger />
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/caro" element={<CaroSetup />} />
        <Route path="/caro/play" element={<CaroLocal />} />
        <Route path="/numbers" element={<NumbersSetup />} />
        <Route path="/numbers/play" element={<NumbersSolo />} />
        <Route path="/join" element={<JoinScreen />} />
        <Route path="/join/:code" element={<JoinScreen />} />
        <Route path="/room/:code" element={<RoomScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/debug" element={<DebugScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
