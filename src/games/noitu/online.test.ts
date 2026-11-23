import { describe, expect, it } from 'vitest';
import { makeDict, type Row } from './logic';
import {
  GRACE_MS,
  applyNoiTuLose,
  applyNoiTuWord,
  initialNoiTuState,
  toLocal,
  turnUidOf,
} from './online';

const dict = makeDict([
  ['học sinh', 'pupil', 1],
  ['sinh viên', 'student', 1],
  ['viên phấn', 'chalk', 1],
] as Row[]);

describe('[LG-24] Nối từ online', () => {
  it('turns alternate, words are checked, the clock restarts', () => {
    let s = initialNoiTuState('a', 'b', 'học sinh', 1000);
    expect(turnUidOf(s)).toBe('a');
    expect(applyNoiTuWord(s, 'b', 'viên', dict, 2000)).toBeNull(); // not b's turn
    expect(applyNoiTuWord(s, 'a', 'xyz', dict, 2000)).toBeNull(); // not a word
    s = applyNoiTuWord(s, 'a', 'vien', dict, 2000)!;
    expect(s.chain).toEqual(['học sinh', 'sinh viên']);
    expect(turnUidOf(s)).toBe('b');
    expect(s.deadline).toBe(2000 + 30_000);
    expect(applyNoiTuWord(s, 'b', 'sinh viên', dict, 3000)).toBeNull(); // wrong start
  });

  it('giving up or timing out loses; the opponent can claim only after the grace time', () => {
    const s = initialNoiTuState('a', 'b', 'học sinh', 0);
    expect(applyNoiTuLose(s, 'a', 'giveup', 10)!.winner).toBe('b');
    expect(applyNoiTuLose(s, 'b', 'giveup', 10)).toBeNull(); // b is not on turn
    expect(applyNoiTuLose(s, 'b', 'timeout', s.deadline + 1)).toBeNull(); // too early
    const c = applyNoiTuLose(s, 'b', 'timeout', s.deadline + GRACE_MS + 1)!;
    expect(c.winner).toBe('b');
    expect(c.reason).toBe('timeout');
    expect(applyNoiTuLose(c, 'a', 'giveup', 0)).toBeNull(); // already over
  });

  it('a corrupt chain is rejected instead of crashing', () => {
    const s = { ...initialNoiTuState('a', 'b', 'học sinh', 0), chain: [] as string[] };
    expect(applyNoiTuWord(s, 'a', 'viên', dict, 1)).toBeNull();
    expect(() => toLocal(s)).toThrow();
    const stored = JSON.parse(JSON.stringify(initialNoiTuState('a', 'b', 'học sinh', 0)));
    expect(toLocal(stored).chain).toEqual(['học sinh']);
  });
});
