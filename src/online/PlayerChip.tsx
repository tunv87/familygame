import { Avatar } from '../ui/components';
import { inkOf } from '../games/numbers/NumbersBoard';
import { useTheme } from '../app/theme';
import type { RoomPlayer } from './types';

export function PlayerChip({
  player,
  mark,
  stone,
  score,
  active,
  color,
  testId,
  note,
  ready,
}: {
  player?: RoomPlayer;
  mark?: 'x' | 'o';
  /** Cờ gánh piece colour */
  stone?: 'black' | 'white';
  score?: number;
  active?: boolean;
  color?: string;
  testId?: string;
  /** small note before the score, e.g. "3 từ" in Nối từ */
  note?: string;
  /** waiting room: this player tapped Ready */
  ready?: boolean;
}) {
  const theme = useTheme();
  return (
    <div
      className={`player ${active ? 'active' : ''} ${player && !player.online ? 'offline' : ''} ${
        ready ? 'ready' : ''
      }`}
      style={color ? { borderColor: color } : undefined}
      data-testid={testId}
    >
      <span className="avatar-wrap">
        <Avatar emoji={player?.avatar ?? '❔'} />
        {mark ? <span className={`badge ${mark}`}>{mark === 'x' ? theme.x : theme.o}</span> : null}
        {stone ? <span className={`badge cg-badge ${stone}`} /> : null}
        {ready ? (
          <span className="badge ready-badge" data-testid={testId && `${testId}-ready`}>
            ✅
          </span>
        ) : null}
      </span>
      <span className="name">{player?.name ?? '…'}</span>
      {note ? (
        <span className="player-note" data-testid={testId && `${testId}-note`}>
          {note}
        </span>
      ) : null}
      {score !== undefined && (
        <span
          className={`score ${note ? 'with-note' : ''}`}
          style={color ? { color: inkOf(color) } : undefined}
          data-testid={testId && `${testId}-score`}
        >
          {score}
        </span>
      )}
    </div>
  );
}
