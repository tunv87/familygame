import { describe, expect, it } from 'vitest';
import { SONGS, composeBar, songsFor } from './musicScore';

const seeded = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

describe('[AU-10] generated background music', () => {
  it('three songs with different tempos, each with four chords and several motifs', () => {
    expect(SONGS).toHaveLength(3);
    expect(new Set(SONGS.map((s) => s.bpm)).size).toBe(3);
    for (const s of SONGS) {
      expect(s.chords).toHaveLength(4);
      expect(s.motifs.length).toBeGreaterThanOrEqual(4);
      expect(s.scale).toHaveLength(10); // pentatonic, two octaves
    }
  });

  it('every composed bar stays in the scale and inside the bar', () => {
    for (const s of SONGS) {
      const rand = seeded(7);
      let notes = 0;
      for (let b = 0; b < 200; b++) {
        const bar = composeBar(s, rand);
        for (const n of bar) {
          expect(s.scale).toContain(n.freq);
          expect(n.at).toBeGreaterThanOrEqual(0);
          expect(n.at + n.len).toBeLessThanOrEqual(8);
        }
        notes += bar.length;
      }
      expect(notes / 200, `${s.id}: bars should not be empty`).toBeGreaterThan(2);
    }
  });

  it('the melody keeps changing (not the same bar over and over)', () => {
    const rand = seeded(3);
    const bars = new Set(
      Array.from({ length: 40 }, () => JSON.stringify(composeBar(SONGS[0], rand))),
    );
    expect(bars.size).toBeGreaterThan(15);
  });

  it('the cute theme starts with the bouncy song more often', () => {
    const cute = songsFor('cute').map((s) => s.id);
    expect(cute.filter((id) => id === 'vuichoi').length).toBeGreaterThan(1);
    expect(new Set(songsFor('classic').map((s) => s.id)).size).toBe(3);
  });
});
