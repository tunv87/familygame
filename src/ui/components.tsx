import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AVATARS, getProfile, setProfile, useProfile, type Profile } from '../app/settings';
import { useT, type MessageKey } from '../i18n';
import { sfx } from '../lib/sound';
import { useTheme } from '../app/theme';
import { pushBackHandler } from '../lib/native';

/** While mounted (and `active`), the Android back button calls `handler` instead of going back. */
export function useBackHandler(handler: () => void, active = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!active) return;
    return pushBackHandler(() => ref.current());
  }, [active]);
}

export function TopBar({
  title,
  onBack,
  right,
  onTitleTap,
  noBack,
  left,
}: {
  title: string;
  noBack?: boolean;
  left?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
  onTitleTap?: () => void;
}) {
  const t = useT();
  const navigate = useNavigate();
  return (
    <header className="topbar">
      {!noBack ? (
        <button
          className="icon-btn"
          aria-label={t('back')}
          onClick={() => {
            sfx.tap();
            if (onBack) onBack();
            else navigate(-1);
          }}
        >
          ⬅️
        </button>
      ) : (
        (left ?? <span style={{ width: 'var(--tap)' }} />)
      )}
      <h1 onClick={onTitleTap}>{title}</h1>
      {right ?? <span style={{ width: 'var(--tap)' }} />}
    </header>
  );
}

export function Card({
  emoji,
  title,
  hint,
  onClick,
  className = '',
  testId,
}: {
  emoji: string;
  title: string;
  hint?: string;
  onClick: () => void;
  className?: string;
  testId?: string;
}) {
  return (
    <button
      className={`card ${className}`}
      data-testid={testId}
      onClick={() => {
        sfx.unlock();
        sfx.tap();
        onClick();
      }}
    >
      <span className="emoji" aria-hidden>
        {emoji}
      </span>
      <span>
        <div className="title">{title}</div>
        {hint ? <div className="hint">{hint}</div> : null}
      </span>
    </button>
  );
}

export function Modal({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function Avatar({ emoji }: { emoji: string }) {
  return <span className="avatar">{emoji}</span>;
}

export function HelpButton({ steps }: { steps: [string, MessageKey][] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="icon-btn" aria-label={t('help')} onClick={() => setOpen(true)}>
        ❓
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <h2>{t('help')}</h2>
          <div className="help-steps">
            {steps.map(([emoji, key], i) => (
              <div key={key}>
                <b>{i + 1}</b>
                <span>
                  {emoji} {t(key)}
                </span>
              </div>
            ))}
          </div>
          <button className="btn" onClick={() => setOpen(false)}>
            {t('ok')}
          </button>
        </Modal>
      )}
    </>
  );
}

export function Confetti() {
  const { confetti } = useTheme();
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        dur: 2 + Math.random() * 1.5,
        emoji: confetti[i % confetti.length],
      })),
    [confetti],
  );
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

/** "Leave this game?" confirmation so a stray tap doesn't end a game in progress. */
export function ExitConfirm({
  hint,
  onConfirm,
  onCancel,
}: {
  hint?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  useBackHandler(onCancel);
  return (
    <Modal onClose={onCancel}>
      <h2>🚪 {t('exitConfirm')}</h2>
      {hint && <div className="muted">{hint}</div>}
      <div className="stack">
        <button className="btn" onClick={onCancel} data-testid="keep-playing">
          ▶️ {t('keepPlaying')}
        </button>
        <button className="btn secondary" onClick={onConfirm} data-testid="confirm-exit">
          🚪 {t('exitGame')}
        </button>
      </div>
    </Modal>
  );
}

/** Result dialog shown at the end of a round. */
export function ResultModal({
  title,
  win,
  children,
  actions,
}: {
  title: string;
  win?: boolean;
  children?: ReactNode;
  actions: ReactNode;
}) {
  useEffect(() => {
    if (win === true) sfx.win();
    else if (win === false) sfx.lose();
  }, [win]);
  return (
    <>
      {win && <Confetti />}
      <Modal>
        <h2 data-testid="result-title">{title}</h2>
        {children}
        <div className="stack">{actions}</div>
      </Modal>
    </>
  );
}

/** Ask for name + avatar the first time an online feature is used. */
export function ProfileModal({
  onDone,
  onCancel,
}: {
  onDone: (p: Profile) => void;
  onCancel?: () => void;
}) {
  const t = useT();
  const current = useProfile();
  const [name, setName] = useState(current.name);
  const [avatar, setAvatar] = useState(current.avatar);
  const valid = name.trim().length > 0;
  return (
    <Modal onClose={onCancel}>
      <h2>{t('yourName')}</h2>
      <input
        className="text-input"
        value={name}
        maxLength={20}
        placeholder={t('namePlaceholder')}
        onChange={(e) => setName(e.target.value)}
        data-testid="name-input"
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
      <button
        className="btn"
        disabled={!valid}
        data-testid="save-profile"
        onClick={() => {
          setProfile({ name: name.trim(), avatar });
          onDone(getProfile());
        }}
      >
        {t('save')}
      </button>
    </Modal>
  );
}

/** Runs `action` immediately if a profile exists, otherwise asks for one first. */
export function useProfileGate() {
  const [pending, setPending] = useState<((p: Profile) => void) | null>(null);
  const gate = (action: (p: Profile) => void) => {
    const p = getProfile();
    if (p.name) action(p);
    else setPending(() => action);
  };
  const modal = pending ? (
    <ProfileModal
      onCancel={() => setPending(null)}
      onDone={(p) => {
        const fn = pending;
        setPending(null);
        fn(p);
      }}
    />
  ) : null;
  return { gate, modal };
}
