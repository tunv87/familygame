/**
 * Nối từ (word chain) rules, pure and dictionary-agnostic.
 *
 * Players take turns saying a two-syllable Vietnamese word that starts with the last syllable
 * of the previous word: "học sinh" → "sinh viên" → "viên phấn" … Words cannot be repeated.
 * A player who cannot answer in time (or gives up) loses.
 *
 * Players only type the second syllable, with its tone marks ("viên", not "vien").
 *
 * Tiers: 0 = words for children (hand-picked), 1 = very common, 2 = common, 3 = rare.
 */

export type Side = 1 | 2;
export type Tier = 0 | 1 | 2 | 3;
/** `viGloss` = 1: the meaning is in Vietnamese (word from the Vietnamese Wiktionary). */
export type Row = [word: string, gloss: string, tier: Tier, viGloss?: 1];

export interface Dict {
  size: number;
  has(word: string): boolean;
  gloss(word: string): string;
  tier(word: string): Tier;
  /** the meaning is in Vietnamese; such words are only accepted from players, never offered */
  viGloss(word: string): boolean;
  /** all words starting with this syllable */
  from(syllable: string): readonly string[];
}

const TONE = '[\u0300\u0301\u0303\u0309\u0323]';
const OLD_OA = new RegExp(`o(${TONE})([ae])(?=\\s|$)`, 'g');
const OLD_UY = new RegExp(`u(${TONE})y(?=\\s|$)`, 'g');

/**
 * Lower case, single spaces, and one spelling for the two accepted tone placements:
 * "hòa" / "hoà", "thủy" / "thuỷ" are the same word (both are correct Vietnamese).
 */
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(OLD_OA, 'o$2$1')
    .replace(OLD_UY, 'uy$1')
    .normalize('NFC');

/** Removes tones and marks: "Viên" → "vien", "đường" → "duong". */
export const plain = (s: string) =>
  normalize(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

export const first = (w: string) => w.split(' ')[0];
export const last = (w: string) => w.split(' ').slice(-1)[0];

export function makeDict(rows: readonly Row[]): Dict {
  const info = new Map<string, { gloss: string; tier: Tier; vi: boolean }>();
  const byFirst = new Map<string, string[]>();
  for (const [w, gloss, tier, vi] of rows) {
    const word = normalize(w);
    if (word.split(' ').length !== 2) continue;
    const seen = info.get(word);
    if (seen) {
      // the same word in the other tone placement: keep the more common tier
      if (tier < seen.tier) seen.tier = tier;
      continue;
    }
    info.set(word, { gloss, tier, vi: vi === 1 });
    const f = first(word);
    const list = byFirst.get(f);
    if (list) list.push(word);
    else byFirst.set(f, [word]);
  }
  return {
    size: info.size,
    has: (w) => info.has(normalize(w)),
    gloss: (w) => info.get(normalize(w))?.gloss ?? '',
    tier: (w) => info.get(normalize(w))?.tier ?? 3,
    viGloss: (w) => info.get(normalize(w))?.vi ?? false,
    from: (s) => byFirst.get(normalize(s)) ?? [],
  };
}

export interface NoiTuState {
  /** words said so far, the first one chosen by the game */
  chain: string[];
  /** who must answer now */
  turn: Side;
  winner: Side | null;
  /** why the loser lost */
  reason?: 'timeout' | 'giveup';
}

export type Verdict =
  | { ok: true; word: string }
  | { ok: false; reason: 'empty' | 'chain' | 'used' | 'unknown' | 'tones' };

/** Words that can follow the chain now (not used yet). */
export function options(dict: Dict, chain: readonly string[]): string[] {
  const used = new Set(chain);
  return dict.from(last(chain[chain.length - 1])).filter((w) => !used.has(w));
}

/**
 * Checks what a player typed: just the second syllable ("viên") or the whole word
 * ("sinh viên"). It must be written correctly, with its tone marks.
 */
export function check(dict: Dict, chain: readonly string[], input: string): Verdict {
  const s = normalize(input);
  if (!s) return { ok: false, reason: 'empty' };
  const prev = last(chain[chain.length - 1]);
  const parts = s.split(' ');
  if (parts.length > 2) return { ok: false, reason: 'unknown' };
  if (parts.length === 2 && parts[0] !== prev) return { ok: false, reason: 'chain' };
  const second = parts[parts.length - 1];
  const word = `${prev} ${second}`;
  if (chain.includes(word)) return { ok: false, reason: 'used' };
  if (dict.has(word)) return { ok: true, word };
  // a real word with the tone marks missing or wrong: tell them, but don't give it away
  if (dict.from(prev).some((w) => plain(last(w)) === plain(second)))
    return { ok: false, reason: 'tones' };
  return { ok: false, reason: 'unknown' };
}

/**
 * A friendly opening word that is easy to continue. For children: a children's word with at
 * least 3 children's words after it; otherwise a very common word with 4 common follow-ups.
 */
export function startWord(
  dict: Dict,
  words: readonly string[],
  rand = Math.random,
  kids = false,
): string {
  const max = kids ? 0 : 1;
  const need = kids ? 3 : 4;
  const good = words.filter(
    (w) =>
      dict.tier(w) <= max && options(dict, [w]).filter((x) => dict.tier(x) <= max).length >= need,
  );
  const pool = good.length ? good : words;
  return pool[Math.floor(rand() * pool.length)];
}

/** Words the game itself may say (hints, computer, openers): not the accept-only ones. */
export function offerable(dict: Dict, chain: readonly string[]): string[] {
  return options(dict, chain).filter((w) => !dict.viGloss(w));
}

/**
 * The easiest word that follows the chain now, or '': children's words first, and words that
 * can themselves be continued before dead ends (a hint should not make the next player lose).
 */
export function easiestOption(dict: Dict, chain: readonly string[], rand = Math.random): string {
  const opts = offerable(dict, chain);
  const open = opts.filter((w) => offerable(dict, [...chain, w]).length > 0);
  for (const pool0 of [open, opts])
    for (const max of [0, 1, 2, 3]) {
      const pool = pool0.filter((w) => dict.tier(w) <= max);
      if (pool.length) return pool[Math.floor(rand() * pool.length)];
    }
  return '';
}

export function initialState(start: string, turn: Side = 1): NoiTuState {
  return { chain: [start], turn, winner: null };
}

export const other = (s: Side): Side => (s === 1 ? 2 : 1);

/** Adds an already checked word and passes the turn. */
export function play(s: NoiTuState, word: string): NoiTuState {
  if (s.winner) return s;
  return { ...s, chain: [...s.chain, word], turn: other(s.turn) };
}

/** The player on turn ran out of time or gave up. */
export function lose(s: NoiTuState, reason: 'timeout' | 'giveup'): NoiTuState {
  if (s.winner) return s;
  return { ...s, winner: other(s.turn), reason };
}

/** Seconds per turn. */
export const TURN_SECONDS = 30;
