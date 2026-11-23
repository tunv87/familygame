// Runs the whole QA suite and writes evidence: npm run qa
//   1. web build (for the SEC-03 bundle scan)
//   2. unit + logic + static security tests (Vitest)
//   3. Firebase rules tests + UI/UX/crash/security e2e (Playwright) on the emulators
//   4. scripts/qa-report.mjs → qa/runs/run-NN.md / .json, failure screenshots
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';

const tmp = 'qa/runs/tmp';
rmSync(tmp, { recursive: true, force: true });
rmSync('qa/evidence/screens', { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
const run = (cmd) => {
  console.log(`\n$ ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
};

run('npm run build --silent');
run(`npx vitest run --reporter=default --reporter=json --outputFile=${tmp}/unit.json`);
run(
  `npx firebase emulators:exec --only auth,database --project demo-familygame ` +
    `"npx vitest run --config vitest.rules.config.ts --reporter=default --reporter=json --outputFile=${tmp}/rules.json; ` +
    `npx playwright test --config qa/playwright.qa.config.ts"`,
);
const runs = existsSync('qa/runs')
  ? readdirSync('qa/runs').filter((f) => /^run-\d+\.md$/.test(f))
  : [];
const n = String(runs.length + 1).padStart(2, '0');
const ok = run(`node scripts/qa-report.mjs ${n}`);
process.exit(ok ? 0 : 1);
