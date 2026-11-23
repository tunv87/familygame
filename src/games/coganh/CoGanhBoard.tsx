import { useLayoutEffect, useRef, useState } from 'react';
import { ADJ, N, SIZE, xy, type Cell } from './logic';

// Each line once: a → b with a < b
const LINES: [number, number][] = [];
for (let a = 0; a < N; a++) for (const b of ADJ[a]) if (a < b) LINES.push([a, b]);

/**
 * The 5×5 Cờ gánh board. Lines are SVG; points are buttons laid over them so they
 * are easy to tap (≥ 44 px on phones) and to test (data-testid="pt-<index>").
 */
export function CoGanhBoard({
  board,
  selected,
  targets,
  movable,
  forced,
  last,
  flipped,
  disabled,
  onPoint,
}: {
  board: readonly Cell[];
  selected: number | null;
  /** points the selected piece can move to */
  targets: readonly number[];
  /** pieces that can be picked up this turn (all, or only the forced ones) */
  movable: readonly number[];
  /** a Mở is pending: highlight the forced pieces and points */
  forced: boolean;
  last?: { from: number; to: number };
  /** points converted by the last move (flip animation) */
  flipped: readonly number[];
  disabled: boolean;
  onPoint: (i: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState(300);
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setSide(Math.floor(Math.min(el.clientWidth, el.clientHeight, 640)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const margin = side * 0.1;
  const gap = (side - 2 * margin) / (SIZE - 1);
  const pos = (i: number) => {
    const [x, y] = xy(i);
    return { left: margin + x * gap, top: margin + y * gap };
  };
  const piece = gap * 0.7;
  const target = new Set(targets);
  const canMove = new Set(movable);
  const flip = new Set(flipped);

  return (
    <div className="cg-wrap" ref={wrapRef}>
      <div className="cg-board" data-testid="cg-board" style={{ width: side, height: side }}>
        <svg width={side} height={side} aria-hidden>
          {LINES.map(([a, b]) => {
            const p = pos(a);
            const q = pos(b);
            return <line key={`${a}-${b}`} x1={p.left} y1={p.top} x2={q.left} y2={q.top} />;
          })}
          {last && (
            <line
              className="cg-last"
              x1={pos(last.from).left}
              y1={pos(last.from).top}
              x2={pos(last.to).left}
              y2={pos(last.to).top}
            />
          )}
        </svg>
        {board.map((c, i) => {
          const p = pos(i);
          const cls = [
            'cg-pt',
            c === 1 ? 'black' : c === 2 ? 'white' : 'empty',
            selected === i ? 'selected' : '',
            target.has(i) ? 'target' : '',
            canMove.has(i) && !disabled ? 'movable' : '',
            forced && (canMove.has(i) || target.has(i)) ? 'forced' : '',
            flip.has(i) ? 'flip' : '',
            last?.to === i ? 'last' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={i}
              data-testid={`pt-${i}`}
              className={cls}
              aria-label={`${xy(i)[0] + 1}-${xy(i)[1] + 1}`}
              disabled={disabled}
              style={{ left: p.left, top: p.top, width: gap * 0.9, height: gap * 0.9 }}
              onPointerDown={(e) => {
                e.preventDefault();
                onPoint(i);
              }}
            >
              {c !== 0 && <span className="cg-piece" style={{ width: piece, height: piece }} />}
              {c === 0 && target.has(i) && (
                <span className="cg-dot" style={{ width: piece * 0.42, height: piece * 0.42 }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
