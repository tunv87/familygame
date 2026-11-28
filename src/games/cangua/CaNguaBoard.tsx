import { useT } from '../../i18n';
import { HOME_CELLS, STABLE_AT, TRACK_CELLS, horseAt } from './geometry';
import { ARM, COLORS, colorOf, type CaNguaState, type Color } from './logic';

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

/** The two dice of a roll, side by side (blank before the first roll). */
export function Dice2({ dice, rolling }: { dice: [number, number] | null; rolling?: boolean }) {
  return (
    <div className="cn-dice" data-testid="cn-dice" data-value={dice ? dice.join('') : ''}>
      <DieFace value={dice?.[0] ?? null} rolling={rolling} />
      <DieFace value={dice?.[1] ?? null} rolling={rolling} />
    </div>
  );
}
