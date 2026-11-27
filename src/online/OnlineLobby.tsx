import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { modeStatus, useGamesConfig } from '../app/gameConfig';
import { useT } from '../i18n';
import { createLogger } from '../lib/logger';
import { Card, useProfileGate } from '../ui/components';
import { isOnlineConfigured } from './firebase';
import { createRoom } from './room';
import type { GameId, RoomOptions } from './types';

const log = createLogger('lobby');

export function OnlineLobby({ game, options }: { game: GameId; options: RoomOptions }) {
  const t = useT();
  const navigate = useNavigate();
  const { gate, modal } = useProfileGate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const onlineOn = modeStatus(useGamesConfig(), game, 'online') === 'on';

  if (!isOnlineConfigured) return <div className="banner">{t('onlineNotConfigured')}</div>;

  const create = () =>
    gate(async (profile) => {
      setBusy(true);
      setError('');
      try {
        const code = await createRoom(game, options, profile);
        navigate(`/room/${code}`);
      } catch (e) {
        log.error('create room failed', e);
        setError(t('connectError'));
        setBusy(false);
      }
    });

  return (
    <div className="stack">
      <Card
        emoji="🏠"
        title={busy ? t('connecting') : t('createRoom')}
        hint={t('createRoomHint')}
        onClick={busy ? () => {} : create}
        testId="create-room"
        off={onlineOn ? undefined : t('onlineOff')}
      />
      <Card
        emoji="🔑"
        title={t('joinRoom')}
        hint={t('joinRoomHint')}
        onClick={() => navigate('/join')}
        testId="join-room"
      />
      {error && <div className="error center">{error}</div>}
      {modal}
    </div>
  );
}
