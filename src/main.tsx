import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createLogger, installGlobalErrorLogging, isLeaving } from './lib/logger';
import { restoreStorage, setupNative } from './lib/native';
import { setupPwa } from './lib/pwa';
// Self-hosted rounded font with full Vietnamese coverage, so diacritics render the
// same on every device (system fonts on some Windows/Android setups lack them).
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/nunito/900.css';
import './styles.css';

async function main() {
  installGlobalErrorLogging();
  // On native, saved settings/profile/records are restored before any store reads them,
  // so the App module (which creates those stores) is imported only afterwards.
  await restoreStorage();
  await setupNative();
  setupPwa();
  createLogger('app').info('start', { version: __APP_VERSION__, built: __BUILD_TIME__ });
  let App: typeof import('./app/App').App;
  try {
    ({ App } = await import('./app/App'));
  } catch (e) {
    if (isLeaving()) return; // the page is reloading anyway
    // e.g. a new version was published while this page was open, or the network dropped:
    // reload once; if that fails too, say so instead of leaving a blank screen
    createLogger('app').error('app failed to load', String(e));
    const KEY = 'fg:reloaded-after-load-error';
    try {
      if (!sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, '1');
        location.reload();
        return;
      }
    } catch {
      /* storage blocked: show the message */
    }
    showLoadError();
    return;
  }
  try {
    sessionStorage.removeItem('fg:reloaded-after-load-error');
  } catch {
    /* ignore */
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

/** Plain message (no app code needed) when the app itself cannot be loaded. */
function showLoadError() {
  const vi = (navigator.language || '').toLowerCase().startsWith('vi');
  const root = document.getElementById('root')!;
  root.innerHTML = '';
  const box = document.createElement('main');
  box.className = 'screen center';
  box.setAttribute('data-testid', 'load-error');
  const p = document.createElement('p');
  p.textContent = vi
    ? 'Chưa mở được trò chơi. Hãy kiểm tra mạng rồi tải lại.'
    : 'The games could not be opened. Check your connection and reload.';
  const b = document.createElement('button');
  b.className = 'btn';
  b.textContent = vi ? '🔄 Tải lại' : '🔄 Reload';
  b.onclick = () => location.reload();
  box.append(p, b);
  root.append(box);
}

main().catch((e) => {
  if (!isLeaving()) createLogger('app').error('start failed', String(e));
});
