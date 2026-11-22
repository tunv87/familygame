/** Logic cases from qa/test-cases.md that are not covered by the per-module tests. */
import { beforeEach, describe, expect, it } from 'vitest';
import { chooseMove, type AiLevel } from '../games/caro/ai';
import { BIG, SMALL, type CaroConfig, type Stone } from '../games/caro/logic';
import { formatSeconds, getRecord, submitTime } from '../games/numbers/records';
import { en } from '../i18n/en';
import { vi } from '../i18n/vi';
import { createRng } from '../lib/rng';
import { load, save } from '../lib/storage';

describe('[LG-04] AI never picks an occupied cell', () => {
  const levels: AiLevel[] = ['easy', 'medium', 'hard'];
  const randomBoard = (cfg: CaroConfig, fill: number, rand: () => number): Stone[] => {
    const b: Stone[] = new Array(cfg.size * cfg.size).fill(0);
    const idx = b.map((_, i) => i).sort(() => rand() - 0.5);
    idx.slice(0, Math.floor(b.length * fill)).forEach((i, k) => (b[i] = k % 2 === 0 ? 1 : 2));
    return b;
  };
  for (const [name, cfg, runs] of [
    ['3×3', SMALL, 300],
    ['15×15', BIG, 200],
  ] as const) {
    it(`${name}: ${runs} random positions per level, including nearly full boards`, () => {
      const rand = createRng(2026);
      for (const level of levels) {
        for (let r = 0; r < runs; r++) {
          const fill = r % 5 === 0 ? 0.9 + rand() * 0.09 : rand() * 0.8;
          const b = randomBoard(cfg, fill, rand);
          if (b.every((s) => s !== 0)) continue;
          const me = (r % 2 ? 1 : 2) as 1 | 2;
          const m = chooseMove(b, cfg, me, level, rand);
          expect(Number.isInteger(m) && m >= 0 && m < b.length, `index ${m}`).toBe(true);
          expect(b[m], `${name} ${level} picked occupied cell ${m}`).toBe(0);
        }
      }
    });
  }
  it('a single empty cell is always chosen', () => {
    const b: Stone[] = [1, 2, 1, 2, 0, 1, 2, 1, 2];
    for (const level of levels) expect(chooseMove(b, SMALL, 1, level)).toBe(4);
  });
});

describe('[LG-08] practice records keep only the best time', () => {
  beforeEach(() => localStorage.clear());
  it('first time is a record, slower is not, faster is', () => {
    expect(getRecord('easy')).toBeUndefined();
    expect(submitTime('easy', 20_000)).toBe(true);
    expect(submitTime('easy', 25_000)).toBe(false);
    expect(getRecord('easy')).toBe(20_000);
    expect(submitTime('easy', 18_500)).toBe(true);
    expect(getRecord('easy')).toBe(18_500);
    expect(getRecord('hard')).toBeUndefined();
    expect(formatSeconds(18_500)).toBe('18.5');
  });
});

describe('[LG-09] translations use the same placeholders', () => {
  const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  it('every key has the same {variables} in Vietnamese and English', () => {
    const bad = (Object.keys(vi) as (keyof typeof vi)[]).filter(
      (k) => JSON.stringify(vars(vi[k])) !== JSON.stringify(vars(en[k])),
    );
    expect(bad).toEqual([]);
  });
  it('no empty translations', () => {
    expect(Object.entries(en).filter(([, v]) => !v.trim())).toEqual([]);
  });
});

describe('[LG-10] saved data with missing or wrong fields falls back to defaults', () => {
  beforeEach(() => localStorage.clear());
  it('fills in missing fields', () => {
    localStorage.setItem('fg:test', JSON.stringify({ a: 2 }));
    expect(load('test', { a: 1, b: 'x' })).toEqual({ a: 2, b: 'x' });
  });
  it('ignores invalid JSON and non-object values', () => {
    for (const raw of ['not json', 'null', '[]', '"text"', '42']) {
      localStorage.setItem('fg:test', raw);
      expect(load('test', { a: 1 }), raw).toEqual({ a: 1 });
    }
  });
  it('round-trips through save', () => {
    save('test', { a: 3 });
    expect(load('test', { a: 1 })).toEqual({ a: 3 });
  });
});

describe('[LG-10] corrupt settings, profile and records are cleaned', () => {
  it('settings with unknown values fall back to valid ones', async () => {
    const { cleanSettings, cleanProfile } = await import('../app/settings');
    const s = cleanSettings({ theme: 'neon', lang: 'fr', sound: 'yes', bigText: 7 } as never);
    expect(['vi', 'en']).toContain(s.lang);
    expect(s).toMatchObject({ theme: 'classic', sound: true, bigText: false });
    expect(cleanProfile({ name: 12345, avatar: null } as never).name).toBe('');
    expect(cleanProfile({ name: 'x'.repeat(40), avatar: '🐶' }).name).toHaveLength(20);
  });
  it('a corrupt record is ignored and replaced by the next real time', () => {
    localStorage.setItem('fg:numbers-records', '{"easy":"fast","hard":-5}');
    expect(getRecord('easy')).toBeUndefined();
    expect(getRecord('hard')).toBeUndefined();
    expect(submitTime('easy', 30_000)).toBe(true);
    expect(getRecord('easy')).toBe(30_000);
  });
  it('an unknown level becomes easy', async () => {
    const { asLevel, makeLayout } = await import('../games/numbers/logic');
    expect(asLevel('impossible')).toBe('easy');
    expect(asLevel(undefined)).toBe('easy');
    expect(makeLayout('bogus' as never, 1).tiles).toHaveLength(30);
  });
});
