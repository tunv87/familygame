import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Stone } from './logic';
import { useTheme } from '../../app/theme';

const MIN_CELL_BIG = 34; // px; comfortable finger target on the 15×15 board

/** Renders a caro board that fits the screen; the big board scrolls if cells would be too small. */
export function CaroBoard({
  size,
  board,
  onCell,
  last,
  winLine,
  disabled,
}: {
  size: number;
  board: readonly Stone[];
  onCell: (idx: number) => void;
  last?: number;
  winLine?: readonly number[];
  disabled?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState({ w: 320, h: 320 });
  const [zoomed, setZoomed] = useState(false);
  const small = size <= 4;
  const theme = useTheme();

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setAvail({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = Math.floor(Math.min(avail.w, avail.h) / size) - (small ? 12 : 0);
  const cell = small
    ? Math.min(fit, 200)
    : zoomed
      ? Math.max(fit, 44)
      : Math.max(fit, MIN_CELL_BIG);
  const scrolls = cell * size > Math.min(avail.w, avail.h) + 2;

  // Keep the latest move visible on the scrollable big board.
  const lastRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (scrolls)
      lastRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [last, scrolls]);

  const win = new Set(winLine ?? []);
  return (
    <div className="caro-wrap" ref={wrapRef}>
      <div className="caro-scroll" style={{ position: 'relative' }}>
        <div
          className={`caro-board ${small ? 'small' : 'big'}`}
          data-testid="caro-board"
          style={{
            gridTemplateColumns: `repeat(${size}, ${cell}px)`,
            gridAutoRows: `${cell}px`,
          }}
        >
          {board.map((s, i) => (
            <button
              key={i}
              ref={i === last ? lastRef : undefined}
              data-testid={`cell-${i}`}
              aria-label={`${Math.floor(i / size) + 1}-${(i % size) + 1}`}
              className={`caro-cell ${s === 1 ? 'x' : s === 2 ? 'o' : ''} ${i === last ? 'last' : ''} ${win.has(i) ? 'win' : ''}`}
              style={{ fontSize: cell * (small ? 0.6 : 0.7) }}
              disabled={disabled || s !== 0}
              onClick={() => onCell(i)}
            >
              {s !== 0 && <span className="mark">{s === 1 ? theme.x : theme.o}</span>}
            </button>
          ))}
        </div>
      </div>
      {!small && (
        <button
          className="icon-btn zoom-btn"
          aria-label="zoom"
          onClick={() => setZoomed((z) => !z)}
        >
          {zoomed ? '➖' : '🔍'}
        </button>
      )}
    </div>
  );
}
