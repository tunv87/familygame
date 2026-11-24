import { useEffect, useMemo, useRef, useState } from 'react';
import { useT, type MessageKey } from '../../i18n';
import { createLogger } from '../../lib/logger';
import { sfx } from '../../lib/sound';
import { OnlineResult } from '../../online/OnlineResult';
import { PlayerChip } from '../../online/PlayerChip';
import { transactState, winsOf } from '../../online/room';
import type { OnlineGameProps } from '../../online/RoomScreen';
import { CaNguaBoard, DieFace, HORSE_COLORS } from './CaNguaBoard';
import { colorOf, legalMoves, type Color } from './logic';
import {
  applyCaNguaOnline,
  colorOfUid,
  seatsOf,
  toLocal,
  turnUidOf,
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
  const myTurn = !o.winner && turnUidOf(o) === uid;
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
      const lr = o.lastRoll;
      const id = window.setTimeout(() => {
        setRolling(false);
        if (lr.p) setMessage(t('cnNoMove', { name: nameOf(lr.c), n: lr.v }));
        else setMessage(t('cnRolled', { name: nameOf(lr.c), n: lr.v }));
        if (lr.v === 6) sfx.ganh();
      }, ROLL_MS);
      return () => window.clearTimeout(id);
    }
    if (lastKey !== before.last && o.last) {
      if (o.last.k !== undefined) {
        sfx.ganh(true);
        setMessage(
          t('cnKick', { name: nameOf(colorOf(o.last.h)), other: nameOf(colorOf(o.last.k)) }),
        );
      } else if (o.lastRoll?.v === 6 && !o.winner) setMessage(t('cnAgain'));
      else setMessage('');
      if (turnUidOf(o) === uid && !o.winner) sfx.opponent();
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
    if (!o.winner && gone.length && firstHere === mine)
      void act({ t: 'drop', uid: seats[gone[0]] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goneKey, firstHere, mine, o.winner]);

  const playable =
    myTurn && s.roll !== null && !pending && !rolling
      ? legalMoves(s, s.roll).map((m) => m.horse)
      : [];
  const shownRoll = o.lastRoll?.v ?? null;

  const status = o.winner
    ? ''
    : rolling
      ? t('cnRolling')
      : myTurn
        ? s.roll === null
          ? t('cnYourRoll')
          : t('cnPickHorse', { n: s.roll })
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
      <CaNguaBoard state={s} playable={playable} onHorse={(h) => void act({ t: 'move', horse: h })} />
      <div className="cn-controls">
        <DieFace value={rolling ? null : shownRoll} rolling={rolling} />
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
      {mine !== null && (
        <div className="muted center" style={{ fontSize: 14 }}>
          {t('cnYouAre', { color: t(`cnColor${mine}` as MessageKey) })}
        </div>
      )}
      {o.winner && (
        <OnlineResult {...props} opp={winnerPlayer} oppGone={Object.keys(players).length < 2} winner={o.winner} />
      )}
    </>
  );
}
