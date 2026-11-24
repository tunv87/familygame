import { useCountPlay } from '../../online/plays';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProfile } from '../../app/settings';
import { useTheme } from '../../app/theme';
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
import { chooseMove, type AiLevel } from './ai';
import { boardFromMoves, configFor, outcomeOfMoves, type Player } from './logic';
import { CaroBoard } from './CaroBoard';
import { CARO_HELP, CARO_STORY } from './help';

const log = createLogger('caro');

/** Caro on one device: vs computer (mode=solo) or two people taking turns (mode=local). */
export function CaroLocal() {
  const t = useT();
  const navigate = useNavigate();
  const profile = useProfile();
  const theme = useTheme();
  const [params] = useSearchParams();
  const mode = params.get('mode') === 'local' ? 'local' : 'solo';
  const size = Number(params.get('size')) === 15 ? 15 : 3;
  const level = (params.get('level') ?? 'easy') as AiLevel;
  const cfg = configFor(size);

  const [moves, setMoves] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  useCountPlay('caro', round);
  const [score, setScore] = useState<[number, number]>([0, 0]); // [player A, player B]
  // Who plays X alternates every round. In solo mode "A" is the human.
  const aIsX = round % 2 === 0;
  const board = useMemo(() => boardFromMoves(size, moves), [size, moves]);
  const outcome = useMemo(() => outcomeOfMoves(cfg, moves), [cfg, moves]);
  const toMove: Player = moves.length % 2 === 0 ? 1 : 2;
  const aStone: Player = aIsX ? 1 : 2;
  const aiTurn = mode === 'solo' && !outcome && toMove !== aStone;

  const names: [string, string] =
    mode === 'solo'
      ? [profile.name || t('you'), t('caroComputer')]
      : [t('caroPlayer1'), t('caroPlayer2')];
  const avatars: [string, string] = mode === 'solo' ? [profile.avatar, '🤖'] : ['🙂', '😎'];

  useEffect(() => {
    if (!aiTurn) return;
    const id = setTimeout(() => {
      const idx = chooseMove(board, cfg, toMove, level);
      log.debug('ai move', { idx, level });
      sfx.opponent();
      setMoves((m) => [...m, idx]);
    }, 450);
    return () => clearTimeout(id);
  }, [aiTurn, board, cfg, toMove, level]);

  useEffect(() => {
    if (!outcome) return;
    log.info('game over', { winner: outcome.winner, moves: moves.length, mode, size, level });
    if (outcome.winner !== 0) {
      const aWon = outcome.winner === aStone;
      setScore(([a, b]) => (aWon ? [a + 1, b] : [a, b + 1]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome]);

  const play = (idx: number) => {
    if (outcome || aiTurn || board[idx] !== 0) return;
    sfx.tap();
    setMoves((m) => [...m, idx]);
  };

  const undo = () => {
    // Solo: take back the human move and the computer reply.
    const n = mode === 'solo' ? (toMove === aStone ? 2 : 1) : 1;
    setMoves((m) => m.slice(0, Math.max(0, m.length - n)));
  };

  const [confirmExit, setConfirmExit] = useState(false);
  const exit = () => (moves.length > 0 && !outcome ? setConfirmExit(true) : navigate('/caro'));
  useBackHandler(exit);

  const newRound = () => {
    setMoves([]);
    setRound((r) => r + 1);
  };

  const currentIsA = toMove === aStone;
  const status = outcome
    ? ''
    : aiTurn
      ? t('caroThinking')
      : mode === 'solo'
        ? t('caroYourTurn')
        : t('caroTurn', { name: names[currentIsA ? 0 : 1] });

  let resultTitle = t('draw');
  let win: boolean | undefined;
  if (outcome && outcome.winner !== 0) {
    const aWon = outcome.winner === aStone;
    if (mode === 'solo') {
      resultTitle = aWon ? t('youWin') : t('youLose');
      win = aWon;
    } else {
      resultTitle = t('playerWins', { name: names[aWon ? 0 : 1] });
      win = true;
    }
  }

  const mark = (isA: boolean) => ((isA ? aIsX : !aIsX) ? theme.x : theme.o);
  return (
    <main className="screen game">
      <TopBar
        title={t('gameCaro')}
        onBack={exit}
        right={<HelpButton steps={CARO_HELP} story={CARO_STORY} />}
      />
      <div className="players">
        {[0, 1].map((k) => (
          <div key={k} className={`player ${!outcome && currentIsA === (k === 0) ? 'active' : ''}`}>
            <span className="avatar-wrap">
              <Avatar emoji={avatars[k]} />
              <span className={`badge ${(k === 0) === aIsX ? 'x' : 'o'}`}>{mark(k === 0)}</span>
            </span>
            <span className="name">{names[k]}</span>
            <span className="score">{score[k]}</span>
          </div>
        ))}
      </div>
      <div className="status-line" data-testid="status">
        {status}
      </div>
      <CaroBoard
        size={size}
        board={board}
        onCell={play}
        last={moves[moves.length - 1]}
        winLine={outcome?.line}
        disabled={!!outcome || aiTurn}
      />
      <div className="players">
        <button
          className="btn secondary grow"
          onClick={undo}
          disabled={moves.length === 0 || !!outcome || aiTurn}
        >
          ↩️ {t('undo')}
        </button>
        <button className="btn secondary grow" onClick={newRound}>
          🔄 {t('newGame')}
        </button>
      </div>
      {confirmExit && (
        <ExitConfirm onConfirm={() => navigate('/caro')} onCancel={() => setConfirmExit(false)} />
      )}
      {outcome && (
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
        />
      )}
    </main>
  );
}
