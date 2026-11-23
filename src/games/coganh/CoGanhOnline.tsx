import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../../i18n';
import { createLogger } from '../../lib/logger';
import { sfx } from '../../lib/sound';
import { OnlineResult } from '../../online/OnlineResult';
import { PlayerChip } from '../../online/PlayerChip';
import { transactState, winsOf } from '../../online/room';
import type { OnlineGameProps } from '../../online/RoomScreen';
import { CoGanhBoard } from './CoGanhBoard';
import { useSelection } from './CoGanhLocal';
import { count, type Move } from './logic';
import { applyCoGanhOnline, toLocal, turnUidOf, type CoGanhOnlineState } from './online';

const log = createLogger('coganh-online');

export function CoGanhOnline(props: OnlineGameProps) {
  const { room, uid, oppUid, me, opp } = props;
  const t = useT();
  const o = room.state as CoGanhOnlineState;
  const state = useMemo(() => toLocal(o), [o]);
  const [pending, setPending] = useState(false);
  const mySide = o.blackUid === uid ? 1 : 2;
  const myTurn = !o.winner && turnUidOf(o) === uid && !props.oppGone;
  const { selected, movable, targets, tap } = useSelection(state, myTurn && !pending);

  // Sounds for every new move (mine or the opponent's), and the Mở warning when it is on me.
  const prevPlies = useRef(o.plies);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (o.plies <= prevPlies.current) {
      prevPlies.current = o.plies;
      return;
    }
    prevPlies.current = o.plies;
    const g = o.ganh?.length ?? 0;
    const c = o.chet?.length ?? 0;
    if (g || c) sfx.ganh(g >= 4 || c > 0);
    else if (turnUidOf(o) === uid) sfx.opponent();
    if (o.forced?.length && turnUidOf(o) === uid && !o.winner) sfx.forced();
    setMessage(c ? t('cgChet', { n: g + c }) : g ? t('cgGanh', { n: g }) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.plies]);

  const play = async (m: Move) => {
    setPending(true);
    try {
      const ok = await transactState<CoGanhOnlineState>(room.code, (cur) =>
        applyCoGanhOnline(cur, uid, m),
      );
      if (!ok) log.warn('move rejected', m);
    } catch (e) {
      log.error('move failed', e);
    } finally {
      setPending(false);
    }
  };

  const onPoint = (i: number) => {
    const m = tap(i);
    if (m) void play(m);
  };

  const forcedMine = !!o.forced?.length && myTurn;
  const status = o.winner
    ? ''
    : forcedMine
      ? `⚠️ ${t('cgForced')}`
      : myTurn
        ? t('cgYourTurn')
        : t('caroWaitTurn', { name: opp?.name ?? '' });

  return (
    <>
      <div className="players">
        <PlayerChip
          player={me}
          stone={mySide === 1 ? 'black' : 'white'}
          score={count(state.board, mySide)}
          active={myTurn}
          testId="me"
        />
        <PlayerChip
          player={opp}
          stone={mySide === 1 ? 'white' : 'black'}
          score={count(state.board, mySide === 1 ? 2 : 1)}
          active={!o.winner && !myTurn}
          testId="opp"
        />
      </div>
      <div className={`status-line ${forcedMine ? 'warn' : ''}`} data-testid="status">
        {status}
      </div>
      <div className="numbers-toast" data-testid="cg-message">
        {message}
      </div>
      <CoGanhBoard
        board={state.board}
        selected={selected}
        targets={targets}
        movable={myTurn ? movable : []}
        forced={forcedMine}
        last={o.last}
        flipped={[...(o.ganh ?? []), ...(o.chet ?? [])]}
        disabled={!myTurn || pending}
        onPoint={onPoint}
      />
      <div className="muted center" style={{ fontSize: 14 }}>
        🏆 {winsOf(room, uid)} – {winsOf(room, oppUid)}
      </div>
      {o.winner && <OnlineResult {...props} winner={o.winner} />}
    </>
  );
}
