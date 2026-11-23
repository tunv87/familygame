import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chooseNoiTuWord } from './ai';
import {
  check,
  initialState,
  lose,
  makeDict,
  options,
  plain,
  play,
  startWord,
  type Row,
} from './logic';

const ROWS: Row[] = [
  ['học sinh', 'pupil', 1],
  ['sinh viên', 'student', 1],
  ['sinh nhật', 'birthday', 1],
  ['viên phấn', 'piece of chalk', 1],
  ['viên chức', 'civil servant', 2],
  ['phấn khởi', 'excited', 1],
  ['con ma', 'ghost', 1],
  ['con má', 'cheek', 3],
  ['con mèo', 'cat', 1],
  ['mèo con', 'kitten', 1],
  ['ma quỷ', 'demons', 2],
  ['quỷ con', 'little devil', 2],
  ['nhật ký', 'diary', 1],
  ['ký ức', 'memory', 1],
];
const dict = makeDict(ROWS);

describe('[LG-21] Nối từ rules', () => {
  it('builds the dictionary and finds continuations', () => {
    expect(dict.size).toBe(ROWS.length);
    expect(dict.has('Học  Sinh')).toBe(true);
    expect(dict.from('sinh')).toEqual(['sinh viên', 'sinh nhật']);
    expect(plain('Đường Viên')).toBe('duong vien');
  });

  it('accepts the second syllable alone or the whole word', () => {
    expect(check(dict, ['học sinh'], 'viên')).toEqual({ ok: true, word: 'sinh viên' });
    expect(check(dict, ['học sinh'], 'sinh viên')).toEqual({ ok: true, word: 'sinh viên' });
    expect(check(dict, ['học sinh'], '  Viên ')).toEqual({ ok: true, word: 'sinh viên' });
  });

  it('accepts words typed without tones when only one word fits', () => {
    expect(check(dict, ['học sinh'], 'vien')).toEqual({ ok: true, word: 'sinh viên' });
    expect(check(dict, ['học sinh'], 'sinh nhat')).toEqual({ ok: true, word: 'sinh nhật' });
  });

  it('asks the player to choose when tones are needed to tell words apart', () => {
    expect(check(dict, ['mèo con'], 'ma')).toEqual({ ok: true, word: 'con ma' }); // exact
    expect(check(dict, ['mèo con'], 'MA ')).toEqual({ ok: true, word: 'con ma' });
    const v = check(dict, ['ma quỷ', 'quỷ con'], 'meo'); // tones left out
    expect(v).toEqual({ ok: true, word: 'con mèo' });
    const amb = check(dict, ['mèo con'], 'mà');
    expect(amb).toEqual({ ok: false, reason: 'choose', candidates: ['con ma', 'con má'] });
  });

  it('refuses words that break the chain, repeat, or are not in the dictionary', () => {
    expect(check(dict, ['học sinh'], '')).toEqual({ ok: false, reason: 'empty' });
    expect(check(dict, ['học sinh'], 'con mèo')).toEqual({ ok: false, reason: 'chain' });
    expect(check(dict, ['học sinh', 'sinh viên', 'viên phấn'], 'xyz')).toEqual({
      ok: false,
      reason: 'unknown',
    });
    expect(check(dict, ['sinh viên', 'viên chức', 'x sinh'], 'viên')).toEqual({
      ok: false,
      reason: 'used',
    });
    expect(check(dict, ['a b c'], 'x')).toEqual({ ok: false, reason: 'unknown' });
    expect(check(dict, ['học sinh'], 'a b c')).toEqual({ ok: false, reason: 'unknown' });
  });

  it('turns alternate; running out of time or giving up loses', () => {
    let s = initialState('học sinh');
    expect(s.turn).toBe(1);
    s = play(s, 'sinh viên');
    expect(s.turn).toBe(2);
    expect(s.chain).toEqual(['học sinh', 'sinh viên']);
    const t = lose(s, 'timeout');
    expect(t.winner).toBe(1);
    expect(t.reason).toBe('timeout');
    expect(play(t, 'viên phấn')).toBe(t); // game over
    expect(lose(play(s, 'viên phấn'), 'giveup').winner).toBe(2);
  });

  it('options exclude used words; the opening word is easy to continue', () => {
    expect(options(dict, ['học sinh', 'sinh nhật', 'x sinh'])).toEqual(['sinh viên']);
    const words = ROWS.map((r) => r[0]);
    expect(startWord(dict, words, () => 0)).toBe(words[0]);
  });
});

describe('[LG-22] Nối từ computer', () => {
  it('only plays legal words and gives up when it knows none', () => {
    const s = initialState('học sinh');
    for (const lv of ['easy', 'medium', 'hard'] as const) {
      const w = chooseNoiTuWord(dict, s, lv, () => 0.5);
      if (w) expect(check(dict, s.chain, w).ok).toBe(true);
    }
    expect(chooseNoiTuWord(dict, initialState('ký ức'), 'hard')).toBeNull();
  });

  it('medium never uses rare words; hard leaves the fewest answers', () => {
    const s = initialState('học sinh', 2);
    // sinh nhật → nhật ký (1 reply) vs sinh viên → viên phấn, viên chức (2 replies)
    expect(chooseNoiTuWord(dict, s, 'hard', () => 0)).toBe('sinh nhật');
    const m = initialState('mèo con');
    for (let i = 0; i < 20; i++)
      expect(chooseNoiTuWord(dict, m, 'medium', Math.random)).not.toBe('con má');
  });
});

describe('[LG-23] Nối từ word list', () => {
  const rows = (JSON.parse(readFileSync('src/games/noitu/words.json', 'utf8')) as { w: Row[] }).w;
  const real = makeDict(rows);
  it('is big enough, two syllables, with an English gloss each', () => {
    expect(real.size).toBeGreaterThan(15000);
    for (const [w, g, t] of rows) {
      expect(w.split(' ')).toHaveLength(2);
      expect(g.length).toBeGreaterThan(0);
      expect([1, 2, 3]).toContain(t);
    }
  });
  it('has the everyday words children say and none of the blocked ones', () => {
    for (const w of ['con mèo', 'mèo con', 'học sinh', 'sinh viên', 'bánh chưng', 'áo dài'])
      expect(real.has(w), w).toBe(true);
    for (const w of ['gái điếm', 'bỏ mẹ', 'đồ chó']) expect(real.has(w), w).toBe(false);
    const bad = /(^| )(đụ|địt|lồn|cặc|buồi|đéo|đĩ|điếm)( |$)/;
    expect(rows.filter(([w]) => bad.test(w))).toEqual([]);
  });
  it('most common words can be continued', () => {
    const common = rows.filter(([, , t]) => t === 1).map(([w]) => w);
    const open = common.filter((w) => options(real, [w]).length > 0);
    expect(open.length / common.length).toBeGreaterThan(0.8);
  });
});
