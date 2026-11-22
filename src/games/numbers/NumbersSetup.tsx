import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n';
import { OnlineLobby } from '../../online/OnlineLobby';
import { Card, HelpButton, TopBar } from '../../ui/components';
import { NUMBERS_HELP } from './help';
import type { NumbersLevel } from './logic';
import { formatSeconds, getRecord } from './records';

type NumbersMode = 'bot' | 'practice' | 'online';

export function NumbersSetup() {
  const t = useT();
  const navigate = useNavigate();
  const [mode, setMode] = useState<NumbersMode | null>(null);
  const [level, setLevel] = useState<NumbersLevel | null>(null);
  const levels: [NumbersLevel, string, string][] = [
    ['easy', '🐣', t('numbersLevelEasy')],
    ['medium', '🦊', t('numbersLevelMedium')],
    ['hard', '🦁', t('numbersLevelHard')],
  ];

  const back = () => {
    if (level) setLevel(null);
    else if (mode) setMode(null);
    else navigate('/');
  };

  const pickLevel = (lv: NumbersLevel) => {
    if (mode === 'online') setLevel(lv);
    else navigate(`/numbers/play?mode=${mode}&level=${lv}`);
  };

  return (
    <main className="screen">
      <TopBar title={t('gameNumbers')} onBack={back} right={<HelpButton steps={NUMBERS_HELP} />} />
      {mode === null ? (
        <div className="stack">
          <h2 className="section-title">{t('chooseMode')}</h2>
          <Card
            emoji="🤖"
            title={t('modeSolo')}
            hint={t('numbersBotHint')}
            onClick={() => setMode('bot')}
            testId="mode-bot"
          />
          <Card
            emoji="⏱️"
            title={t('modePractice')}
            hint={t('modePracticeHint')}
            onClick={() => setMode('practice')}
            testId="mode-practice"
          />
          <Card
            emoji="🌏"
            title={t('modeOnline')}
            hint={t('modeOnlineHint')}
            onClick={() => setMode('online')}
            testId="mode-online"
          />
        </div>
      ) : level === null ? (
        <div className="stack">
          <h2 className="section-title">{t('chooseLevel')}</h2>
          {levels.map(([lv, emoji, label]) => {
            const best = mode === 'practice' ? getRecord(lv) : undefined;
            return (
              <Card
                key={lv}
                emoji={emoji}
                title={label}
                hint={
                  best !== undefined
                    ? `🏆 ${t('numbersSeconds', { s: formatSeconds(best) })}`
                    : undefined
                }
                testId={`level-${lv}`}
                onClick={() => pickLevel(lv)}
              />
            );
          })}
        </div>
      ) : (
        <>
          <h2 className="section-title">{t('online')}</h2>
          <OnlineLobby game="numbers" options={{ level }} />
        </>
      )}
    </main>
  );
}
