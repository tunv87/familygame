import { useT } from '../../i18n';
import { FIELDS, QUAN_VALUE, type OAQState, type Side } from './logic';
import type { SowFrame } from './useSowing';

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
 * While a move is replayed (`frame`), the board shows that frame: the hand with the stones it
 * holds, a stone dropping into a cell, a capture. Tapping the board then skips the replay.
 */
export function OAQBoard({
  state,
  bottom,
  selected,
  playable,
  frame,
  disabled,
  onCell,
  onSkip,
}: {
  state: Pick<OAQState, 'board' | 'quan'>;
  /** the side whose fields are drawn on the bottom row */
  bottom: Side;
  selected: number | null;
  /** fields that can be picked up now */
  playable: readonly number[];
  /** a move being replayed, or null */
  frame: SowFrame | null;
  disabled: boolean;
  onCell: (i: number) => void;
  onSkip: () => void;
}) {
  const t = useT();
  const L = layout(bottom);
  const canPlay = new Set(playable);
  const view = frame ?? state;

  const cell = (i: number, extra: string) => {
    const big = i === 0 ? view.quan[0] : i === 6 ? view.quan[1] : false;
    const n = view.board[i];
    const value = n + (big ? QUAN_VALUE : 0);
    const fx = frame?.fx?.cell === i ? frame.fx : null;
    const hand = frame?.hand?.cell === i ? frame.hand : null;
    const cls = [
      'oaq-cell',
      extra,
      selected === i && !frame ? 'selected' : '',
      canPlay.has(i) && !disabled && !frame ? 'playable' : '',
      fx ? `fx-${fx.kind}` : '',
      hand ? 'has-hand' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <button
        // a new key per step restarts the cell's animation
        key={fx ? `${i}-${fx.key}` : i}
        data-testid={`cell-${i}`}
        className={cls}
        aria-label={`${extra.startsWith('quan') ? t('oaqQuan') : t('oaqField')} ${value}`}
        disabled={disabled && !frame}
        onPointerDown={(e) => {
          e.preventDefault();
          if (frame) onSkip();
          else onCell(i);
        }}
      >
        <Stones n={n} big={big} />
        <span className="oaq-count" data-testid={`count-${i}`}>
          {value}
        </span>
        {hand && (
          <span className="oaq-hand" data-testid="oaq-hand">
            ✋{hand.n > 0 ? hand.n : ''}
          </span>
        )}
        {fx?.kind === 'take' && <span className="oaq-plus">+{fx.value}</span>}
        {selected === i && !frame && (
          <span className="oaq-arrows" aria-hidden>
            ◀ ▶
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="oaq-wrap">
      <div
        className={`oaq-board ${frame ? 'replaying' : ''}`}
        data-testid="oaq-board"
        data-replaying={frame ? '1' : undefined}
      >
        {cell(L.left, 'quan left')}
        <div className="oaq-row top">{L.top.map((i) => cell(i, 'field them'))}</div>
        <div className="oaq-row bottom">{L.bottomRow.map((i) => cell(i, 'field mine'))}</div>
        {cell(L.right, 'quan right')}
      </div>
    </div>
  );
}
