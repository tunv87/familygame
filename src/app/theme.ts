import { useSettings, type ThemeId } from './settings';

export interface ThemeAssets {
  /** caro marks for X (first player) and O */
  x: string;
  o: string;
  confetti: string[];
  gameEmoji: Record<'numbers' | 'caro' | 'coganh' | 'oanquan', string>;
  /** hub title decoration */
  titleEmoji: string;
  themeColor: string;
}

export const THEMES: Record<ThemeId, ThemeAssets> = {
  classic: {
    x: '✕',
    o: '◯',
    confetti: ['🎉', '⭐', '🎈', '✨', '🏆'],
    gameEmoji: { numbers: '🔢', caro: '⭕', coganh: '⚫', oanquan: '🪨' },
    titleEmoji: '',
    themeColor: '#ffb703',
  },
  cute: {
    x: '💖',
    o: '⭐',
    confetti: ['💖', '🌸', '🦄', '✨', '🎀'],
    gameEmoji: { numbers: '🦄', caro: '💖', coganh: '🌸', oanquan: '🐚' },
    titleEmoji: '🎀',
    themeColor: '#ff8fc8',
  },
};

export function useTheme(): ThemeAssets {
  return THEMES[useSettings().theme];
}
