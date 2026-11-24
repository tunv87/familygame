import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useT } from '../i18n';
import { createLogger } from '../lib/logger';
import { sfx } from '../lib/sound';
import { ExitConfirm, TopBar, useBackHandler } from '../ui/components';
import { shareInvite } from '../lib/native';
import { ensureAuth } from './firebase';
import { PlayerChip } from './PlayerChip';
import { leaveRoom, shareUrl, startGame, startRematch, watchRoom } from './room';
import { maxPlayers, type Room, type RoomPlayer } from './types';

// each game's online screen is loaded when a room of that game opens
const CaNguaOnline = lazy(() =>
  import('../games/cangua/CaNguaOnline').then((m) => ({ default: m.CaNguaOnline })),
);
const CaroOnline = lazy(() =>
  import('../games/caro/CaroOnline').then((m) => ({ default: m.CaroOnline })),
);
const CoGanhOnline = lazy(() =>
  import('../games/coganh/CoGanhOnline').then((m) => ({ default: m.CoGanhOnline })),
);
const NoiTuOnline = lazy(() =>
  import('../games/noitu/NoiTuOnline').then((m) => ({ default: m.NoiTuOnline })),
);
const OAQOnline = lazy(() =>
  import('../games/oanquan/OAQOnline').then((m) => ({ default: m.OAQOnline })),
);
const NumbersOnline = lazy(() =>
  import('../games/numbers/NumbersOnline').then((m) => ({ default: m.NumbersOnline })),
);

const log = createLogger('roomscreen');

export interface OnlineGameProps {
  room: Room;
  uid: string;
  oppUid: string;
  me: RoomPlayer;
  opp?: RoomPlayer;
  oppGone: boolean;
  /** leave immediately (from the result dialog) */
  onLeave: () => void;
  /** leave via the exit button: asks for confirmation mid-game */
  onExit: () => void;
  /**
   * a spectator: sees the game from the host's side (uid is the host's) and cannot act;
   * the game screens lock every input and speak about turns neutrally
   */
  spectate?: boolean;
}

export function RoomScreen() {
  const t = useT();
  const navigate = useNavigate();
  const { code = '' } = useParams();
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  // 'unknown' until the first connection, so the notice does not flash while connecting
  const [connection, setConnection] = useState<'unknown' | 'online' | 'offline'>('unknown');
  useEffect(() => {
    // The browser knows about a lost network before Firebase's socket times out.
    const off = () => setConnection('offline');
    window.addEventListener('offline', off);
    return () => window.removeEventListener('offline', off);
  }, []);
  const lastOpp = useRef<{ uid: string; player: RoomPlayer } | null>(null);
  const leaving = useRef(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    if (!/^\d{4}$/.test(code)) {
      setRoom(null); // not a room code: show "room not found" without touching the database
      return;
    }
    ensureAuth()
      .then((u) => {
        setUid(u);
        unsub = watchRoom(
          code,
          u,
          setRoom,
          () => setError(t('connectError')),
          (c) =>
            setConnection((prev) => (c ? 'online' : prev === 'unknown' ? 'unknown' : 'offline')),
        );
      })
      .catch(() => setError(t('connectError')));
    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const players = useMemo(() => room?.players ?? {}, [room]);
  const spectators = room?.spectators ?? {};
  const isPlayer = !!uid && !!players[uid];
  const isSpectator = !!uid && !isPlayer && !!spectators[uid];
  const isMember = isPlayer || isSpectator;
  // spectators watch from the host's side (or the first player still here)
  const viewUid = isSpectator
    ? players[room!.hostUid]
      ? room!.hostUid
      : (Object.entries(players).sort((a, b) => a[1].joinedAt - b[1].joinedAt)[0]?.[0] ?? '')
    : (uid ?? '');
  const wasIn = useRef(false);
  if (isMember) wasIn.current = true;
  const oppEntry = Object.entries(players).find(([u]) => u !== viewUid);
  if (oppEntry) lastOpp.current = { uid: oppEntry[0], player: oppEntry[1] };
  const isHost = !!room && room.hostUid === uid;

  // Not a member yet (e.g. opened /room/1234 directly): go through the join flow.
  useEffect(() => {
    if (room && uid && !isMember && !leaving.current) navigate(`/join/${code}`, { replace: true });
  }, [room, uid, isMember, code, navigate]);

  // Host starts the game once both players are in (Cờ cá ngựa: when the host taps Start),
  // and starts rematches.
  const multi = room?.game === 'cangua';
  useEffect(() => {
    if (!room || !isHost) return;
    const count = Object.keys(players).length;
    if (room.status === 'waiting' && count === 2 && !multi) {
      startGame(room).catch((e) => log.error('start failed', e));
    } else if (room.status === 'playing' && count >= 2) {
      const r = room.rematch ?? {};
      if (Object.keys(players).every((u) => r[u]))
        startRematch(room).catch((e) => log.error('rematch failed', e));
    }
  }, [room, isHost, players, multi]);

  // Sound cue when the friend arrives.
  const oppCount = Object.keys(players).length - 1;
  useEffect(() => {
    if (oppCount) sfx.good();
  }, [oppCount]);

  const leave = async () => {
    leaving.current = true;
    if (uid) await leaveRoom(code, uid);
    navigate('/');
  };

  const share = async () => {
    const url = shareUrl(code);
    const game =
      room?.game === 'numbers'
        ? t('gameNumbers')
        : room?.game === 'coganh'
          ? t('gameCoGanh')
          : room?.game === 'oanquan'
            ? t('gameOAQ')
            : room?.game === 'noitu'
              ? t('gameNoiTu')
              : room?.game === 'cangua'
                ? t('gameCaNgua')
                : t('gameCaro');
    const text = t('shareText', { game, code });
    if (await shareInvite({ title: t('appName'), text, url })) return;
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
    } catch (e) {
      log.warn('clipboard failed', String(e));
    }
  };

  const title =
    room?.game === 'numbers'
      ? t('gameNumbers')
      : room?.game === 'caro'
        ? t('gameCaro')
        : room?.game === 'coganh'
          ? t('gameCoGanh')
          : room?.game === 'oanquan'
            ? t('gameOAQ')
            : room?.game === 'noitu'
              ? t('gameNoiTu')
              : room?.game === 'cangua'
                ? t('gameCaNgua')
                : t('online');

  // Android back button: same as the exit button (asks mid-game). Set below once known.
  const backRef = useRef<() => void>(() => void leave());
  useBackHandler(() => (confirmExit ? setConfirmExit(false) : backRef.current()));

  if (room === null && wasIn.current && !leaving.current) {
    // every player left: the room is gone (spectators and players who lost the connection)
    return (
      <main className="screen">
        <TopBar title={title} onBack={() => navigate('/')} />
        <div className="center grow">
          <div className="banner" data-testid="room-ended">
            🏁 {t('roomEnded')}
          </div>
          <button className="btn" onClick={() => navigate('/')}>
            🏠 {t('home')}
          </button>
        </div>
      </main>
    );
  }

  if (error || room === null) {
    return (
      <main className="screen">
        <TopBar title={title} onBack={() => navigate('/')} />
        <div className="center grow">
          <div className="error">{error || t('roomNotFound', { code })}</div>
          <button className="btn" onClick={() => navigate('/')}>
            🏠 {t('home')}
          </button>
        </div>
      </main>
    );
  }

  if (room === undefined || !uid || !isMember) {
    return (
      <main className="screen center">
        <div className="muted">{t('connecting')}</div>
      </main>
    );
  }

  const me = players[viewUid];
  const watchers = Object.keys(spectators).length;
  const watchLine = isSpectator ? (
    <div className="banner spectate-banner" data-testid="spectating">
      👀 {t('spectating')}
    </div>
  ) : watchers > 0 ? (
    <div className="watchers" data-testid="watchers">
      👀 {t('watchers', { n: watchers })}
    </div>
  ) : null;

  if (room.status === 'waiting' || !room.state) {
    return (
      <main className="screen">
        <TopBar title={title} onBack={leave} />
        <div className="center grow">
          <div className="muted">{t('roomCode')}</div>
          <div className="room-code" data-testid="room-code">
            {code}
          </div>
          <button className="btn" onClick={share} data-testid="share">
            📤 {copied ? t('copied') : t('share')}
          </button>
          {watchLine}
          {multi ? (
            <MultiLobby room={room} uid={uid} isHost={isHost} />
          ) : (
            <>
              <div className="status-line">⏳ {t('waitingOpponent')}</div>
              <div className="players" style={{ width: '100%' }}>
                <PlayerChip player={me} />
                <PlayerChip player={oppEntry?.[1]} />
              </div>
            </>
          )}
        </div>
      </main>
    );
  }

  const opp = oppEntry?.[1] ?? lastOpp.current?.player;
  const oppUid = oppEntry?.[0] ?? lastOpp.current?.uid ?? '';
  const st = room.state as { done?: boolean; winner?: string };
  const finished = !!(st.done || st.winner);
  const requestExit = () => (finished || !oppEntry || isSpectator ? leave() : setConfirmExit(true));
  backRef.current = requestExit;
  const props: OnlineGameProps = {
    room,
    uid: viewUid,
    spectate: isSpectator,
    oppUid,
    me,
    opp,
    oppGone: !oppEntry,
    onLeave: leave,
    onExit: requestExit,
  };
  return (
    <main className={`screen game ${room.game === 'numbers' ? 'tight' : ''}`}>
      {/* Numbers puts its back button in its compact HUD to leave more room for the board. */}
      {room.game !== 'numbers' && (
        <TopBar
          title={title}
          onBack={requestExit}
          right={
            <button className="btn secondary exit-btn" onClick={requestExit} data-testid="exit">
              🚪 {t('exitGame')}
            </button>
          }
        />
      )}
      {watchLine}
      {connection === 'offline' && (
        <div className="banner" data-testid="offline">
          📶 {t('offlineSelf')}
        </div>
      )}
      {!multi && !oppEntry && opp && (
        <div className="banner">👋 {t('opponentLeft', { name: opp.name })}</div>
      )}
      {!multi && oppEntry && !oppEntry[1].online && (
        <div className="banner">📶 {t('waitingReconnect', { name: oppEntry[1].name })}</div>
      )}
      <Suspense fallback={null}>
        {room.game === 'numbers' ? (
          <NumbersOnline {...props} />
        ) : room.game === 'coganh' ? (
          <CoGanhOnline {...props} />
        ) : room.game === 'oanquan' ? (
          <OAQOnline {...props} />
        ) : room.game === 'noitu' ? (
          <NoiTuOnline {...props} />
        ) : room.game === 'cangua' ? (
          <CaNguaOnline {...props} />
        ) : (
          <CaroOnline {...props} />
        )}
      </Suspense>
      {confirmExit && (
        <ExitConfirm
          hint={t('exitOnlineHint')}
          onConfirm={leave}
          onCancel={() => setConfirmExit(false)}
        />
      )}
    </main>
  );
}

/** Waiting room for games of 2–4 players: who is in, and a Start button for the host. */
function MultiLobby({ room, uid, isHost }: { room: Room; uid: string; isHost: boolean }) {
  const t = useT();
  const [starting, setStarting] = useState(false);
  const list = Object.entries(room.players ?? {}).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  const max = maxPlayers(room.game);
  const start = () => {
    setStarting(true);
    startGame(room).catch((e) => {
      log.error('start failed', e);
      setStarting(false);
    });
  };
  return (
    <>
      <div className="status-line">
        ⏳ {list.length < 2 ? t('waitingOpponent') : isHost ? t('cnCanStart') : t('cnWaitHost')}
      </div>
      <div className="lobby-grid" data-testid="lobby-players">
        {Array.from({ length: max }, (_, i) => (
          <PlayerChip
            key={list[i]?.[0] ?? `empty-${i}`}
            player={list[i]?.[1]}
            active={list[i]?.[0] === uid}
          />
        ))}
      </div>
      {isHost && (
        <button
          className="btn"
          disabled={list.length < 2 || starting}
          onClick={start}
          data-testid="start-game"
        >
          ▶️ {t('cnStart', { n: list.length })}
        </button>
      )}
    </>
  );
}
