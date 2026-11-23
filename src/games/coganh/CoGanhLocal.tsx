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
import { chooseCoGanhMove, type CoGanhLevel } from './ai';
import { CoGanhBoard } from './CoGanhBoard';
import { COGANH_HELP } from './help';
import {
  QUIET_LIMIT,
  applyMove,
  count,
  initialState,
  legalMoves,
  type CoGanhState,
  type MoveResult,
  type Side,
} from './logic';

const log = createLogger('coganh');
const LEVELS: CoGanhLevel[] = ['easy', 'medium', 'hard'];

/** Feedback for a move: sound + a short message. Shared with the online screen. */
export function moveFeedback(r: MoveResult, t: ReturnType<typeof useT>): string {
  const big = r.ganh.length >= 4 || r.chet.length > 0;
  if (r.ganh.length || r.chet.length) sfx.ganh(big);
  if (r.chet.length) return t('cgChet', { n: r.chet.length + r.ganh.length });
  if (r.ganh.length) return t('cgGanh', { n: r.ganh.length });
  return '';
}

/** Selection logic shared by local and online play. */
export function useSelection(state: CoGanhState, myTurn: boolean) {
  const [selected, setSelected] = useState<number | null>(null);
  const legal = useMemo(() => (myTurn ? legalMoves(state) : []), [state, myTurn]);
  const movable = useMemo(() => [...new Set(legal.map((m) => m.from))], [legal]);
  const targets =
    selected === null ? [] : legal.filter((m) => m.from === selected).map((m) => m.to);
  useEffect(() => setSelected(null), [state]);
  // With exactly one piece to move (typical for a Mở), pick it up for the player.
  useEffect(() => {
    if (myTurn && state.forced.length && movable.length === 1) setSelected(movable[0]);
  }, [myTurn, state, movable]);
  /** returns the move to play, or null if the tap only changed the selection */
  const tap = (i: number) => {
    if (!myTurn) return null;
    if (selected !== null && targets.includes(i)) return { from: selected, to: i };
    if (movable.includes(i)) {
      sfx.tap();
      setSelected(i === selected ? null : i);
    } else if (state.board[i] !== 0) {
      sfx.bad(); // a piece that cannot move now (e.g. not one of the forced ones)
    } else setSelected(null);
    return null;
  };
  return { selected, movable, targets, tap };
}

/** Cờ gánh on one device: vs computer (mode=solo) or two people (mode=local). */
export function CoGanhLocal() {
  const t = useT();
  const navigate = useNavigate();
  const profile = useProfile();
  const [params] = useSearchParams();
  const mode = params.get('mode') === 'local' ? 'local' : 'solo';
  const levelParam = params.get('level') as CoGanhLevel;
  const level: CoGanhLevel = LEVELS.includes(levelParam) ? levelParam : 'easy';

  const [round, setRound] = useState(0);
  const [history, setHistory] = useState<CoGanhState[]>(() => [initialState()]);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [confirmExit, setConfirmExit] = useState(false);
  const state = history[history.length - 1];

  // Player A is the human in solo mode; A plays Black (first) in even rounds.
  const aSide: Side = round % 2 === 0 ? 1 : 2;
  const aiTurn = mode === 'solo' && !state.winner && state.turn !== aSide;
  const { selected, movable, targets, tap } = useSelection(state, !state.winner && !aiTurn);

  const play = (m: { from: number; to: number }) => {
    const r = applyMove(state, m);
    if (!r) return;
    setFlipped([...r.ganh, ...r.chet]);
    const msg = moveFeedback(r, t);
    if (!r.ganh.length && !r.chet.length) sfx.tap();
    setHistory((h) => [...h, r.state]);
    if (r.state.forced.length && !r.state.winner) {
      // the next player was "opened": tell them they must capture
      if (mode === 'local' || r.state.turn === aSide) sfx.forced();
      setMessage(t('cgForced'));
    } else setMessage(msg);
  };

  useEffect(() => {
    if (!aiTurn) return;
    const id = setTimeout(() => {
      const m = chooseCoGanhMove(state, level);
      log.debug('ai move', { m, level });
      sfx.opponent();
      play(m);
    }, 500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiTurn, state]);

  useEffect(() => {
    if (!state.winner) return;
    log.info('game over', { winner: state.winner, plies: state.plies, mode, level });
    if (state.winner !== 'draw')
      setScore(([a, b]) => (state.winner === aSide ? [a + 1, b] : [a, b + 1]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.winner]);

  const onPoint = (i: number) => {
    const m = tap(i);
    if (m) play(m);
  };

  const undo = () => {
    // Solo: go back to the human's previous turn (undoing the computer's reply too).
    setHistory((h) => {
      let k = h.length - 1;
      if (k === 0) return h;
      k--;
      if (mode === 'solo') while (k > 0 && h[k].turn !== aSide) k--;
      return h.slice(0, k + 1);
    });
    setFlipped([]);
    setMessage('');
  };

  const newRound = () => {
    setHistory([initialState()]);
    setRound((r) => r + 1);
    setFlipped([]);
    setMessage('');
  };

  const exit = () =>
    state.plies > 0 && !state.winner ? setConfirmExit(true) : navigate('/coganh');
  useBackHandler(exit);

  const names: [string, string] =
    mode === 'solo'
      ? [profile.name || t('you'), t('caroComputer')]
      : [t('caroPlayer1'), t('caroPlayer2')];
  const avatars: [string, string] = mode === 'solo' ? [profile.avatar, '🤖'] : ['🙂', '😎'];
  const sideOf = (k: 0 | 1): Side => (k === 0 ? aSide : aSide === 1 ? 2 : 1);
  const turnName = names[state.turn === aSide ? 0 : 1];
  const status = state.winner
    ? ''
    : state.forced.length && !aiTurn
      ? `⚠️ ${t('cgForced')}`
      : aiTurn
        ? t('caroThinking')
        : mode === 'solo'
          ? t('cgYourTurn')
          : t('cgTurn', { name: turnName });

  let resultTitle = t('draw');
  let win: boolean | undefined;
  if (state.winner && state.winner !== 'draw') {
    const aWon = state.winner === aSide;
    resultTitle =
      mode === 'solo'
        ? aWon
          ? t('youWin')
          : t('youLose')
        : t('playerWins', { name: names[aWon ? 0 : 1] });
    win = mode === 'solo' ? aWon : true;
  }
  const drawReason =
    state.winner === 'draw'
      ? state.quiet >= QUIET_LIMIT
        ? t('cgDrawQuiet')
        : t('cgDrawRepeat')
      : '';

  return (
    <main className="screen game">
      <TopBar title={t('gameCoGanh')} onBack={exit} right={<HelpButton steps={COGANH_HELP} />} />
      <div className="players">
        {([0, 1] as const).map((k) => (
          <div
            key={k}
            className={`player ${!state.winner && state.turn === sideOf(k) ? 'active' : ''}`}
            data-testid={k === 0 ? 'me' : 'opp'}
          >
            <span className="avatar-wrap">
              <Avatar emoji={avatars[k]} />
              <span className={`badge cg-badge ${sideOf(k) === 1 ? 'black' : 'white'}`} />
            </span>
            <span className="name">{names[k]}</span>
            <span className="score" data-testid={k === 0 ? 'me-count' : 'opp-count'}>
              {count(state.board, sideOf(k))}
            </span>
          </div>
        ))}
      </div>
      <div
        className={`status-line ${state.forced.length && !aiTurn ? 'warn' : ''}`}
        data-testid="status"
      >
        {status}
      </div>
      <div className="numbers-toast" data-testid="cg-message">
        {message && !state.forced.length ? message : ''}
      </div>
      <CoGanhBoard
        board={state.board}
        selected={selected}
        targets={targets}
        movable={movable}
        forced={state.forced.length > 0 && !aiTurn}
        last={state.last}
        flipped={flipped}
        disabled={!!state.winner || aiTurn}
        onPoint={onPoint}
      />
      <div className="players">
        <button
          className="btn secondary grow"
          onClick={undo}
          disabled={history.length < 2 || aiTurn || !!state.winner}
        >
          ↩️ {t('undo')}
        </button>
        <button className="btn secondary grow" onClick={newRound}>
          🔄 {t('newGame')}
        </button>
      </div>
      {confirmExit && (
        <ExitConfirm onConfirm={() => navigate('/coganh')} onCancel={() => setConfirmExit(false)} />
      )}
      {state.winner && (
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
          {drawReason && <div className="muted">{drawReason}</div>}
          <div className="muted" data-testid="final-score">
            {score[0]} – {score[1]}
          </div>
        </ResultModal>
      )}
    </main>
  );
}
