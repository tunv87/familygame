import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../../i18n';
import { createLogger } from '../../lib/logger';
import { sfx } from '../../lib/sound';
import { OnlineResult } from '../../online/OnlineResult';
import { PlayerChip } from '../../online/PlayerChip';
import { transactState } from '../../online/room';
import type { OnlineGameProps } from '../../online/RoomScreen';
import { Countdown, MiniPlayer, NumbersBoard, useCountdown } from './NumbersBoard';
import { applyClaim, makeLayout, normalizeOwner, numbersWinner, type NumbersState } from './logic';

const log = createLogger('numbers');

export function NumbersOnline(props: OnlineGameProps) {
  const { room, uid, oppUid, me, opp } = props;
  const t = useT();
  const s = room.state as NumbersState;
  const layout = useMemo(() => makeLayout(s.level, s.seed), [s.level, s.seed]);
  const owner = normalizeOwner(s.owner);
  const winner = numbersWinner(s);
  const count = useCountdown(room.round);

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

  const find = async (n: number) => {
    setToast('');
    try {
      const ok = await transactState<NumbersState>(room.code, (cur) => applyClaim(cur, uid, n));
      log.debug('claim', { n, ok });
    } catch (e) {
      log.error('claim failed', e);
    }
  };

  return (
    <>
      <div className="numbers-hud">
        <button
          className="icon-btn small"
          onClick={props.onExit}
          data-testid="exit"
          aria-label={t('exitGame')}
          title={t('exitGame')}
        >
          🚪
        </button>
        <MiniPlayer
          avatar={me.avatar}
          name={me.name}
          score={s.scores?.[uid] ?? 0}
          color="var(--p1)"
          testId="me"
        />
        <div className="target" data-testid="target">
          {s.done ? '🏁' : <span className="big">{s.next}</span>}
        </div>
        <MiniPlayer
          avatar={opp?.avatar}
          name={opp?.name}
          offline={opp && !opp.online}
          score={s.scores?.[oppUid] ?? 0}
          color="var(--p2)"
          testId="opp"
        />
      </div>
      <div className="numbers-toast">{toast}</div>
      <NumbersBoard
        layout={layout}
        owner={owner}
        me={uid}
        next={s.next}
        round={room.round}
        disabled={count > 0 || s.done || props.oppGone || !!props.spectate}
        onFind={find}
      />
      <Countdown count={count} />
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
