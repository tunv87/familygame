import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModeCard } from '../../ui/GameGate';
import { PlayCount } from '../../ui/PlayCount';
import { useT } from '../../i18n';
import { OnlineLobby } from '../../online/OnlineLobby';
import { Card, HelpButton, TopBar, useBackHandler } from '../../ui/components';
import type { Mode } from '../registry';
import type { NoiTuLevel } from './ai';
import { NOITU_HELP, NOITU_STORY } from './help';

export function NoiTuSetup() {
  const t = useT();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode | null>(null);
  const back = () => (mode !== null ? setMode(null) : navigate('/'));
  useBackHandler(back);

  const pickMode = (m: Mode) => {
    if (m === 'local') navigate('/noitu/play?mode=local');
    else setMode(m);
  };

  const levels: [NoiTuLevel, string, string][] = [
    ['easy', '🐣', t('levelEasy')],
    ['medium', '🦊', t('levelMedium')],
    ['hard', '🦁', t('levelHard')],
  ];

  return (
    <main className="screen">
      <TopBar
        title={t('gameNoiTu')}
        onBack={back}
        right={<HelpButton steps={NOITU_HELP} story={NOITU_STORY} />}
      />
      <PlayCount game="noitu" />
      {mode === null ? (
        <div className="stack">
          <h2 className="section-title">{t('chooseMode')}</h2>
          <ModeCard
            game="noitu"
            mode="solo"
            emoji="🤖"
            title={t('modeSolo')}
            hint={t('modeSoloHint')}
            onClick={() => pickMode('solo')}
            testId="mode-solo"
          />
          <ModeCard
            game="noitu"
            mode="local"
            emoji="👫"
            title={t('modeLocal')}
            hint={t('modeLocalHint')}
            onClick={() => pickMode('local')}
            testId="mode-local"
          />
          <ModeCard
            game="noitu"
            mode="online"
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
              onClick={() => navigate(`/noitu/play?mode=solo&level=${lv}`)}
            />
          ))}
        </div>
      ) : (
        <>
          <h2 className="section-title">{t('online')}</h2>
          <OnlineLobby game="noitu" options={{}} />
        </>
      )}
    </main>
  );
}
