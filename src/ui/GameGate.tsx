import type { ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { gameStatus, modeStatus, useGamesConfig, type ModeKey } from '../app/gameConfig';
import { useT } from '../i18n';
import type { GameId } from '../online/types';
import { Card, TopBar } from './components';

/** mode=… in a play link → the mode the owner can turn off */
export function modeOfParam(m: string | null): ModeKey {
  if (m === 'local') return 'local';
  if (m === 'practice') return 'practice';
  return 'solo'; // solo, bot
}

/** A mode card on a game page: hidden or greyed out as the owner set it. */
export function ModeCard({
  game,
  mode,
  ...card
}: { game: GameId; mode: ModeKey } & Parameters<typeof Card>[0]) {
  const t = useT();
  const s = modeStatus(useGamesConfig(), game, mode);
  if (s === 'hidden') return null;
  return <Card {...card} off={s === 'off' ? t('gameOff') : undefined} />;
}

function Unavailable() {
  const t = useT();
  const navigate = useNavigate();
  return (
    <main className="screen">
      <TopBar title={t('appName')} onBack={() => navigate('/')} />
      <div className="center grow">
        <div className="banner" data-testid="unavailable">
          🔧 {t('gameUnavailable')}
        </div>
        <button className="btn" onClick={() => navigate('/')}>
          🏠 {t('home')}
        </button>
      </div>
    </main>
  );
}

/**
 * Wraps a game's routes: a game (or, on play links, a mode) the owner turned off or hid
 * shows a short message instead of the game.
 */
export function GameGate({
  game,
  play,
  children,
}: {
  game: GameId;
  /** a play route: also check the mode in the link */
  play?: boolean;
  children: ReactNode;
}) {
  const config = useGamesConfig();
  const [params] = useSearchParams();
  const s = play
    ? modeStatus(config, game, modeOfParam(params.get('mode')))
    : gameStatus(config, game);
  return s === 'on' ? <>{children}</> : <Unavailable />;
}
