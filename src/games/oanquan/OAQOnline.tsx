import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../../i18n';
import { createLogger } from '../../lib/logger';
import { sfx } from '../../lib/sound';
import { OnlineResult } from '../../online/OnlineResult';
import { PlayerChip } from '../../online/PlayerChip';
import { transactState, winsOf } from '../../online/room';
import type { OnlineGameProps } from '../../online/RoomScreen';
import type { Move } from './logic';
import { OAQBoard } from './OAQBoard';
import { DirButtons, oaqFeedback, useOAQSelection } from './OAQLocal';
import { applyOAQOnline, toLocal, turnUidOf, type OAQOnlineState } from './online';

const log = createLogger('oanquan-online');

export function OAQOnline(props: OnlineGameProps) {
  const { room, uid, oppUid, me, opp } = props;
  const t = useT();
  const o = room.state as OAQOnlineState;
  const state = useMemo(() => toLocal(o), [o]);
  const [pending, setPending] = useState(false);
  const mySide = o.uid1 === uid ? 1 : 2;
  const myTurn = !o.winner && turnUidOf(o) === uid && !props.oppGone;
  const { selected, playable, tap } = useOAQSelection(state, myTurn && !pending);

  // Sound + message for every new move (mine or the opponent's).
  const prevPlies = useRef(o.plies);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (o.plies <= prevPlies.current) {
      prevPlies.current = o.plies;
      return;
    }
    prevPlies.current = o.plies;
    if (!o.gained && turnUidOf(o) === uid) sfx.opponent();
    const nextName = (turnUidOf(o) === uid ? me?.name : opp?.name) ?? '';
    setMessage(
      oaqFeedback(
        { gained: o.gained ?? 0, tookQuan: !!o.tookQuan, reseeded: !!o.reseeded },
        t,
        nextName,
      ),
    );
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

  const status = o.winner
    ? ''
    : myTurn
      ? selected !== null
        ? t('oaqPickDir')
        : t('oaqYourTurn')
      : t('caroWaitTurn', { name: opp?.name ?? '' });

  return (
    <>
      <div className="players">
        <PlayerChip player={me} score={state.score[mySide - 1]} active={myTurn} testId="me" />
        <PlayerChip
          player={opp}
          score={state.score[mySide === 1 ? 1 : 0]}
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
        path={o.path ?? []}
        captured={o.captured ?? []}
        disabled={!myTurn || pending}
        onCell={tap}
      />
      <DirButtons
        selected={myTurn ? selected : null}
        bottom={mySide}
        onMove={(m) => void play(m)}
      />
      <div className="muted center" style={{ fontSize: 14 }}>
        🏆 {winsOf(room, uid)} – {winsOf(room, oppUid)}
      </div>
      {o.winner && <OnlineResult {...props} winner={o.winner} />}
    </>
  );
}
