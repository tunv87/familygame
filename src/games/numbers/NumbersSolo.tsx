import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProfile } from '../../app/settings';
import { useT } from '../../i18n';
import { createLogger } from '../../lib/logger';
import { randomSeed } from '../../lib/rng';
import { sfx } from '../../lib/sound';
import { ExitConfirm, ResultModal, useBackHandler } from '../../ui/components';
import { Countdown, MiniPlayer, NumbersBoard, useCountdown } from './NumbersBoard';
import {
  applyClaim,
  asLevel,
  botDelayMs,
  initialState,
  makeLayout,
  numbersWinner,
  type NumbersState,
} from './logic';
import { formatSeconds, getRecord, submitTime } from './records';

const log = createLogger('numbers-solo');
const ME = 'me';
const BOT = 'bot';

/** Tìm số on one device: race the computer (mode=bot) or beat your own time (mode=practice). */
export function NumbersSolo() {
  const t = useT();
  const navigate = useNavigate();
  const profile = useProfile();
  const [params] = useSearchParams();
  const level = asLevel(params.get('level'));
  const practice = params.get('mode') === 'practice';

  const [round, setRound] = useState(0);
  const newState = () => initialState(level, randomSeed(), practice ? [ME] : [ME, BOT], Date.now());
  const [s, setS] = useState<NumbersState>(newState);
  const layout = useMemo(() => makeLayout(s.level, s.seed), [s.level, s.seed]);
  const count = useCountdown(round);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [result, setResult] = useState<{ ms: number; record: boolean } | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);

  // Start the clock when the countdown ends.
  useEffect(() => {
    if (count === 0) setStartedAt(Date.now());
  }, [count]);

  // Practice: tick a visible timer.
  useEffect(() => {
    if (!practice || count > 0 || s.done) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [practice, count, s.done]);

  // Computer opponent: claims the next number after a level-dependent delay.
  useEffect(() => {
    if (practice || count > 0 || s.done || confirmExit) return;
    const id = setTimeout(() => {
      setS((cur) => {
        const nextState = applyClaim(cur, BOT, cur.next);
        if (nextState) sfx.opponent();
        return nextState ?? cur;
      });
    }, botDelayMs(level));
    return () => clearTimeout(id);
  }, [practice, count, s.done, s.next, level, confirmExit]);

  // Practice finished → record time.
  useEffect(() => {
    if (!practice || !s.done || result) return;
    const ms = Date.now() - startedAt;
    const record = submitTime(level, ms);
    log.info('practice done', { level, ms, record });
    setResult({ ms, record });
  }, [practice, s.done, result, startedAt, level]);

  const find = (n: number) => setS((cur) => applyClaim(cur, ME, n) ?? cur);

  const restart = () => {
    setS(newState());
    setResult(null);
    setRound((r) => r + 1);
  };

  const exit = () => (s.done || s.next === 1 ? navigate('/numbers') : setConfirmExit(true));
  useBackHandler(exit);

  const winner = numbersWinner(s);
  const elapsed = practice && startedAt && count === 0 ? Math.max(0, now - startedAt) : 0;
  const best = getRecord(level);

  return (
    <main className="screen tight game">
      <div className="numbers-hud">
        <button
          className="icon-btn small"
          onClick={exit}
          data-testid="exit"
          aria-label={t('exitGame')}
          title={t('exitGame')}
        >
          🚪
        </button>
        <MiniPlayer
          avatar={profile.avatar}
          name={profile.name || t('you')}
          score={practice ? s.next - 1 : (s.scores[ME] ?? 0)}
          color="var(--p1)"
          testId="me"
        />
        <div className="target" data-testid="target">
          {s.done ? '🏁' : <span className="big">{s.next}</span>}
        </div>
        {practice ? (
          <MiniPlayer
            avatar="⏱️"
            name={best !== undefined ? `🏆 ${formatSeconds(best)}` : t('numbersTime')}
            score={formatSeconds(result?.ms ?? elapsed)}
            color="var(--p2)"
            testId="timer"
          />
        ) : (
          <MiniPlayer
            avatar="🤖"
            name={t('caroComputer')}
            score={s.scores[BOT] ?? 0}
            color="var(--p2)"
            testId="opp"
          />
        )}
      </div>
      <div className="numbers-toast" />
      <NumbersBoard
        layout={layout}
        owner={s.owner}
        me={ME}
        next={s.next}
        round={round}
        disabled={count > 0 || s.done}
        onFind={find}
      />
      <Countdown count={count} />
      {confirmExit && (
        <ExitConfirm
          onConfirm={() => navigate('/numbers')}
          onCancel={() => setConfirmExit(false)}
        />
      )}
      {s.done && (practice ? result : winner) && (
        <ResultModal
          title={
            practice
              ? result!.record
                ? t('numbersNewRecord')
                : t('numbersFinished')
              : winner === 'draw'
                ? t('draw')
                : winner === ME
                  ? t('youWin')
                  : t('youLose')
          }
          win={
            practice ? result!.record || undefined : winner === 'draw' ? undefined : winner === ME
          }
          sound={practice && result!.record ? 'record' : undefined}
          actions={
            <>
              <button className="btn" onClick={restart} data-testid="play-again">
                🔄 {t('playAgain')}
              </button>
              <button className="btn secondary" onClick={() => navigate('/')}>
                🏠 {t('home')}
              </button>
            </>
          }
        >
          {practice ? (
            <div className="big-stat" data-testid="practice-time">
              ⏱️ {t('numbersSeconds', { s: formatSeconds(result!.ms) })}
            </div>
          ) : (
            <div className="players">
              <MiniPlayer
                avatar={profile.avatar}
                name={profile.name || t('you')}
                score={s.scores[ME] ?? 0}
                color="var(--p1)"
                testId="final-me"
              />
              <MiniPlayer
                avatar="🤖"
                name={t('caroComputer')}
                score={s.scores[BOT] ?? 0}
                color="var(--p2)"
                testId="final-opp"
              />
            </div>
          )}
        </ResultModal>
      )}
    </main>
  );
}
