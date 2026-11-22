import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAMES } from '../games/registry';
import { useT } from '../i18n';
import { Card, TopBar } from '../ui/components';
import { setSettings, useSettings } from './settings';
import { useTheme } from './theme';

export function Hub() {
  const t = useT();
  const navigate = useNavigate();
  const settings = useSettings();
  const theme = useTheme();
  const taps = useRef<number[]>([]);
  // Hidden shortcut: tap the title 5 times quickly to open the debug log.
  const onTitleTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((x) => now - x < 2000), now];
    if (taps.current.length >= 5) navigate('/debug');
  };
  return (
    <main className="screen">
      <TopBar
        noBack
        left={
          <button
            className="icon-btn"
            aria-label={t('theme')}
            data-testid="theme-toggle"
            onClick={() => setSettings({ theme: settings.theme === 'cute' ? 'classic' : 'cute' })}
          >
            {settings.theme === 'cute' ? '🎨' : '🎀'}
          </button>
        }
        title={`${theme.titleEmoji} ${t('appName')} ${theme.titleEmoji}`.trim()}
        onTitleTap={onTitleTap}
        right={
          <button
            className="icon-btn"
            aria-label={t('settings')}
            onClick={() => navigate('/settings')}
          >
            ⚙️
          </button>
        }
      />
      <div className="hub-grid">
        {GAMES.map((g) => (
          <Card
            key={g.id}
            className="hub-card"
            testId={`game-${g.id}`}
            emoji={theme.gameEmoji[g.id] ?? g.emoji}
            title={t(g.title)}
            hint={t(g.desc)}
            onClick={() => navigate(g.path)}
          />
        ))}
      </div>
      <div className="grow" />
      <Card
        emoji="🔑"
        title={t('joinRoom')}
        hint={t('joinRoomHint')}
        onClick={() => navigate('/join')}
        testId="hub-join"
      />
    </main>
  );
}
