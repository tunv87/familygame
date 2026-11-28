import { useT } from '../i18n';
import { useDaily, type DailyGame } from '../lib/daily';
import { Card } from './components';

/** "📅 Today's challenge" card with the streak, for a game's start page. */
export function DailyCard({ game, onClick }: { game: DailyGame; onClick: () => void }) {
  const t = useT();
  const d = useDaily(game);
  const hint = d.playedToday
    ? t('dailyPlayed', { n: d.streak })
    : d.streak > 0
      ? t('dailyKeep', { n: d.streak })
      : t('dailyHint');
  return (
    <Card
      emoji="📅"
      title={t('daily')}
      hint={hint}
      onClick={onClick}
      testId="mode-daily"
      className="daily-card"
    />
  );
}
