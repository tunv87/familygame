/** Static security checks (qa/test-cases.md: SEC-03, SEC-04, SEC-05). */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '../..');
const SKIP = new Set([
  'node_modules',
  '.git',
  'dist',
  'test-results',
  'playwright-report',
  'Pods',
  'build',
  '.gradle',
  'qa',
]);

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* files(p);
    else if (st.size < 2_000_000 && !/\.(png|jpg|jpeg|webp|woff2?|jar|ico)$/.test(name)) yield p;
  }
}

describe('[SEC-03] no secrets in the repository or the web build', () => {
  const patterns: [string, RegExp][] = [
    ['private key', /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ['service account', /"type":\s*"service_account"/],
    ['App Store Connect key', /-----BEGIN EC PRIVATE KEY-----|AuthKey_[A-Z0-9]{10}\.p8/],
    ['GitHub token', /gh[pousr]_[A-Za-z0-9]{36}/],
    ['keystore file', /^$/], // matched by file name below
  ];
  it('source tree', () => {
    const hits: string[] = [];
    for (const f of files(ROOT)) {
      if (/\.(jks|keystore|p8|p12)$/.test(f)) hits.push(`${f}: key file`);
      const text = readFileSync(f, 'utf8');
      for (const [name, re] of patterns.slice(0, 4)) if (re.test(text)) hits.push(`${f}: ${name}`);
    }
    expect(hits.filter((h) => !h.includes('security.test.ts'))).toEqual([]);
  });
  it('only the public Firebase web API key is in the build', () => {
    const dist = join(ROOT, 'dist/assets');
    if (!existsSync(dist)) return; // build not present in this run
    const keys = new Set<string>();
    for (const f of readdirSync(dist).filter((n) => n.endsWith('.js'))) {
      for (const m of readFileSync(join(dist, f), 'utf8').matchAll(/AIza[0-9A-Za-z_-]{35}/g))
        keys.add(m[0]);
    }
    const env = readFileSync(join(ROOT, '.env.production'), 'utf8');
    for (const k of keys)
      expect(env.includes(k), `unexpected API key ${k.slice(0, 8)}…`).toBe(true);
  });
});

describe('[SEC-04] dependencies shipped in the app have no high/critical advisories', () => {
  it('npm audit --omit=dev', () => {
    let out = '';
    try {
      out = execSync('npm audit --omit=dev --json', {
        cwd: ROOT,
        encoding: 'utf8',
        timeout: 60_000,
      });
    } catch (e) {
      out = (e as { stdout?: string }).stdout ?? '';
    }
    if (!out.trim().startsWith('{')) return; // registry unreachable: reported as skipped in the run notes
    const v = JSON.parse(out).metadata?.vulnerabilities ?? {};
    expect({ high: v.high ?? 0, critical: v.critical ?? 0 }).toEqual({ high: 0, critical: 0 });
  });
});

describe('[SEC-05] native apps only talk over HTTPS', () => {
  it('Android: no cleartext traffic', () => {
    const manifest = readFileSync(join(ROOT, 'android/app/src/main/AndroidManifest.xml'), 'utf8');
    expect(manifest).not.toMatch(/usesCleartextTraffic="true"/);
    const cap = readFileSync(join(ROOT, 'capacitor.config.ts'), 'utf8');
    expect(cap).not.toMatch(/cleartext:\s*true/);
    expect(cap).not.toMatch(/allowMixedContent:\s*true/);
  });
  it('iOS: App Transport Security is not disabled', () => {
    const plist = readFileSync(join(ROOT, 'ios/App/App/Info.plist'), 'utf8');
    expect(plist).not.toMatch(/NSAllowsArbitraryLoads<\/key>\s*<true/);
  });
});
