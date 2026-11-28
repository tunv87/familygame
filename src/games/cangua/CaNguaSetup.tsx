import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n';
import { OnlineLobby } from '../../online/OnlineLobby';
import { Card, HelpButton, TopBar, useBackHandler } from '../../ui/components';
import { ModeCard } from '../../ui/GameGate';
import { GamePoster } from '../../ui/GamePoster';
import { CN_HELP, CN_STORY } from './help';

/** Cờ cá ngựa: race the computer (1–3 of them) on this device, or 2–4 people online. */
export function CaNguaSetup() {
  const t = useT();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'solo' | 'local' | 'online' | null>(null);
  const back = () => (mode !== null ? setMode(null) : navigate('/'));
  useBackHandler(back);

  const counts: [number, string, string, string][] = [
    [1, '🤖', t('cnBots1'), t('cnBots1Hint')],
    [2, '🤖🤖', t('cnBots2'), t('cnBots2Hint')],
    [3, '🤖🤖🤖', t('cnBots3'), t('cnBots3Hint')],
  ];

  return (
    <main className="screen">
      <TopBar
        title={t('gameCaNgua')}
        onBack={back}
        right={<HelpButton steps={CN_HELP} story={CN_STORY} />}
      />
      <GamePoster game="cangua" story={CN_STORY} rules={CN_HELP} />
      {mode === null ? (
        <div className="stack">
          <h2 className="section-title">{t('chooseMode')}</h2>
          <ModeCard
            game="cangua"
            mode="solo"
            emoji="🤖"
            title={t('modeSolo')}
            hint={t('cnSoloHint')}
            onClick={() => setMode('solo')}
            testId="mode-solo"
          />
          <ModeCard
            game="cangua"
            mode="local"
            emoji="👫"
            title={t('modeLocal')}
            hint={t('cnLocalHint')}
            onClick={() => setMode('local')}
            testId="mode-local"
          />
          <ModeCard
            game="cangua"
            mode="online"
            emoji="🌏"
            title={t('modeOnline')}
            hint={t('cnOnlineHint')}
            onClick={() => setMode('online')}
            testId="mode-online"
          />
        </div>
      ) : mode === 'local' ? (
        <div className="stack">
          <h2 className="section-title">{t('cnHowManyPlayers')}</h2>
          {(
            [
              [2, '🙂😎', t('cnPlayers2')],
              [3, '🙂😎🤠', t('cnPlayers3')],
              [4, '🙂😎🤠🥳', t('cnPlayers4')],
            ] as const
          ).map(([n, emoji, title]) => (
            <Card
              key={n}
              emoji={emoji}
              title={title}
              testId={`players-${n}`}
              className="bots"
              onClick={() => navigate(`/cangua/play?mode=local&players=${n}`)}
            />
          ))}
        </div>
      ) : mode === 'solo' ? (
        <div className="stack">
          <h2 className="section-title">{t('cnHowMany')}</h2>
          {counts.map(([n, emoji, title, hint]) => (
            <Card
              key={n}
              emoji={emoji}
              title={title}
              hint={hint}
              testId={`bots-${n}`}
              className="bots"
              onClick={() => navigate(`/cangua/play?mode=solo&bots=${n}`)}
            />
          ))}
        </div>
      ) : (
        <div className="stack">
          <div className="muted center" data-testid="cn-intro">
            🐴 {t('cnIntro')}
          </div>
          <OnlineLobby game="cangua" options={{}} />
        </div>
      )}
    </main>
  );
}
