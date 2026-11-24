import { useCountPlay } from '../../online/plays';
import { useEffect, useMemo, useState } from 'react';
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
import { chooseOAQMove, type OAQLevel } from './ai';
import { OAQ_HELP, OAQ_STORY } from './help';
import { OAQBoard, dirFor } from './OAQBoard';
import { useSowing } from './useSowing';
import {
  applyMove,
  initialState,
  legalMoves,
  type Move,
  type MoveResult,
  type OAQState,
  type Side,
} from './logic';

const log = createLogger('oanquan');
const LEVELS: OAQLevel[] = ['easy', 'medium', 'hard'];

/** Sound + message for a finished move. Shared with the online screen. */
export function oaqFeedback(
  r: Pick<MoveResult, 'gained' | 'tookQuan' | 'reseeded'>,
  t: ReturnType<typeof useT>,
  nextName: string,
): string {
  if (r.gained) sfx.ganh(r.tookQuan);
  const parts: string[] = [];
  if (r.tookQuan) parts.push(t('oaqTookQuan', { n: r.gained }));
  else if (r.gained) parts.push(t('oaqGained', { n: r.gained }));
  if (r.reseeded) {
    sfx.forced();
    parts.push(t('oaqReseed', { name: nextName }));
  }
  return parts.join(' · ');
}

/** Pick a field, then a direction. Shared by local and online play. */
export function useOAQSelection(state: OAQState, myTurn: boolean) {
  const [selected, setSelected] = useState<number | null>(null);
  const playable = useMemo(
    () => (myTurn ? [...new Set(legalMoves(state).map((m) => m.from))] : []),
    [state, myTurn],
  );
  useEffect(() => setSelected(null), [state]);
  const tap = (i: number) => {
    if (!myTurn) return;
    if (playable.includes(i)) {
      sfx.tap();
      setSelected(i === selected ? null : i);
    } else {
      sfx.bad();
      setSelected(null);
    }
  };
  return { selected, playable, tap, clear: () => setSelected(null) };
}

/** The two big "sow left / sow right" buttons shown once a field is picked. */
export function DirButtons({
  selected,
  bottom,
  onMove,
}: {
  selected: number | null;
  bottom: Side;
  onMove: (m: Move) => void;
}) {
  const t = useT();
  return (
    <div className="players oaq-dirs">
      {(['left', 'right'] as const).map((d) => (
        <button
          key={d}
          className="btn grow"
          data-testid={`dir-${d}`}
          disabled={selected === null}
          onClick={() =>
            selected !== null && onMove({ from: selected, dir: dirFor(selected, bottom, d) })
          }
        >
          {d === 'left' ? `⬅️ ${t('oaqLeft')}` : `${t('oaqRight')} ➡️`}
        </button>
      ))}
    </div>
  );
}

/** Ô ăn quan on one device: vs computer (mode=solo) or two people (mode=local). */
export function OAQLocal() {
  const t = useT();
  const navigate = useNavigate();
  const profile = useProfile();
  const [params] = useSearchParams();
  const mode = params.get('mode') === 'local' ? 'local' : 'solo';
  const levelParam = params.get('level') as OAQLevel;
  const level: OAQLevel = LEVELS.includes(levelParam) ? levelParam : 'easy';

  const [round, setRound] = useState(0);
  useCountPlay('oanquan', round);
  const [history, setHistory] = useState<OAQState[]>(() => [initialState(1)]);
  const sowing = useSowing();
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [message, setMessage] = useState('');
  const [confirmExit, setConfirmExit] = useState(false);
  const state = history[history.length - 1];

  // Side 1 (bottom row) is the human in solo mode / player 1 in local mode.
  const names: [string, string] =
    mode === 'solo'
      ? [profile.name || t('you'), t('caroComputer')]
      : [t('caroPlayer1'), t('caroPlayer2')];
  const avatars: [string, string] = mode === 'solo' ? [profile.avatar, '🤖'] : ['🙂', '😎'];
  const aiTurn = mode === 'solo' && !state.winner && state.turn === 2;
  const busy = sowing.animating;
  const { selected, playable, tap } = useOAQSelection(state, !state.winner && !aiTurn && !busy);
  const shownScore = sowing.frame?.score ?? state.score;

  const play = (m: Move) => {
    const r = applyMove(state, m);
    if (!r) return;
    sfx.tap();
    setMessage('');
    setHistory((h) => [...h, r.state]);
    // replay the sowing, then announce the capture
    sowing.play(state, r.steps, state.turn, () =>
      setMessage(oaqFeedback(r, t, names[r.state.turn - 1])),
    );
  };

  useEffect(() => {
    // answer once the previous sowing has been shown
    if (!aiTurn || busy) return;
    const id = setTimeout(() => {
      const m = chooseOAQMove(state, level);
      log.debug('ai move', { m, level });
      play(m);
    }, 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiTurn, state, busy]);

  useEffect(() => {
    if (!state.winner) return;
    log.info('game over', {
      winner: state.winner,
      score: state.score,
      plies: state.plies,
      mode,
      level,
    });
    if (state.winner !== 'draw')
      setScore(([a, b]) => (state.winner === 1 ? [a + 1, b] : [a, b + 1]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.winner]);

  const undo = () => {
    setHistory((h) => {
      let k = h.length - 1;
      if (k === 0) return h;
      k--;
      if (mode === 'solo') while (k > 0 && h[k].turn !== 1) k--;
      return h.slice(0, k + 1);
    });
    sowing.skip();
    setMessage('');
  };

  const newRound = () => {
    const r = round + 1;
    setHistory([initialState(r % 2 === 0 ? 1 : 2)]);
    setRound(r);
    sowing.skip();
    setMessage('');
  };

  const exit = () =>
    state.plies > 0 && !state.winner ? setConfirmExit(true) : navigate('/oanquan');
  useBackHandler(exit);

  const status = busy
    ? t('oaqSowing')
    : state.winner
      ? ''
      : aiTurn
        ? t('caroThinking')
        : selected !== null
          ? t('oaqPickDir')
          : mode === 'solo'
            ? t('oaqYourTurn')
            : t('cgTurn', { name: names[state.turn - 1] });

  let resultTitle = t('draw');
  let win: boolean | undefined;
  if (state.winner && state.winner !== 'draw') {
    const aWon = state.winner === 1;
    resultTitle =
      mode === 'solo'
        ? aWon
          ? t('youWin')
          : t('youLose')
        : t('playerWins', { name: names[aWon ? 0 : 1] });
    win = mode === 'solo' ? aWon : true;
  }

  return (
    <main className="screen game">
      <TopBar
        title={t('gameOAQ')}
        onBack={exit}
        right={<HelpButton steps={OAQ_HELP} story={OAQ_STORY} />}
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
            <span className="score" data-testid={side === 1 ? 'me-score' : 'opp-score'}>
              {shownScore[side - 1]}
            </span>
          </div>
        ))}
      </div>
      <div className="status-line" data-testid="status">
        {status}
      </div>
      <div className="numbers-toast" data-testid="oaq-message">
        {message}
      </div>
      <OAQBoard
        state={state}
        bottom={1}
        selected={selected}
        playable={playable}
        frame={sowing.frame}
        disabled={!!state.winner || aiTurn || busy}
        onCell={tap}
        onSkip={sowing.skip}
      />
      <DirButtons selected={selected} bottom={1} onMove={play} />
      <div className="players">
        <button
          className="btn secondary grow"
          onClick={undo}
          disabled={history.length < 2 || aiTurn || busy || !!state.winner}
        >
          ↩️ {t('undo')}
        </button>
        <button className="btn secondary grow" onClick={newRound}>
          🔄 {t('newGame')}
        </button>
      </div>
      {confirmExit && (
        <ExitConfirm
          onConfirm={() => navigate('/oanquan')}
          onCancel={() => setConfirmExit(false)}
        />
      )}
      {state.winner && !busy && (
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
          <div className="muted">{t('oaqEnd')}</div>
          <div className="oaq-final" data-testid="final-points">
            {names[0]} {state.score[0]} – {state.score[1]} {names[1]}
          </div>
          <div className="muted" data-testid="final-score">
            🏆 {score[0]} – {score[1]}
          </div>
        </ResultModal>
      )}
    </main>
  );
}
