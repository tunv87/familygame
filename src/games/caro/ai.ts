import { DIRS, other, winningLine, type CaroConfig, type Player, type Stone } from './logic';

export type AiLevel = 'easy' | 'medium' | 'hard';

/** Pick a move for `me`. `rand` is injectable for deterministic tests. */
export function chooseMove(
  board: readonly Stone[],
  cfg: CaroConfig,
  me: Player,
  level: AiLevel,
  rand: () => number = Math.random,
): number {
  const empties = board.flatMap((s, i) => (s === 0 ? [i] : []));
  if (empties.length === 0) throw new Error('board full');
  if (cfg.size <= 4) return smallMove(board, cfg, me, level, empties, rand);
  return bigMove(board, cfg, me, level, rand);
}

// ---------------------------------------------------------------------------
// Small board (3×3): perfect play via minimax; easier levels mix in randomness.

function findImmediate(board: Stone[], cfg: CaroConfig, p: Player, empties: number[]) {
  for (const i of empties) {
    board[i] = p;
    const win = winningLine(board, cfg, i);
    board[i] = 0;
    if (win) return i;
  }
  return -1;
}

function smallMove(
  src: readonly Stone[],
  cfg: CaroConfig,
  me: Player,
  level: AiLevel,
  empties: number[],
  rand: () => number,
): number {
  const board = src.slice();
  const pickRandom = () => empties[Math.floor(rand() * empties.length)];
  if (level === 'easy') {
    // Takes an obvious win half the time, otherwise random: beatable by a 7-year-old.
    const win = findImmediate(board, cfg, me, empties);
    return win >= 0 && rand() < 0.5 ? win : pickRandom();
  }
  if (level === 'medium') {
    const win = findImmediate(board, cfg, me, empties);
    if (win >= 0) return win;
    const block = findImmediate(board, cfg, other(me), empties);
    if (block >= 0 && rand() < 0.85) return block;
    return pickRandom();
  }
  let best = -Infinity;
  let bestMoves: number[] = [];
  for (const i of empties) {
    board[i] = me;
    const score = -negamax(board, cfg, other(me), i, 1);
    board[i] = 0;
    if (score > best) {
      best = score;
      bestMoves = [i];
    } else if (score === best) bestMoves.push(i);
  }
  return bestMoves[Math.floor(rand() * bestMoves.length)];
}

const memo = new Map<string, number>();

/** Score from the perspective of `toMove`, given that `last` was just played by the opponent. */
function negamax(
  board: Stone[],
  cfg: CaroConfig,
  toMove: Player,
  last: number,
  depth: number,
): number {
  if (winningLine(board, cfg, last)) return -(100 - depth);
  const key = board.join('') + toMove + depth;
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  let any = false;
  let best = -Infinity;
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== 0) continue;
    any = true;
    board[i] = toMove;
    best = Math.max(best, -negamax(board, cfg, other(toMove), i, depth + 1));
    board[i] = 0;
  }
  const result = any ? best : 0;
  memo.set(key, result);
  return result;
}

// ---------------------------------------------------------------------------
// Big board (15×15, 5 in a row): pattern-scoring heuristic.

const WIN = 10_000_000;

/** Value of the line formed through a cell if `p` played there, by run length and open ends. */
function patternScore(count: number, open: number, winLen: number): number {
  if (count >= winLen) return WIN;
  if (open === 0) return 0;
  const left = winLen - count; // stones still needed
  if (left === 1) return open === 2 ? 1_000_000 : 50_000; // open four is unstoppable
  if (left === 2) return open === 2 ? 40_000 : 2_000; // open three forces a reply
  if (left === 3) return open === 2 ? 1_500 : 150;
  return open === 2 ? 60 : 10;
}

/** Heuristic value of placing `p` at empty cell `idx`. Counts runs that allow one gap. */
export function cellScore(board: readonly Stone[], cfg: CaroConfig, idx: number, p: Player) {
  const { size, winLen } = cfg;
  const r0 = Math.floor(idx / size);
  const c0 = idx % size;
  let total = 0;
  let strongThreats = 0;
  for (const [dr, dc] of DIRS) {
    let count = 1;
    let open = 0;
    let gapUsed = false;
    for (const sign of [1, -1]) {
      let r = r0 + dr * sign;
      let c = c0 + dc * sign;
      while (true) {
        if (r < 0 || r >= size || c < 0 || c >= size) break;
        const s = board[r * size + c];
        if (s === p) {
          count++;
        } else if (s === 0) {
          // Allow a single gap ("X X_X") if a friendly stone follows it.
          const nr = r + dr * sign;
          const nc = c + dc * sign;
          const inside = nr >= 0 && nr < size && nc >= 0 && nc < size;
          if (!gapUsed && inside && board[nr * size + nc] === p && count + 1 < winLen) {
            gapUsed = true;
          } else {
            open++;
            break;
          }
        } else break;
        r += dr * sign;
        c += dc * sign;
      }
    }
    // A gapped run is only a win if contiguous; treat it as one stone weaker when it would "win".
    const effective = gapUsed && count >= winLen ? winLen - 1 : count;
    const s = patternScore(
      effective,
      gapUsed && count >= winLen ? Math.max(open, 1) : open,
      winLen,
    );
    if (s >= 40_000) strongThreats++;
    total += s;
  }
  // Two simultaneous threats (e.g. double open-three) are nearly as good as an open four.
  if (strongThreats >= 2 && total < 1_000_000) total += 500_000;
  return total;
}

function candidates(board: readonly Stone[], size: number, radius = 2): number[] {
  const out: number[] = [];
  let anyStone = false;
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== 0) {
      anyStone = true;
      continue;
    }
    const r0 = Math.floor(i / size);
    const c0 = i % size;
    search: for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const r = r0 + dr;
        const c = c0 + dc;
        if (r >= 0 && r < size && c >= 0 && c < size && board[r * size + c] !== 0) {
          out.push(i);
          break search;
        }
      }
    }
  }
  if (!anyStone) return [Math.floor(size / 2) * size + Math.floor(size / 2)];
  return out;
}

interface Scored {
  idx: number;
  attack: number;
  defense: number;
  value: number;
}

function rank(board: readonly Stone[], cfg: CaroConfig, me: Player, defenseWeight: number) {
  const opp = other(me);
  return candidates(board, cfg.size)
    .map<Scored>((idx) => {
      const attack = cellScore(board, cfg, idx, me);
      const defense = cellScore(board, cfg, idx, opp);
      // Winning now beats everything; blocking an opponent win comes next.
      const value =
        attack >= WIN
          ? attack * 10
          : defense >= WIN
            ? defense * 2
            : attack + defense * defenseWeight;
      return { idx, attack, defense, value };
    })
    .sort((a, b) => b.value - a.value);
}

function bigMove(
  src: readonly Stone[],
  cfg: CaroConfig,
  me: Player,
  level: AiLevel,
  rand: () => number,
): number {
  if (level === 'easy') {
    const ranked = rank(src, cfg, me, 0.6);
    if (ranked[0].attack >= WIN) return ranked[0].idx;
    // Often misses threats: picks among the top few, weighting toward weaker moves.
    const pool = ranked.slice(0, Math.min(6, ranked.length));
    return pool[Math.floor(rand() * pool.length)].idx;
  }
  if (level === 'medium') {
    const ranked = rank(src, cfg, me, 0.9);
    const top = ranked.filter((m) => m.value >= ranked[0].value * 0.9);
    return top[Math.floor(rand() * top.length)].idx;
  }
  // Hard: 2-ply. For each strong candidate, assume the opponent replies with their best move.
  const board = src.slice();
  const ranked = rank(board, cfg, me, 1.0);
  const first = ranked[0];
  if (first.attack >= WIN || first.defense >= WIN) return first.idx;
  const opp = other(me);
  let bestIdx = first.idx;
  let bestVal = -Infinity;
  for (const m of ranked.slice(0, 10)) {
    board[m.idx] = me;
    const reply = rank(board, cfg, opp, 1.0)[0];
    // My follow-up threat after their reply.
    let follow = 0;
    if (reply) {
      board[reply.idx] = opp;
      follow = rank(board, cfg, me, 1.0)[0]?.attack ?? 0;
      board[reply.idx] = 0;
    }
    board[m.idx] = 0;
    const replyThreat = reply ? reply.attack : 0;
    const val = m.attack * 1.0 + m.defense * 0.9 - replyThreat * 1.2 + follow * 0.5;
    if (val > bestVal) {
      bestVal = val;
      bestIdx = m.idx;
    }
  }
  return bestIdx;
}
