import type { CaroOnlineState } from '../games/caro/online';
import type { NumbersState } from '../games/numbers/logic';

export type GameId = 'numbers' | 'caro';

export interface RoomPlayer {
  name: string;
  avatar: string;
  joinedAt: number;
  online: boolean;
}

export interface RoomOptions {
  level?: string;
  size?: number;
}

export interface Room {
  code: string;
  game: GameId;
  options: RoomOptions;
  hostUid: string;
  /** the one guest allowed to join; claimed atomically with their player entry */
  guestUid?: string;
  createdAt: number;
  status: 'waiting' | 'playing';
  round: number;
  players?: Record<string, RoomPlayer>;
  rematch?: Record<string, boolean>;
  /** results[round] = winner uid or 'draw' */
  results?: Record<string, string>;
  state?: NumbersState | CaroOnlineState;
}

export const MAX_PLAYERS = 2;
export const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
