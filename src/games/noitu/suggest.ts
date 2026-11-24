/**
 * "Từ này có thật": a player says a refused word is a real word. Only the word itself is sent
 * (no name, no player id in the record) to `suggestions/`, for the owner to review in the
 * Firebase console and add to the next word list.
 */
import { push, ref, serverTimestamp } from 'firebase/database';
import { createLogger } from '../../lib/logger';
import { ensureAuth, getDb, isOnlineConfigured } from '../../online/firebase';
import { normalize } from './logic';

const log = createLogger('noitu-suggest');

export const canSuggest = isOnlineConfigured;

/** Two syllables of letters only, at most 30 characters (also enforced by the database rules). */
export function isSuggestable(word: string): boolean {
  const w = normalize(word);
  return w.length <= 30 && /^\p{L}+ \p{L}+$/u.test(w);
}

export async function suggestWord(word: string): Promise<boolean> {
  const w = normalize(word);
  if (!canSuggest || !isSuggestable(w)) return false;
  try {
    await ensureAuth();
    await push(ref(getDb(), 'suggestions'), { word: w, at: serverTimestamp() });
    log.info('word suggested', { w });
    return true;
  } catch (e) {
    log.warn('suggestion failed', String(e));
    return false;
  }
}
