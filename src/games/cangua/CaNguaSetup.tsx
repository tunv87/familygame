import { useNavigate } from 'react-router-dom';
import { GamePoster } from '../../ui/GamePoster';
import { useT } from '../../i18n';
import { OnlineLobby } from '../../online/OnlineLobby';
import { HelpButton, TopBar, useBackHandler } from '../../ui/components';
import { CN_HELP, CN_STORY } from './help';

/** Cờ cá ngựa is played online, 2–4 players: straight to creating or joining a room. */
export function CaNguaSetup() {
  const t = useT();
  const navigate = useNavigate();
  useBackHandler(() => navigate('/'));
  return (
    <main className="screen">
      <TopBar
        title={t('gameCaNgua')}
        onBack={() => navigate('/')}
        right={<HelpButton steps={CN_HELP} story={CN_STORY} />}
      />
      <GamePoster game="cangua" story={CN_STORY} rules={CN_HELP} />
      <div className="stack">
        <div className="muted center" data-testid="cn-intro">
          🐴 {t('cnIntro')}
        </div>
        <OnlineLobby game="cangua" options={{}} />
      </div>
    </main>
  );
}
