import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProfile } from '../../app/settings';
import { useT } from '../../i18n';
import { createLogger } from '../../lib/logger';
import { sfx } from '../../lib/sound';
import {
  Avatar,
  ExitConfirm,
  HelpButton,
  ResultModal,
  TopBar,
  useBackHandler,
} from '../../ui/components';
import { chooseNoiTuWord, type NoiTuLevel } from './ai';
import { useDict, type Loaded } from './dict';
import { NOITU_HELP, NOITU_STORY } from './help';
import { initialState, lose, options, play, startWord, type NoiTuState } from './logic';
import { AnswerBox, Chain, HINTS, TimerBar, useCountdown } from './NoiTuPlay';

const log = createLogger('noitu');
const LEVELS: NoiTuLevel[] = ['easy', 'medium', 'hard'];
/** seconds per turn: children need time to type */
const SECONDS: Record<NoiTuLevel | 'local', number> = { easy: 60, medium: 45, hard: 30, local: 45 };

export function NoiTuLocal() {
  const t = useT();
  const navigate = useNavigate();
  const loaded = useDict();
  const exitTo = () => navigate('/noitu');
  if (loaded === null || loaded === 'error')
    return (
      <main className="screen game">
        <TopBar title={t('gameNoiTu')} onBack={exitTo} />
        <div className="center grow muted" data-testid="nt-loading">
          {loaded === 'error' ? t('ntLoadFailed') : t('ntLoading')}
        </div>
      </main>
    );
  return <Game loaded={loaded} />;
}

function Game({ loaded }: { loaded: Loaded }) {
  const { dict, words } = loaded;
  const t = useT();
  const navigate = useNavigate();
  const profile = useProfile();
  const [params] = useSearchParams();
  const mode = params.get('mode') === 'local' ? 'local' : 'solo';
  const levelParam = params.get('level') as NoiTuLevel;
  const level: NoiTuLevel = LEVELS.includes(levelParam) ? levelParam : 'easy';
  const seconds = SECONDS[mode === 'local' ? 'local' : level];

  const [round, setRound] = useState(0);
  const [state, setState] = useState<NoiTuState>(() => initialState(startWord(dict, words), 1));
  const [deadline, setDeadline] = useState(() => Date.now() + seconds * 1000);
  const [hints, setHints] = useState<[number, number]>([HINTS, HINTS]);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [confirmExit, setConfirmExit] = useState(false);
  // who said each word: the opener is 0, then sides alternate starting with the first answerer
  const [firstSide, setFirstSide] = useState<1 | 2>(1);

  const names: [string, string] =
    mode === 'solo'
      ? [profile.name || t('you'), t('caroComputer')]
      : [t('caroPlayer1'), t('caroPlayer2')];
  const avatars: [string, string] = mode === 'solo' ? [profile.avatar, '🤖'] : ['🙂', '😎'];
  const aiTurn = mode === 'solo' && !state.winner && state.turn === 2;

  const answer = useCallback(
    (w: string) => {
      setState((s) => play(s, w));
      setDeadline(Date.now() + seconds * 1000);
    },
    [seconds],
  );

  const now = useCallback(() => Date.now(), []);
  const left = useCountdown(state.winner ? null : deadline, now, () => {
    log.info('timeout', { turn: state.turn });
    setState((s) => lose(s, 'timeout'));
  });

  // the computer answers after "thinking" a little
  useEffect(() => {
    if (!aiTurn) return;
    const id = setTimeout(
      () => {
        const w = chooseNoiTuWord(dict, state, level);
        log.debug('ai word', { w, level });
        if (w) answer(w);
        else setState((s) => lose(s, 'giveup'));
      },
      1200 + Math.random() * 1300,
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiTurn, state.chain.length]);

  useEffect(() => {
    if (!state.winner) return;
    log.info('game over', { winner: state.winner, words: state.chain.length, mode, level });
    setScore(([a, b]) => (state.winner === 1 ? [a + 1, b] : [a, b + 1]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.winner]);

  const newRound = () => {
    const r = round + 1;
    const first = r % 2 === 0 ? 1 : 2;
    setRound(r);
    setFirstSide(first);
    setState(initialState(startWord(dict, words), first));
    setDeadline(Date.now() + seconds * 1000);
    setHints([HINTS, HINTS]);
  };

  const exit = () =>
    state.chain.length > 1 && !state.winner ? setConfirmExit(true) : navigate('/noitu');
  useBackHandler(exit);

  const sideOf = (i: number) =>
    i === 0 ? 0 : (i - 1) % 2 === 0 ? firstSide : firstSide === 1 ? 2 : 1;
  const loser = state.winner ? (state.winner === 1 ? 2 : 1) : null;
  const couldSay = useMemo(
    () => (loser ? (options(dict, state.chain).find((w) => dict.tier(w) === 1) ?? '') : ''),
    [dict, loser, state.chain],
  );

  const status = state.winner
    ? ''
    : aiTurn
      ? t('caroThinking')
      : mode === 'solo'
        ? t('ntYourTurn')
        : t('cgTurn', { name: names[state.turn - 1] });

  let resultTitle = '';
  let win: boolean | undefined;
  if (state.winner) {
    resultTitle =
      mode === 'solo'
        ? state.winner === 1
          ? t('youWin')
          : t('youLose')
        : t('playerWins', { name: names[state.winner - 1] });
    win = mode === 'solo' ? state.winner === 1 : true;
  }

  return (
    <main className="screen game nt-screen">
      <TopBar
        title={t('gameNoiTu')}
        onBack={exit}
        right={<HelpButton steps={NOITU_HELP} story={NOITU_STORY} />}
      />
      <div className="players">
        {([1, 2] as const).map((side) => (
          <div
            key={side}
            className={`player ${!state.winner && state.turn === side ? 'active' : ''}`}
            data-testid={side === 1 ? 'me' : 'opp'}
          >
            <Avatar emoji={avatars[side - 1]} />
            <span className="name">{names[side - 1]}</span>
            <span className="score">{score[side - 1]}</span>
          </div>
        ))}
      </div>
      <TimerBar left={left} total={seconds} />
      <div className="status-line" data-testid="status">
        {status}
      </div>
      <Chain dict={dict} chain={state.chain} sideOf={sideOf} avatars={avatars} />
      <AnswerBox
        dict={dict}
        chain={state.chain}
        enabled={!state.winner && !aiTurn}
        hintsLeft={hints[state.turn - 1]}
        onHint={() =>
          setHints(([a, b]) => (state.turn === 1 ? [a - 1, b] : [a, b - 1]) as [number, number])
        }
        onAnswer={answer}
        onGiveUp={() => {
          sfx.bad();
          setState((s) => lose(s, 'giveup'));
        }}
      />
      {confirmExit && (
        <ExitConfirm onConfirm={() => navigate('/noitu')} onCancel={() => setConfirmExit(false)} />
      )}
      {state.winner && loser && (
        <ResultModal
          title={resultTitle}
          win={win}
          actions={
            <>
              <button className="btn" onClick={newRound} data-testid="play-again">
                🔄 {t('playAgain')}
              </button>
              <button className="btn secondary" onClick={() => navigate('/')}>
                🏠 {t('home')}
              </button>
            </>
          }
        >
          <div className="muted" data-testid="nt-reason">
            {state.reason === 'timeout'
              ? t('ntTimeout', { name: names[loser - 1] })
              : t('ntGaveUp', { name: names[loser - 1] })}
            {' · '}
            {t('ntChainLen', { n: state.chain.length })}
          </div>
          {couldSay && (
            <div className="muted" data-testid="nt-could">
              {t('ntCouldSay', { w: couldSay })}
            </div>
          )}
          <div className="muted" data-testid="final-score">
            🏆 {score[0]} – {score[1]}
          </div>
        </ResultModal>
      )}
    </main>
  );
}
