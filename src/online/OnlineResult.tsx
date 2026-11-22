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
  winner,
  children,
}: OnlineGameProps & { winner: string; children?: React.ReactNode }) {
  const t = useT();
  useEffect(() => {
    recordResult(room.code, room.round, winner).catch(() => {});
  }, [room.code, room.round, winner]);
  const iWon = winner === uid;
  const title =
    winner === 'draw' ? t('draw') : iWon ? t('youWin') : t('playerWins', { name: opp?.name ?? '' });
  const waiting = !!room.rematch?.[uid];
  return (
    <ResultModal
      title={title}
      win={winner === 'draw' ? undefined : iWon}
      actions={
        <>
          {!oppGone && (
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
