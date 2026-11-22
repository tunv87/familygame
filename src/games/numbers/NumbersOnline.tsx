import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../../i18n';
import { createLogger } from '../../lib/logger';
import { sfx } from '../../lib/sound';
import { OnlineResult } from '../../online/OnlineResult';
import { PlayerChip } from '../../online/PlayerChip';
import { transactState } from '../../online/room';
import type { OnlineGameProps } from '../../online/RoomScreen';
import { applyClaim, makeLayout, normalizeOwner, numbersWinner, type NumbersState } from './logic';

const log = createLogger('numbers');
const COUNTDOWN = 3;
const HINT_AFTER_MS = 15_000;

export function NumbersOnline(props: OnlineGameProps) {
  const { room, uid, oppUid, me, opp } = props;
  const t = useT();
  const s = room.state as NumbersState;
  const layout = useMemo(() => makeLayout(s.level, s.seed), [s.level, s.seed]);
  const owner = normalizeOwner(s.owner);
  const winner = numbersWinner(s);

  // 3-2-1 countdown at the start of each round.
  const [count, setCount] = useState(COUNTDOWN);
  useEffect(() => {
    setCount(COUNTDOWN);
    const id = setInterval(() => setCount((c) => (c <= 1 ? (clearInterval(id), 0) : c - 1)), 800);
    return () => clearInterval(id);
  }, [room.round]);

  // Wrong-tap shake and "nobody found it for a while" hint.
  const [wrong, setWrong] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  useEffect(() => {
    setHint(false);
    const id = setTimeout(() => setHint(true), HINT_AFTER_MS);
    return () => clearTimeout(id);
  }, [s.next, room.round]);

  // Toast + sound when the opponent takes a number.
  const [toast, setToast] = useState('');
  const prevNext = useRef(s.next);
  useEffect(() => {
    const taken = s.next - 1;
    if (s.next > prevNext.current && owner[taken] && owner[taken] !== uid) {
      sfx.opponent();
      setToast(t('numbersTaken', { name: opp?.name ?? '', n: taken }));
    }
    prevNext.current = s.next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.next]);

  const tap = async (n: number) => {
    if (count > 0 || s.done || owner[n] || props.oppGone) return;
    if (n !== s.next) {
      sfx.bad();
      setWrong(n);
      setTimeout(() => setWrong(null), 400);
      return;
    }
    sfx.good();
    setToast('');
    try {
      const ok = await transactState<NumbersState>(room.code, (cur) => applyClaim(cur, uid, n));
      log.debug('claim', { n, ok });
    } catch (e) {
      log.error('claim failed', e);
    }
  };

  // Fit the board (fixed cols:rows aspect) into the available space.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () =>
      setWidth(Math.floor(Math.min(el.clientWidth, (el.clientHeight * layout.cols) / layout.rows)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout.cols, layout.rows]);
  const cellPx = width / layout.cols;

  return (
    <>
      <div className="players">
        <PlayerChip player={me} score={s.scores?.[uid] ?? 0} color="var(--p1)" testId="me" />
        <PlayerChip player={opp} score={s.scores?.[oppUid] ?? 0} color="var(--p2)" testId="opp" />
      </div>
      <div className="target" data-testid="target">
        {s.done ? '🏁' : t('numbersFind')}
        {!s.done && <span className="big">{s.next}</span>}
      </div>
      <div className="status-line muted" style={{ fontSize: '0.85em' }}>
        {toast}
      </div>
      <div className="numbers-wrap" ref={wrapRef}>
        <div
          className="numbers-board"
          data-testid="numbers-board"
          style={{ width, height: (width * layout.rows) / layout.cols }}
        >
          {layout.tiles.map((tile) => {
            const who = owner[tile.n];
            const cls = who ? (who === uid ? 'mine claimed' : 'theirs claimed') : '';
            return (
              <button
                key={tile.n}
                data-testid={`num-${tile.n}`}
                className={`num ${cls} ${wrong === tile.n ? 'wrong' : ''} ${hint && tile.n === s.next ? 'hint' : ''}`}
                style={
                  {
                    left: `${tile.x * 100}%`,
                    top: `${tile.y * 100}%`,
                    width: tile.size * cellPx,
                    fontSize: tile.size * cellPx * 0.5,
                    color: tile.color,
                    '--rot': `${tile.rotate}deg`,
                  } as React.CSSProperties
                }
                onPointerDown={(e) => {
                  e.preventDefault();
                  void tap(tile.n);
                }}
              >
                {tile.n}
              </button>
            );
          })}
        </div>
      </div>
      {count > 0 && (
        <div className="countdown" data-testid="countdown">
          {count}
        </div>
      )}
      {winner && (
        <OnlineResult {...props} winner={winner}>
          <div className="players">
            <PlayerChip player={me} score={s.scores?.[uid] ?? 0} color="var(--p1)" />
            <PlayerChip player={opp} score={s.scores?.[oppUid] ?? 0} color="var(--p2)" />
          </div>
        </OnlineResult>
      )}
    </>
  );
}
