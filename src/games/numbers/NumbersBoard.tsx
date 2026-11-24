import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { sfx } from '../../lib/sound';
import { JITTER, type Layout } from './logic';

export const COUNTDOWN = 3;
/** Tap target diameter in grid cells: tiles are ≥ 1 - 2·JITTER apart, so this never overlaps. */
const HIT_SIZE = 1 - 2 * JITTER;

/** 3-2-1 countdown that restarts whenever `round` changes. Returns seconds left (0 = go). */
export function useCountdown(round: unknown): number {
  const [count, setCount] = useState(COUNTDOWN);
  useEffect(() => {
    setCount(COUNTDOWN);
    const id = setInterval(() => setCount((c) => (c <= 1 ? (clearInterval(id), 0) : c - 1)), 800);
    return () => clearInterval(id);
  }, [round]);
  return count;
}

export function Countdown({ count }: { count: number }) {
  // 3, 2, 1 → tick; 0 → go
  const started = useRef(false);
  useEffect(() => {
    if (count > 0) {
      started.current = true;
      sfx.tick();
    } else if (started.current) {
      started.current = false;
      sfx.go();
    }
  }, [count]);
  return count > 0 ? (
    <div className="countdown" data-testid="countdown">
      {count}
    </div>
  ) : null;
}

/** Text colour for a player colour: var(--p2) → var(--ink-p2), which passes WCAG AA on white. */
export const inkOf = (color: string) => color.replace('var(--p', 'var(--ink-p');

export function MiniPlayer({
  avatar,
  name,
  score,
  color,
  testId,
  offline,
}: {
  avatar?: string;
  name?: string;
  score: number | string;
  color: string;
  testId: string;
  offline?: boolean;
}) {
  return (
    <div className={`mini-player ${offline ? 'offline' : ''}`} style={{ borderColor: color }}>
      <span className="mini-avatar">{avatar ?? '❔'}</span>
      <span className="mini-name">{name ?? '…'}</span>
      <span className="mini-score" style={{ color: inkOf(color) }} data-testid={`${testId}-score`}>
        {score}
      </span>
    </div>
  );
}

/**
 * The scattered-numbers board shared by online, vs-computer and practice modes.
 * `owner[n]` is who took number n; `me` decides which claimed numbers are "mine".
 * `onFind(n)` is only called for the correct next number; wrong taps shake locally.
 */
export function NumbersBoard({
  layout,
  owner,
  me,
  next,
  disabled,
  onFind,
}: {
  layout: Layout;
  owner: Record<string, string>;
  me: string;
  next: number;
  /** changes every round (kept for callers; the board itself has no timers) */
  round?: unknown;
  disabled: boolean;
  onFind: (n: number) => void;
}) {
  const [wrong, setWrong] = useState<number | null>(null);

  const tap = (n: number) => {
    if (disabled || owner[n]) return;
    if (n !== next) {
      sfx.bad();
      setWrong(n);
      setTimeout(() => setWrong(null), 400);
      return;
    }
    sfx.good();
    onFind(n);
  };

  // Fit the board into the available space. Layouts are portrait (fewer columns than rows);
  // on a wide screen (computer, tablet held sideways) the board is turned on its side
  // (x and y swapped) so it fills the screen. Same numbers, same game, just drawn sideways.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 320, h: 480 });
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const sideways = box.w > box.h * 1.15 && layout.rows > layout.cols;
  const cols = sideways ? layout.rows : layout.cols;
  const rows = sideways ? layout.cols : layout.rows;
  const width = Math.floor(Math.min(box.w, (box.h * cols) / rows));
  const cellPx = width / cols;

  return (
    <div className="numbers-wrap" ref={wrapRef}>
      <div
        className="numbers-board"
        data-testid="numbers-board"
        style={{ width, height: (width * rows) / cols }}
      >
        {layout.tiles.map((tile) => {
          const who = owner[tile.n];
          const cls = who ? (who === me ? 'mine claimed' : 'theirs claimed') : '';
          return (
            <button
              key={tile.n}
              data-testid={`num-${tile.n}`}
              className={`num ${cls} ${wrong === tile.n ? 'wrong' : ''}`}
              style={
                {
                  left: `${(sideways ? tile.y : tile.x) * 100}%`,
                  top: `${(sideways ? tile.x : tile.y) * 100}%`,
                  // Hit area is as large as the grid allows without overlapping neighbours.
                  width: HIT_SIZE * cellPx,
                  '--rot': `${tile.rotate}deg`,
                } as React.CSSProperties
              }
              onPointerDown={(e) => {
                e.preventDefault();
                tap(tile.n);
              }}
            >
              <span
                className="num-face"
                style={{ width: tile.size * cellPx, fontSize: tile.size * cellPx * 0.6 }}
              >
                {tile.n}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
