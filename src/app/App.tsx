import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { CaroLocal } from '../games/caro/CaroLocal';
import { CaroSetup } from '../games/caro/CaroSetup';
import { NumbersSetup } from '../games/numbers/NumbersSetup';
import { createLogger } from '../lib/logger';
import { JoinScreen } from '../online/JoinScreen';
import { RoomScreen } from '../online/RoomScreen';
import { DebugScreen } from './DebugScreen';
import { Hub } from './Hub';
import { SettingsScreen } from './SettingsScreen';
import { useSettings } from './settings';

const log = createLogger('nav');

function RouteLogger() {
  const loc = useLocation();
  useEffect(() => log.info('route', { path: loc.pathname + loc.search }), [loc]);
  return null;
}

export function App() {
  const { bigText, lang } = useSettings();
  useEffect(() => {
    document.documentElement.dataset.bigtext = bigText ? '1' : '0';
    document.documentElement.lang = lang;
  }, [bigText, lang]);
  return (
    <HashRouter>
      <RouteLogger />
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/caro" element={<CaroSetup />} />
        <Route path="/caro/play" element={<CaroLocal />} />
        <Route path="/numbers" element={<NumbersSetup />} />
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
