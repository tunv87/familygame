import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chooseNoiTuWord } from './ai';
import {
  check,
  easiestOption,
  initialState,
  lose,
  makeDict,
  normalize,
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

  it('needs the tone marks: a tone-less word is refused without giving it away', () => {
    expect(check(dict, ['học sinh'], 'vien')).toEqual({ ok: false, reason: 'tones' });
    expect(check(dict, ['học sinh'], 'sinh nhat')).toEqual({ ok: false, reason: 'tones' });
    expect(check(dict, ['mèo con'], 'ma')).toEqual({ ok: true, word: 'con ma' });
    expect(check(dict, ['mèo con'], 'má')).toEqual({ ok: true, word: 'con má' });
    expect(check(dict, ['mèo con'], 'mà')).toEqual({ ok: false, reason: 'tones' });
    expect(check(dict, ['mèo con'], 'MÈO ')).toEqual({ ok: true, word: 'con mèo' });
    expect(check(dict, ['học sinh'], 'sinh vien')).toEqual({ ok: false, reason: 'tones' });
    expect(check(dict, ['học sinh'], 'sính viên')).toEqual({ ok: false, reason: 'chain' });
  });

  it('both tone placements are the same word: "hoà" = "hòa", "thuỷ" = "thủy"', () => {
    const d = makeDict([
      ['hoà bình', 'peace', 1],
      ['hòa bình', 'peace', 2],
      ['bình thủy', 'thermos', 1],
      ['an hòa', 'harmony', 2],
    ]);
    expect(d.size).toBe(3); // the duplicate spelling is merged
    expect(d.tier('hòa bình')).toBe(1);
    expect(check(d, ['an hoà'], 'bình')).toEqual({ ok: true, word: 'hoà bình' });
    expect(check(d, ['hòa bình'], 'thuỷ')).toEqual({ ok: true, word: 'bình thuỷ' });
    expect(check(d, ['hoà bình'], 'thủy')).toEqual({ ok: true, word: 'bình thuỷ' });
    // decomposed input (some keyboards) is the same text
    expect(check(d, ['hoà bình'], 'thủy'.normalize('NFD'))).toEqual({
      ok: true,
      word: 'bình thuỷ',
    });
    // "hoàng", "thuyền": the tone is not syllable-final, nothing to move
    expect(normalize('Hoàng Thuyền')).toBe('hoàng thuyền');
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

describe("[LG-25] Nối từ children's words", () => {
  const kd = makeDict([
    ['con mèo', 'cat', 0],
    ['mèo con', 'kitten', 0],
    ['mèo mướp', 'tabby cat', 1],
    ['mèo rừng', 'wild cat', 2],
    ['con gà', 'chicken', 0],
    ['con người', 'human', 1],
    ['gà con', 'chick', 0],
    ['con chó', 'dog', 0],
  ]);
  it("the easy computer and hints use children's words first", () => {
    for (let i = 0; i < 20; i++) {
      expect(chooseNoiTuWord(kd, initialState('con mèo'), 'easy', Math.random)).toBe('mèo con');
      expect(easiestOption(kd, ['con mèo'])).toBe('mèo con');
      expect(['con gà', 'con chó']).toContain(easiestOption(kd, ['gà con', 'con mèo', 'mèo con']));
    }
    expect(easiestOption(kd, ['x mướp'])).toBe('');
  });
  it("children's games open with a children's word that is easy to continue", () => {
    // "gà con" → con mèo, con gà, con chó (3 children's words)
    expect(startWord(kd, ['mèo rừng', 'gà con', 'con người'], () => 0, true)).toBe('gà con');
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
      expect([0, 1, 2, 3]).toContain(t);
    }
  });
  it('has the everyday words children say and none of the blocked ones', () => {
    for (const w of ['con mèo', 'mèo con', 'học sinh', 'sinh viên', 'bánh chưng', 'áo dài'])
      expect(real.has(w), w).toBe(true);
    for (const w of ['gái điếm', 'bỏ mẹ', 'đồ chó']) expect(real.has(w), w).toBe(false);
    const bad = /(^| )(đụ|địt|lồn|cặc|buồi|đéo|đĩ|điếm)( |$)/;
    expect(rows.filter(([w]) => bad.test(w))).toEqual([]);
  });
  it("has a hand-picked list of children's words that can open a game", () => {
    const kids = rows.filter(([, , t]) => t === 0).map(([w]) => w);
    expect(kids.length).toBeGreaterThan(800);
    for (const w of ['con mèo', 'bà nội', 'quả táo', 'đi học', 'cầu vồng'])
      expect(kids).toContain(w);
    for (const w of ['sĩ phu', 'nạn nhân']) expect(kids).not.toContain(w);
    const openers = kids.filter(
      (w) => options(real, [w]).filter((x) => real.tier(x) === 0).length >= 3,
    );
    expect(openers.length).toBeGreaterThan(100);
  });
  it('most common words can be continued', () => {
    const common = rows.filter(([, , t]) => t === 1).map(([w]) => w);
    const open = common.filter((w) => options(real, [w]).length > 0);
    expect(open.length / common.length).toBeGreaterThan(0.8);
  });
});
