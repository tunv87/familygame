import { useState } from 'react';
import { useT } from '../i18n';
import { load, save } from '../lib/storage';
import { sfx } from '../lib/sound';
import { Modal } from '../ui/components';
import {
  AVATARS,
  getProfile,
  setProfile,
  setSettings,
  useSettings,
  type ThemeId,
} from './settings';

const KEY = 'onboarded';

export function needsWelcome(): boolean {
  return !load(KEY, { done: false }).done;
}

/** First-launch screen: optional name, avatar and theme (applied live). */
export function Welcome({ onDone }: { onDone: () => void }) {
  const t = useT();
  const settings = useSettings();
  const [name, setName] = useState(getProfile().name);
  const [avatar, setAvatar] = useState(getProfile().avatar);
  const finish = () => {
    sfx.unlock();
    sfx.good();
    setProfile({ name: name.trim(), avatar });
    save(KEY, { done: true });
    onDone();
  };
  const themes: [ThemeId, string, string][] = [
    ['classic', '🎲', t('themeClassic')],
    ['cute', '🦄', t('themeCute')],
  ];
  return (
    <Modal>
      <h2 data-testid="welcome">{t('welcomeTitle')}</h2>
      <div className="muted">{t('welcomeSub')}</div>
      <div className="muted">{t('welcomeName')}</div>
      <input
        className="text-input"
        value={name}
        maxLength={20}
        placeholder={t('namePlaceholder')}
        onChange={(e) => setName(e.target.value)}
        data-testid="welcome-name"
      />
      <div className="avatar-grid compact">
        {AVATARS.map((a) => (
          <button key={a} aria-pressed={a === avatar} onClick={() => setAvatar(a)}>
            {a}
          </button>
        ))}
      </div>
      <div className="muted">{t('welcomeTheme')}</div>
      <div className="theme-pick">
        {themes.map(([id, emoji, label]) => (
          <button
            key={id}
            aria-pressed={settings.theme === id}
            className={`theme-option ${id}`}
            data-testid={`welcome-theme-${id}`}
            onClick={() => setSettings({ theme: id })}
          >
            <span className="emoji">{emoji}</span>
            {label}
          </button>
        ))}
      </div>
      <button className="btn" onClick={finish} data-testid="welcome-start">
        ▶️ {t('welcomeStart')}
      </button>
    </Modal>
  );
}
