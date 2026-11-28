import { getSettings } from '../app/settings';
import { createLogger } from './logger';
import { haptic } from './native';

const log = createLogger('sound');

/**
 * Game sound events played from CC0 audio files (public/sounds/<theme>/<event>.mp3,
 * see public/sounds/LICENSE.txt). Each theme has its own set. Small UI feedback
 * (tap, right/wrong number, opponent move) makes no sound, only vibration.
 */
export const SOUND_EVENTS = [
  'tick', // countdown 3-2-1
  'go', // countdown ends
  'win',
  'lose',
  'draw', // also "finished" in practice without a record
  'ganh', // Cờ gánh: one pair captured
  'ganhBig', // Cờ gánh: chầu 4 / chầu 6, or a surrounded group (vây)
  'forced', // Cờ gánh: the opponent "opened" — a capture is now compulsory
  'record', // new best time
] as const;
export type SoundEvent = (typeof SOUND_EVENTS)[number];

const VOLUME: Record<SoundEvent, number> = {
  tick: 0.6,
  go: 0.8,
  win: 0.9,
  lose: 0.7,
  draw: 0.8,
  ganh: 0.9,
  ganhBig: 1,
  forced: 0.8,
  record: 1,
};

let ctx: AudioContext | null = null;

/** The shared AudioContext (also used by background music), regardless of settings. */
export function audioContext(): AudioContext | null {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    // iOS Safari starts suspended until a user gesture.
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function effects(): AudioContext | null {
  return getSettings().sound ? audioContext() : null;
}

// ---------------------------------------------------------------------------
// File-based events

const buffers = new Map<string, AudioBuffer | 'loading' | 'failed'>();
const lastPlayed = new Map<SoundEvent, number>();

function url(theme: string, ev: SoundEvent) {
  return `${import.meta.env.BASE_URL}sounds/${theme}/${ev}.mp3`;
}

/** Fetches and decodes the current theme's sounds once (needs an AudioContext). */
export function preloadSounds() {
  const a = audioContext();
  if (!a) return;
  const theme = getSettings().theme;
  for (const ev of SOUND_EVENTS) {
    const key = `${theme}/${ev}`;
    if (buffers.has(key)) continue;
    buffers.set(key, 'loading');
    fetch(url(theme, ev))
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${r.status}`))))
      .then((data) => a.decodeAudioData(data))
      .then((buf) => buffers.set(key, buf))
      .catch((e) => {
        buffers.set(key, 'failed');
        log.warn('sound failed to load', { key, e: String(e) });
      });
  }
}

/** Synthesised stand-ins, used until a file has loaded (or if it cannot load). */
const FALLBACK: Record<SoundEvent, () => void> = {
  tick: () => tone(880, 0, 0.08, 'triangle', 0.08),
  go: () => tone(1320, 0, 0.2, 'triangle', 0.1),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25)),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.15, 0.3, 'triangle')),
  draw: () => [523, 659].forEach((f, i) => tone(f, i * 0.15, 0.3)),
  ganh: () => [660, 990].forEach((f, i) => tone(f, i * 0.08, 0.15)),
  ganhBig: () => [660, 880, 1100, 1320].forEach((f, i) => tone(f, i * 0.07, 0.18)),
  forced: () => [440, 440].forEach((f, i) => tone(f, i * 0.18, 0.12, 'square', 0.05)),
  record: () => [523, 784, 1047, 1568].forEach((f, i) => tone(f, i * 0.1, 0.3)),
};

/** Recent plays, for tests and the debug page. */
const played: string[] = [];
(window as unknown as { __fgSounds: string[] }).__fgSounds = played;
const remember = (name: string) => {
  played.push(name);
  if (played.length > 50) played.shift();
};

export function playSound(ev: SoundEvent) {
  const a = effects();
  if (!a) return;
  const now = performance.now();
  if (now - (lastPlayed.get(ev) ?? -1e9) < 40) return; // avoid stacking on rapid taps
  lastPlayed.set(ev, now);
  remember(ev);
  const buf = buffers.get(`${getSettings().theme}/${ev}`);
  if (!(buf instanceof AudioBuffer)) {
    preloadSounds();
    FALLBACK[ev]();
    return;
  }
  const src = a.createBufferSource();
  const gain = a.createGain();
  src.buffer = buf;
  gain.gain.value = VOLUME[ev];
  src.connect(gain).connect(a.destination);
  src.start();
}

// ---------------------------------------------------------------------------
// Synthesised fallbacks

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.15) {
  const a = effects();
  if (!a) return;
  const t0 = a.currentTime + start;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur);
}

// ---------------------------------------------------------------------------
// Cờ cá ngựa: dice and hooves, synthesised (no files needed)

/** A short burst of filtered noise: a die hitting the table, or a hoof. */
function knock(start: number, dur: number, freq: number, vol: number, q = 1) {
  const a = effects();
  if (!a) return;
  const t0 = a.currentTime + start;
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = a.createBufferSource();
  src.buffer = buf;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = a.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(a.destination);
  src.start(t0);
}

/** Two dice rattling in a cup and landing (about half a second). */
function diceRoll() {
  if (!effects()) return;
  remember('dice');
  // rattles get slower, like dice settling down
  let t = 0;
  for (let i = 0; i < 9; i++) {
    knock(t, 0.03, 2200 + Math.random() * 1800, 0.35, 2);
    t += 0.025 + i * 0.006;
  }
  // the two dice land
  knock(t + 0.02, 0.06, 900, 0.7, 1.5);
  knock(t + 0.09, 0.05, 1100, 0.55, 1.5);
}

/** A horse trots one square per hoofbeat (at most 6 beats). */
function hooves(steps: number) {
  if (!effects()) return;
  remember('hooves');
  const n = Math.max(1, Math.min(6, steps));
  for (let i = 0; i < n; i++) {
    const t = i * 0.12;
    knock(t, 0.04, 650, 0.6, 3);
    knock(t + 0.045, 0.035, 900, 0.4, 3);
  }
}

/** Lucky roll (1-1, 1-6, 6-1, 6-6): roll again. */
function lucky() {
  if (!effects()) return;
  remember('lucky');
  [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.06, 0.18, 'triangle', 0.09));
}

/** Vibration has its own switch in Settings. */
function buzz(kind: keyof typeof haptic) {
  if (getSettings().vibrate) haptic[kind]();
}

// Small UI feedback (tap, right/wrong number, opponent move) is intentionally silent:
// only vibration, which has its own switch. Sound is kept for the game events above.
export const sfx = {
  tap: () => buzz('tap'),
  good: () => buzz('tap'),
  bad: () => buzz('wrong'),
  opponent: () => {},
  win: () => {
    playSound('win');
    buzz('win');
  },
  lose: () => playSound('lose'),
  draw: () => playSound('draw'),
  record: () => {
    playSound('record');
    buzz('win');
  },
  ganh: (big = false) => {
    playSound(big ? 'ganhBig' : 'ganh');
    buzz(big ? 'win' : 'tap');
  },
  forced: () => {
    playSound('forced');
    buzz('wrong');
  },
  /** Cờ cá ngựa */
  dice: () => {
    diceRoll();
    buzz('tap');
  },
  hooves: (steps: number) => hooves(steps),
  lucky: () => lucky(),
  tick: () => playSound('tick'),
  go: () => playSound('go'),
  /** Call from a user gesture: unlocks audio on iOS and starts loading the sounds. */
  unlock: () => {
    // Do not even create an audio context when both sound and music are off.
    const { sound, music } = getSettings();
    if (!sound && !music) return;
    if (audioContext() && sound) preloadSounds();
  },
};
