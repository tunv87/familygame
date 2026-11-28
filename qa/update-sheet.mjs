/**
 * Writes qa/latest-results.json into the project's Google Sheet ("Familygame – Tiến độ dự án"):
 *  - Test_Cases: for each tc_id (column A) → test_date (B), actual_result (H), status (I)
 *  - Version_Trigger: A1 = latest_test_version, A2 = latest_deployed_version (the build tested)
 *  - Kiểm thử: a new row at the end of the "Lần chạy" table, with the date in "Ngày test"
 *
 * Env: SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_JSON (the service account's JSON key; the sheet
 * must be shared with its e-mail as Editor). Optional: QA_RUN_URL (link for the "Báo cáo" column;
 * on GitHub Actions the run's own page is used).
 */
import { readFileSync } from 'node:fs';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const KEY = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
if (!SPREADSHEET_ID) {
  console.error('SPREADSHEET_ID is required');
  process.exit(1);
}
if (!KEY) {
  // not set up yet: keep the run green; the results stay attached to the run (latest-results.json)
  const msg =
    'GOOGLE_SERVICE_ACCOUNT_JSON is not set: the Google Sheet was not updated (see docs/post-deploy-qa.md)';
  console.log(process.env.GITHUB_ACTIONS ? `::warning::${msg}` : msg);
  process.exit(0);
}

let data;
try {
  data = JSON.parse(readFileSync(new URL('./latest-results.json', import.meta.url), 'utf8'));
} catch (e) {
  console.error(
    'qa/latest-results.json is missing or broken (did post-deploy.mjs run?)',
    e.message,
  );
  process.exit(1);
}
const { test_date, build_version, results = [] } = data;

// loaded only now, so the warning above works without the package installed
const { google } = await import('googleapis');
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(KEY),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const quote = (title) => `'${title.replace(/'/g, "''")}'`;

const meta = await sheets.spreadsheets.get({
  spreadsheetId: SPREADSHEET_ID,
  fields: 'sheets.properties(sheetId,title)',
});
const sheetId = (title) =>
  meta.data.sheets.find((s) => s.properties.title === title)?.properties.sheetId;
for (const t of ['Test_Cases', 'Version_Trigger', 'Kiểm thử'])
  if (sheetId(t) === undefined) throw new Error(`tab "${t}" not found`);

// ---------------------------------------------------------------- Test_Cases
const ids = await sheets.spreadsheets.values.get({
  spreadsheetId: SPREADSHEET_ID,
  range: 'Test_Cases!A:A',
});
const rowOf = new Map((ids.data.values ?? []).map((r, i) => [String(r[0] ?? '').trim(), i + 1]));
const updates = [];
const missing = [];
for (const r of results) {
  const row = rowOf.get(r.tc_id);
  if (!row) {
    missing.push(r.tc_id);
    continue;
  }
  updates.push(
    { range: `Test_Cases!B${row}`, values: [[test_date]] },
    { range: `Test_Cases!H${row}:I${row}`, values: [[r.actual_result, r.status]] },
  );
}

// ---------------------------------------------------------------- Version_Trigger
updates.push({ range: 'Version_Trigger!A1:A2', values: [[build_version], [build_version]] });

await sheets.spreadsheets.values.batchUpdate({
  spreadsheetId: SPREADSHEET_ID,
  requestBody: { valueInputOption: 'RAW', data: updates },
});

// ---------------------------------------------------------------- Kiểm thử → "Lần chạy"
const tab = 'Kiểm thử';
const table = await sheets.spreadsheets.values.get({
  spreadsheetId: SPREADSHEET_ID,
  range: `${quote(tab)}!A1:G`,
});
const rows = table.data.values ?? [];
const header = rows.findIndex((r) => String(r[0] ?? '').trim() === 'Lần chạy');
if (header < 0) throw new Error('"Lần chạy" table not found in tab Kiểm thử');
const cols = rows[header].map((c) => String(c).trim());
// the table ends at the first empty row (another table may follow after a blank line)
let end = header + 1;
while (end < rows.length && (rows[end] ?? []).some((c) => String(c).trim())) end++;

const pass = results.filter((r) => r.status === 'PASS').length;
const failed = results.filter((r) => r.status === 'FAIL').map((r) => r.tc_id);
const blocked = results.filter((r) => r.status === 'BLOCKED').map((r) => r.tc_id);
const link =
  process.env.QA_RUN_URL ||
  (process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : 'Tab Test_Cases');
const byName = {
  'Lần chạy': `Post-deploy ${build_version}`,
  'Case PASS': String(pass),
  'Tổng case': String(results.length),
  'Tỉ lệ PASS': results.length ? `${Math.round((pass / results.length) * 100)}%` : '0%',
  'Lỗi mới tìm thấy':
    [
      failed.length ? `FAIL: ${failed.join(', ')}` : '',
      blocked.length ? `BLOCKED: ${blocked.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('; ') || 'Không có',
  'Báo cáo': link,
  'Ngày test': test_date,
};
const line = cols.map((c) => byName[c] ?? '');

// make room for the new row so whatever follows the table is pushed down, not overwritten
await sheets.spreadsheets.batchUpdate({
  spreadsheetId: SPREADSHEET_ID,
  requestBody: {
    requests: [
      {
        insertDimension: {
          range: { sheetId: sheetId(tab), dimension: 'ROWS', startIndex: end, endIndex: end + 1 },
          inheritFromBefore: true,
        },
      },
    ],
  },
});
await sheets.spreadsheets.values.update({
  spreadsheetId: SPREADSHEET_ID,
  range: `${quote(tab)}!A${end + 1}`,
  valueInputOption: 'RAW',
  requestBody: { values: [line] },
});

console.log(
  `Sheet updated: ${results.length - missing.length} test cases, version ${build_version}, ` +
    `run row ${end + 1} (${pass}/${results.length} PASS)` +
    (missing.length ? `; not in Test_Cases: ${missing.join(', ')}` : ''),
);
