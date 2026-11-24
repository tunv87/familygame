import { useSettings } from '../app/settings';
import { useT } from '../i18n';
import { totalPlays, usePlayCounts } from '../online/plays';
import type { GameId } from '../online/types';

/** "🎮 1.234 lượt chơi": one game, or every game together when `game` is not given. */
export function PlayCount({ game }: { game?: GameId }) {
  const t = useT();
  const { lang } = useSettings();
  const counts = usePlayCounts();
  if (!counts) return null; // offline or not known yet: show nothing
  const n = game ? Number(counts[game]) || 0 : totalPlays(counts);
  const text = n.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US');
  return (
    <div className="play-count" data-testid="play-count" data-count={n}>
      🎮 {t(game ? 'playCount' : 'playCountTotal', { n: text })}
    </div>
  );
}
