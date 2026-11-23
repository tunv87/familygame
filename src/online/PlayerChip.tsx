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
}: {
  player?: RoomPlayer;
  mark?: 'x' | 'o';
  /** Cờ gánh piece colour */
  stone?: 'black' | 'white';
  score?: number;
  active?: boolean;
  color?: string;
  testId?: string;
}) {
  const theme = useTheme();
  return (
    <div
      className={`player ${active ? 'active' : ''} ${player && !player.online ? 'offline' : ''}`}
      style={color ? { borderColor: color } : undefined}
      data-testid={testId}
    >
      <span className="avatar-wrap">
        <Avatar emoji={player?.avatar ?? '❔'} />
        {mark ? <span className={`badge ${mark}`}>{mark === 'x' ? theme.x : theme.o}</span> : null}
        {stone ? <span className={`badge cg-badge ${stone}`} /> : null}
      </span>
      <span className="name">{player?.name ?? '…'}</span>
      {score !== undefined && (
        <span
          className="score"
          style={color ? { color: inkOf(color) } : undefined}
          data-testid={testId && `${testId}-score`}
        >
          {score}
        </span>
      )}
    </div>
  );
}
