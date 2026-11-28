/**
 * Family members on this device and their wins (the family leaderboard).
 *
 * The active member is mirrored into the single profile (settings.ts) that every game already
 * reads, so games need no changes: switching member = changing the profile. Editing the profile
 * (e.g. the name dialog) updates the active member.
 *
 * Wins are counted for the active member when they beat the computer or win online.
 * Everything is stored on this device only.
 */
import { useSyncExternalStore } from 'react';
import { load, save } from '../lib/storage';
import type { GameId } from '../online/types';
import { AVATARS, getProfile, setProfile, subscribeProfile, type Profile } from './settings';

export interface Member extends Profile {
  id: string;
}
interface Family {
  members: Member[];
  active: string;
}
export type Wins = Record<string, Partial<Record<GameId, number>>>;

export const MAX_MEMBERS = 8;
const GAMES: GameId[] = ['numbers', 'caro', 'coganh', 'oanquan', 'noitu', 'cangua'];

const newId = () => `m${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

export function cleanFamily(f: Partial<Family> | null | undefined): Family {
  const members = (Array.isArray(f?.members) ? f.members : [])
    .filter((m) => m && typeof m.id === 'string' && typeof m.name === 'string' && m.name.trim())
    .slice(0, MAX_MEMBERS)
    .map((m) => ({
      id: m.id.slice(0, 32),
      name: m.name.slice(0, 20),
      avatar: AVATARS.includes(m.avatar) ? m.avatar : AVATARS[0],
    }));
  const active = members.some((m) => m.id === f?.active) ? f!.active! : (members[0]?.id ?? '');
  return { members, active };
}

export function cleanWins(w: unknown): Wins {
  const out: Wins = {};
  if (!w || typeof w !== 'object') return out;
  for (const [id, games] of Object.entries(w as Record<string, unknown>)) {
    if (!games || typeof games !== 'object') continue;
    const g: Partial<Record<GameId, number>> = {};
    for (const k of GAMES) {
      const n = (games as Record<string, unknown>)[k];
      if (typeof n === 'number' && Number.isInteger(n) && n > 0) g[k] = Math.min(n, 1e6);
    }
    out[id.slice(0, 32)] = g;
  }
  return out;
}

let family = cleanFamily(load<Family | null>('family', null));
let wins = cleanWins(load<Wins>('wins', {}));
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function setFamily(next: Family) {
  family = next;
  save('family', family);
  emit();
}

// First run with this feature: the existing profile becomes the first member.
{
  const p = getProfile();
  if (family.members.length === 0 && p.name) {
    const id = newId();
    setFamily({ members: [{ id, name: p.name, avatar: p.avatar }], active: id });
  }
}

// The profile changed (name dialog, settings): keep the active member in step.
subscribeProfile(() => {
  const p = getProfile();
  if (!p.name) return;
  const cur = family.members.find((m) => m.id === family.active);
  if (!cur) {
    if (family.members.length >= MAX_MEMBERS) return;
    const id = newId();
    setFamily({ members: [...family.members, { id, ...p }], active: id });
  } else if (cur.name !== p.name || cur.avatar !== p.avatar) {
    setFamily({
      ...family,
      members: family.members.map((m) => (m.id === cur.id ? { ...m, ...p } : m)),
    });
  }
});

export const getFamily = () => family;
export const getWins = () => wins;

export function switchMember(id: string) {
  const m = family.members.find((x) => x.id === id);
  if (!m) return;
  setFamily({ ...family, active: id });
  setProfile({ name: m.name, avatar: m.avatar });
}

/** Adds a member and makes them the one playing. */
export function addMember(p: Profile): boolean {
  if (family.members.length >= MAX_MEMBERS || !p.name.trim()) return false;
  const id = newId();
  setFamily({
    members: [...family.members, { id, name: p.name.trim().slice(0, 20), avatar: p.avatar }],
    active: family.active,
  });
  switchMember(id);
  return true;
}

export function updateMember(id: string, p: Profile) {
  if (!p.name.trim()) return;
  setFamily({
    ...family,
    members: family.members.map((m) =>
      m.id === id ? { ...m, name: p.name.trim().slice(0, 20), avatar: p.avatar } : m,
    ),
  });
  if (id === family.active) setProfile({ name: p.name.trim().slice(0, 20), avatar: p.avatar });
}

/** Removes a member and their wins (the last member cannot be removed). */
export function removeMember(id: string) {
  if (family.members.length <= 1) return;
  const members = family.members.filter((m) => m.id !== id);
  const wasActive = family.active === id;
  setFamily({ members, active: wasActive ? members[0].id : family.active });
  if (wasActive) switchMember(members[0].id);
  const rest = { ...wins };
  delete rest[id];
  wins = rest;
  save('wins', wins);
  emit();
}

/** The member playing now won a game (against the computer or online). */
export function recordWin(game: GameId) {
  const id = family.active;
  if (!id) return;
  const mine = wins[id] ?? {};
  wins = { ...wins, [id]: { ...mine, [game]: (mine[game] ?? 0) + 1 } };
  save('wins', wins);
  emit();
}

export const totalWins = (w: Partial<Record<GameId, number>> | undefined) =>
  GAMES.reduce((sum, g) => sum + (w?.[g] ?? 0), 0);

/** Members with their wins, most wins first. */
export function leaderboard(f: Family = family, w: Wins = wins) {
  return f.members
    .map((m) => ({ ...m, wins: w[m.id] ?? {}, total: totalWins(w[m.id]) }))
    .sort((a, b) => b.total - a.total);
}

let snapshot = { family, wins };
const getSnapshot = () => {
  if (snapshot.family !== family || snapshot.wins !== wins) snapshot = { family, wins };
  return snapshot;
};

export function useFamily() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
