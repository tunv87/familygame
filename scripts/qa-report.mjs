// Builds qa/runs/run-NN.md and run-NN.json from the raw results in qa/runs/tmp,
// mapping every test back to the case IDs in qa/test-cases.md. Exit code 1 if any case failed.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

const n = process.argv[2] ?? '00';
const tmp = 'qa/runs/tmp';
const now = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

// ---- test cases from the catalogue
const cases = [];
for (const line of readFileSync('qa/test-cases.md', 'utf8').split('\n')) {
  // tolerate Prettier's column padding
  const cells = line.split('|').map((c) => c.trim());
  if (cells.length >= 6 && /^[A-Z]+-\d+b?$/.test(cells[1]) && /^P\d$/.test(cells[2]))
    cases.push({ id: cells[1], prio: cells[2], what: cells[3], expected: cells[4] });
}

// ---- raw results → flat list { title, status, errors[], evidence[] }
const tests = [];
const readJson = (f) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null);
for (const [file, kind] of [
  ['unit.json', 'Vitest'],
  ['rules.json', 'Vitest (rules)'],
]) {
  const j = readJson(join(tmp, file));
  for (const tr of j?.testResults ?? []) {
    for (const a of tr.assertionResults) {
      tests.push({
        title: [...a.ancestorTitles, a.title].join(' › '),
        file: tr.name.replace(process.cwd() + '/', ''),
        kind,
        status: a.status === 'passed' ? 'passed' : a.status === 'failed' ? 'failed' : 'skipped',
        errors: a.failureMessages ?? [],
        evidence: [],
      });
    }
    if (tr.status === 'failed' && tr.assertionResults.length === 0)
      tests.push({
        title: `${tr.name} (file failed to load)`,
        file: tr.name,
        kind,
        status: 'failed',
        errors: [tr.message ?? ''],
        evidence: [],
      });
  }
}
const e2e = readJson(join(tmp, 'e2e.json'));
const evDir = `qa/evidence/failures/run-${n}`;
const walk = (suite, path) => {
  for (const s of suite.suites ?? []) walk(s, [...path, s.title]);
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests) {
      const r = t.results[t.results.length - 1] ?? {};
      const evidence = [];
      for (const att of r.attachments ?? []) {
        if (att.contentType?.startsWith('image/') && att.path && existsSync(att.path)) {
          mkdirSync(evDir, { recursive: true });
          const dest = join(
            evDir,
            // unique per test: case id + the test's own artifact folder + file name
            `${spec.title.match(/\[([A-Z]+-\d+b?)\]/)?.[1] ?? 'test'}-${basename(dirname(att.path)).slice(-24)}-${basename(att.path)}`,
          );
          copyFileSync(att.path, dest);
          evidence.push(dest);
        }
      }
      tests.push({
        title: spec.title,
        file: spec.file,
        kind: 'Playwright',
        status: r.status === 'passed' ? 'passed' : r.status === 'skipped' ? 'skipped' : 'failed',
        errors: (r.errors ?? []).map((e) => e.message ?? String(e)),
        evidence,
      });
    }
  }
};
if (e2e) for (const s of e2e.suites ?? []) walk(s, []);
if (!e2e)
  tests.push({
    title: 'Playwright suite did not run',
    status: 'failed',
    errors: ['no e2e.json'],
    evidence: [],
    kind: 'Playwright',
  });

// ---- map tests to cases
// eslint-disable-next-line no-control-regex -- strip ANSI colour codes from runner output
const strip = (s) => s.replace(/\u001b\[[0-9;]*m/g, '');
const idsIn = (s) => [...s.matchAll(/\[([A-Z]+-\d+b?)\]/g)].map((m) => m[1]);
const result = new Map(
  cases.map((c) => [c.id, { ...c, tests: 0, failed: 0, messages: [], evidence: [] }]),
);
for (const t of tests) {
  const ids = idsIn(t.title);
  const msg = strip(t.errors.join('\n'));
  const failedIds =
    t.status === 'failed'
      ? idsIn(msg).filter((i) => ids.includes(i)).length
        ? idsIn(msg).filter((i) => ids.includes(i))
        : ids
      : [];
  for (const id of ids) {
    const r = result.get(id);
    if (!r) continue;
    r.tests++;
    if (failedIds.includes(id)) {
      r.failed++;
      const lines = msg
        .split('\n')
        .filter((l) => l.includes(`[${id}]`) || (!idsIn(msg).length && l.trim()))
        .slice(0, 6)
        .map((l) => l.trim().slice(0, 300));
      r.messages.push(`${t.title}: ${lines.join(' / ') || msg.slice(0, 300)}`);
      r.evidence.push(...t.evidence);
    }
  }
}
const rows = [...result.values()];
const status = (r) => (r.tests === 0 ? 'NOT RUN' : r.failed ? 'FAIL' : 'PASS');
const cat = (id) => id.split('-')[0];
const cats = [...new Set(rows.map((r) => cat(r.id)))];
const count = (list, s) => list.filter((r) => status(r) === s).length;

let md = `# QA run ${n}\n\nThời gian: ${now}\nTest tự động: ${tests.length} (${tests.filter((t) => t.status === 'passed').length} pass, ${tests.filter((t) => t.status === 'failed').length} fail, ${tests.filter((t) => t.status === 'skipped').length} skip)\n\n`;
md += `## Tổng hợp theo nhóm\n\n| Nhóm | Case | PASS | FAIL | NOT RUN |\n| --- | --- | --- | --- | --- |\n`;
for (const c of cats) {
  const list = rows.filter((r) => cat(r.id) === c);
  md += `| ${c} | ${list.length} | ${count(list, 'PASS')} | ${count(list, 'FAIL')} | ${count(list, 'NOT RUN')} |\n`;
}
md += `| **Tổng** | **${rows.length}** | **${count(rows, 'PASS')}** | **${count(rows, 'FAIL')}** | **${count(rows, 'NOT RUN')}** |\n\n`;
md += `## Kết quả từng case\n\n| Case | Ưu tiên | Kết quả | Số test | Kiểm tra |\n| --- | --- | --- | --- | --- |\n`;
for (const r of rows)
  md += `| ${r.id} | ${r.prio} | ${status(r) === 'PASS' ? '✅ PASS' : status(r) === 'FAIL' ? '❌ FAIL' : '⚪ NOT RUN'} | ${r.tests} | ${r.what} |\n`;
const failed = rows.filter((r) => status(r) === 'FAIL');
if (failed.length) {
  md += `\n## Chi tiết case FAIL\n`;
  for (const r of failed) {
    md += `\n### ${r.id} – ${r.what}\nMong đợi: ${r.expected}\n\n`;
    for (const m of r.messages.slice(0, 12)) md += `- ${m.replace(/\|/g, '/')}\n`;
    if (r.evidence.length)
      md += `\nẢnh: ${[...new Set(r.evidence)].map((e) => `[${basename(e)}](../../${e})`).join(', ')}\n`;
  }
}
md += `\n## Evidence\n- Ảnh từng màn hình × thiết bị: \`qa/evidence/screens/\`\n- Ảnh case fail: \`qa/evidence/failures/run-${n}/\`\n- Kết quả máy đọc: \`qa/runs/run-${n}.json\`\n`;
writeFileSync(`qa/runs/run-${n}.md`, md);
writeFileSync(
  `qa/runs/run-${n}.json`,
  JSON.stringify(
    {
      run: n,
      at: now,
      cases: rows.map((r) => ({
        id: r.id,
        status: status(r),
        tests: r.tests,
        failures: r.messages,
      })),
      tests: tests.map(({ title, kind, status }) => ({ title, kind, status })),
    },
    null,
    2,
  ),
);
console.log(
  `\nqa/runs/run-${n}.md: ${count(rows, 'PASS')} pass, ${count(rows, 'FAIL')} fail, ${count(rows, 'NOT RUN')} not run`,
);
process.exit(failed.length || count(rows, 'NOT RUN') ? 1 : 0);
