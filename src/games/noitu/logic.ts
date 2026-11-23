/**
 * Nối từ (word chain) rules, pure and dictionary-agnostic.
 *
 * Players take turns saying a two-syllable Vietnamese word that starts with the last syllable
 * of the previous word: "học sinh" → "sinh viên" → "viên phấn" … Words cannot be repeated.
 * A player who cannot answer in time (or gives up) loses.
 *
 * Players only type the second syllable; tones may be left out ("vien" → "viên") when that
 * leaves a single dictionary word, otherwise they pick from the candidates.
 */

export type Side = 1 | 2;
export type Tier = 1 | 2 | 3;
export type Row = [word: string, gloss: string, tier: Tier];

export interface Dict {
  size: number;
  has(word: string): boolean;
  gloss(word: string): string;
  tier(word: string): Tier;
  /** all words starting with this syllable */
  from(syllable: string): readonly string[];
}

export const normalize = (s: string) =>
  s.normalize('NFC').toLowerCase().trim().replace(/\s+/g, ' ');

/** Removes tones and marks: "Viên" → "vien", "đường" → "duong". */
export const plain = (s: string) =>
  normalize(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

export const first = (w: string) => w.split(' ')[0];
export const last = (w: string) => w.split(' ').slice(-1)[0];

export function makeDict(rows: readonly Row[]): Dict {
  const info = new Map<string, { gloss: string; tier: Tier }>();
  const byFirst = new Map<string, string[]>();
  for (const [w, gloss, tier] of rows) {
    const word = normalize(w);
    if (word.split(' ').length !== 2 || info.has(word)) continue;
    info.set(word, { gloss, tier });
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
  | { ok: false; reason: 'empty' | 'chain' | 'used' | 'unknown' }
  | { ok: false; reason: 'choose'; candidates: string[] };

/** Words that can follow the chain now (not used yet). */
export function options(dict: Dict, chain: readonly string[]): string[] {
  const used = new Set(chain);
  return dict.from(last(chain[chain.length - 1])).filter((w) => !used.has(w));
}

/**
 * Checks what a player typed: just the second syllable ("viên") or the whole word
 * ("sinh viên"). Tones may be missing when that is unambiguous.
 */
export function check(dict: Dict, chain: readonly string[], input: string): Verdict {
  const s = normalize(input);
  if (!s) return { ok: false, reason: 'empty' };
  const prev = last(chain[chain.length - 1]);
  const parts = s.split(' ');
  if (parts.length > 2) return { ok: false, reason: 'unknown' };
  if (parts.length === 2 && plain(parts[0]) !== plain(prev)) return { ok: false, reason: 'chain' };
  const second = parts[parts.length - 1];
  const word = `${prev} ${second}`;
  if (chain.includes(word)) return { ok: false, reason: 'used' };
  if (dict.has(word)) return { ok: true, word };
  // no exact match: try ignoring tones
  const used = new Set(chain);
  const all = dict.from(prev).filter((w) => plain(last(w)) === plain(second));
  const fresh = all.filter((w) => !used.has(w));
  if (fresh.length === 1) return { ok: true, word: fresh[0] };
  if (fresh.length > 1) return { ok: false, reason: 'choose', candidates: fresh };
  if (all.length) return { ok: false, reason: 'used' };
  return { ok: false, reason: 'unknown' };
}

/** A friendly opening word: very common and easy to continue. */
export function startWord(dict: Dict, words: readonly string[], rand = Math.random): string {
  const good = words.filter(
    (w) => dict.tier(w) === 1 && options(dict, [w]).filter((x) => dict.tier(x) === 1).length >= 4,
  );
  const pool = good.length ? good : words;
  return pool[Math.floor(rand() * pool.length)];
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
