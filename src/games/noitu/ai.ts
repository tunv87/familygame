/**
 * Nối từ computer player.
 *  - easy:   uses children's words; otherwise knows about two thirds of the very common words
 *  - medium: knows every common word
 *  - hard:   knows the whole dictionary and prefers words that leave you few answers
 * Returns null when it cannot find a word (it gives up and you win).
 */
import { last, options, type Dict, type NoiTuState } from './logic';

export type NoiTuLevel = 'easy' | 'medium' | 'hard';

/** Stable pseudo-random "does the easy robot know this word" (same answer every time). */
function knows(word: string): boolean {
  let h = 0;
  for (const c of word) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h) % 3 !== 0;
}

export function chooseNoiTuWord(
  dict: Dict,
  s: NoiTuState,
  level: NoiTuLevel,
  rand: () => number = Math.random,
): string | null {
  const all = options(dict, s.chain);
  const kids = level === 'easy' ? all.filter((w) => dict.tier(w) === 0) : [];
  if (kids.length) return kids[Math.floor(rand() * kids.length)];
  const known = all.filter((w) =>
    level === 'easy'
      ? dict.tier(w) === 1 && knows(w)
      : level === 'medium'
        ? dict.tier(w) <= 2
        : true,
  );
  if (!known.length) return null;
  if (level !== 'hard') return known[Math.floor(rand() * known.length)];
  // hard: leave the opponent as few common answers as possible
  const used = new Set([...s.chain]);
  const replies = (w: string) =>
    dict.from(last(w)).filter((x) => x !== w && !used.has(x) && dict.tier(x) <= 2).length;
  let best: string[] = [];
  let bestN = Infinity;
  for (const w of known) {
    const n = replies(w);
    if (n < bestN) {
      bestN = n;
      best = [w];
    } else if (n === bestN) best.push(w);
  }
  return best[Math.floor(rand() * best.length)];
}
