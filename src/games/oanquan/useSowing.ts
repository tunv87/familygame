/**
 * Replays an Ô ăn quan move step by step: the hand picks up the stones, drops one per cell,
 * picks up again, captures. The board shows these frames instead of the final state until
 * the replay ends (or the player taps to skip it).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { OAQState, Side, Step } from './logic';

export interface SowFrame {
  board: number[];
  quan: [boolean, boolean];
  score: [number, number];
  /** where the hand is and how many stones it holds */
  hand: { cell: number; n: number } | null;
  /** what just happened, to animate that cell */
  fx: { cell: number; kind: 'pick' | 'drop' | 'take'; value?: number; key: number } | null;
}

/** All frames of a move, starting from the position before it. */
export function framesOf(prev: OAQState, steps: readonly Step[], mover: Side): SowFrame[] {
  const board = prev.board.slice();
  const quan: [boolean, boolean] = [prev.quan[0], prev.quan[1]];
  const score: [number, number] = [prev.score[0], prev.score[1]];
  let hand: SowFrame['hand'] = null;
  const out: SowFrame[] = [];
  steps.forEach((s, key) => {
    let fx: SowFrame['fx'] = null;
    if (s.t === 'pick') {
      board[s.cell] = 0;
      hand = { cell: s.cell, n: s.n };
      fx = { cell: s.cell, kind: 'pick', key };
    } else if (s.t === 'drop') {
      board[s.cell] += 1;
      hand = hand ? { cell: s.cell, n: Math.max(0, hand.n - 1) } : null;
      fx = { cell: s.cell, kind: 'drop', key };
    } else if (s.t === 'take') {
      board[s.cell] = 0;
      if (s.quan) quan[s.cell === 0 ? 0 : 1] = false;
      score[mover - 1] += s.value;
      hand = null;
      fx = { cell: s.cell, kind: 'take', value: s.value, key };
    } else return; // reseeding shows in the final position
    out.push({
      board: board.slice(),
      quan: [quan[0], quan[1]],
      score: [score[0], score[1]],
      hand,
      fx,
    });
  });
  return out;
}

const STEP_MS = { pick: 420, drop: 260, take: 700 } as const;

function reducedMotion() {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function useSowing() {
  const [frames, setFrames] = useState<SowFrame[]>([]);
  const [i, setI] = useState(0);
  const done = useRef<(() => void) | null>(null);

  const finish = useCallback(() => {
    setFrames([]);
    setI(0);
    const cb = done.current;
    done.current = null;
    cb?.();
  }, []);

  /** Starts replaying a move; `onDone` runs when it ends or is skipped. */
  const play = useCallback(
    (prev: OAQState, steps: readonly Step[], mover: Side, onDone?: () => void) => {
      const f = framesOf(prev, steps, mover);
      done.current = onDone ?? null;
      if (!f.length || reducedMotion()) {
        setFrames([]);
        done.current = null;
        onDone?.();
        return;
      }
      setI(0);
      setFrames(f);
    },
    [],
  );

  useEffect(() => {
    if (!frames.length) return;
    const f = frames[i];
    // long sowings speed up a little so a move never takes too long
    const fast = frames.length > 18 ? 0.6 : 1;
    const ms = (f.fx ? STEP_MS[f.fx.kind] : STEP_MS.drop) * (f.fx?.kind === 'drop' ? fast : 1);
    const id = setTimeout(() => (i + 1 < frames.length ? setI(i + 1) : finish()), ms);
    return () => clearTimeout(id);
  }, [frames, i, finish]);

  return {
    frame: frames.length ? frames[i] : null,
    animating: frames.length > 0,
    play,
    skip: finish,
  };
}
