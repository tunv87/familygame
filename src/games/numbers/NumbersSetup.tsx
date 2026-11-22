import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n';
import { OnlineLobby } from '../../online/OnlineLobby';
import { Card, HelpButton, TopBar } from '../../ui/components';
import { NUMBERS_HELP } from './help';
import type { NumbersLevel } from './logic';

export function NumbersSetup() {
  const t = useT();
  const navigate = useNavigate();
  const [level, setLevel] = useState<NumbersLevel | null>(null);
  const levels: [NumbersLevel, string, string][] = [
    ['easy', '🐣', t('numbersLevelEasy')],
    ['medium', '🦊', t('numbersLevelMedium')],
    ['hard', '🦁', t('numbersLevelHard')],
  ];
  return (
    <main className="screen">
      <TopBar
        title={t('gameNumbers')}
        onBack={() => (level ? setLevel(null) : navigate('/'))}
        right={<HelpButton steps={NUMBERS_HELP} />}
      />
      {level === null ? (
        <div className="stack">
          <div className="banner">👫 {t('numbersOnlyOnline')}</div>
          <h2 className="section-title">{t('chooseLevel')}</h2>
          {levels.map(([lv, emoji, label]) => (
            <Card
              key={lv}
              emoji={emoji}
              title={label}
              testId={`level-${lv}`}
              onClick={() => setLevel(lv)}
            />
          ))}
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
