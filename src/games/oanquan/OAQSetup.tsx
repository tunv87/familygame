import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCount } from '../../ui/PlayCount';
import { useT } from '../../i18n';
import { OnlineLobby } from '../../online/OnlineLobby';
import { Card, HelpButton, TopBar, useBackHandler } from '../../ui/components';
import type { Mode } from '../registry';
import type { OAQLevel } from './ai';
import { OAQ_HELP, OAQ_STORY } from './help';

export function OAQSetup() {
  const t = useT();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode | null>(null);
  const back = () => (mode !== null ? setMode(null) : navigate('/'));
  useBackHandler(back);

  const pickMode = (m: Mode) => {
    if (m === 'local') navigate('/oanquan/play?mode=local');
    else setMode(m);
  };

  const levels: [OAQLevel, string, string][] = [
    ['easy', '🐣', t('levelEasy')],
    ['medium', '🦊', t('levelMedium')],
    ['hard', '🦁', t('levelHard')],
  ];

  return (
    <main className="screen">
      <TopBar
        title={t('gameOAQ')}
        onBack={back}
        right={<HelpButton steps={OAQ_HELP} story={OAQ_STORY} />}
      />
      <PlayCount game="oanquan" />
      {mode === null ? (
        <div className="stack">
          <h2 className="section-title">{t('chooseMode')}</h2>
          <Card
            emoji="🤖"
            title={t('modeSolo')}
            hint={t('modeSoloHint')}
            onClick={() => pickMode('solo')}
            testId="mode-solo"
          />
          <Card
            emoji="👫"
            title={t('modeLocal')}
            hint={t('modeLocalHint')}
            onClick={() => pickMode('local')}
            testId="mode-local"
          />
          <Card
            emoji="🌏"
            title={t('modeOnline')}
            hint={t('modeOnlineHint')}
            onClick={() => pickMode('online')}
            testId="mode-online"
          />
        </div>
      ) : mode === 'solo' ? (
        <div className="stack">
          <h2 className="section-title">{t('chooseLevel')}</h2>
          {levels.map(([lv, emoji, label]) => (
            <Card
              key={lv}
              emoji={emoji}
              title={label}
              testId={`level-${lv}`}
              onClick={() => navigate(`/oanquan/play?mode=solo&level=${lv}`)}
            />
          ))}
        </div>
      ) : (
        <>
          <h2 className="section-title">{t('online')}</h2>
          <OnlineLobby game="oanquan" options={{}} />
        </>
      )}
    </main>
  );
}
