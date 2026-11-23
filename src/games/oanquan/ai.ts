/**
 * Ô ăn quan computer player.
 *  - easy:   random move; takes the best capture only 30% of the time
 *  - medium: looks 2 turns ahead (my move, your best reply)
 *  - hard:   alpha-beta, 4 turns ahead
 * Evaluation = score difference + stones on own side (they are collected at the end).
 */
import { FIELDS, applyMove, legalMoves, other, type Move, type OAQState, type Side } from './logic';

export type OAQLevel = 'easy' | 'medium' | 'hard';
const DEPTH: Record<OAQLevel, number> = { easy: 1, medium: 2, hard: 4 };
const WIN = 10_000;

function evaluate(s: OAQState, me: Side): number {
  if (s.winner) return s.winner === 'draw' ? 0 : s.winner === me ? WIN : -WIN;
  const opp = other(me);
  const onSide = (side: Side) => FIELDS[side].reduce((a, i) => a + s.board[i], 0);
  return (s.score[me - 1] - s.score[opp - 1]) * 10 + (onSide(me) - onSide(opp)) * 3;
}

function search(s: OAQState, depth: number, alpha: number, beta: number, me: Side): number {
  if (depth === 0 || s.winner) return evaluate(s, me);
  const moves = legalMoves(s);
  if (!moves.length) return evaluate(s, me);
  const maximize = s.turn === me;
  let best = maximize ? -Infinity : Infinity;
  for (const m of moves) {
    const r = applyMove(s, m);
    if (!r) continue;
    const v = search(r.state, depth - 1, alpha, beta, me);
    if (maximize) {
      best = Math.max(best, v);
      alpha = Math.max(alpha, v);
    } else {
      best = Math.min(best, v);
      beta = Math.min(beta, v);
    }
    if (beta <= alpha) break;
  }
  return best;
}

export function chooseOAQMove(
  s: OAQState,
  level: OAQLevel,
  rand: () => number = Math.random,
): Move {
  const moves = legalMoves(s);
  if (!moves.length) throw new Error('no legal move');
  const me = s.turn;
  if (level === 'easy' && rand() >= 0.3) return moves[Math.floor(rand() * moves.length)];
  let best: Move[] = [];
  let bestV = -Infinity;
  for (const m of moves) {
    const r = applyMove(s, m)!;
    const v = search(r.state, DEPTH[level] - 1, -Infinity, Infinity, me);
    if (v > bestV) {
      bestV = v;
      best = [m];
    } else if (v === bestV) best.push(m);
  }
  return best[Math.floor(rand() * best.length)];
}
