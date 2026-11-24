import type { MessageKey } from '../i18n';

export type Mode = 'solo' | 'local' | 'online';
export type GameGroup = 'folk' | 'mind';

export interface GameInfo {
  id: 'numbers' | 'caro' | 'coganh' | 'oanquan' | 'noitu' | 'cangua';
  emoji: string;
  title: MessageKey;
  desc: MessageKey;
  path: string;
  modes: Mode[];
  group: GameGroup;
}

/** Hub sections, in display order. */
export const GROUPS: { id: GameGroup; title: MessageKey; emoji: string }[] = [
  { id: 'folk', title: 'groupFolk', emoji: '🏮' },
  { id: 'mind', title: 'groupMind', emoji: '🧠' },
];

/** Add new sub-games here; the hub renders from this list. */
export const GAMES: GameInfo[] = [
  {
    id: 'oanquan',
    emoji: '🪨',
    title: 'gameOAQ',
    desc: 'gameOAQDesc',
    path: '/oanquan',
    modes: ['solo', 'local', 'online'],
    group: 'folk',
  },
  {
    id: 'coganh',
    emoji: '⚫',
    title: 'gameCoGanh',
    desc: 'gameCoGanhDesc',
    path: '/coganh',
    modes: ['solo', 'local', 'online'],
    group: 'folk',
  },
  {
    id: 'cangua',
    emoji: '🐴',
    title: 'gameCaNgua',
    desc: 'gameCaNguaDesc',
    path: '/cangua',
    modes: ['online'],
    group: 'folk',
  },
  {
    id: 'caro',
    emoji: '⭕',
    title: 'gameCaro',
    desc: 'gameCaroDesc',
    path: '/caro',
    modes: ['solo', 'local', 'online'],
    group: 'mind',
  },
  {
    id: 'noitu',
    emoji: '🔗',
    title: 'gameNoiTu',
    desc: 'gameNoiTuDesc',
    path: '/noitu',
    modes: ['solo', 'local', 'online'],
    group: 'mind',
  },
  {
    id: 'numbers',
    emoji: '🔢',
    title: 'gameNumbers',
    desc: 'gameNumbersDesc',
    path: '/numbers',
    modes: ['solo', 'online'],
    group: 'mind',
  },
];
