import { describe, expect, it } from 'vitest';
import { cleanFamily, cleanWins, leaderboard } from './family';

describe('[LG-32] family members and leaderboard', () => {
  it('keeps only valid members and an active one that exists', () => {
    const f = cleanFamily({
      members: [
        { id: 'a', name: 'An', avatar: '🐰' },
        { id: 'b', name: '  ', avatar: '🐶' }, // no name
        { id: 'c', name: 'Bình', avatar: 'not an avatar' },
      ],
      active: 'zzz',
    });
    expect(f.members.map((m) => m.name)).toEqual(['An', 'Bình']);
    expect(f.members[1].avatar).toBe('🐶');
    expect(f.active).toBe('a');
    expect(cleanFamily(null)).toEqual({ members: [], active: '' });
  });

  it('keeps only whole positive win counts for known games', () => {
    expect(cleanWins({ a: { caro: 3, numbers: -1, chess: 9, noitu: 1.5 }, b: 'x' })).toEqual({
      a: { caro: 3 },
    });
  });

  it('ranks members by total wins', () => {
    const f = cleanFamily({
      members: [
        { id: 'a', name: 'An', avatar: '🐰' },
        { id: 'b', name: 'Bình', avatar: '🐶' },
      ],
      active: 'a',
    });
    const board = leaderboard(f, { a: { caro: 1 }, b: { caro: 2, noitu: 1 } });
    expect(board.map((m) => [m.name, m.total])).toEqual([
      ['Bình', 3],
      ['An', 1],
    ]);
  });
});
