/**
 * The "composer" for the background music: pure functions, no audio, so they can be tested.
 * Each song has a tempo, a scale, a chord progression and melody motifs; every bar the melody
 * is re-composed from the motifs, so the music keeps changing without audio files.
 */

export interface Song {
  id: 'langque' | 'vuichoi' | 'thongtha';
  bpm: number;
  /** Hz of the scale degrees, low to high (pentatonic, two octaves) */
  scale: number[];
  /** one chord per bar: root Hz and chord tones (Hz) for the pad */
  chords: { root: number; tones: number[] }[];
  /** melody motifs over 8 eighth notes: scale indexes, -1 = rest */
  motifs: number[][];
  drums: 'mo' | 'bounce' | 'soft';
  /** chance that a melody note slides into place like a đàn bầu */
  slide: number;
  /** melody instrument */
  lead: 'pluck' | 'bell';
}

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const scaleOf = (rootMidi: number, steps: number[]) =>
  [0, 12].flatMap((oct) => steps.map((s) => hz(rootMidi + oct + s)));
const chord = (rootMidi: number, intervals: number[]) => ({
  root: hz(rootMidi - 12),
  tones: intervals.map((i) => hz(rootMidi + i)),
});
const MAJOR_PENTA = [0, 2, 4, 7, 9];
const MINOR_PENTA = [0, 3, 5, 7, 10];
const MAJ = [0, 4, 7];
const MIN = [0, 3, 7];

export const SONGS: Song[] = [
  {
    // countryside: calm pentatonic tune on a plucked zither, wood block on the off-beats
    id: 'langque',
    bpm: 84,
    scale: scaleOf(72, MAJOR_PENTA), // C5 pentatonic
    chords: [chord(60, MAJ), chord(57, MIN), chord(53, MAJ), chord(55, MAJ)], // C Am F G
    motifs: [
      [4, -1, 3, 2, 1, -1, 2, -1],
      [2, 3, 4, -1, 5, -1, 4, -1],
      [5, -1, 4, 3, 2, -1, -1, -1],
      [0, 1, 2, -1, 4, 3, 2, -1],
      [7, -1, 6, 5, 4, -1, 2, -1],
      [3, -1, 2, -1, 1, 0, -1, -1],
    ],
    drums: 'mo',
    slide: 0.25,
    lead: 'pluck',
  },
  {
    // playtime: bright and bouncy, bells, shaker and soft kick
    id: 'vuichoi',
    bpm: 112,
    scale: scaleOf(79, MAJOR_PENTA), // G5 pentatonic
    chords: [chord(67, MAJ), chord(64, MIN), chord(60, MAJ), chord(62, MAJ)], // G Em C D
    motifs: [
      [0, 2, 4, 2, 5, 4, 2, -1],
      [4, -1, 4, 5, 7, -1, 5, 4],
      [2, 1, 0, -1, 2, 4, -1, -1],
      [5, 4, 2, 4, 5, -1, 7, -1],
      [7, 5, 4, 2, 4, -1, 0, -1],
    ],
    drums: 'bounce',
    slide: 0,
    lead: 'bell',
  },
  {
    // easy-going: slow, sparse, warm pads, for thinking over a board game
    id: 'thongtha',
    bpm: 68,
    scale: scaleOf(69, MINOR_PENTA), // A4 minor pentatonic
    chords: [chord(57, MIN), chord(53, MAJ), chord(60, MAJ), chord(55, MAJ)], // Am F C G
    motifs: [
      [4, -1, -1, 3, 2, -1, -1, -1],
      [2, -1, 3, -1, 4, -1, -1, -1],
      [7, -1, -1, 5, 4, -1, 3, -1],
      [0, -1, 2, -1, -1, -1, 1, -1],
    ],
    drums: 'soft',
    slide: 0.35,
    lead: 'pluck',
  },
];

/** The songs a theme starts with (the cute theme prefers the bouncy one). */
export function songsFor(theme: 'classic' | 'cute'): Song[] {
  const [langque, vuichoi, thongtha] = SONGS;
  return theme === 'cute' ? [vuichoi, langque, vuichoi, thongtha] : [langque, thongtha, vuichoi];
}

export interface Note {
  /** eighth-note position in the bar, 0..7 */
  at: number;
  freq: number;
  /** length in eighth notes */
  len: number;
  /** slide up into the note (đàn bầu) */
  slide: boolean;
}

/**
 * Composes one bar of melody: a motif, sometimes moved up or down a step of the scale, with a
 * few notes left out or added, so the tune varies but stays in the scale.
 */
export function composeBar(song: Song, rand: () => number): Note[] {
  const motif = song.motifs[Math.floor(rand() * song.motifs.length)];
  const shift = rand() < 0.3 ? (rand() < 0.5 ? -1 : 1) : 0;
  const top = song.scale.length - 1;
  const notes: Note[] = [];
  motif.forEach((deg, at) => {
    if (deg < 0) {
      // now and then fill a rest with a neighbour note
      if (rand() < 0.1 && notes.length) {
        const prev = notes[notes.length - 1];
        const i = song.scale.indexOf(prev.freq);
        notes.push({ at, freq: song.scale[Math.min(top, i + 1)], len: 1, slide: false });
      }
      return;
    }
    if (rand() < 0.12) return; // breathe: leave a note out
    const i = Math.max(0, Math.min(top, deg + shift));
    // a note lasts until the next one (at most a half bar)
    let len = 1;
    while (at + len < 8 && motif[at + len] < 0 && len < 4) len++;
    notes.push({ at, freq: song.scale[i], len, slide: rand() < song.slide });
  });
  return notes;
}
