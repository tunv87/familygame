import type { MessageKey } from '../i18n';

export type Mode = 'solo' | 'local' | 'online';

export interface GameInfo {
  id: 'numbers' | 'caro';
  emoji: string;
  title: MessageKey;
  desc: MessageKey;
  path: string;
  modes: Mode[];
}

/** Add new sub-games here; the hub renders from this list. */
export const GAMES: GameInfo[] = [
  {
    id: 'numbers',
    emoji: '🔢',
    title: 'gameNumbers',
    desc: 'gameNumbersDesc',
    path: '/numbers',
    modes: ['solo', 'online'],
  },
  {
    id: 'caro',
    emoji: '⭕',
    title: 'gameCaro',
    desc: 'gameCaroDesc',
    path: '/caro',
    modes: ['solo', 'local', 'online'],
  },
];
