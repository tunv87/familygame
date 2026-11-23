/**
 * Quiet background music generated with Web Audio: a slow pentatonic melody over
 * a soft bass, so there are no audio files or licences involved. Off by default
 * (Settings → Nhạc nền); pauses while the app is in the background.
 */
import { audioContext } from './sound';

const BPM = 88;
const STEP = 60 / BPM / 2; // eighth notes
// C major pentatonic, two octaves (Hz)
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];
// Phrases as scale indexes (-1 = rest); chosen to stay calm and never clash.
const PHRASES = [
  [4, -1, 5, 4, 2, -1, 3, -1, 2, -1, 1, 2, 0, -1, -1, -1],
  [2, 3, 4, -1, 5, -1, 4, 3, 2, -1, 3, -1, 4, -1, -1, -1],
  [5, -1, 7, 6, 5, -1, 4, -1, 3, 4, 5, -1, 2, -1, -1, -1],
  [0, 2, 4, -1, 3, -1, 2, -1, 1, -1, 2, 1, 0, -1, -1, -1],
];
const BASS = [130.81, 98.0, 110.0, 87.31]; // C3 G2 A2 F2, one per phrase

let timer: number | null = null;
let master: GainNode | null = null;
let nextTime = 0;
let step = 0;

function note(
  a: AudioContext,
  freq: number,
  at: number,
  dur: number,
  vol: number,
  type: OscillatorType,
) {
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(master!);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

function schedule() {
  const a = audioContext();
  if (!a || !master) return;
  while (nextTime < a.currentTime + 0.4) {
    const phrase = Math.floor(step / 16) % PHRASES.length;
    const i = PHRASES[phrase][step % 16];
    if (i >= 0) note(a, SCALE[i], nextTime, STEP * 1.8, 0.07, 'sine');
    if (step % 8 === 0) note(a, BASS[phrase], nextTime, STEP * 7, 0.05, 'triangle');
    nextTime += STEP;
    step++;
  }
}

export function isMusicPlaying() {
  return timer !== null;
}
// for tests and the debug page
(window as unknown as { __fgMusic: () => boolean }).__fgMusic = isMusicPlaying;

export function startMusic() {
  if (timer !== null) return;
  const a = audioContext();
  if (!a) return;
  master = a.createGain();
  master.gain.value = 0.6;
  master.connect(a.destination);
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
