import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n';
import { Avatar, ProfileModal, TopBar } from '../ui/components';
import { setSettings, useProfile, useSettings, type Lang, type ThemeId } from './settings';
import { useState } from 'react';

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const t = useT();
  return (
    <div className="segmented">
      <button aria-pressed={value} onClick={() => onChange(true)}>
        {t('on')}
      </button>
      <button aria-pressed={!value} onClick={() => onChange(false)}>
        {t('off')}
      </button>
    </div>
  );
}

export function SettingsScreen() {
  const t = useT();
  const s = useSettings();
  const profile = useProfile();
  const navigate = useNavigate();
  const [editProfile, setEditProfile] = useState(false);
  return (
    <main className="screen">
      <TopBar title={t('settings')} />
      <button className="setting-row" onClick={() => setEditProfile(true)}>
        <Avatar emoji={profile.avatar} />
        <span className="grow" style={{ textAlign: 'left', fontWeight: 700 }}>
          {profile.name || t('yourName')}
        </span>
        ✏️
      </button>
      <div className="setting-row">
        <span>🎨 {t('theme')}</span>
        <div className="segmented">
          {(['classic', 'cute'] as ThemeId[]).map((theme) => (
            <button
              key={theme}
              aria-pressed={s.theme === theme}
              data-testid={`theme-${theme}`}
              onClick={() => setSettings({ theme })}
            >
              {theme === 'classic' ? t('themeClassic') : t('themeCute')}
            </button>
          ))}
        </div>
      </div>
      <div className="setting-row">
        <span>🔊 {t('sound')}</span>
        <Toggle value={s.sound} onChange={(sound) => setSettings({ sound })} />
      </div>
      <div className="setting-row">
        <span>🔠 {t('bigText')}</span>
        <Toggle value={s.bigText} onChange={(bigText) => setSettings({ bigText })} />
      </div>
      <div className="setting-row">
        <span>🌐 {t('language')}</span>
        <div className="segmented">
          {(['vi', 'en'] as Lang[]).map((lang) => (
            <button key={lang} aria-pressed={s.lang === lang} onClick={() => setSettings({ lang })}>
              {lang === 'vi' ? 'Tiếng Việt' : 'English'}
            </button>
          ))}
        </div>
      </div>
      <div className="grow" />
      <button className="btn secondary" onClick={() => navigate('/about')} data-testid="about">
        ℹ️ {t('about')} · {t('privacy')}
      </button>
      <button className="btn secondary" onClick={() => navigate('/debug')}>
        🪵 {t('debug')}
      </button>
      <div className="muted center" style={{ fontSize: 14 }}>
        v{__APP_VERSION__} · {__BUILD_TIME__}
      </div>
      {editProfile && (
        <ProfileModal onDone={() => setEditProfile(false)} onCancel={() => setEditProfile(false)} />
      )}
    </main>
  );
}
