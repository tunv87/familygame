import { useState } from 'react';
import { GAMES } from '../games/registry';
import { useT } from '../i18n';
import { Avatar, Modal, TopBar } from '../ui/components';
import {
  MAX_MEMBERS,
  addMember,
  leaderboard,
  removeMember,
  switchMember,
  updateMember,
  useFamily,
  type Member,
} from './family';
import { AVATARS, type Profile } from './settings';
import { useTheme } from './theme';

const MEDALS = ['🥇', '🥈', '🥉'];

/** Name + avatar for a new or existing family member. */
function MemberModal({ member, onClose }: { member?: Member; onClose: () => void }) {
  const t = useT();
  const [name, setName] = useState(member?.name ?? '');
  const [avatar, setAvatar] = useState(member?.avatar ?? AVATARS[0]);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const { family } = useFamily();
  const save = () => {
    const p: Profile = { name: name.trim(), avatar };
    if (member) updateMember(member.id, p);
    else addMember(p);
    onClose();
  };
  return (
    <Modal onClose={onClose}>
      <h2>{member ? t('familyEdit') : t('familyAdd')}</h2>
      <input
        className="text-input"
        value={name}
        maxLength={20}
        placeholder={t('namePlaceholder')}
        onChange={(e) => setName(e.target.value)}
        data-testid="member-name"
        autoFocus
      />
      <div className="muted">{t('pickAvatar')}</div>
      <div className="avatar-grid">
        {AVATARS.map((a) => (
          <button key={a} aria-pressed={a === avatar} onClick={() => setAvatar(a)}>
            {a}
          </button>
        ))}
      </div>
      <button className="btn" disabled={!name.trim()} onClick={save} data-testid="member-save">
        {t('save')}
      </button>
      {member && family.members.length > 1 && (
        <button
          className="btn secondary"
          data-testid="member-remove"
          onClick={() => {
            if (!confirmRemove) return setConfirmRemove(true);
            removeMember(member.id);
            onClose();
          }}
        >
          🗑️ {confirmRemove ? t('familyRemoveSure', { name: member.name }) : t('familyRemove')}
        </button>
      )}
    </Modal>
  );
}

/**
 * Family members on this device: who is playing now, add / edit / remove people, and the family
 * leaderboard (wins against the computer and online, per game).
 */
export function FamilyScreen() {
  const t = useT();
  const theme = useTheme();
  const { family, wins } = useFamily();
  const [editing, setEditing] = useState<Member | 'new' | null>(null);
  const board = leaderboard(family, wins);
  const anyWins = board.some((m) => m.total > 0);

  return (
    <main className="screen family">
      <TopBar title={t('family')} />
      <h2 className="section-title">{t('familyWhoPlays')}</h2>
      <div className="family-members" data-testid="family-members">
        {family.members.map((m) => (
          <div
            key={m.id}
            className={`family-member ${m.id === family.active ? 'active' : ''}`}
            data-testid={`member-${m.name}`}
          >
            <button
              className="family-pick"
              aria-pressed={m.id === family.active}
              onClick={() => switchMember(m.id)}
            >
              <Avatar emoji={m.avatar} />
              <span className="name">{m.name}</span>
              {m.id === family.active && <span className="family-now">{t('familyNow')}</span>}
            </button>
            <button
              className="icon-btn small"
              aria-label={t('familyEdit')}
              onClick={() => setEditing(m)}
            >
              ✏️
            </button>
          </div>
        ))}
        {family.members.length < MAX_MEMBERS && (
          <button
            className="btn secondary"
            onClick={() => setEditing('new')}
            data-testid="member-add"
          >
            ➕ {t('familyAdd')}
          </button>
        )}
      </div>

      <h2 className="section-title">🏆 {t('leaderboard')}</h2>
      <div className="leaderboard" data-testid="leaderboard">
        {board.length === 0 || !anyWins ? (
          <div className="muted center">{t('leaderboardEmpty')}</div>
        ) : (
          board.map((m, i) => (
            <div
              key={m.id}
              className="leader-row"
              data-testid={`leader-${i + 1}`}
              data-total={m.total}
            >
              <span className="leader-rank">{m.total > 0 ? (MEDALS[i] ?? i + 1) : ''}</span>
              <Avatar emoji={m.avatar} />
              <span className="leader-name">
                <b>{m.name}</b>
                <small>
                  {GAMES.filter((g) => m.wins[g.id])
                    .map((g) => `${theme.gameEmoji[g.id] ?? g.emoji} ${m.wins[g.id]}`)
                    .join('  ·  ')}
                </small>
              </span>
              <span className="leader-total">{m.total}</span>
            </div>
          ))
        )}
      </div>
      <p className="muted center" style={{ fontSize: 14 }}>
        {t('leaderboardHow')}
      </p>
      {editing && (
        <MemberModal
          member={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
}
