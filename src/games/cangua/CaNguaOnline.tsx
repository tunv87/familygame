import { useEffect, useMemo, useRef, useState } from 'react';
import { useT, type MessageKey } from '../../i18n';
import { createLogger } from '../../lib/logger';
import { sfx } from '../../lib/sound';
import { OnlineResult } from '../../online/OnlineResult';
import { PlayerChip } from '../../online/PlayerChip';
import { transactState, winsOf } from '../../online/room';
import type { OnlineGameProps } from '../../online/RoomScreen';
import { CaNguaBoard, Dice2, HORSE_COLORS, useDieChoice } from './CaNguaBoard';
import { colorOf, rollsAgain, type Color } from './logic';
import {
  applyCaNguaOnline,
  colorOfUid,
  seatsOf,
  toLocal,
  turnUidOf,
  unpackDice,
  type CaNguaAction,
  type CaNguaOnlineState,
} from './online';

const log = createLogger('cangua-online');
const ROLL_MS = 450;

/** Cờ cá ngựa between 2–4 players online. */
export function CaNguaOnline(props: OnlineGameProps) {
  const { room, uid } = props;
  const t = useT();
  const o = room.state as CaNguaOnlineState;
  const s = useMemo(() => toLocal(o), [o]);
  const players = room.players ?? {};
  const seats = seatsOf(o);
  const nameOf = (c: Color) => players[seats[c]]?.name ?? t(`cnColor${c}` as MessageKey);
  const mine = colorOfUid(o, uid);
  const watching = !!props.spectate;
  const myTurn = !o.winner && turnUidOf(o) === uid && !watching;
  const [pending, setPending] = useState(false);

  // a short roll animation each time someone rolls
  const [rolling, setRolling] = useState(false);
  const [message, setMessage] = useState('');
  const seen = useRef({ rolls: o.rolls, last: JSON.stringify(o.last ?? null) });
  useEffect(() => {
    const before = seen.current;
    const lastKey = JSON.stringify(o.last ?? null);
    seen.current = { rolls: o.rolls, last: lastKey };
    if (o.rolls === before.rolls + 1 && o.lastRoll) {
      setRolling(true);
      sfx.dice();
      const lr = o.lastRoll;
      const dice = unpackDice(lr.d);
      const id = window.setTimeout(() => {
        setRolling(false);
        if (!dice) return;
        const vars = { name: nameOf(lr.c), a: dice[0], b: dice[1] };
        setMessage(lr.p ? t('cnNoMove', vars) : t('cnRolled', vars));
        if (rollsAgain(dice)) sfx.lucky();
      }, ROLL_MS);
      return () => window.clearTimeout(id);
    }
    if (lastKey !== before.last && o.last) {
      sfx.hooves(Math.max(1, o.last.t - Math.max(0, o.last.f)));
      const lastDice = unpackDice(o.lastRoll?.d);
      if (o.last.k !== undefined) {
        sfx.ganh(true);
        setMessage(
          t('cnKick', { name: nameOf(colorOf(o.last.h)), other: nameOf(colorOf(o.last.k)) }),
        );
      } else if (lastDice && rollsAgain(lastDice) && !o.roll && !o.winner)
        setMessage(t('cnAgain', { a: lastDice[0], b: lastDice[1] }));
      else setMessage('');
      // someone else just finished their turn and it is now mine
      if (turnUidOf(o) === uid && seats[colorOf(o.last.h)] !== uid && !o.winner) sfx.opponent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.rolls, o.last]);

  const act = async (a: CaNguaAction) => {
    setPending(true);
    try {
      const ok = await transactState<CaNguaOnlineState>(room.code, (cur) =>
        applyCaNguaOnline(cur, uid, a),
      );
      if (!ok) log.warn('action rejected', a);
    } catch (e) {
      log.error('action failed', e);
    } finally {
      setPending(false);
    }
  };

  // A player who left is dropped by the first player still here, so the game goes on.
  const gone = s.colors.filter((c) => !players[seats[c]]);
  const firstHere = s.colors.find((c) => players[seats[c]]);
  const goneKey = gone.join();
  useEffect(() => {
    if (!watching && !o.winner && gone.length && firstHere === mine)
      void act({ t: 'drop', uid: seats[gone[0]] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goneKey, firstHere, mine, o.winner]);

  const choice = useDieChoice(s, myTurn && !pending && !rolling);
  const shownDice = s.roll ?? unpackDice(o.lastRoll?.d);
  const left = s.roll && s.used ? s.roll[s.used & 1 ? 1 : 0] : null;

  const status = o.winner
    ? ''
    : rolling
      ? t('cnRolling')
      : watching
        ? t('turnOf', { name: nameOf(s.turn) })
        : myTurn
          ? s.roll === null
            ? t('cnYourRoll')
            : left !== null
              ? t('cnPickRest', { n: left })
              : t('cnPickHorse', { a: s.roll[0], b: s.roll[1] })
          : t('caroWaitTurn', { name: nameOf(s.turn) });

  const winnerPlayer = o.winner ? players[o.winner] : undefined;
  return (
    <>
      <div className="players cn-players">
        {([0, 1, 2, 3] as Color[])
          .filter((c) => seats[c])
          .map((c) => (
            <PlayerChip
              key={c}
              player={players[seats[c]]}
              color={HORSE_COLORS[c]}
              score={winsOf(room, seats[c])}
              active={!o.winner && s.turn === c && s.colors.includes(c)}
              testId={seats[c] === uid ? 'me' : `p-${c}`}
            />
          ))}
      </div>
      <div className="status-line" data-testid="status">
        {status}
      </div>
      <div className="numbers-toast" data-testid="cn-message">
        {message}
      </div>
      <CaNguaBoard
        state={s}
        playable={choice.playable}
        onHorse={(h) =>
          void act(
            choice.selected === null
              ? { t: 'move', horse: h }
              : { t: 'move', horse: h, die: choice.selected },
          )
        }
      />
      <div className="cn-controls">
        <Dice2
          dice={rolling ? null : shownDice}
          rolling={rolling}
          used={s.roll ? s.used : 0}
          usable={choice.usable}
          selected={choice.selected}
          onPick={(d) => {
            sfx.tap();
            choice.pickDie(d);
          }}
          label={(n) => t('cnPickDie', { n })}
        />
        <button
          className="btn grow"
          data-testid="cn-roll"
          disabled={!myTurn || s.roll !== null || pending || rolling}
          onClick={() => {
            sfx.tap();
            void act({ t: 'roll' });
          }}
        >
          🎲 {t('cnRoll')}
        </button>
      </div>
      {mine !== null && !watching && (
        <div className="muted center" style={{ fontSize: 14 }}>
          {t('cnYouAre', { color: t(`cnColor${mine}` as MessageKey) })}
        </div>
      )}
      {o.winner && (
        <OnlineResult
          {...props}
          opp={winnerPlayer}
          oppGone={Object.keys(players).length < 2}
          winner={o.winner}
        />
      )}
    </>
  );
}
