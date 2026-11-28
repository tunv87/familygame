import { describe, expect, it } from 'vitest';
import { allReady, type RoomPlayer } from './types';

const p: RoomPlayer = { name: 'x', avatar: '🙂', joinedAt: 0, online: true };

describe('[LG-35] online waiting room: everyone ready', () => {
  it('needs at least two players, each of them ready', () => {
    expect(allReady({ players: { a: p }, ready: { a: true } })).toBe(false); // alone
    expect(allReady({ players: { a: p, b: p } })).toBe(false);
    expect(allReady({ players: { a: p, b: p }, ready: { a: true } })).toBe(false);
    expect(allReady({ players: { a: p, b: p }, ready: { a: true, b: true } })).toBe(true);
  });

  it('a ready flag left by someone who has gone does not count; a newcomer must tap Ready', () => {
    // b was ready and left (flag not cleaned up yet); c joined
    expect(allReady({ players: { a: p, c: p }, ready: { a: true, b: true } })).toBe(false);
    expect(allReady({ players: { a: p, c: p }, ready: { a: true, b: true, c: true } })).toBe(true);
  });

  it('Cờ cá ngựa: the host who taps Start need not tap Ready, everyone else must', () => {
    const players = { host: p, b: p, c: p };
    expect(allReady({ players, ready: { b: true } }, 'host')).toBe(false);
    expect(allReady({ players, ready: { b: true, c: true } }, 'host')).toBe(true);
    expect(allReady({ players: { host: p } }, 'host')).toBe(false); // nobody to play with
  });

  it('only a real true counts as ready', () => {
    const ready = { a: true, b: 'yes' } as unknown as Record<string, boolean>;
    expect(allReady({ players: { a: p, b: p }, ready })).toBe(false);
  });
});
