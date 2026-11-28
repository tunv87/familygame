import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../../i18n';
import { createLogger } from '../../lib/logger';
import { sfx } from '../../lib/sound';
import { serverNow } from '../../online/firebase';
import { OnlineResult } from '../../online/OnlineResult';
import { PlayerChip } from '../../online/PlayerChip';
import { transactState, winsOf } from '../../online/room';
import type { OnlineGameProps } from '../../online/RoomScreen';
import { useDict, type Loaded } from './dict';
import { TURN_SECONDS } from './logic';
import { AnswerBox, Chain, HINTS, TimerBar, useCountdown } from './NoiTuPlay';
import {
  GRACE_MS,
  applyNoiTuLose,
  applyNoiTuWord,
  toLocal,
  turnUidOf,
  type NoiTuOnlineState,
} from './online';

const log = createLogger('noitu-online');

export function NoiTuOnline(props: OnlineGameProps) {
  const t = useT();
  const loaded = useDict();
  if (loaded === null || loaded === 'error')
    return (
      <div className="center grow muted" data-testid="nt-loading">
        {loaded === 'error' ? t('ntLoadFailed') : t('ntLoading')}
      </div>
    );
  return <Game {...props} loaded={loaded} />;
}

function Game(props: OnlineGameProps & { loaded: Loaded }) {
  const { room, uid, oppUid, me, opp, loaded } = props;
  const { dict } = loaded;
  const t = useT();
  const o = room.state as NoiTuOnlineState;
  const state = useMemo(() => toLocal(o), [o]);
  const [pending, setPending] = useState(false);
  const [hints, setHints] = useState(HINTS);
  const mySide = o.uid1 === uid ? 1 : 2;
  const hostTurn = !o.winner && turnUidOf(o) === uid;
  const myTurn = hostTurn && !props.oppGone && !props.spectate;
  const watching = !!props.spectate;

  // fresh hints each round
  const round = room.round;
  useEffect(() => setHints(HINTS), [round]);

  // a sound when the opponent's word arrives
  const prevLen = useRef(state.chain.length);
  useEffect(() => {
    if (state.chain.length > prevLen.current && myTurn) sfx.opponent();
    prevLen.current = state.chain.length;
  }, [state.chain.length, myTurn]);

  const tx = async (fn: (cur: NoiTuOnlineState) => NoiTuOnlineState | null, what: string) => {
    setPending(true);
    try {
      const ok = await transactState<NoiTuOnlineState>(room.code, fn);
      if (!ok) log.warn(`${what} rejected`);
    } catch (e) {
      log.error(`${what} failed`, e);
    } finally {
      setPending(false);
    }
  };

  const left = useCountdown(o.winner ? null : o.deadline, serverNow, () => {
    // my own clock ran out: I lose. The opponent's clock: claim only after the grace time.
    if (turnUidOf(o) === uid && !watching)
      void tx((cur) => applyNoiTuLose(cur, uid, 'timeout', serverNow()), 'timeout');
  });
  // the opponent's app is gone or frozen: claim the win once the grace time has passed
  useEffect(() => {
    if (o.winner || turnUidOf(o) === uid || watching) return;
    const wait = o.deadline + GRACE_MS + 500 - serverNow();
    const id = setTimeout(
      () => void tx((cur) => applyNoiTuLose(cur, uid, 'timeout', serverNow()), 'claim'),
      Math.max(0, wait),
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.deadline, o.winner, o.turn]);

  const sideOf = (i: number) => (i === 0 ? 0 : (i - 1) % 2 === 0 ? 1 : 2) as 0 | 1 | 2;
  // show my words on the right ("me" bubbles = side 1 in Chain)
  const viewSide = (i: number) => {
    const s = sideOf(i);
    return s === 0 ? 0 : s === mySide ? 1 : 2;
  };

  // words each player has added this game (the opening word belongs to nobody)
  const wordsOf = (side: 1 | 2) => state.chain.filter((_, i) => sideOf(i) === side).length;
  const status = o.winner
    ? ''
    : watching
      ? t('turnOf', { name: (hostTurn ? me?.name : opp?.name) ?? '' })
      : myTurn
        ? t('ntYourTurn')
        : t('caroWaitTurn', { name: opp?.name ?? '' });

  return (
    <div className="nt-screen grow" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="players">
        <PlayerChip
          player={me}
          score={winsOf(room, uid)}
          active={hostTurn}
          testId="me"
          note={t('ntWordsCount', { n: wordsOf(mySide) })}
        />
        <PlayerChip
          player={opp}
          score={winsOf(room, oppUid)}
          note={t('ntWordsCount', { n: wordsOf(mySide === 1 ? 2 : 1) })}
          active={!o.winner && !hostTurn}
          testId="opp"
        />
      </div>
      <TimerBar left={left} total={TURN_SECONDS} />
      <div className="status-line" data-testid="status">
        {status}
      </div>
      <Chain
        dict={dict}
        chain={state.chain}
        sideOf={viewSide}
        avatars={[me?.avatar ?? '🙂', opp?.avatar ?? '😎']}
      />
      <AnswerBox
        dict={dict}
        chain={state.chain}
        enabled={myTurn && !pending}
        hintsLeft={hints}
        onHint={() => setHints((h) => h - 1)}
        onAnswer={(w) => void tx((cur) => applyNoiTuWord(cur, uid, w, dict, serverNow()), 'word')}
        onGiveUp={() => void tx((cur) => applyNoiTuLose(cur, uid, 'giveup', serverNow()), 'giveup')}
      />
      {o.winner && (
        <OnlineResult {...props} winner={o.winner}>
          <div className="muted" data-testid="nt-reason">
            {t(o.reason === 'timeout' ? 'ntTimeout' : 'ntGaveUp', {
              name: (o.winner === uid ? opp?.name : me?.name) ?? '',
            })}
            {' · '}
            {t('ntChainLen', { n: state.chain.length })}
          </div>
        </OnlineResult>
      )}
    </div>
  );
}
