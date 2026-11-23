import { load, save } from '../../lib/storage';
import type { NumbersLevel } from './logic';

type Records = Partial<Record<NumbersLevel, number>>;

const valid = (ms: unknown): ms is number =>
  typeof ms === 'number' && Number.isFinite(ms) && ms > 0;

export function getRecord(level: NumbersLevel): number | undefined {
  const ms = load<Records>('numbers-records', {})[level];
  return valid(ms) ? ms : undefined; // ignore corrupt saved values
}

/** Saves `ms` if it beats the current best; returns true for a new record. */
export function submitTime(level: NumbersLevel, ms: number): boolean {
  const all = load<Records>('numbers-records', {});
  const best = valid(all[level]) ? all[level] : undefined;
  if (best !== undefined && best <= ms) return false;
  save('numbers-records', { ...all, [level]: ms });
  return true;
}

export function formatSeconds(ms: number): string {
  return (ms / 1000).toFixed(1);
}
