import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAMES, GROUPS } from '../games/registry';
import { useT } from '../i18n';
import { Card, TopBar } from '../ui/components';
import { PlayCount } from '../ui/PlayCount';
import { gameStatus, useGamesConfig } from './gameConfig';
import { setSettings, useSettings } from './settings';
import { useTheme } from './theme';
import { Welcome, needsWelcome } from './Welcome';

export function Hub() {
  const t = useT();
  const navigate = useNavigate();
  const settings = useSettings();
  const theme = useTheme();
  const config = useGamesConfig();
  const taps = useRef<number[]>([]);
  const [welcome, setWelcome] = useState(needsWelcome);
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
      {GROUPS.map((grp) => {
        const games = GAMES.filter(
          (g) => g.group === grp.id && gameStatus(config, g.id) !== 'hidden',
        );
        if (games.length === 0) return null;
        return (
          <section key={grp.id} className="hub-group" data-testid={`group-${grp.id}`}>
            <h2 className="hub-group-title">
              {grp.emoji} {t(grp.title)}
            </h2>
            <div className="hub-grid">
              {games.map((g) => (
                <Card
                  key={g.id}
                  className="hub-card"
                  testId={`game-${g.id}`}
                  emoji={theme.gameEmoji[g.id] ?? g.emoji}
                  title={t(g.title)}
                  hint={t(g.desc)}
                  off={gameStatus(config, g.id) === 'off' ? t('gameOff') : undefined}
                  onClick={() => navigate(g.path)}
                />
              ))}
            </div>
          </section>
        );
      })}
      {welcome && <Welcome onDone={() => setWelcome(false)} />}
      <div className="grow" />
      <PlayCount />
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
