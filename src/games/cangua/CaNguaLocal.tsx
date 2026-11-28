import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProfile } from '../../app/settings';
import { useT, type MessageKey } from '../../i18n';
import { sfx } from '../../lib/sound';
import { useCountPlay } from '../../online/plays';
import {
  Avatar,
  ExitConfirm,
  HelpButton,
  ResultModal,
  TopBar,
  useBackHandler,
} from '../../ui/components';
import { chooseMove } from './ai';
import { CaNguaBoard, Dice2, HORSE_COLORS } from './CaNguaBoard';
import { CN_HELP, CN_STORY } from './help';
import {
  applyMove,
  applyRoll,
  colorOf,
  initialState,
  legalMoves,
  rollsAgain,
  type CaNguaState,
  type Dice,
  type Color,
} from './logic';
import { colorsFor } from './online';

const ROLL_MS = 450;
const BOT_ROLL_MS = 750;
const BOT_MOVE_MS = 650;
const ME: Color = 0;
const BOT_AVATARS = ['🤖', '👾', '🦾'];
const LOCAL_AVATARS = ['🙂', '😎', '🤠', '🥳'];

/**
 * Cờ cá ngựa on one device: against 1–3 computer players (?mode=solo&bots=1|2|3), or 2–4
 * people passing the device around (?mode=local&players=2|3|4).
 */
export function CaNguaLocal() {
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const profile = useProfile();
  const local = params.get('mode') === 'local';
  const players = local ? Math.min(4, Math.max(2, Number(params.get('players')) || 2)) : 1;
  const bots = local ? 0 : Math.min(3, Math.max(1, Number(params.get('bots')) || 1));
  const colors = colorsFor(players + bots);
  const isHuman = (c: Color) => local || c === ME;

  const [round, setRound] = useState(0);
  useCountPlay('cangua', round);
  const [state, setState] = useState<CaNguaState>(() => initialState(colors));
  const [rolling, setRolling] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmExit, setConfirmExit] = useState(false);
  const busy = useRef(false);

  const botIndex = (c: Color) => colors.indexOf(c); // 1, 2, 3 for the computers
  const nameOf = (c: Color) =>
    local
      ? t('cnPlayerN', { n: colors.indexOf(c) + 1 })
      : c === ME
        ? profile.name || t('you')
        : bots === 1
          ? t('caroComputer')
          : t('cnBotName', { n: botIndex(c) });
  const avatarOf = (c: Color) =>
    local
      ? LOCAL_AVATARS[colors.indexOf(c)]
      : c === ME
        ? profile.avatar
        : BOT_AVATARS[botIndex(c) - 1];

  // whoever's turn it is on this device (one person, or anyone holding it in "same device")
  const myTurn = state.winner === null && isHuman(state.turn);
  const botTurn = state.winner === null && !isHuman(state.turn);

  // latest state for the roll timer (the roll lands after a short animation)
  const current = useRef(state);
  current.current = state;

  const roll = () => {
    if (busy.current || state.winner !== null || state.roll !== null) return;
    busy.current = true;
    setRolling(true);
    sfx.dice();
    window.setTimeout(() => {
      const s = current.current;
      const r = () => 1 + Math.floor(Math.random() * 6);
      const dice: Dice = [r(), r()];
      const next = applyRoll(s, dice);
      setRolling(false);
      busy.current = false;
      if (!next) return;
      const vars = { name: nameOf(s.turn), a: dice[0], b: dice[1], n: dice[0] + dice[1] };
      setMessage(next.lastRoll?.passed ? t('cnNoMove', vars) : t('cnRolled', vars));
      if (rollsAgain(dice)) sfx.lucky();
      setState(next);
    }, ROLL_MS);
  };

  const move = (horse: number) => {
    const s = state;
    const next = applyMove(s, horse);
    if (!next) return;
    sfx.hooves(next.last ? Math.max(1, next.last.to - Math.max(0, next.last.from)) : 1);
    if (next.last?.kick !== undefined) {
      sfx.ganh(true);
      setMessage(
        t('cnKick', { name: nameOf(colorOf(horse)), other: nameOf(colorOf(next.last.kick)) }),
      );
    } else if (s.roll && rollsAgain(s.roll) && next.winner === null)
      setMessage(t('cnAgain', { a: s.roll[0], b: s.roll[1] }));
    else setMessage('');
    if (!local && next.turn === ME && next.winner === null && s.turn !== ME) sfx.opponent();
    setState(next);
  };

  // the computers roll and move by themselves, a little slower than a person would
  useEffect(() => {
    if (!botTurn || rolling) return;
    const id = window.setTimeout(
      () => {
        if (state.roll === null) roll();
        else {
          const h = chooseMove(state, state.roll);
          if (h !== null) move(h);
        }
      },
      state.roll === null ? BOT_ROLL_MS : BOT_MOVE_MS,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, rolling, botTurn]);

  const newRound = () => {
    setState(initialState(colors));
    setMessage('');
    setRolling(false);
    busy.current = false;
    setRound((r) => r + 1);
  };

  const started = state.rolls > 0;
  const exit = () =>
    started && state.winner === null ? setConfirmExit(true) : navigate('/cangua');
  useBackHandler(exit);

  const playable =
    myTurn && state.roll !== null && !rolling
      ? legalMoves(state, state.roll).map((m) => m.horse)
      : [];
  const shownDice = state.lastRoll?.dice ?? null;
  const rollText = (d: Dice) => `${d[0]} + ${d[1]} = ${d[0] + d[1]}`;

  const status =
    state.winner !== null
      ? ''
      : rolling
        ? t('cnRolling')
        : myTurn && local
          ? state.roll === null
            ? t('cnTurnRoll', { name: nameOf(state.turn) })
            : t('cnTurnPick', { name: nameOf(state.turn), n: rollText(state.roll) })
          : myTurn
            ? state.roll === null
              ? t('cnYourRoll')
              : t('cnPickHorse', { n: rollText(state.roll) })
            : t('turnOf', { name: nameOf(state.turn) });

  return (
    <main className="screen game">
      <TopBar
        title={t('gameCaNgua')}
        onBack={exit}
        right={<HelpButton steps={CN_HELP} story={CN_STORY} />}
      />
      <div className="players cn-players">
        {colors.map((c) => (
          <div
            key={c}
            className={`player ${state.winner === null && state.turn === c ? 'active' : ''}`}
            style={{ borderColor: HORSE_COLORS[c] }}
            data-testid={c === ME ? 'me' : `p-${c}`}
          >
            <Avatar emoji={avatarOf(c)} />
            <span className="name">{nameOf(c)}</span>
          </div>
        ))}
      </div>
      <div className="status-line" data-testid="status">
        {status}
      </div>
      <div className="numbers-toast" data-testid="cn-message">
        {message}
      </div>
      <CaNguaBoard state={state} playable={playable} onHorse={move} />
      <div className="cn-controls">
        <Dice2 dice={rolling ? null : shownDice} rolling={rolling} />
        <button
          className="btn grow"
          data-testid="cn-roll"
          disabled={!myTurn || state.roll !== null || rolling}
          onClick={() => {
            sfx.tap();
            roll();
          }}
        >
          🎲 {t('cnRoll')}
        </button>
      </div>
      {!local && (
        <div className="muted center" style={{ fontSize: 14 }}>
          {t('cnYouAre', { color: t(`cnColor${ME}` as MessageKey) })}
        </div>
      )}
      {confirmExit && (
        <ExitConfirm onConfirm={() => navigate('/cangua')} onCancel={() => setConfirmExit(false)} />
      )}
      {state.winner !== null && (
        <ResultModal
          title={
            state.winner === ME && !local
              ? t('youWin')
              : t('playerWins', { name: nameOf(state.winner) })
          }
          win={local || state.winner === ME}
          record={!local && state.winner === ME ? 'cangua' : undefined}
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
