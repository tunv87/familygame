/**
 * Background music generated with Web Audio (no audio files, no licences): a plucked
 * đàn tranh-like melody (sometimes sliding into a note like a đàn bầu) or bells, a soft chord
 * pad, a bass line and light percussion (wood block, shaker, soft kick). Three songs; the melody
 * is re-composed every bar from each song's motifs (musicScore.ts) and the song changes every
 * couple of minutes. Off by default (Settings → Nhạc nền); pauses while the app is hidden.
 */
import { getSettings } from '../app/settings';
import { SONGS, composeBar, songsFor, type Note, type Song } from './musicScore';
import { audioContext } from './sound';

const BARS_PER_SONG = 48; // about 2–3 minutes, then the next song

let timer: number | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let nextTime = 0;
let step = 0; // eighth notes since the song started
let songs: Song[] = [];
let songIndex = 0;
let bar: Note[] = [];

const song = () => songs[songIndex % songs.length];

function env(g: GainNode, at: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
}

/** Plucked string: bright attack that mellows (filter closes) and dies away. */
function pluck(a: BaseAudioContext, freq: number, at: number, dur: number, slide: boolean) {
  const out = a.createGain();
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(freq * 6, at);
  lp.frequency.exponentialRampToValueAtTime(freq * 1.5, at + 0.4);
  lp.connect(out).connect(master!);
  env(out, at, 0.16, 0.005, Math.max(0.6, dur * 1.6));
  for (const [type, mult, vol] of [
    ['triangle', 1, 1],
    ['sawtooth', 1.002, 0.25],
  ] as const) {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    if (slide) {
      o.frequency.setValueAtTime(freq * mult * 0.944, at); // a semitone below
      o.frequency.exponentialRampToValueAtTime(freq * mult, at + 0.12);
    } else o.frequency.setValueAtTime(freq * mult, at);
    g.gain.value = vol;
    o.connect(g).connect(lp);
    o.start(at);
    o.stop(at + dur * 1.6 + 0.7);
  }
}

/** Soft bell: sine with a quiet overtone. */
function bell(a: BaseAudioContext, freq: number, at: number, dur: number) {
  for (const [mult, vol] of [
    [1, 0.12],
    [2.76, 0.025],
  ]) {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'sine';
    o.frequency.value = freq * mult;
    env(g, at, vol, 0.004, Math.max(0.4, dur));
    o.connect(g).connect(master!);
    o.start(at);
    o.stop(at + dur + 0.5);
  }
}

/** Warm chord pad for a whole bar. */
function pad(a: BaseAudioContext, tones: number[], at: number, len: number) {
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 900;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(0.045, at + len * 0.35);
  g.gain.linearRampToValueAtTime(0.0001, at + len + 0.3);
  lp.connect(g).connect(master!);
  for (const f of tones)
    for (const detune of [-6, 6]) {
      const o = a.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      o.detune.value = detune;
      o.connect(lp);
      o.start(at);
      o.stop(at + len + 0.4);
    }
}

function bass(a: BaseAudioContext, freq: number, at: number, dur: number) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  env(g, at, 0.14, 0.01, dur);
  o.connect(g).connect(master!);
  o.start(at);
  o.stop(at + dur + 0.1);
}

function noiseBuffer(a: BaseAudioContext) {
  if (noise && noise.sampleRate === a.sampleRate) return noise;
  noise = a.createBuffer(1, a.sampleRate * 0.2, a.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}

/** Wood block (mõ): short hollow knock. */
function mo(a: BaseAudioContext, at: number, vol = 0.12) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(950, at);
  o.frequency.exponentialRampToValueAtTime(700, at + 0.05);
  env(g, at, vol, 0.002, 0.08);
  o.connect(g).connect(master!);
  o.start(at);
  o.stop(at + 0.15);
}

function shaker(a: BaseAudioContext, at: number, vol: number) {
  const s = a.createBufferSource();
  s.buffer = noiseBuffer(a);
  const hp = a.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6000;
  const g = a.createGain();
  env(g, at, vol, 0.003, 0.05);
  s.connect(hp).connect(g).connect(master!);
  s.start(at);
  s.stop(at + 0.1);
}

function kick(a: BaseAudioContext, at: number) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(110, at);
  o.frequency.exponentialRampToValueAtTime(45, at + 0.15);
  env(g, at, 0.22, 0.003, 0.2);
  o.connect(g).connect(master!);
  o.start(at);
  o.stop(at + 0.3);
}

function playStep(a: BaseAudioContext, t: number, eighth: number) {
  const s = song();
  const inBar = step % 8;
  const barNo = Math.floor(step / 8);
  const c = s.chords[barNo % s.chords.length];
  if (inBar === 0) {
    bar = composeBar(s, Math.random);
    pad(a, c.tones, t, eighth * 8);
  }
  // bass: root on beat 1, fifth-ish (the chord's top tone, an octave down) on beat 3
  if (inBar === 0) bass(a, c.root, t, eighth * 3);
  if (inBar === 4) bass(a, c.tones[2] / 2, t, eighth * 3);
  for (const n of bar)
    if (n.at === inBar) {
      if (s.lead === 'bell') bell(a, n.freq, t, eighth * n.len);
      else pluck(a, n.freq, t, eighth * n.len, n.slide);
    }
  if (s.drums === 'mo') {
    if (inBar === 2 || inBar === 6) mo(a, t);
    if (inBar === 7 && barNo % 2 === 1) mo(a, t, 0.07);
  } else if (s.drums === 'bounce') {
    if (inBar === 0 || inBar === 4) kick(a, t);
    shaker(a, t, inBar % 2 ? 0.05 : 0.025);
  } else if (inBar === 0 && barNo % 2 === 0) mo(a, t, 0.06);
}

function schedule() {
  const a = audioContext();
  if (!a || !master) return;
  while (nextTime < a.currentTime + 0.4) {
    const eighth = 60 / song().bpm / 2;
    playStep(a, nextTime, eighth);
    nextTime += eighth;
    step++;
    if (step >= BARS_PER_SONG * 8) {
      step = 0;
      songIndex++;
    }
  }
}

/**
 * Renders `seconds` of a song into any audio context (used to make preview recordings with an
 * OfflineAudioContext; the app itself uses startMusic).
 */
export function renderPreview(
  a: BaseAudioContext,
  id: Song['id'],
  seconds: number,
  rand: () => number = Math.random,
) {
  const keep = { master, songs, songIndex, step, bar };
  master = a.createGain();
  master.gain.value = 0.55;
  master.connect(a.destination);
  songs = SONGS.filter((x) => x.id === id);
  songIndex = 0;
  step = 0;
  const realRandom = Math.random;
  Math.random = rand;
  try {
    let t = 0.05;
    while (t < seconds) {
      const eighth = 60 / song().bpm / 2;
      playStep(a, t, eighth);
      t += eighth;
      step++;
    }
  } finally {
    Math.random = realRandom;
    ({ master, songs, songIndex, step, bar } = keep);
  }
}

export function isMusicPlaying() {
  return timer !== null;
}
// for tests and the debug page
(window as unknown as { __fgMusic: () => boolean }).__fgMusic = isMusicPlaying;
(window as unknown as { __fgSong: () => string | null }).__fgSong = () =>
  timer !== null ? song().id : null;

export function startMusic() {
  if (timer !== null) return;
  const a = audioContext();
  if (!a) return;
  master = a.createGain();
  master.gain.value = 0.55;
  master.connect(a.destination);
  // a different first song each time, from the ones that suit the theme
  const list = songsFor(getSettings().theme);
  songs = list;
  songIndex = Math.floor(Math.random() * list.length);
  nextTime = a.currentTime + 0.1;
  step = 0;
  timer = window.setInterval(schedule, 100);
  schedule();
}

export function stopMusic() {
  if (timer === null) return;
  window.clearInterval(timer);
  timer = null;
  const m = master;
  const a = audioContext();
  if (m && a) {
    m.gain.setTargetAtTime(0.0001, a.currentTime, 0.15); // fade out
    setTimeout(() => m.disconnect(), 800);
  }
  master = null;
}
