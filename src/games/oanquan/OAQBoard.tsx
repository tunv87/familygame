import { useT } from '../../i18n';
import { FIELDS, QUAN_VALUE, type OAQState, type Side } from './logic';

/** Screen layout of the ring for a viewer whose own fields are on the bottom row. */
function layout(bottom: Side) {
  return bottom === 1
    ? { left: 0, right: 6, top: [11, 10, 9, 8, 7], bottomRow: [1, 2, 3, 4, 5] }
    : { left: 6, right: 0, top: [5, 4, 3, 2, 1], bottomRow: [7, 8, 9, 10, 11] };
}

/** Screen direction → ring direction. Along the bottom row, "right" is always +1. */
export function dirFor(cell: number, bottom: Side, screen: 'left' | 'right'): 1 | -1 {
  const onBottom = FIELDS[bottom].includes(cell);
  const right = onBottom ? 1 : -1;
  return screen === 'right' ? right : (-right as 1 | -1);
}

const MAX_DOTS = 12;

function Stones({ n, big }: { n: number; big: boolean }) {
  const dots = Math.min(n, MAX_DOTS);
  return (
    <span className="oaq-stones" aria-hidden>
      {big && <span className="oaq-big" />}
      {Array.from({ length: dots }, (_, k) => (
        <span key={k} className="oaq-dot" />
      ))}
    </span>
  );
}

/**
 * The Ô ăn quan board: two rows of 5 fields between two half-round quan cells.
 * Cells are buttons (data-testid="cell-<index>") showing the stones and a big count.
 */
export function OAQBoard({
  state,
  bottom,
  selected,
  playable,
  path,
  captured,
  disabled,
  onCell,
}: {
  state: Pick<OAQState, 'board' | 'quan'>;
  /** the side whose fields are drawn on the bottom row */
  bottom: Side;
  selected: number | null;
  /** fields that can be picked up now */
  playable: readonly number[];
  /** cells sown by the last move, in order (staggered highlight) */
  path: readonly number[];
  captured: readonly number[];
  disabled: boolean;
  onCell: (i: number) => void;
}) {
  const t = useT();
  const L = layout(bottom);
  const order = new Map<number, number>();
  path.forEach((c, k) => {
    if (!order.has(c)) order.set(c, k);
  });
  const caught = new Set(captured);
  const canPlay = new Set(playable);

  const cell = (i: number, extra: string) => {
    const big = i === 0 ? state.quan[0] : i === 6 ? state.quan[1] : false;
    const n = state.board[i];
    const value = n + (big ? QUAN_VALUE : 0);
    const k = order.get(i);
    const cls = [
      'oaq-cell',
      extra,
      selected === i ? 'selected' : '',
      canPlay.has(i) && !disabled ? 'playable' : '',
      k !== undefined ? 'sown' : '',
      caught.has(i) ? 'caught' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <button
        key={`${i}-${path.length}-${captured.length}`}
        data-testid={`cell-${i}`}
        className={cls}
        style={k !== undefined ? { animationDelay: `${k * 90}ms` } : undefined}
        aria-label={`${extra === 'quan' ? t('oaqQuan') : t('oaqField')} ${value}`}
        disabled={disabled}
        onPointerDown={(e) => {
          e.preventDefault();
          onCell(i);
        }}
      >
        <Stones n={n} big={big} />
        <span className="oaq-count" data-testid={`count-${i}`}>
          {value}
        </span>
      </button>
    );
  };

  return (
    <div className="oaq-wrap">
      <div className="oaq-board" data-testid="oaq-board">
        {cell(L.left, 'quan left')}
        <div className="oaq-row top">{L.top.map((i) => cell(i, 'field them'))}</div>
        <div className="oaq-row bottom">{L.bottomRow.map((i) => cell(i, 'field mine'))}</div>
        {cell(L.right, 'quan right')}
      </div>
    </div>
  );
}
