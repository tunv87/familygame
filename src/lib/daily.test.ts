import { beforeEach, describe, expect, it } from 'vitest';
import {
  dailySeed,
  dailyStatus,
  dayKey,
  finishDaily,
  previousDay,
  resetDailyForTests,
} from './daily';

const faster = (a: number, b: number) => a < b;

describe("[LG-33] today's challenge", () => {
  beforeEach(() => resetDailyForTests());

  it('same seed for the whole day, different per game and per day', () => {
    expect(dailySeed('numbers', '2026-11-28')).toBe(dailySeed('numbers', '2026-11-28'));
    expect(dailySeed('numbers', '2026-11-28')).not.toBe(dailySeed('noitu', '2026-11-28'));
    expect(dailySeed('numbers', '2026-11-28')).not.toBe(dailySeed('numbers', '2026-11-29'));
  });

  it('day keys and the day before (across months and years)', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(previousDay('2026-03-01')).toBe('2026-02-28');
    expect(previousDay('2027-01-01')).toBe('2026-12-31');
  });

  it("keeps today's best and counts days in a row", () => {
    expect(finishDaily('numbers', 30_000, faster, '2026-11-27').record.streak).toBe(1);
    const again = finishDaily('numbers', 40_000, faster, '2026-11-27');
    expect(again.improved).toBe(false);
    expect(again.record.best).toBe(30_000);
    expect(finishDaily('numbers', 25_000, faster, '2026-11-28').record.streak).toBe(2);
    expect(dailyStatus('numbers', '2026-11-28')).toMatchObject({ playedToday: true, streak: 2 });
    expect(dailyStatus('numbers', '2026-11-29')).toMatchObject({ playedToday: false, streak: 2 });
    // a day skipped: the streak starts again
    expect(dailyStatus('numbers', '2026-11-30').streak).toBe(0);
    expect(finishDaily('numbers', 20_000, faster, '2026-11-30').record.streak).toBe(1);
  });
});
