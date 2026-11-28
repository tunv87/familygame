import { useState } from 'react';
import { useT } from '../../i18n';
import { HOME_CELLS, STABLE_AT, TRACK_CELLS, horseAt } from './geometry';
import { ARM, COLORS, colorOf, movesNow, type CaNguaState, type Color } from './logic';

export const HORSE_COLORS: Record<Color, string> = {
  0: '#e63946',
  1: '#1f78d1',
  2: '#2a9d5c',
  3: '#f2a900',
};
const TINT: Record<Color, string> = {
  0: '#fbd3d6',
  1: '#cfe3f7',
  2: '#cdebd9',
  3: '#fde9b0',
};

/** A small horse head, centred on 0,0, about 0.5 board cells tall. */
const HORSE_PATH =
  'M-0.2 0.26h0.42v-0.07h-0.05l-0.03-0.18c0.06-0.03 0.1-0.09 0.1-0.17 0-0.1-0.07-0.19-0.18-0.2' +
  'l-0.04-0.07-0.06 0.07c-0.1 0.02-0.18 0.1-0.2 0.2l-0.03 0.07 0.07 0.04 0.07-0.05 0.04 0.03' +
  '-0.08 0.16h-0.05z';

/** The cross-shaped board with the horses. Horses in `playable` glow and can be tapped. */
export function CaNguaBoard({
  state,
  playable,
  onHorse,
}: {
  state: CaNguaState;
  playable: number[];
  onHorse: (horse: number) => void;
}) {
  const t = useT();
  const starts = new Map(COLORS.map((c) => [String(TRACK_CELLS[c * ARM]), c]));
  const last = state.last;
  return (
    <div className="cn-wrap">
      <svg className="cn-board" viewBox="-0.1 -0.1 15.2 15.2" data-testid="cn-board">
        {COLORS.map((c) => {
          const [r, col] = STABLE_AT[c];
          return (
            <g key={`stable-${c}`}>
              <rect x={col} y={r} width={6} height={6} rx={0.6} fill={HORSE_COLORS[c]} />
              <rect x={col + 0.7} y={r + 0.7} width={4.6} height={4.6} rx={0.5} fill="#fffaf0" />
              {[0, 1, 2, 3].map((i) => (
                <circle
                  key={i}
                  cx={col + 1.75 + (i % 2) * 2.5}
                  cy={r + 1.75 + Math.floor(i / 2) * 2.5}
                  r={0.72}
                  fill={TINT[c]}
                  stroke={HORSE_COLORS[c]}
                  strokeWidth={0.06}
                />
              ))}
            </g>
          );
        })}
        {TRACK_CELLS.map(([r, c], i) => {
          const start = starts.get(String([r, c]));
          return (
            <rect
              key={`t-${i}`}
              x={c}
              y={r}
              width={1}
              height={1}
              className="cn-cell"
              fill={start !== undefined ? HORSE_COLORS[start] : '#fffdf7'}
            />
          );
        })}
        {/* the centre */}
        {COLORS.map((c) => {
          const pts = {
            0: '6,6 7.5,7.5 6,9',
            1: '6,6 7.5,7.5 9,6',
            2: '9,6 7.5,7.5 9,9',
            3: '6,9 7.5,7.5 9,9',
          }[c];
          return <polygon key={`c-${c}`} points={pts} fill={HORSE_COLORS[c]} opacity={0.85} />;
        })}
        {COLORS.map((c) =>
          HOME_CELLS[c].map(([r, col], i) => (
            <g key={`h-${c}-${i}`}>
              <rect x={col} y={r} width={1} height={1} className="cn-cell" fill={TINT[c]} />
              <text x={col + 0.5} y={r + 0.66} className="cn-step" fill={HORSE_COLORS[c]}>
                {i + 1}
              </text>
            </g>
          )),
        )}
        {last && (
          <circle
            className="cn-last"
            cx={horseAt(last.horse, last.from)[1]}
            cy={horseAt(last.horse, last.from)[0]}
            r={0.18}
            fill={HORSE_COLORS[colorOf(last.horse)]}
          />
        )}
        {state.horses.map((pos, h) => {
          const c = colorOf(h);
          if (!state.colors.includes(c) && pos < 0) return null;
          const [y, x] = horseAt(h, pos);
          const can = playable.includes(h);
          return (
            <g
              key={h}
              className={`cn-horse ${can ? 'can' : ''} ${last?.horse === h ? 'moved' : ''}`}
              style={{ transform: `translate(${x}px, ${y}px)` }}
              data-testid={`horse-${h}`}
              data-pos={pos}
              role={can ? 'button' : undefined}
              aria-label={can ? t('cnMoveHorse', { color: t(`cnColor${c}`) }) : undefined}
              onPointerDown={(e) => {
                if (!can) return;
                e.preventDefault();
                onHorse(h);
              }}
            >
              {can && <circle r={0.75} className="cn-glow" />}
              <circle r={0.42} fill={HORSE_COLORS[c]} stroke="#fff" strokeWidth={0.09} />
              {/* drawn horse head (the ♞ character is missing from many fonts) */}
              <path className="cn-horse-face" d={HORSE_PATH} />
              {/* a bigger invisible target for fingers */}
              <circle r={0.75} fill="transparent" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 2],
    [1, 2],
    [2, 2],
  ],
};

/** A die face (blank when there is no roll yet). */
export function DieFace({ value, rolling }: { value: number | null; rolling?: boolean }) {
  return (
    <svg
      className={`cn-die ${rolling ? 'rolling' : ''}`}
      viewBox="0 0 3 3"
      data-testid="cn-die"
      data-value={value ?? ''}
      aria-label={value ? String(value) : undefined}
    >
      <rect x={0.05} y={0.05} width={2.9} height={2.9} rx={0.5} className="cn-die-bg" />
      {(value ? PIPS[value] : []).map(([c, r], i) => (
        <circle key={i} cx={0.6 + c * 0.9} cy={0.6 + r * 0.9} r={0.3} className="cn-pip" />
      ))}
    </svg>
  );
}

/**
 * The two dice of a roll, side by side (blank before the first roll). While the player moves,
 * each die they can still use is a button: the chosen one is highlighted, used ones are faded.
 */
export function Dice2({
  dice,
  rolling,
  used = 0,
  usable = [],
  selected = null,
  onPick,
  label,
}: {
  dice: [number, number] | null;
  rolling?: boolean;
  /** bit 0 = first die used, bit 1 = second */
  used?: number;
  /** dice (0, 1) that can move a horse now */
  usable?: number[];
  selected?: number | null;
  onPick?: (die: 0 | 1) => void;
  label?: (n: number) => string;
}) {
  return (
    <div className="cn-dice" data-testid="cn-dice" data-value={dice ? dice.join('') : ''}>
      {([0, 1] as const).map((i) => {
        const value = dice?.[i] ?? null;
        const isUsed = !!(used & (1 << i));
        const can = !rolling && !isUsed && usable.includes(i) && !!onPick;
        const cls = `cn-die-btn ${isUsed ? 'used' : ''} ${can ? 'can' : ''} ${
          can && selected === i ? 'picked' : ''
        }`;
        return can ? (
          <button
            key={i}
            type="button"
            className={cls}
            data-testid={`cn-die-${i}`}
            aria-pressed={selected === i}
            aria-label={value && label ? label(value) : undefined}
            onClick={() => onPick(i)}
          >
            <DieFace value={value} />
          </button>
        ) : (
          <span key={i} className={cls} data-testid={`cn-die-${i}`}>
            <DieFace value={value} rolling={rolling} />
          </span>
        );
      })}
    </div>
  );
}

/**
 * Which die the player moves with: the one they tapped, or else the first die that can move.
 * Returns the dice that can be picked and the horses that can move with the chosen die.
 */
export function useDieChoice(s: CaNguaState, active: boolean) {
  const [pick, setPick] = useState<{ key: string; die: 0 | 1 } | null>(null);
  // a tap only counts for the roll (and the dice left) it was made on
  const key = `${s.rolls}:${s.turn}:${s.used}`;
  const moves = active ? movesNow(s) : [];
  const usable = [...new Set(moves.map((m) => m.die))];
  const selected =
    pick && pick.key === key && usable.includes(pick.die) ? pick.die : (usable[0] ?? null);
  return {
    usable,
    selected,
    playable: moves.filter((m) => m.die === selected).map((m) => m.horse),
    pickDie: (die: 0 | 1) => setPick({ key, die }),
  };
}
