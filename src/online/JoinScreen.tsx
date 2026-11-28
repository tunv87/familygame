import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProfile, type Profile } from '../app/settings';
import { useT } from '../i18n';
import { createLogger } from '../lib/logger';
import { sfx } from '../lib/sound';
import { ProfileModal, TopBar } from '../ui/components';
import { isOnlineConfigured } from './firebase';
import { RoomError, joinRoom } from './room';

const log = createLogger('join');

export function JoinScreen() {
  const t = useT();
  const navigate = useNavigate();
  const params = useParams();
  const [code, setCode] = useState(params.code ?? '');
  const [needProfile, setNeedProfile] = useState(!getProfile().name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const join = useCallback(
    async (c: string, profile: Profile) => {
      setBusy(true);
      setError('');
      try {
        await joinRoom(c, profile);
        navigate(`/room/${c}`, { replace: true });
      } catch (e) {
        log.warn('join failed', { c, e: String(e) });
        sfx.bad();
        if (e instanceof RoomError && e.code === 'notFound')
          setError(t('roomNotFound', { code: c }));
        else if (e instanceof RoomError && e.code === 'full') setError(t('roomFull', { code: c }));
        else setError(t('connectError'));
        setCode('');
        started.current = '';
        setBusy(false);
      }
    },
    [navigate, t],
  );

  // One join per code, even if React runs this effect twice (StrictMode) or it re-renders.
  const started = useRef('');
  useEffect(() => {
    if (needProfile || code.length !== 4 || busy || error || started.current === code) return;
    started.current = code;
    void join(code, getProfile());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, needProfile]);

  const press = (d: string) => {
    sfx.tap();
    setError('');
    setCode((c) => (d === '⌫' ? c.slice(0, -1) : c.length < 4 ? c + d : c));
  };

  if (!isOnlineConfigured)
    return (
      <main className="screen">
        <TopBar title={t('joinRoom')} />
        <div className="banner">{t('onlineNotConfigured')}</div>
      </main>
    );

  return (
    <main className="screen">
      <TopBar title={t('joinRoom')} onBack={() => navigate('/')} />
      <div className="center grow">
        <div className="muted">{t('enterCode')}</div>
        <div className="code-slots" data-testid="code-slots">
          {[0, 1, 2, 3].map((i) => (
            <span key={i}>{code[i] ?? ''}</span>
          ))}
        </div>
        <div className="status-line">
          {busy ? t('connecting') : <span className="error">{error}</span>}
        </div>
        <div className="keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((d, i) =>
            d ? (
              <button
                key={i}
                onClick={() => press(d)}
                disabled={busy}
                data-testid={`key-${d}`}
                aria-label={d === '⌫' ? t('deleteDigit') : undefined}
              >
                {d === '⌫' ? <BackspaceIcon /> : d}
              </button>
            ) : (
              <span key={i} />
            ),
          )}
        </div>
      </div>
      {needProfile && (
        <ProfileModal onDone={() => setNeedProfile(false)} onCancel={() => navigate('/')} />
      )}
    </main>
  );
}

/** Drawn "delete" key: the ⌫ character is missing from many fonts (shows as a box). */
function BackspaceIcon() {
  return (
    <svg className="key-icon" viewBox="0 0 24 24" aria-hidden width="1em" height="1em">
      <path
        d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M12 9.5l5 5M17 9.5l-5 5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
