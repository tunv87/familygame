import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n';
import { OnlineLobby } from '../../online/OnlineLobby';
import { Card, HelpButton, TopBar } from '../../ui/components';
import type { Mode } from '../registry';
import type { AiLevel } from './ai';
import { CARO_HELP } from './help';

export function CaroSetup() {
  const t = useT();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode | null>(null);
  const [size, setSize] = useState<number | null>(null);

  const back = () => {
    if (size !== null) setSize(null);
    else if (mode !== null) setMode(null);
    else navigate('/');
  };

  const pickSize = (s: number) => {
    if (mode === 'local') navigate(`/caro/play?mode=local&size=${s}`);
    else setSize(s);
  };

  const levels: [AiLevel, string, string][] = [
    ['easy', '🐣', t('levelEasy')],
    ['medium', '🦊', t('levelMedium')],
    ['hard', '🦁', t('levelHard')],
  ];

  return (
    <main className="screen">
      <TopBar title={t('gameCaro')} onBack={back} right={<HelpButton steps={CARO_HELP} />} />
      {mode === null ? (
        <div className="stack">
          <h2 className="section-title">{t('chooseMode')}</h2>
          <Card
            emoji="🤖"
            title={t('modeSolo')}
            hint={t('modeSoloHint')}
            onClick={() => setMode('solo')}
            testId="mode-solo"
          />
          <Card
            emoji="👫"
            title={t('modeLocal')}
            hint={t('modeLocalHint')}
            onClick={() => setMode('local')}
            testId="mode-local"
          />
          <Card
            emoji="🌏"
            title={t('modeOnline')}
            hint={t('modeOnlineHint')}
            onClick={() => setMode('online')}
            testId="mode-online"
          />
        </div>
      ) : size === null ? (
        <div className="stack">
          <h2 className="section-title">{t('caroBoard')}</h2>
          <Card
            emoji="#️⃣"
            title={t('caroSmall')}
            hint={t('caroSmallHint')}
            onClick={() => pickSize(3)}
            testId="size-3"
          />
          <Card
            emoji="🧩"
            title={t('caroBig')}
            hint={t('caroBigHint')}
            onClick={() => pickSize(15)}
            testId="size-15"
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
              onClick={() => navigate(`/caro/play?mode=solo&size=${size}&level=${lv}`)}
            />
          ))}
        </div>
      ) : (
        <>
          <h2 className="section-title">{t('online')}</h2>
          <OnlineLobby game="caro" options={{ size }} />
        </>
      )}
    </main>
  );
}
