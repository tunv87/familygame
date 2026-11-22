import { useT } from '../i18n';
import { TopBar } from '../ui/components';
import privacy from './privacy.json';
import { useSettings } from './settings';

export function AboutScreen() {
  const t = useT();
  const { lang } = useSettings();
  const p = privacy[lang];
  return (
    <main className="screen">
      <TopBar title={t('about')} />
      <div className="center">
        <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width={96} height={96} />
        <h2 style={{ margin: 0 }}>{t('appName')}</h2>
        <div className="muted">{t('aboutTagline')}</div>
        <div className="muted" style={{ fontSize: 14 }}>
          v{__APP_VERSION__}
        </div>
      </div>
      <article className="about-text" data-testid="privacy">
        <h2>🔒 {p.title}</h2>
        <p className="muted">{p.updated}</p>
        {p.sections.map(([heading, body]) => (
          <section key={heading}>
            <h3>{heading}</h3>
            <p>{body}</p>
          </section>
        ))}
      </article>
    </main>
  );
}
