import { getSettings } from '../app/settings';
import { haptic } from './native';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (!getSettings().sound) return null;
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

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.15) {
  const a = audio();
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

/** Haptics follow the sound setting (one switch: "Âm thanh & rung"). */
function buzz(kind: keyof typeof haptic) {
  if (getSettings().sound) haptic[kind]();
}

export const sfx = {
  tap: () => {
    tone(660, 0, 0.08, 'triangle', 0.08);
    buzz('tap');
  },
  good: () => {
    tone(880, 0, 0.12);
    tone(1320, 0.06, 0.15);
    buzz('tap');
  },
  bad: () => {
    tone(200, 0, 0.18, 'square', 0.06);
    buzz('wrong');
  },
  opponent: () => tone(440, 0, 0.1, 'triangle', 0.08),
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25));
    buzz('win');
  },
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.15, 0.3, 'triangle')),
  /** Call from a user gesture to unlock audio on iOS. */
  unlock: () => void audio(),
};
