/**
 * The error log (#/debug) is for us, not for players: its button in Settings only shows in
 * development, or on a device where someone tapped the home title 5 times (support asks for it).
 */
import { load, save } from '../lib/storage';

const KEY = 'devtools';

export const devToolsUnlocked = () =>
  import.meta.env.DEV || load<{ on: boolean }>(KEY, { on: false }).on === true;

export function unlockDevTools() {
  save(KEY, { on: true });
}
