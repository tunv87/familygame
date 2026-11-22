import { load, save } from '../../lib/storage';
import type { NumbersLevel } from './logic';

type Records = Partial<Record<NumbersLevel, number>>;

export function getRecord(level: NumbersLevel): number | undefined {
  return load<Records>('numbers-records', {})[level];
}

/** Saves `ms` if it beats the current best; returns true for a new record. */
export function submitTime(level: NumbersLevel, ms: number): boolean {
  const all = load<Records>('numbers-records', {});
  const best = all[level];
  if (best !== undefined && best <= ms) return false;
  save('numbers-records', { ...all, [level]: ms });
  return true;
}

export function formatSeconds(ms: number): string {
  return (ms / 1000).toFixed(1);
}
