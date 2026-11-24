import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../../i18n';
import { useTheme } from '../../app/theme';
import { createLogger } from '../../lib/logger';
import { sfx } from '../../lib/sound';
import { OnlineResult } from '../../online/OnlineResult';
import { PlayerChip } from '../../online/PlayerChip';
import { transactState, winsOf } from '../../online/room';
import type { OnlineGameProps } from '../../online/RoomScreen';
import { CaroBoard } from './CaroBoard';
import { boardFromMoves } from './logic';
import { applyCaroMove, turnUid, type CaroOnlineState } from './online';

const log = createLogger('caro-online');

export function CaroOnline(props: OnlineGameProps) {
  const { room, uid, oppUid, me, opp } = props;
  const t = useT();
  const theme = useTheme();
  const s = room.state as CaroOnlineState;
  const moves = useMemo(() => s.moves ?? [], [s.moves]);
  const board = useMemo(() => boardFromMoves(s.size, moves), [s.size, moves]);
  const [pending, setPending] = useState(false);
  // a spectator sees the host's side: hostTurn lights the right chip, myTurn allows moves
  const hostTurn = !s.winner && turnUid(s) === uid;
  const myTurn = hostTurn && !props.spectate;
  const iAmX = s.xUid === uid;

  // Cue when the opponent moves.
  const prevLen = useRef(moves.length);
  useEffect(() => {
    if (moves.length > prevLen.current && moves.length % 2 === (iAmX ? 0 : 1)) sfx.opponent();
    prevLen.current = moves.length;
  }, [moves.length, iAmX]);

  const play = async (idx: number) => {
    if (!myTurn || pending || board[idx] !== 0) return;
    sfx.tap();
    setPending(true);
    try {
      const ok = await transactState<CaroOnlineState>(room.code, (cur) =>
        applyCaroMove(cur, uid, idx),
      );
      if (!ok) log.warn('move rejected', { idx });
    } catch (e) {
      log.error('move failed', e);
    } finally {
      setPending(false);
    }
  };

  const markOf = (isX: boolean) => (
    <span style={{ color: isX ? 'var(--x)' : 'var(--o)' }}>{isX ? theme.x : theme.o}</span>
  );
  return (
    <>
      <div className="players">
        <PlayerChip
          player={me}
          mark={iAmX ? 'x' : 'o'}
          score={winsOf(room, uid)}
          active={hostTurn}
          testId="me"
        />
        <PlayerChip
          player={opp}
          mark={iAmX ? 'o' : 'x'}
          score={winsOf(room, oppUid)}
          active={!s.winner && !hostTurn}
          testId="opp"
        />
      </div>
      <div className="status-line" data-testid="status">
        {s.winner ? (
          ''
        ) : props.spectate ? (
          t('turnOf', { name: (hostTurn ? me?.name : opp?.name) ?? '' })
        ) : myTurn ? (
          <>
            {markOf(iAmX)} {t('caroYourTurn')}
          </>
        ) : (
          t('caroWaitTurn', { name: opp?.name ?? '' })
        )}
      </div>
      <CaroBoard
        size={s.size}
        board={board}
        onCell={play}
        last={moves[moves.length - 1]}
        winLine={s.line}
        disabled={!myTurn || pending || props.oppGone}
      />
      {s.winner && <OnlineResult {...props} winner={s.winner} />}
    </>
  );
}
