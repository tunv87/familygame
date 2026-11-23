/** Audio assets (qa/test-cases.md: AU-01). */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SOUND_EVENTS } from '../lib/sound';

const ROOT = join(__dirname, '../..');

describe('[AU-01] every game sound exists for both themes, is a small MP3, and is licensed', () => {
  for (const theme of ['classic', 'cute']) {
    it(theme, () => {
      for (const ev of SOUND_EVENTS) {
        const f = join(ROOT, 'public/sounds', theme, `${ev}.mp3`);
        expect(existsSync(f), `${theme}/${ev}.mp3 missing`).toBe(true);
        const head = readFileSync(f).subarray(0, 3);
        const isMp3 =
          head.toString('latin1') === 'ID3' || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0);
        expect(isMp3, `${theme}/${ev}.mp3 is not MP3`).toBe(true);
        expect(statSync(f).size, `${theme}/${ev}.mp3 too large`).toBeLessThan(50_000);
      }
    });
  }
  it('licence file names the source and CC0', () => {
    const lic = readFileSync(join(ROOT, 'public/sounds/LICENSE.txt'), 'utf8');
    expect(lic).toMatch(/CC0 1\.0/);
    expect(lic).toMatch(/uisfx/);
  });
  it('the PWA precaches the sounds for offline play', () => {
    const cfg = readFileSync(join(ROOT, 'vite.config.ts'), 'utf8');
    expect(cfg).toMatch(/\{js,css,html,svg,png,mp3\}/);
  });
});
