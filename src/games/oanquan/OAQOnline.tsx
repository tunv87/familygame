import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../../i18n';
import { createLogger } from '../../lib/logger';
import { sfx } from '../../lib/sound';
import { OnlineResult } from '../../online/OnlineResult';
import { PlayerChip } from '../../online/PlayerChip';
import { transactState, winsOf } from '../../online/room';
import type { OnlineGameProps } from '../../online/RoomScreen';
import { applyMove, type Move, type OAQState } from './logic';
import { OAQBoard } from './OAQBoard';
import { DirButtons, oaqFeedback, useOAQSelection } from './OAQLocal';
import { applyOAQOnline, toLocal, turnUidOf, type OAQOnlineState } from './online';
import { useSowing } from './useSowing';

const log = createLogger('oanquan-online');

export function OAQOnline(props: OnlineGameProps) {
  const { room, uid, oppUid, me, opp } = props;
  const t = useT();
  const o = room.state as OAQOnlineState;
  const state = useMemo(() => toLocal(o), [o]);
  const [pending, setPending] = useState(false);
  const mySide = o.uid1 === uid ? 1 : 2;
  const myTurn = !o.winner && turnUidOf(o) === uid && !props.oppGone;
  const sowing = useSowing();
  const busy = sowing.animating;
  const shownScore = sowing.frame?.score ?? state.score;
  const { selected, playable, tap } = useOAQSelection(state, myTurn && !pending && !busy);

  // Every new move (mine or the opponent's) is replayed from the previous position on both
  // devices (the rules are deterministic), then its sound and message follow.
  const prev = useRef<{ plies: number; state: OAQState }>({ plies: o.plies, state });
  const [message, setMessage] = useState('');
  useEffect(() => {
    const before = prev.current;
    prev.current = { plies: o.plies, state };
    if (o.plies !== before.plies + 1) return; // first view, a new round, or a skipped update
    if (!o.gained && turnUidOf(o) === uid) sfx.opponent();
    const nextName = (turnUidOf(o) === uid ? me?.name : opp?.name) ?? '';
    const announce = () =>
      setMessage(
        oaqFeedback(
          { gained: o.gained ?? 0, tookQuan: !!o.tookQuan, reseeded: !!o.reseeded },
          t,
          nextName,
        ),
      );
    setMessage('');
    const r = o.last ? applyMove(before.state, o.last) : null;
    if (r) sowing.play(before.state, r.steps, before.state.turn, announce);
    else announce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.plies]);

  const play = async (m: Move) => {
    setPending(true);
    try {
      const ok = await transactState<OAQOnlineState>(room.code, (cur) =>
        applyOAQOnline(cur, uid, m),
      );
      if (!ok) log.warn('move rejected', m);
    } catch (e) {
      log.error('move failed', e);
    } finally {
      setPending(false);
    }
  };

  const status = busy
    ? t('oaqSowing')
    : o.winner
      ? ''
      : myTurn
        ? selected !== null
          ? t('oaqPickDir')
          : t('oaqYourTurn')
        : t('caroWaitTurn', { name: opp?.name ?? '' });

  return (
    <>
      <div className="players">
        <PlayerChip player={me} score={shownScore[mySide - 1]} active={myTurn} testId="me" />
        <PlayerChip
          player={opp}
          score={shownScore[mySide === 1 ? 1 : 0]}
          active={!o.winner && !myTurn}
          testId="opp"
        />
      </div>
      <div className="status-line" data-testid="status">
        {status}
      </div>
      <div className="numbers-toast" data-testid="oaq-message">
        {message}
      </div>
      <OAQBoard
        state={state}
        bottom={mySide}
        selected={selected}
        playable={myTurn ? playable : []}
        frame={sowing.frame}
        disabled={!myTurn || pending || busy}
        onCell={tap}
        onSkip={sowing.skip}
      />
      <DirButtons
        selected={myTurn && !busy ? selected : null}
        bottom={mySide}
        onMove={(m) => void play(m)}
      />
      <div className="muted center" style={{ fontSize: 14 }}>
        🏆 {winsOf(room, uid)} – {winsOf(room, oppUid)}
      </div>
      {o.winner && !busy && <OnlineResult {...props} winner={o.winner} />}
    </>
  );
}
