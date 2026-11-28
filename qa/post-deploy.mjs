/**
 * Post-deploy QA: checks the live site (GitHub Pages) right after a deploy, on a desktop
 * (1280×800) and a phone (360×800) screen, for the cases TC-01 … TC-15 of the project's
 * "Test_Cases" sheet. Writes qa/latest-results.json:
 *   { test_date, build_version, url, results: [{ tc_id, status, actual_result }] }
 * Exits with code 1 when a case fails (the sheet is still updated by the next step).
 *
 *   node qa/post-deploy.mjs                    # live site
 *   QA_URL=http://localhost:4173/ node qa/post-deploy.mjs
 *
 * Only reads the site: it never creates rooms or accounts. TC-15 also reads qa/npm-audit.json
 * when the workflow wrote it.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = (process.env.QA_URL || 'https://tunv87.github.io/familygame/').replace(/\/?$/, '/');
const OUT = new URL('./latest-results.json', import.meta.url);
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 360, height: 800 };

const results = new Map(); // tc_id -> { status, notes[] }
const note = (id, status, text) => {
  const r = results.get(id) ?? { status: 'PASS', notes: [] };
  // FAIL beats BLOCKED beats PASS
  const rank = { PASS: 0, BLOCKED: 1, FAIL: 2 };
  if (rank[status] > rank[r.status]) r.status = status;
  r.notes.push(text);
  results.set(id, r);
};
const check = (id, ok, passText, failText) =>
  note(id, ok ? 'PASS' : 'FAIL', ok ? passText : failText);

/** Runs one case; an exception fails it with the message. */
async function run(id, label, fn) {
  try {
    await fn();
  } catch (e) {
    note(
      id,
      'FAIL',
      `${label}: ${String(e?.message ?? e)
        .split('\n')[0]
        .slice(0, 160)}`,
    );
  }
}

// behind a company / sandbox proxy, the browser needs to be told about it
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await chromium.launch(proxy ? { proxy: { server: proxy } } : {});
const errors = []; // console errors and page errors, from every page

async function newPage(viewport, label) {
  const ctx = await browser.newContext({ viewport, locale: 'vi-VN' });
  // a returning player: welcome done, named, sound off, Vietnamese
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('fg:onboarded', '{"done":true}');
      if (!localStorage.getItem('fg:profile'))
        localStorage.setItem('fg:profile', JSON.stringify({ name: 'QA', avatar: '🐢' }));
      localStorage.setItem(
        'fg:settings',
        JSON.stringify({ lang: 'vi', theme: 'classic', sound: false }),
      );
    } catch {
      /* storage blocked */
    }
  });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[${label}] console: ${m.text().slice(0, 200)}`);
  });
  page.on('pageerror', (e) => errors.push(`[${label}] page: ${String(e.message).slice(0, 200)}`));
  page.setDefaultTimeout(15_000);
  return { ctx, page };
}

const go = (page, hash) => page.goto(`${BASE}${hash}`, { waitUntil: 'domcontentloaded' });

// ---------------------------------------------------------------- build version (from #/debug)
let buildVersion = 'unknown';
{
  const { ctx, page } = await newPage(DESKTOP, 'desktop');
  await run('TC-14', 'debug page', async () => {
    // players get no button to the log (F06); open it by its address
    await go(page, '#/settings');
    await page.getByTestId('about').waitFor();
    const debugButton = await page.getByRole('button', { name: /Nhật ký lỗi|Error log/ }).count();
    await go(page, '#/debug');
    const text = await page.locator('.log-view').innerText();
    const m = text.match(/version (\S+) built ([^\n]+)/);
    if (m) buildVersion = `${m[1]} (${m[2].trim()})`;
    // TC-14: no secrets, tokens or private data on the debug page
    const secrets = [
      [/AIza[0-9A-Za-z_-]{35}/, 'Google API key'],
      [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
      [/"private_key"|client_secret|refresh_token/i, 'service account / OAuth secret'],
      [/\bya29\.[0-9A-Za-z_-]+/, 'OAuth access token'],
      [/eyJ[0-9A-Za-z_-]{10,}\.[0-9A-Za-z_-]{10,}\.[0-9A-Za-z_-]{10,}/, 'JWT / ID token'],
      [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, 'e-mail address'],
    ].filter(([re]) => re.test(text));
    check(
      'TC-14',
      secrets.length === 0 && debugButton === 0,
      `#/debug shows build ${buildVersion} and logs only; no keys, tokens or e-mails; no button to it in Settings`,
      [
        secrets.length ? `#/debug exposes: ${secrets.map(([, what]) => what).join(', ')}` : '',
        debugButton ? 'Settings still shows the error log button' : '',
      ]
        .filter(Boolean)
        .join('; '),
    );
  });
  await ctx.close();
}

// ---------------------------------------------------------------- desktop cases
{
  const { ctx, page } = await newPage(DESKTOP, 'desktop');

  await run('TC-01', 'Nối từ', async () => {
    await go(page, '#/noitu/play?mode=solo&level=easy');
    await page.getByTestId('nt-input').waitFor({ timeout: 30_000 });
    await page.getByTestId('nt-input').fill('xyz');
    await page.getByTestId('nt-go').click();
    await page.getByTestId('nt-error').filter({ hasText: /.+/ }).waitFor();
    const refused = (await page.getByTestId('nt-word-1').count()) === 0;
    await page.getByTestId('nt-hint').click();
    await page.waitForFunction(
      () => document.querySelector('[data-testid="nt-input"]')?.value !== '',
    );
    const hint = await page.getByTestId('nt-input').inputValue();
    await page.getByTestId('nt-go').click();
    await page.getByTestId('nt-word-1').waitFor();
    // the computer answers (or, on the easy level, sometimes gives up)
    await page
      .getByTestId('nt-word-2')
      .or(page.getByTestId('result-title'))
      .first()
      .waitFor({ timeout: 20_000 });
    const words = await page.locator('[data-testid^="nt-word-"] b').allInnerTexts();
    check(
      'TC-01',
      refused && hint.length > 0 && words.every((w) => w.trim().split(/\s+/).length === 2),
      `"xyz" refused; hint "${hint}" accepted; computer answered (${words.join(' → ')})`,
      `refused=${refused}, hint="${hint}", words=${words.join(' → ')}`,
    );
  });

  await run('TC-02', 'Vào phòng & Cài đặt', async () => {
    await go(page, '#/join');
    await page.getByTestId('key-1').waitFor();
    const overlayJoin = await page.locator('.modal-backdrop').count();
    await go(page, '#/settings');
    await page.getByTestId('open-family').waitFor();
    const overlaySettings = await page.locator('.modal-backdrop').count();
    check(
      'TC-02',
      overlayJoin === 0 && overlaySettings === 0,
      'Vào phòng and Cài đặt open as full pages, nothing covering them',
      `unexpected overlay: join=${overlayJoin}, settings=${overlaySettings}`,
    );
  });

  await run('TC-03', 'modal Hướng dẫn', async () => {
    await go(page, '#/noitu');
    await page.getByTestId('help').click();
    // read the dialog right away and after the opening animation: it must be solid both times
    const look = () =>
      page.locator('.modal').evaluate((el) => {
        const cs = getComputedStyle(el);
        const alpha = (cs.backgroundColor.match(/[\d.]+/g) ?? []).map(Number)[3] ?? 1;
        let op = 1;
        for (let n = el; n; n = n.parentElement) op *= Number(getComputedStyle(n).opacity);
        return { alpha, op };
      });
    const early = await look();
    await page.waitForTimeout(400);
    const late = await look();
    const ok = [early, late].every((x) => x.alpha === 1 && x.op === 1);
    check(
      'TC-03',
      ok,
      'Help dialog is opaque from the first frame (background alpha 1, opacity 1)',
      `Help dialog see-through: first ${JSON.stringify(early)}, after ${JSON.stringify(late)}`,
    );
    await page.keyboard.press('Escape');
  });

  await run('TC-04', 'keypad & Tìm số', async () => {
    await go(page, '#/join');
    const del = page.getByTestId('key-⌫');
    const drawn = (await del.locator('svg').count()) === 1;
    const digits = await page.locator('.keypad button').allInnerTexts();
    await go(page, '#/numbers/play?mode=practice&level=easy');
    await page.getByTestId('num-1').waitFor();
    const nums = await page.locator('[data-testid^="num-"]').allInnerTexts();
    const okNums = nums.every((n) => /^\d+$/.test(n.trim()));
    check(
      'TC-04',
      drawn && digits.filter((d) => /^\d$/.test(d.trim())).length === 10 && okNums,
      `keypad 0–9 plus drawn delete icon; ${nums.length} numbers on the board, all digits`,
      `delete icon drawn=${drawn}, keypad=${digits.join(' ')}, board digits ok=${okNums}`,
    );
  });

  await run('TC-05', 'Cờ cá ngựa modes', async () => {
    await go(page, '#/cangua');
    await page.getByTestId('mode-solo').waitFor();
    const modes = ['mode-solo', 'mode-local', 'mode-online'];
    const have = [];
    for (const m of modes) if (await page.getByTestId(m).count()) have.push(m);
    await page.getByTestId('mode-local').click();
    await page.getByTestId('players-2').click();
    await page.getByTestId('cn-board').waitFor();
    const horses = await page.locator('[data-testid^="horse-"]').count();
    check(
      'TC-05',
      have.length === 3 && horses === 8,
      'Với máy, Hai người cùng máy and Online available; same-device game starts with 8 horses',
      `modes found: ${have.join(', ')}; horses on board: ${horses}`,
    );
  });

  await run('TC-06', 'robot cards', async () => {
    await go(page, '#/cangua');
    await page.getByTestId('mode-solo').click();
    const boxes = [];
    for (const n of [1, 2, 3]) {
      const b = await page
        .getByTestId(`bots-${n}`)
        .locator('.emoji')
        .evaluate((el) => {
          const r = el.getBoundingClientRect();
          const card = el.closest('.card').getBoundingClientRect();
          return { h: r.height, inside: r.bottom <= card.bottom + 1 && r.right <= card.right + 1 };
        });
      boxes.push(b);
    }
    const ok = boxes.every((b) => b.inside && b.h < 90);
    check(
      'TC-06',
      ok,
      'robots for 1, 2 and 3 computers stay on one line inside their cards',
      `robot icons overflow: ${JSON.stringify(boxes)}`,
    );
  });

  await run('TC-07', 'Cờ cá ngựa pieces', async () => {
    await go(page, '#/cangua/play?mode=solo&bots=1');
    await page.getByTestId('cn-board').waitFor();
    const horses = page.locator('[data-testid^="horse-"]');
    const count = await horses.count();
    const drawn = await page.locator('[data-testid^="horse-"] path.cn-horse-face').count();
    const glyphs = await page
      .getByTestId('cn-board')
      .evaluate((el) => (el.textContent ?? '').match(/[♞♘⊠□�]/g)?.length ?? 0);
    check(
      'TC-07',
      count === 8 && drawn === 8 && glyphs === 0,
      '8 pieces, each a drawn horse head; no font glyphs (⊠) on the board',
      `pieces=${count}, drawn horses=${drawn}, glyph characters=${glyphs}`,
    );
  });

  await run('TC-08', 'Gia đình', async () => {
    await go(page, '#/');
    await page.getByTestId('hub-family').click();
    await page.getByTestId('family-members').waitFor();
    await page.getByTestId('leaderboard').waitFor();
    const members = await page.locator('.family-member').count();
    check(
      'TC-08',
      members >= 1,
      `Gia đình page: ${members} member(s), add/switch members, Bảng vàng leaderboard`,
      'Gia đình page has no members',
    );
  });

  await run('TC-09', 'Thử thách hôm nay', async () => {
    const found = [];
    for (const g of ['numbers', 'noitu']) {
      await go(page, `#/${g}`);
      await page.getByTestId('mode-solo').or(page.getByTestId('mode-bot')).first().waitFor();
      if (await page.getByTestId('mode-daily').count()) found.push(g);
    }
    await go(page, '#/numbers/play?mode=daily');
    await page.getByTestId('num-1').waitFor();
    check(
      'TC-09',
      found.length === 2,
      'Thử thách hôm nay on Tìm số and Nối từ; the daily board opens',
      `daily challenge found only in: ${found.join(', ') || 'none'}`,
    );
  });

  await run('TC-10', 'smoke', async () => {
    const routes = [
      '#/',
      '#/oanquan/play?mode=local',
      '#/coganh/play?mode=local',
      '#/caro/play?mode=local&size=15',
    ];
    for (const r of routes) {
      await go(page, r);
      await page.locator('main').first().waitFor();
      await page.waitForTimeout(600);
    }
    // theme switch both ways
    await go(page, '#/');
    await page.getByTestId('theme-toggle').click();
    await page.getByTestId('theme-toggle').click();
    await go(page, '#/debug');
    const log = await page.locator('.log-view').innerText();
    const bad = log.split('\n').filter((l) => /\b(ERROR|error)\b/.test(l) && !/^ua:/.test(l));
    note(
      'TC-10',
      bad.length ? 'FAIL' : 'PASS',
      bad.length
        ? `#/debug log errors: ${bad.slice(0, 3).join(' | ')}`
        : '6 screens and theme switch opened; #/debug log has no errors',
    );
  });

  await run('TC-13', 'XSS', async () => {
    const evil = '<img src=x onerror="window.__xss=1">';
    await page.evaluate((name) => {
      localStorage.setItem('fg:profile', JSON.stringify({ name, avatar: '🐢' }));
    }, evil);
    await go(page, '#/settings');
    await page.reload(); // a fresh start reads the saved name
    await page.waitForTimeout(500);
    const xss = await page.evaluate(() => window.__xss === 1);
    const shown = await page.locator('.setting-row').first().innerText();
    // a broken saved value must not break the app either
    await page.evaluate(() => localStorage.setItem('fg:settings', '{not json'));
    await go(page, '#/');
    await page.reload();
    await page.getByTestId('game-caro').waitFor();
    const alive = await page.getByTestId('game-caro').isVisible();
    check(
      'TC-13',
      !xss && shown.includes('<img') && alive,
      'HTML in a name is shown as text and never runs; corrupt saved settings fall back cleanly',
      `script ran=${xss}, shown="${shown.slice(0, 40)}", app alive=${alive}`,
    );
    await page.evaluate(() => {
      localStorage.setItem('fg:profile', JSON.stringify({ name: 'QA', avatar: '🐢' }));
      localStorage.setItem(
        'fg:settings',
        JSON.stringify({ lang: 'vi', theme: 'classic', sound: false }),
      );
    });
  });

  await ctx.close();
}

// ---------------------------------------------------------------- phone (360×800)
{
  const { ctx, page } = await newPage(MOBILE, 'mobile');
  await run('TC-11', 'mobile', async () => {
    const routes = [
      '#/',
      '#/settings',
      '#/family',
      '#/join',
      '#/numbers',
      '#/noitu',
      '#/cangua',
      '#/oanquan/play?mode=local',
      '#/coganh/play?mode=local',
      '#/caro/play?mode=local&size=15',
      '#/cangua/play?mode=solo&bots=3',
    ];
    const wide = [];
    for (const r of routes) {
      await go(page, r);
      await page.locator('main').first().waitFor();
      await page.waitForTimeout(400);
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      if (over > 0) wide.push(`${r} (+${over}px)`);
    }
    check(
      'TC-11',
      wide.length === 0,
      `${routes.length} screens at 360×800: no sideways scrolling`,
      `wider than the phone: ${wide.join(', ')}`,
    );
  });
  // the help dialog on the phone too
  await run('TC-03', 'modal on phone', async () => {
    await go(page, '#/noitu');
    await page.getByTestId('help').click();
    const alpha = await page
      .locator('.modal')
      .evaluate(
        (el) => (getComputedStyle(el).backgroundColor.match(/[\d.]+/g) ?? []).map(Number)[3] ?? 1,
      );
    check('TC-03', alpha === 1, 'opaque on 360×800 too', `see-through on 360×800 (alpha ${alpha})`);
  });
  await ctx.close();
}

// ---------------------------------------------------------------- security outside the browser
async function readDbUrl() {
  try {
    const env = readFileSync(new URL('../.env.production', import.meta.url), 'utf8');
    return {
      db: env.match(/^VITE_FIREBASE_DATABASE_URL=(.+)$/m)?.[1]?.trim(),
      key: env.match(/^VITE_FIREBASE_API_KEY=(.+)$/m)?.[1]?.trim(),
    };
  } catch {
    return {};
  }
}
const { db, key } = await readDbUrl();

await run('TC-12', 'database rules', async () => {
  if (!db) return note('TC-12', 'BLOCKED', 'database URL not available here');
  // without signing in, nothing can be listed or read
  const probes = ['/.json', '/rooms.json', '/rooms.json?shallow=true', '/stats.json'];
  const open = [];
  for (const p of probes) {
    const r = await fetch(`${db}${p}`);
    if (r.ok) open.push(`${p} → ${r.status}`);
  }
  check(
    'TC-12',
    open.length === 0,
    'database refuses anonymous reads of the root, /rooms and /stats',
    `database answered without sign-in: ${open.join(', ')}`,
  );
});

await run('TC-15', 'API key & dependencies', async () => {
  // 1) the web key must only work from the game's own address
  if (key) {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Referer: 'https://evil.example.com/' },
        body: JSON.stringify({
          identifier: 'qa@example.com',
          continueUri: 'https://evil.example.com/',
        }),
      },
    );
    const body = await r.text();
    const restricted = r.status === 403 || /REFERER|referrer|BLOCKED/i.test(body);
    note(
      'TC-15',
      restricted ? 'PASS' : 'FAIL',
      restricted
        ? 'Firebase web key refused from another website (HTTP referrer restriction on)'
        : `Firebase web key works from any website (status ${r.status}): restrict it to tunv87.github.io in Google Cloud Console`,
    );
  } else note('TC-15', 'BLOCKED', 'API key not available here');
  // 2) npm audit, written by the workflow before this script
  const auditFile = new URL('./npm-audit.json', import.meta.url);
  if (existsSync(auditFile)) {
    const a = JSON.parse(readFileSync(auditFile, 'utf8'));
    const v = a.metadata?.vulnerabilities ?? {};
    const bad = (v.high ?? 0) + (v.critical ?? 0);
    note(
      'TC-15',
      bad ? 'FAIL' : 'PASS',
      bad
        ? `npm audit (production): ${v.high ?? 0} high, ${v.critical ?? 0} critical`
        : `npm audit (production): 0 high/critical (${v.moderate ?? 0} moderate, ${v.low ?? 0} low)`,
    );
  }
});

await browser.close();

// TC-10: no console or page errors anywhere in this run
note(
  'TC-10',
  errors.length ? 'FAIL' : 'PASS',
  errors.length
    ? `${errors.length} browser error(s): ${errors.slice(0, 3).join(' | ')}`
    : '0 console/page errors on desktop and phone',
);

const order = Array.from({ length: 15 }, (_, i) => `TC-${String(i + 1).padStart(2, '0')}`);
const now = new Date();
const out = {
  test_date: now.toISOString().slice(0, 10),
  tested_at: now.toISOString(),
  build_version: buildVersion,
  url: BASE,
  results: order
    .filter((id) => results.has(id))
    .map((id) => ({
      tc_id: id,
      status: results.get(id).status,
      actual_result: results.get(id).notes.join('; '),
    })),
};
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
const counts = out.results.reduce((c, r) => ({ ...c, [r.status]: (c[r.status] ?? 0) + 1 }), {});
console.log(`build ${buildVersion} — ${JSON.stringify(counts)}`);
for (const r of out.results) console.log(`${r.status.padEnd(7)} ${r.tc_id}  ${r.actual_result}`);
process.exit(out.results.some((r) => r.status === 'FAIL') ? 1 : 0);
