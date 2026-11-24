import { describe, expect, it } from 'vitest';
import { cleanConfig, gameStatus, modeStatus } from './gameConfig';

describe('[LG-31] game and mode availability', () => {
  it('reads on / off / hidden for games and their modes; anything else counts as on', () => {
    const c = cleanConfig({
      caro: { status: 'off' },
      noitu: { status: 'on', modes: { online: 'hidden', solo: 'off', local: 'banana' } },
      oanquan: { status: 'nope' },
      junk: 5,
    });
    expect(gameStatus(c, 'caro')).toBe('off');
    expect(gameStatus(c, 'oanquan')).toBe('on');
    expect(gameStatus(c, 'coganh')).toBe('on'); // not configured
    expect(modeStatus(c, 'noitu', 'online')).toBe('hidden');
    expect(modeStatus(c, 'noitu', 'solo')).toBe('off');
    expect(modeStatus(c, 'noitu', 'local')).toBe('on');
    expect(modeStatus(c, 'caro', 'local')).toBe('off'); // the game is off: so are its modes
    expect(cleanConfig(null)).toEqual({});
    expect(cleanConfig('x')).toEqual({});
  });
});
