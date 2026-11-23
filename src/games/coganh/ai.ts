/**
 * Cờ gánh computer player.
 *  - easy:   random move, takes a Gánh only half of the time
 *  - medium: looks 2 plies ahead
 *  - hard:   alpha-beta, 4 plies, captures searched first
 * Always plays a legal move, so a pending Mở (forced Gánh) is respected.
 */
import {
  ADJ,
  N,
  captureMoves,
  count,
  ganhPairs,
  legalMoves,
  movesFor,
  other,
  trappedGroups,
  type Cell,
  type CoGanhState,
  type Move,
  type Side,
} from './logic';

export type CoGanhLevel = 'easy' | 'medium' | 'hard';
const DEPTH: Record<CoGanhLevel, number> = { easy: 0, medium: 2, hard: 4 };
const WIN = 100_000;

interface Node {
  board: Cell[];
  turn: Side;
  forced: Move[];
}

const keyOf = (m: Move) => m.from * N + m.to;

/** Same rules as applyMove, without the draw/history bookkeeping (search only). */
function step(n: Node, m: Move): { node: Node; gained: number } {
  const side = n.turn;
  const opp = other(side);
  const b = n.board.slice();
  b[m.to] = side;
  b[m.from] = 0;
  let gained = 0;
  for (const p of ganhPairs(b, m.to, side).flat()) {
    b[p] = side;
    gained++;
  }
  for (const p of trappedGroups(b, opp).flat()) {
    b[p] = side;
    gained++;
  }
  const before = new Set(captureMoves(n.board, opp).map(keyOf));
  const forced = captureMoves(b, opp).filter((x) => !before.has(keyOf(x)));
  return { node: { board: b, turn: opp, forced }, gained };
}

const moves = (n: Node) => (n.forced.length ? n.forced : movesFor(n.board, n.turn));

/** Score for `me`: pieces matter most, then freedom to move. */
function evaluate(b: Cell[], me: Side): number {
  const opp = other(me);
  const mine = count(b, me);
  const theirs = count(b, opp);
  if (theirs === 0) return WIN;
  if (mine === 0) return -WIN;
  let mobility = 0;
  for (let i = 0; i < N; i++) {
    if (b[i] === 0) continue;
    const free = ADJ[i].reduce((k, j) => k + (b[j] === 0 ? 1 : 0), 0);
    mobility += b[i] === me ? free : -free;
  }
  return (mine - theirs) * 100 + mobility * 2;
}

function negamax(n: Node, depth: number, alpha: number, beta: number): number {
  const opp = other(n.turn);
  if (count(n.board, opp) === 0) return WIN + depth;
  if (count(n.board, n.turn) === 0) return -WIN - depth;
  if (depth === 0) return evaluate(n.board, n.turn);
  const children = moves(n).map((m) => step(n, m));
  if (children.length === 0) return -WIN; // cannot happen (R3), guard only
  children.sort((a, b) => b.gained - a.gained); // captures first → better pruning
  let best = -Infinity;
  for (const c of children) {
    const v = -negamax(c.node, depth - 1, -beta, -alpha);
    if (v > best) best = v;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

export function chooseCoGanhMove(
  s: CoGanhState,
  level: CoGanhLevel,
  rand: () => number = Math.random,
): Move {
  const legal = legalMoves(s);
  if (legal.length === 0) throw new Error('no legal move');
  const pick = <T>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const root: Node = { board: s.board, turn: s.turn, forced: s.forced };

  if (level === 'easy') {
    const scored = legal.map((m) => ({ m, gained: step(root, m).gained }));
    const best = Math.max(...scored.map((x) => x.gained));
    if (best > 0 && rand() < 0.5) return pick(scored.filter((x) => x.gained === best)).m;
    return pick(legal);
  }

  let bestScore = -Infinity;
  let bestMoves: Move[] = [];
  const children = legal.map((m) => ({ m, ...step(root, m) }));
  children.sort((a, b) => b.gained - a.gained);
  for (const c of children) {
    const v = -negamax(c.node, DEPTH[level] - 1, -Infinity, -bestScore + 1);
    if (v > bestScore) {
      bestScore = v;
      bestMoves = [c.m];
    } else if (v === bestScore) bestMoves.push(c.m);
  }
  return pick(bestMoves);
}
