/**
 * Security-rules tests against the Firebase emulators (auth + database), using the same
 * modular SDK as the app. Each "user" is a separate Firebase app signed in anonymously.
 */
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import {
  connectDatabaseEmulator,
  get,
  getDatabase,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
  type Database,
} from 'firebase/database';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

const NS = 'demo-familygame-default-rtdb';
const DB_URL = `http://127.0.0.1:9000`;
const apps: FirebaseApp[] = [];

async function admin(method: 'PUT' | 'DELETE', path: string, body?: unknown) {
  const res = await fetch(`${DB_URL}/${path}.json?ns=${NS}`, {
    method,
    headers: { Authorization: 'Bearer owner' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`admin ${method} ${path}: ${res.status}`);
}

async function user(): Promise<{ uid: string; db: Database }> {
  const app = initializeApp(
    { apiKey: 'demo-key', projectId: 'demo-familygame', databaseURL: `${DB_URL}?ns=${NS}` },
    `u${apps.length}-${Math.random()}`,
  );
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getDatabase(app);
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
  const { user } = await signInAnonymously(auth);
  return { uid: user.uid, db };
}

async function anonymousDb(): Promise<Database> {
  const app = initializeApp(
    { projectId: 'demo-familygame', databaseURL: `${DB_URL}?ns=${NS}` },
    `anon-${Math.random()}`,
  );
  apps.push(app);
  const db = getDatabase(app);
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
  return db;
}

const ok = (p: Promise<unknown>) => expect(p).resolves.not.toThrow();
const denied = (p: Promise<unknown>) => expect(p).rejects.toThrow(/permission/i);

const room = (host: string, createdAt = Date.now()) => ({
  code: '1234',
  game: 'caro',
  options: { size: 3 },
  hostUid: host,
  createdAt,
  status: 'waiting',
  round: 0,
  players: { [host]: { name: 'An', avatar: '🐶', joinedAt: createdAt, online: true } },
});
const player = (name = 'Bình') => ({ name, avatar: '🐱', joinedAt: Date.now(), online: true });
const join = (u: { uid: string; db: Database }, name = 'Bình', code = '1234') =>
  update(ref(u.db, `rooms/${code}`), { [`players/${u.uid}`]: player(name), guestUid: u.uid });

beforeEach(() => admin('DELETE', ''));
afterAll(async () => {
  await Promise.all(apps.map((a) => deleteApp(a)));
});

describe('[SEC-01] rooms rules', () => {
  it('requires auth to read', async () => {
    const alice = await user();
    await admin('PUT', 'rooms/1234', room(alice.uid));
    await denied(get(ref(await anonymousDb(), 'rooms/1234')));
    await ok(get(ref((await user()).db, 'rooms/1234')));
  });

  it('lets a signed-in user create a room as host only, with a 4-digit code', async () => {
    const alice = await user();
    await ok(set(ref(alice.db, 'rooms/1234'), room(alice.uid)));
    await denied(set(ref(alice.db, 'rooms/5678'), room('mallory')));
    await denied(set(ref(alice.db, 'rooms/12a4'), room(alice.uid)));
  });

  it('cannot overwrite a fresh room, but can reuse a stale one', async () => {
    const [alice, bob] = [await user(), await user()];
    await admin('PUT', 'rooms/1234', room(alice.uid));
    await denied(set(ref(bob.db, 'rooms/1234'), room(bob.uid)));
    await admin('PUT', 'rooms/1234', room(alice.uid, Date.now() - 25 * 3600 * 1000));
    await ok(set(ref(bob.db, 'rooms/1234'), room(bob.uid)));
  });

  it('allows exactly one guest to join', async () => {
    const [alice, bob, carol] = [await user(), await user(), await user()];
    await admin('PUT', 'rooms/1234', room(alice.uid));
    // joining without claiming the guest seat is rejected
    await denied(set(ref(bob.db, `rooms/1234/players/${bob.uid}`), player()));
    await ok(join(bob));
    await denied(join(carol, 'Chi'));
    await denied(set(ref(carol.db, `rooms/1234/players/${carol.uid}`), player('Chi')));
    // bob can update his own presence later
    await ok(set(ref(bob.db, `rooms/1234/players/${bob.uid}/online`), false));
  });

  it('cannot join a missing room or impersonate someone', async () => {
    const [alice, bob] = [await user(), await user()];
    await denied(join(bob, 'Bình', '9999'));
    await admin('PUT', 'rooms/1234', room(alice.uid));
    await denied(update(ref(bob.db, 'rooms/1234'), { 'players/eve': player(), guestUid: 'eve' }));
  });

  it('validates player names', async () => {
    const [alice, bob] = [await user(), await user()];
    await admin('PUT', 'rooms/1234', room(alice.uid));
    await denied(join(bob, ''));
    await denied(join(bob, 'x'.repeat(21)));
    await ok(join(bob, 'Bình'));
  });

  it('only members can change game state', async () => {
    const [alice, bob, eve] = [await user(), await user(), await user()];
    await admin('PUT', 'rooms/1234', room(alice.uid));
    await ok(join(bob));
    await ok(update(ref(bob.db, 'rooms/1234'), { status: 'playing' }));
    await ok(set(ref(alice.db, 'rooms/1234/state'), { size: 3, xUid: alice.uid, oUid: bob.uid }));
    await denied(set(ref(eve.db, 'rooms/1234/state'), { hacked: true }));
    await denied(update(ref(bob.db, 'rooms/1234'), { status: 'bogus' }));
    await denied(update(ref(bob.db, 'rooms/1234'), { hostUid: bob.uid }));
  });

  it('members can leave and delete the room; strangers cannot', async () => {
    const [alice, bob, eve] = [await user(), await user(), await user()];
    await admin('PUT', 'rooms/1234', room(alice.uid));
    await ok(join(bob));
    await denied(remove(ref(eve.db, 'rooms/1234')));
    await ok(update(ref(bob.db, 'rooms/1234'), { [`players/${bob.uid}`]: null, guestUid: null }));
    await ok(remove(ref(alice.db, 'rooms/1234')));
  });

  it('nothing outside /rooms is readable or writable', async () => {
    const alice = await user();
    await denied(set(ref(alice.db, 'other'), 1));
    await denied(get(ref(alice.db, 'other')));
  });
});

describe('[SEC-06] players cannot tamper with each other', () => {
  it('a member cannot rename or remove the other player', async () => {
    const [alice, bob] = [await user(), await user()];
    await admin('PUT', 'rooms/1234', room(alice.uid));
    await ok(join(bob));
    await denied(set(ref(bob.db, `rooms/1234/players/${alice.uid}/name`), 'Hacked'));
    await denied(update(ref(bob.db, 'rooms/1234'), { [`players/${alice.uid}`]: null }));
    await denied(set(ref(alice.db, `rooms/1234/players/${bob.uid}`), player('Fake')));
  });

  it('a member cannot take the host role or give the seat to someone else', async () => {
    const [alice, bob] = [await user(), await user()];
    await admin('PUT', 'rooms/1234', room(alice.uid));
    await ok(join(bob));
    await denied(update(ref(bob.db, 'rooms/1234'), { hostUid: bob.uid }));
    await denied(update(ref(alice.db, 'rooms/1234'), { guestUid: 'mallory' }));
  });

  it('names must be text of at most 20 characters, even for members', async () => {
    const [alice, bob] = [await user(), await user()];
    await admin('PUT', 'rooms/1234', room(alice.uid));
    await ok(join(bob));
    await denied(set(ref(bob.db, `rooms/1234/players/${bob.uid}/name`), 12345));
    await denied(set(ref(bob.db, `rooms/1234/players/${bob.uid}/name`), 'x'.repeat(21)));
  });
});

describe('[SEC-07] rooms only hold game data (data minimisation)', () => {
  it('extra fields on a player or a room are rejected', async () => {
    const [alice, bob] = [await user(), await user()];
    await admin('PUT', 'rooms/1234', room(alice.uid));
    await ok(join(bob));
    await denied(set(ref(bob.db, `rooms/1234/players/${bob.uid}/email`), 'bob@example.com'));
    await denied(set(ref(alice.db, 'rooms/1234/phone'), '0900000000'));
  });

  it('the full game flow still works under the stricter rules', async () => {
    const [alice, bob] = [await user(), await user()];
    await ok(set(ref(alice.db, 'rooms/1234'), room(alice.uid)));
    await ok(join(bob));
    await ok(
      update(ref(alice.db, 'rooms/1234'), {
        status: 'playing',
        round: 1,
        state: { size: 3, xUid: alice.uid, oUid: bob.uid },
        rematch: null,
      }),
    );
    await ok(set(ref(bob.db, 'rooms/1234/state/moves'), [4]));
    await ok(set(ref(bob.db, `rooms/1234/rematch/${bob.uid}`), true));
    await denied(set(ref(bob.db, `rooms/1234/rematch/${alice.uid}`), true));
    await ok(set(ref(alice.db, 'rooms/1234/results/r1'), alice.uid));
    await ok(set(ref(bob.db, `rooms/1234/players/${bob.uid}/online`), false));
    await ok(update(ref(bob.db, 'rooms/1234'), { [`players/${bob.uid}`]: null, guestUid: null }));
    await ok(remove(ref(alice.db, 'rooms/1234')));
  });
});

describe('[SEC-08] game types', () => {
  it('Cờ gánh and Ô ăn quan rooms are allowed, unknown games are not', async () => {
    const alice = await user();
    await ok(
      set(ref(alice.db, 'rooms/1234'), { ...room(alice.uid), game: 'coganh', options: { v: 1 } }),
    );
    await admin('DELETE', '');
    await ok(
      set(ref(alice.db, 'rooms/1234'), { ...room(alice.uid), game: 'oanquan', options: { v: 1 } }),
    );
    await admin('DELETE', '');
    await ok(
      set(ref(alice.db, 'rooms/1234'), { ...room(alice.uid), game: 'noitu', options: { v: 1 } }),
    );
    await admin('DELETE', '');
    await denied(set(ref(alice.db, 'rooms/1234'), { ...room(alice.uid), game: 'chess' }));
  });
});

describe('[SEC-09] Nối từ word suggestions', () => {
  it('a signed-in player can send a two-syllable word, nothing else, and nobody can read them', async () => {
    const alice = await user();
    const s = push(ref(alice.db, 'suggestions'));
    await ok(set(s, { word: 'mèo mun', at: serverTimestamp() }));
    // cannot change or delete a suggestion once sent
    await denied(set(s, { word: 'mèo con', at: serverTimestamp() }));
    await denied(remove(s));
    // only the word and the time; a word of two syllables, at most 30 characters
    await denied(set(push(ref(alice.db, 'suggestions')), { word: 'mèo', at: serverTimestamp() }));
    await denied(set(push(ref(alice.db, 'suggestions')), { word: 'a b c', at: serverTimestamp() }));
    await denied(
      set(push(ref(alice.db, 'suggestions')), {
        word: 'mèo mun',
        at: serverTimestamp(),
        name: 'Alice',
      }),
    );
    await denied(set(push(ref(alice.db, 'suggestions')), { word: 'mèo mun', at: 1 }));
    // nobody can read them from the app (the owner reads them in the Firebase console)
    await denied(get(ref(alice.db, 'suggestions')));
    // signed-out clients cannot send any
    const anon = await anonymousDb();
    await denied(set(push(ref(anon, 'suggestions')), { word: 'mèo mun', at: serverTimestamp() }));
    await admin('DELETE', '');
  });
});

describe('[SEC-10] Cờ cá ngựa rooms of up to four', () => {
  const seat = (u: { uid: string; db: Database }, k: 'seat3' | 'seat4', name: string) =>
    update(ref(u.db, 'rooms/1234'), { [`players/${u.uid}`]: player(name), [k]: u.uid });
  it('a third and fourth player can join while waiting, one seat each', async () => {
    const [a, b, c, d, e] = [await user(), await user(), await user(), await user(), await user()];
    await ok(set(ref(a.db, 'rooms/1234'), { ...room(a.uid), game: 'cangua' }));
    await denied(seat(c, 'seat3', 'Chi')); // the guest seat comes first
    await ok(join(b));
    await denied(seat(b, 'seat3', 'Bình')); // already seated
    await ok(seat(c, 'seat3', 'Chi'));
    await denied(seat(d, 'seat3', 'Dũng')); // taken
    await ok(seat(d, 'seat4', 'Dũng'));
    await denied(seat(e, 'seat4', 'Em'));
    await denied(update(ref(e.db, 'rooms/1234'), { [`players/${e.uid}`]: player('Em') }));
    // leaving frees the seat
    await ok(update(ref(d.db, 'rooms/1234'), { [`players/${d.uid}`]: null, seat4: null }));
    await ok(update(ref(a.db, 'rooms/1234'), { status: 'playing' }));
    await denied(seat(e, 'seat4', 'Em')); // no joining a game that has started
  });
  it('other games keep two players', async () => {
    const [a, b, c] = [await user(), await user(), await user()];
    await ok(set(ref(a.db, 'rooms/1234'), room(a.uid)));
    await ok(join(b));
    await denied(seat(c, 'seat3', 'Chi'));
  });
});

describe('[SEC-11] play counter', () => {
  it('anyone can read; signed-in players can only add exactly one', async () => {
    const a = await user();
    const anon = await anonymousDb();
    const p = (db: Database, g = 'caro') => ref(db, `stats/plays/${g}`);
    await ok(set(p(a.db), 1)); // first play
    await ok(set(p(a.db), 2));
    await denied(set(p(a.db), 4)); // +2
    await denied(set(p(a.db), 1)); // going down
    await denied(set(p(a.db), '3')); // not a number
    await denied(remove(p(a.db)));
    await denied(set(p(a.db, 'chess'), 1)); // unknown game
    await denied(set(p(anon), 3)); // not signed in
    expect((await get(ref(anon, 'stats/plays'))).val()).toEqual({ caro: 2 });
    await denied(set(ref(a.db, 'stats/other'), 1));
  });
});
