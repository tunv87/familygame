import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CaroOnline } from '../games/caro/CaroOnline';
import { NumbersOnline } from '../games/numbers/NumbersOnline';
import { useT } from '../i18n';
import { createLogger } from '../lib/logger';
import { sfx } from '../lib/sound';
import { TopBar } from '../ui/components';
import { ensureAuth } from './firebase';
import { PlayerChip } from './PlayerChip';
import { leaveRoom, shareUrl, startGame, startRematch, watchRoom } from './room';
import type { Room, RoomPlayer } from './types';

const log = createLogger('roomscreen');

export interface OnlineGameProps {
  room: Room;
  uid: string;
  oppUid: string;
  me: RoomPlayer;
  opp?: RoomPlayer;
  oppGone: boolean;
  onLeave: () => void;
}

export function RoomScreen() {
  const t = useT();
  const navigate = useNavigate();
  const { code = '' } = useParams();
  const [uid, setUid] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const lastOpp = useRef<{ uid: string; player: RoomPlayer } | null>(null);
  const leaving = useRef(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    ensureAuth()
      .then((u) => {
        setUid(u);
        unsub = watchRoom(code, u, setRoom, () => setError(t('connectError')));
      })
      .catch(() => setError(t('connectError')));
    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const players = useMemo(() => room?.players ?? {}, [room]);
  const isMember = !!uid && !!players[uid];
  const oppEntry = Object.entries(players).find(([u]) => u !== uid);
  if (oppEntry) lastOpp.current = { uid: oppEntry[0], player: oppEntry[1] };
  const isHost = !!room && room.hostUid === uid;

  // Not a member yet (e.g. opened /room/1234 directly): go through the join flow.
  useEffect(() => {
    if (room && uid && !isMember && !leaving.current) navigate(`/join/${code}`, { replace: true });
  }, [room, uid, isMember, code, navigate]);

  // Host starts the game once both players are in, and starts rematches.
  useEffect(() => {
    if (!room || !isHost) return;
    const count = Object.keys(players).length;
    if (room.status === 'waiting' && count === 2) {
      startGame(room).catch((e) => log.error('start failed', e));
    } else if (room.status === 'playing' && count === 2) {
      const r = room.rematch ?? {};
      if (Object.keys(players).every((u) => r[u]))
        startRematch(room).catch((e) => log.error('rematch failed', e));
    }
  }, [room, isHost, players]);

  // Sound cue when the friend arrives.
  const oppCount = oppEntry ? 1 : 0;
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
    const game = room?.game === 'numbers' ? t('gameNumbers') : t('gameCaro');
    const text = t('shareText', { game, code });
    try {
      if (navigator.share) {
        await navigator.share({ title: t('appName'), text, url });
        return;
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
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
        : t('online');

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

  const me = players[uid];

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
          <div className="status-line">⏳ {t('waitingOpponent')}</div>
          <div className="players" style={{ width: '100%' }}>
            <PlayerChip player={me} />
            <PlayerChip player={oppEntry?.[1]} />
          </div>
        </div>
      </main>
    );
  }

  const opp = oppEntry?.[1] ?? lastOpp.current?.player;
  const oppUid = oppEntry?.[0] ?? lastOpp.current?.uid ?? '';
  const props: OnlineGameProps = { room, uid, oppUid, me, opp, oppGone: !oppEntry, onLeave: leave };
  return (
    <main className={`screen ${room.game === 'numbers' ? 'tight' : ''}`}>
      {/* Numbers puts its back button in its compact HUD to leave more room for the board. */}
      {room.game !== 'numbers' && <TopBar title={title} onBack={leave} />}
      {!oppEntry && opp && <div className="banner">👋 {t('opponentLeft', { name: opp.name })}</div>}
      {oppEntry && !oppEntry[1].online && (
        <div className="banner">📶 {t('waitingReconnect', { name: oppEntry[1].name })}</div>
      )}
      {room.game === 'numbers' ? <NumbersOnline {...props} /> : <CaroOnline {...props} />}
    </main>
  );
}
