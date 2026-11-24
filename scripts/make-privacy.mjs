// Generates public/privacy.html (Vietnamese + English) from src/app/privacy.json,
// the same text the app shows on its About screen. Runs before every build.
import { readFileSync, writeFileSync } from 'node:fs';

const PRIVACY = JSON.parse(
  readFileSync(new URL('../src/app/privacy.json', import.meta.url), 'utf8'),
);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const block = (lang) => {
  const p = PRIVACY[lang];
  // The web page (used by the app stores) adds the technical details; the app shows plain words.
  return `<section lang="${lang}"><h1>${esc(p.title)}</h1><p class="muted">${esc(p.updated)}</p>${[
    ...p.sections,
    p.technical,
  ]
    .map(([h, b]) => `<h2>${esc(h)}</h2><p>${esc(b)}</p>`)
    .join('')}</section>`;
};
const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Privacy Policy – Family Game</title>
<style>body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;max-width:720px;margin:0 auto;padding:24px 16px;line-height:1.6;color:#1f2937;background:#fff8e7}
h1{font-size:1.6em}h2{font-size:1.1em;margin-top:1.4em}.muted{color:#6b7280}section+section{border-top:2px solid #e5d9bf;margin-top:40px;padding-top:8px}</style>
</head><body>${block('vi')}${block('en')}</body></html>
`;
writeFileSync(new URL('../public/privacy.html', import.meta.url), html);
console.log('public/privacy.html written');
