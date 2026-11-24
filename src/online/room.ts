import {
  get,
  onDisconnect,
  onValue,
  ref,
  remove,
  runTransaction,
  set,
  update,
  type Unsubscribe,
} from 'firebase/database';
import { createLogger } from '../lib/logger';
import { randomSeed } from '../lib/rng';
import { initialCaNguaState } from '../games/cangua/online';
import { initialCaroState } from '../games/caro/online';
import { initialCoGanhState } from '../games/coganh/online';
import { initialOAQState } from '../games/oanquan/online';
import { loadDict } from '../games/noitu/dict';
import { startWord } from '../games/noitu/logic';
import { initialNoiTuState } from '../games/noitu/online';
import { initialState as initialNumbersState, type NumbersLevel } from '../games/numbers/logic';
import { ensureAuth, getDb, serverNow } from './firebase';
import { countPlay } from './plays';
import { ROOM_TTL_MS, maxPlayers, type GameId, type Room, type RoomOptions } from './types';
import type { Profile } from '../app/settings';

const log = createLogger('room');

export class RoomError extends Error {
  constructor(
    public code: 'notFound' | 'full' | 'noCode',
    msg?: string,
  ) {
    super(msg ?? code);
  }
}

const roomRef = (code: string) => ref(getDb(), `rooms/${code}`);

function randomCode(): string {
  return String(1000 + Math.floor(Math.random() * 9000));
}

export async function createRoom(game: GameId, options: RoomOptions, profile: Profile) {
  const uid = await ensureAuth();
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = randomCode();
    const now = Date.now();
    const room: Room = {
      code,
      game,
      options,
      hostUid: uid,
      createdAt: now,
      status: 'waiting',
      round: 0,
      players: {
        [uid]: { name: profile.name, avatar: profile.avatar, joinedAt: now, online: true },
      },
    };
    try {
      const res = await runTransaction(
        roomRef(code),
        (cur: Room | null) => {
          if (cur && now - (cur.createdAt ?? 0) < ROOM_TTL_MS) return; // taken → abort
          return room;
        },
        { applyLocally: false },
      );
      if (res.committed) {
        log.info('room created', { code, game, options });
        return code;
      }
    } catch (e) {
      log.warn('create attempt failed', { code, e: String(e) });
    }
  }
  throw new RoomError('noCode', 'could not allocate a room code');
}

export async function joinRoom(code: string, profile: Profile) {
  const uid = await ensureAuth();
  const snap = await get(roomRef(code));
  const room = snap.val() as Room | null;
  if (!room || Date.now() - room.createdAt > ROOM_TTL_MS) throw new RoomError('notFound');
  const players = room.players ?? {};
  const isHost = room.hostUid === uid;
  const member = !!players[uid];
  const seats = ['guestUid', 'seat3', 'seat4'] as const;
  const mine = seats.find((k) => room[k] === uid);
  // the seat to claim: the guest seat, then (Cờ cá ngựa, before the game starts) seats 3 and 4
  const free = isHost || mine ? undefined : seats.find((k) => !room[k]);
  const noSeat =
    !member &&
    !isHost &&
    !mine &&
    (Object.keys(players).length >= maxPlayers(room.game) ||
      !free ||
      (free !== 'guestUid' && (room.game !== 'cangua' || room.status !== 'waiting')));
  if (noSeat) return watchAs(code, uid, profile, room);
  const me = {
    name: profile.name,
    avatar: profile.avatar,
    joinedAt: players[uid]?.joinedAt ?? Date.now(),
    online: true,
  };
  // Claim the guest seat and add ourselves in one atomic multi-path update.
  try {
    await update(roomRef(code), {
      [`players/${uid}`]: me,
      ...(free ? { [free]: uid } : {}),
    });
  } catch (e) {
    // A second, concurrent join from this device (double tap, re-render) loses the
    // race for the seat to the first one: that is a success, not an error.
    const after = (await get(roomRef(code))).val() as Room | null;
    if (!after?.players?.[uid]) throw e;
    log.info('already joined', { code });
  }
  log.info('joined room', { code });
  return uid;
}

/** No seat left (or the game has started): join as a spectator, who only watches. */
async function watchAs(code: string, uid: string, profile: Profile, room: Room) {
  const me = {
    name: profile.name,
    avatar: profile.avatar,
    joinedAt: room.spectators?.[uid]?.joinedAt ?? Date.now(),
    online: true,
  };
  await set(ref(getDb(), `rooms/${code}/spectators/${uid}`), me);
  log.info('watching room', { code });
  return uid;
}

/** Subscribe to the room and keep our presence flag up to date. */
export function watchRoom(
  code: string,
  uid: string,
  onRoom: (room: Room | null) => void,
  onError: (e: Error) => void,
  onConnection: (connected: boolean) => void = () => {},
): Unsubscribe {
  const db = getDb();
  const playerRef = ref(db, `rooms/${code}/players/${uid}`);
  const watcherRef = ref(db, `rooms/${code}/spectators/${uid}`);
  const unsubRoom = onValue(
    roomRef(code),
    (snap) => onRoom(snap.val() as Room | null),
    (e) => {
      log.error('room listener error', e);
      onError(e);
    },
  );
  const unsubConn = onValue(ref(db, '.info/connected'), (snap) => {
    if (snap.val() !== true) {
      log.warn('disconnected');
      onConnection(false);
      return;
    }
    log.info('connected');
    onConnection(true);
    // Only members have a presence flag: check first, so visiting someone else's
    // room (or a bad link) never attempts a write the rules will reject.
    void Promise.all([get(playerRef), get(watcherRef)])
      .then(async ([asPlayer, asWatcher]) => {
        if (!asPlayer.exists() && !asWatcher.exists()) return;
        const where = asPlayer.exists() ? 'players' : 'spectators';
        const online = ref(db, `rooms/${code}/${where}/${uid}/online`);
        await onDisconnect(online).set(false);
        await set(online, true);
      })
      .catch((e) => log.warn('presence setup failed', String(e)));
  });
  return () => {
    unsubRoom();
    unsubConn();
  };
}

async function newState(room: Room, round: number) {
  const uids = Object.entries(room.players ?? {})
    .sort((a, b) => a[1].joinedAt - b[1].joinedAt)
    .map(([u]) => u);
  if (room.game === 'cangua') return initialCaNguaState(uids, randomSeed(), round - 1);
  if (room.game === 'numbers') {
    return initialNumbersState(
      (room.options.level ?? 'easy') as NumbersLevel,
      randomSeed(),
      uids,
      Date.now(),
    );
  }
  // Alternate who plays X (first) each round.
  const [a, b] = round % 2 === 1 ? uids : [uids[1], uids[0]]; // host is X in round 1
  if (room.game === 'coganh') return initialCoGanhState(a, b); // a = Black, moves first
  if (room.game === 'oanquan') return initialOAQState(a, b); // a moves first
  if (room.game === 'noitu') {
    const { dict, words } = await loadDict();
    return initialNoiTuState(a, b, startWord(dict, words), serverNow()); // a answers first
  }
  return initialCaroState(room.options.size ?? 3, a, b);
}

/** Host only: start the first round once the players are present. */
export async function startGame(room: Room) {
  log.info('starting game', { code: room.code });
  await update(roomRef(room.code), {
    status: 'playing',
    round: 1,
    state: await newState(room, 1),
    rematch: null,
  });
  countPlay(room.game); // one play per online round, counted by the host
}

export async function requestRematch(code: string, uid: string) {
  await set(ref(getDb(), `rooms/${code}/rematch/${uid}`), true);
}

/** Host only: when every player asked for a rematch, start the next round. */
export async function startRematch(room: Room) {
  const round = (room.round ?? 1) + 1;
  log.info('rematch', { code: room.code, round });
  await update(roomRef(room.code), { round, state: await newState(room, round), rematch: null });
  countPlay(room.game);
}

export async function leaveRoom(code: string, uid: string) {
  const db = getDb();
  try {
    await onDisconnect(ref(db, `rooms/${code}/players/${uid}/online`)).cancel();
    await onDisconnect(ref(db, `rooms/${code}/spectators/${uid}/online`)).cancel();
    const snap = await get(roomRef(code));
    const room = snap.val() as Room | null;
    if (room?.spectators?.[uid] && !room.players?.[uid]) {
      await remove(ref(db, `rooms/${code}/spectators/${uid}`));
      log.info('stopped watching', { code });
      return;
    }
    const others = Object.keys(room?.players ?? {}).filter((u) => u !== uid);
    if (others.length === 0) await remove(roomRef(code));
    else
      await update(roomRef(code), {
        [`players/${uid}`]: null,
        ...(room?.guestUid === uid ? { guestUid: null } : {}),
        ...(room?.seat3 === uid ? { seat3: null } : {}),
        ...(room?.seat4 === uid ? { seat4: null } : {}),
      });
    log.info('left room', { code });
  } catch (e) {
    log.warn('leave failed', String(e));
  }
}

/** Run a game-state transaction; returns true if our change was committed. */
export async function transactState<S>(code: string, fn: (s: S) => S | null): Promise<boolean> {
  const run = () =>
    runTransaction(ref(getDb(), `rooms/${code}/state`), (cur: S | null) => {
      if (cur === null) return cur; // first pass may be null before cache warms; retried by SDK
      const next = fn(cur);
      return next === null ? undefined : next;
    });
  let res;
  try {
    res = await run();
  } catch (e) {
    // The connection dropped while the move was on its way (bad mobile signal): the SDK
    // aborts with "disconnect". Send it once more instead of losing the player's move.
    if (!/disconnect/i.test(String(e))) throw e;
    log.warn('move interrupted by a disconnect, retrying');
    await new Promise((r) => setTimeout(r, 500));
    res = await run();
  }
  return res.committed && res.snapshot.exists();
}

/** Record a round result (idempotent: both clients may write the same value). */
export async function recordResult(code: string, round: number, winner: string) {
  await set(ref(getDb(), `rooms/${code}/results/r${round}`), winner);
}

export function winsOf(room: Room, uid: string): number {
  return Object.values(room.results ?? {}).filter((w) => w === uid).length;
}

export function shareUrl(code: string): string {
  return `${location.origin}${import.meta.env.BASE_URL}#/join/${code}`;
}
