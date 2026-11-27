import { useEffect } from 'react';
import { useT } from '../i18n';
import { ResultModal } from '../ui/components';
import { recordResult, requestRematch } from './room';
import type { OnlineGameProps } from './RoomScreen';

/** End-of-round dialog for online games: records the result and handles rematch votes. */
export function OnlineResult({
  room,
  uid,
  opp,
  oppGone,
  onLeave,
  spectate,
  winner,
  children,
}: OnlineGameProps & { winner: string; children?: React.ReactNode }) {
  const t = useT();
  useEffect(() => {
    if (spectate) return; // only players record results
    recordResult(room.code, room.round, winner).catch(() => {});
  }, [room.code, room.round, winner, spectate]);
  const iWon = !spectate && winner === uid;
  const winnerName = room.players?.[winner]?.name ?? opp?.name ?? '';
  const title =
    winner === 'draw'
      ? t('draw')
      : iWon
        ? t('youWin')
        : t('playerWins', { name: spectate ? winnerName : (opp?.name ?? '') });
  const waiting = !!room.rematch?.[uid];
  return (
    <ResultModal
      title={title}
      win={winner === 'draw' || spectate ? undefined : iWon}
      sound={spectate && winner !== 'draw' ? 'win' : undefined}
      actions={
        <>
          {!oppGone && !spectate && (
            <button
              className="btn"
              disabled={waiting}
              data-testid="play-again"
              onClick={() => requestRematch(room.code, uid)}
            >
              🔄 {waiting ? t('waitRematch') : t('playAgain')}
            </button>
          )}
          <button className="btn secondary" onClick={onLeave} data-testid="leave">
            🏠 {t('leave')}
          </button>
        </>
      }
    >
      {children}
    </ResultModal>
  );
}
