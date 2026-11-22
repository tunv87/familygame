import { Avatar } from '../ui/components';
import type { RoomPlayer } from './types';

export function PlayerChip({
  player,
  label,
  score,
  active,
  color,
  testId,
}: {
  player?: RoomPlayer;
  label?: string;
  score?: number;
  active?: boolean;
  color?: string;
  testId?: string;
}) {
  return (
    <div
      className={`player ${active ? 'active' : ''} ${player && !player.online ? 'offline' : ''}`}
      style={color ? { borderColor: color } : undefined}
      data-testid={testId}
    >
      <span className="avatar-wrap">
        <Avatar emoji={player?.avatar ?? '❔'} />
        {label ? <span className={`badge ${label === '✕' ? 'x' : 'o'}`}>{label}</span> : null}
      </span>
      <span className="name">{player?.name ?? '…'}</span>
      {score !== undefined && (
        <span
          className="score"
          style={color ? { color } : undefined}
          data-testid={testId && `${testId}-score`}
        >
          {score}
        </span>
      )}
    </div>
  );
}
