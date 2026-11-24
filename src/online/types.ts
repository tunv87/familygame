import type { CaroOnlineState } from '../games/caro/online';
import type { CaNguaOnlineState } from '../games/cangua/online';
import type { CoGanhOnlineState } from '../games/coganh/online';
import type { NumbersState } from '../games/numbers/logic';
import type { NoiTuOnlineState } from '../games/noitu/online';
import type { OAQOnlineState } from '../games/oanquan/online';

export type GameId = 'numbers' | 'caro' | 'coganh' | 'oanquan' | 'noitu' | 'cangua';

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
  /** Cờ cá ngựa only: the third and fourth players, claimed the same way while waiting */
  seat3?: string;
  seat4?: string;
  createdAt: number;
  status: 'waiting' | 'playing';
  round: number;
  players?: Record<string, RoomPlayer>;
  rematch?: Record<string, boolean>;
  /** results[round] = winner uid or 'draw' */
  results?: Record<string, string>;
  state?:
    | NumbersState
    | CaroOnlineState
    | CoGanhOnlineState
    | OAQOnlineState
    | NoiTuOnlineState
    | CaNguaOnlineState;
}

export const MAX_PLAYERS = 2;
/** players a room of this game can hold */
export const maxPlayers = (game: GameId) => (game === 'cangua' ? 4 : MAX_PLAYERS);
export const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
