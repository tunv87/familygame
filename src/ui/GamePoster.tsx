import type { ReactNode } from 'react';
import { modeStatus, useGamesConfig, type ModeKey } from '../app/gameConfig';
import { useTheme } from '../app/theme';
import { GAMES } from '../games/registry';
import { useT, type MessageKey } from '../i18n';
import type { GameId } from '../online/types';
import { PlayCount } from './PlayCount';

/** The first emoji of "⚫⚪" or "↔️↕️", so each step has one icon. */
function firstEmoji(s: string) {
  try {
    const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return seg.segment(s)[Symbol.iterator]().next().value?.segment ?? s;
  } catch {
    return s;
  }
}

const CHIPS: [ModeKey, string, MessageKey][] = [
  ['solo', '🤖', 'chipSolo'],
  ['local', '👫', 'chipLocal'],
  ['online', '🌏', 'chipOnline'],
];

/** Small "🤖 With computer · 👫 Same device · 🌏 Online" chips (big screens only). */
export function ModeChips({ game }: { game: GameId }) {
  const t = useT();
  const config = useGamesConfig();
  const info = GAMES.find((g) => g.id === game);
  if (!info) return null;
  const chips = CHIPS.filter(
    ([m]) => info.modes.includes(m as never) && modeStatus(config, game, m) !== 'hidden',
  );
  return (
    <span className="mode-chips desk-only" aria-hidden>
      {chips.map(([m, emoji, label]) => (
        <span key={m} className="mode-chip">
          {emoji} {t(label)}
        </span>
      ))}
    </span>
  );
}

/**
 * The left side of a game's start page on computers: big art, name, short description, modes,
 * play count and the first lines of its story. On phones only the play count shows (the rest is
 * hidden by CSS), so the page looks exactly as before.
 */
export function GamePoster({
  game,
  story,
  rules,
  children,
}: {
  game: GameId;
  story?: MessageKey[];
  /** the "how to play" steps, as in the help dialog */
  rules?: [string, MessageKey][];
  children?: ReactNode;
}) {
  const t = useT();
  const theme = useTheme();
  const info = GAMES.find((g) => g.id === game);
  if (!info) return <PlayCount game={game} />;
  return (
    <>
      <aside className="poster" data-game={game}>
        <div className="poster-art desk-only" aria-hidden>
          <span>{theme.gameEmoji[game] ?? info.emoji}</span>
        </div>
        <div className="poster-body desk-only">
          <h2 className="poster-title">{t(info.title)}</h2>
          <p className="poster-desc">{t(info.desc)}</p>
          <ModeChips game={game} />
        </div>
        <PlayCount game={game} />
        {story?.length ? (
          <div className="poster-story desk-only">
            <div className="poster-kicker">🏮 {t('posterStory')}</div>
            <h3>{t(story[0].replace(/Story1$/, 'StoryTitle') as MessageKey)}</h3>
            {story.map((k) => (
              <p key={k}>{t(k)}</p>
            ))}
          </div>
        ) : null}
        {children}
      </aside>
      {rules?.length ? (
        <aside className="poster-rules desk-only" data-game={game} data-testid="poster-rules">
          <h3>📖 {t('helpRules')}</h3>
          <ol>
            {rules.map(([emoji, key]) => (
              <li key={key}>
                <span className="poster-rule-icon" aria-hidden>
                  {firstEmoji(emoji)}
                </span>
                <span>{t(key)}</span>
              </li>
            ))}
          </ol>
        </aside>
      ) : null}
    </>
  );
}
