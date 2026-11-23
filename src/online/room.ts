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
import { initialCaroState } from '../games/caro/online';
import { initialState as initialNumbersState, type NumbersLevel } from '../games/numbers/logic';
import { ensureAuth, getDb } from './firebase';
import { MAX_PLAYERS, ROOM_TTL_MS, type GameId, type Room, type RoomOptions } from './types';
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
  if (!players[uid] && Object.keys(players).length >= MAX_PLAYERS) throw new RoomError('full');
  if (!isHost && room.guestUid && room.guestUid !== uid) throw new RoomError('full');
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
      ...(isHost || room.guestUid === uid ? {} : { guestUid: uid }),
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

/** Subscribe to the room and keep our presence flag up to date. */
export function watchRoom(
  code: string,
  uid: string,
  onRoom: (room: Room | null) => void,
  onError: (e: Error) => void,
  onConnection: (connected: boolean) => void = () => {},
): Unsubscribe {
  const db = getDb();
  const meRef = ref(db, `rooms/${code}/players/${uid}`);
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
    void get(meRef)
      .then(async (me) => {
        if (!me.exists()) return;
        const online = ref(db, `rooms/${code}/players/${uid}/online`);
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

function newState(room: Room, round: number) {
  const uids = Object.entries(room.players ?? {})
    .sort((a, b) => a[1].joinedAt - b[1].joinedAt)
    .map(([u]) => u);
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
  return initialCaroState(room.options.size ?? 3, a, b);
}

/** Host only: start the first round once both players are present. */
export async function startGame(room: Room) {
  log.info('starting game', { code: room.code });
  await update(roomRef(room.code), {
    status: 'playing',
    round: 1,
    state: newState(room, 1),
    rematch: null,
  });
}

export async function requestRematch(code: string, uid: string) {
  await set(ref(getDb(), `rooms/${code}/rematch/${uid}`), true);
}

/** Host only: when both players asked for a rematch, start the next round. */
export async function startRematch(room: Room) {
  const round = (room.round ?? 1) + 1;
  log.info('rematch', { code: room.code, round });
  await update(roomRef(room.code), { round, state: newState(room, round), rematch: null });
}

export async function leaveRoom(code: string, uid: string) {
  const db = getDb();
  try {
    await onDisconnect(ref(db, `rooms/${code}/players/${uid}/online`)).cancel();
    const snap = await get(roomRef(code));
    const room = snap.val() as Room | null;
    const others = Object.keys(room?.players ?? {}).filter((u) => u !== uid);
    if (others.length === 0) await remove(roomRef(code));
    else
      await update(roomRef(code), {
        [`players/${uid}`]: null,
        ...(room?.guestUid === uid ? { guestUid: null } : {}),
      });
    log.info('left room', { code });
  } catch (e) {
    log.warn('leave failed', String(e));
  }
}

/** Run a game-state transaction; returns true if our change was committed. */
export async function transactState<S>(code: string, fn: (s: S) => S | null): Promise<boolean> {
  const res = await runTransaction(ref(getDb(), `rooms/${code}/state`), (cur: S | null) => {
    if (cur === null) return cur; // first pass may be null before cache warms; retried by SDK
    const next = fn(cur);
    return next === null ? undefined : next;
  });
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
