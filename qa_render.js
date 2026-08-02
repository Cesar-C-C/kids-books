/* AUTHORITATIVE end-to-end render QA.
   CRITICAL: this loads the REAL books/<id>/index.html from disk (not a
   synthetic harness) so it actually exercises the shipped entry point —
   including whether <main id="reader"> exists and whether scripts load in
   the correct order. A previous bug slipped through because the old test
   injected its own #reader and could never fail the way production did. */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const root = 'C:/Users/Administrator/WorkBuddy/cesar_agent_fold/kids-books';
const books = ['ocean', 'airplane', 'bigbang', 'seed', 'rocket', 'penguin', 'hsr', 'station'];
let fail = 0;

for (const id of books) {
  const idxPath = path.join(root, 'books', id, 'index.html');
  const html = fs.readFileSync(idxPath, 'utf8');

  // Extract the REAL body, strip <script> tags (we run them manually).
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const realBody = bodyMatch
    ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '')
    : '<main id="reader"></main>';

  // Extract the REAL script load order from the shipped file.
  const srcs = [...html.matchAll(/<script\s+src=["']([^"']+)["']><\/script>/gi)]
    .map(m => m[1]);

  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body>${realBody}</body></html>`,
    { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://kids/' });
  const { window } = dom;
  window.Audio = class { constructor() { this.playbackRate = 1; } play() { return Promise.resolve(); } pause() {} };
  window.speechSynthesis = { getVoices: () => [], cancel() {}, speak() {}, onvoiceschanged: null };
  const store = {};
  window.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };

  let err = null;
  try {
    for (const s of srcs) {
      const abs = path.resolve(root, 'books', id, s); // s is relative to books/<id>/
      window.eval(fs.readFileSync(abs, 'utf8'));
    }
  } catch (e) { err = e; }

  const reader = window.document.getElementById('reader');
  const pages = reader ? reader.querySelectorAll('.page').length : 0;
  const active = reader ? reader.querySelectorAll('.page.active').length : 0;
  const title = (window.document.getElementById('bookTitle') || {}).textContent || '';
  const PAGES = window.PAGES || [];
  const BOOK = window.BOOK || {};

  // Navigate all pages, count interactive .part overlays and check audio files.
  let totalParts = 0, missingAudio = [];
  const nextBtn = window.document.getElementById('next');
  const audioDir = BOOK.audioDir ? path.join(root, 'books', id, BOOK.audioDir) : null;
  for (let i = 0; i < pages; i++) {
    const act = reader.querySelector('.page.active');
    totalParts += act ? act.querySelectorAll('.ovwrap .part, .ovwrap .hot').length : 0;
    if (audioDir && PAGES[i] && !PAGES[i].cover && !PAGES[i].glossary) {
      for (const lang of ['zh', 'en']) {
        const fn = `page_${String(i).padStart(2, '0')}_${lang}.mp3`;
        if (!fs.existsSync(path.join(audioDir, fn))) missingAudio.push(fn);
      }
    }
    if (i < pages - 1) { try { nextBtn.click(); } catch (e) {} }
  }

  const ok = !err && pages === PAGES.length && active === 1 && totalParts > 0 && missingAudio.length === 0;
  console.log(`\n[${id}] "${title}"`);
  console.log(`  scripts-loaded=${srcs.length} | error=${err ? err.message : 'none'} | pages=${pages} active=${active} | parts=${totalParts} | missingAudio=${missingAudio.length}`);
  if (missingAudio.length) console.log('    missing: ' + missingAudio.slice(0, 6).join(', '));
  console.log(`  -> ${ok ? 'RENDER OK ✓' : 'FAIL ✗'}`);
  if (!ok) fail++;
}

console.log(fail ? `\nEND-TO-END QA FAILED (${fail} book(s))` : '\nEND-TO-END QA PASS ✓');
process.exit(fail ? 1 : 0);
