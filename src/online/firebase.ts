import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
  onAuthStateChanged,
  signInAnonymously,
  type Auth,
} from 'firebase/auth';
import {
  connectDatabaseEmulator,
  getDatabase,
  onValue,
  ref,
  type Database,
} from 'firebase/database';
import { createLogger } from '../lib/logger';

const log = createLogger('firebase');
const env = import.meta.env;
const useEmulator = env.VITE_USE_EMULATOR === '1';

export const isOnlineConfigured = useEmulator || Boolean(env.VITE_FIREBASE_DATABASE_URL);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Database | null = null;

function init() {
  if (app) return;
  if (!isOnlineConfigured) throw new Error('online-not-configured');
  const emuHost = env.VITE_EMULATOR_HOST || location.hostname || '127.0.0.1';
  app = initializeApp(
    useEmulator
      ? {
          apiKey: 'demo-key',
          projectId: 'demo-familygame',
          databaseURL: `http://${emuHost}:9000?ns=demo-familygame-default-rtdb`,
        }
      : {
          apiKey: env.VITE_FIREBASE_API_KEY,
          authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
          databaseURL: env.VITE_FIREBASE_DATABASE_URL,
          projectId: env.VITE_FIREBASE_PROJECT_ID,
          appId: env.VITE_FIREBASE_APP_ID,
        },
  );
  // initializeAuth instead of getAuth: getAuth also installs the Google sign-in popup helper,
  // which loads a script from apis.google.com on phones. We only sign in anonymously (B16).
  auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  db = getDatabase(app);
  if (useEmulator) {
    connectAuthEmulator(auth, `http://${emuHost}:9099`, { disableWarnings: true });
    connectDatabaseEmulator(db, emuHost, 9000);
    log.info('using emulators', { emuHost });
  }
}

export function getDb(): Database {
  init();
  return db!;
}

/** REST address of a database path (the play counter uses plain HTTPS, no live connection). */
export function restUrl(path: string, token?: string): string {
  const emuHost = env.VITE_EMULATOR_HOST || location.hostname || '127.0.0.1';
  const base = useEmulator
    ? `http://${emuHost}:9000/${path}.json?ns=demo-familygame-default-rtdb`
    : `${String(env.VITE_FIREBASE_DATABASE_URL).replace(/\/$/, '')}/${path}.json`;
  if (!token) return base;
  return `${base}${base.includes('?') ? '&' : '?'}auth=${encodeURIComponent(token)}`;
}

/** ID token of the anonymous user, for REST writes. */
export async function idToken(quiet = false): Promise<string> {
  await ensureAuth(quiet);
  return auth!.currentUser!.getIdToken();
}

let offset = 0;
let watchingOffset = false;
/** Date.now() corrected to the Firebase server clock, so turn timers agree on both devices. */
export function serverNow(): number {
  if (!watchingOffset) {
    watchingOffset = true;
    onValue(ref(getDb(), '.info/serverTimeOffset'), (s) => {
      offset = Number(s.val()) || 0;
    });
  }
  return Date.now() + offset;
}

let uidPromise: Promise<string> | null = null;

/** Signs in anonymously once per device and resolves to the stable uid. */
export function ensureAuth(quiet = false): Promise<string> {
  init();
  if (!uidPromise) {
    uidPromise = new Promise<string>((resolve, reject) => {
      const unsub = onAuthStateChanged(auth!, (user) => {
        if (user) {
          unsub();
          log.info('signed in', { uid: user.uid.slice(0, 6) });
          resolve(user.uid);
        }
      });
      signInAnonymously(auth!).catch((e) => {
        unsub();
        uidPromise = null;
        // quiet: background work (the play counter) that may simply fail offline
        if (quiet) log.info('anonymous sign-in failed', String(e));
        else log.error('anonymous sign-in failed', e);
        reject(e);
      });
    });
  }
  return uidPromise;
}
