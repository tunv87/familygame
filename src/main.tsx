import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { createLogger, installGlobalErrorLogging } from './lib/logger';
import './styles.css';

installGlobalErrorLogging();
createLogger('app').info('start', { version: __APP_VERSION__, built: __BUILD_TIME__ });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
