import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyCard } from '../../ui/DailyCard';
import { ModeCard } from '../../ui/GameGate';
import { GamePoster } from '../../ui/GamePoster';
import { useT } from '../../i18n';
import { OnlineLobby } from '../../online/OnlineLobby';
import { Card, HelpButton, TopBar, useBackHandler } from '../../ui/components';
import { NUMBERS_HELP, NUMBERS_STORY } from './help';
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

  useBackHandler(back);

  const pickLevel = (lv: NumbersLevel) => {
    if (mode === 'online') setLevel(lv);
    else navigate(`/numbers/play?mode=${mode}&level=${lv}`);
  };

  return (
    <main className="screen">
      <TopBar
        title={t('gameNumbers')}
        onBack={back}
        right={<HelpButton steps={NUMBERS_HELP} story={NUMBERS_STORY} />}
      />
      <GamePoster game="numbers" story={NUMBERS_STORY} rules={NUMBERS_HELP} />
      {mode === null ? (
        <div className="stack">
          <h2 className="section-title">{t('chooseMode')}</h2>
          <DailyCard game="numbers" onClick={() => navigate('/numbers/play?mode=daily')} />
          <ModeCard
            game="numbers"
            mode="solo"
            emoji="🤖"
            title={t('modeSolo')}
            hint={t('numbersBotHint')}
            onClick={() => setMode('bot')}
            testId="mode-bot"
          />
          <ModeCard
            game="numbers"
            mode="practice"
            emoji="⏱️"
            title={t('modePractice')}
            hint={t('modePracticeHint')}
            onClick={() => setMode('practice')}
            testId="mode-practice"
          />
          <ModeCard
            game="numbers"
            mode="online"
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
