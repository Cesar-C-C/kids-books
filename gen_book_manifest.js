/* ============================================================
   Generic manifest generator for any picture book.
   Usage: node gen_book_manifest.js books/<book>
   Reads shared/overlays.js + book/overlays.js + book/book.js in a
   single VM context (so top-level const BOOK/OVL/PAGES are in scope),
   then exports them and extracts all page text + interactive words
   (en + zh) for TTS generation.
   ============================================================ */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const bookDir = process.argv[2];
if (!bookDir) { console.error('Usage: node gen_book_manifest.js books/<book>'); process.exit(1); }
const absDir = path.resolve(bookDir);

const sanitize = s => (s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

// Concatenate in dependency order into one script so const bindings are shared.
const parts = [
  fs.readFileSync(path.join('shared', 'overlays.js'), 'utf8'),
  fs.readFileSync(path.join(absDir, 'overlays.js'), 'utf8'),
  fs.readFileSync(path.join(absDir, 'book.js'), 'utf8'),
  'globalThis.__BOOK = (typeof BOOK!=="undefined") ? BOOK : (window&&window.BOOK);',
  'globalThis.__PAGES = (typeof PAGES!=="undefined") ? PAGES : (window&&window.PAGES);',
  'globalThis.__OVL = (typeof OVL!=="undefined") ? OVL : (window&&window.OVL);'
].join('\n;\n');

const sandbox = {
  window: {},
  globalThis: {},
  document: {},
  Reader: { init() {} },
  console
};
sandbox.globalThis = sandbox; // so that globalThis.x = ... writes back into sandbox
vm.createContext(sandbox);
vm.runInContext(parts, sandbox);

const BOOK = sandbox.__BOOK;
const PAGES = sandbox.__PAGES;
const OVL = sandbox.__OVL || {};

if (!BOOK || !PAGES) { console.error('Failed to load BOOK/PAGES from', bookDir); process.exit(1); }

const seen = new Set();
const entries = [];

function add(id, text, lang) {
  if (!text) return;
  const key = `${lang}:${id}`;
  if (seen.has(key)) return;
  seen.add(key);
  entries.push({ id, text: text.trim(), lang });
}

PAGES.forEach((p, i) => {
  const idx = String(i).padStart(2, '0');
  if (p.en) add(`page_${idx}_en`, p.en, 'en');
  if (p.zh) add(`page_${idx}_zh`, p.zh, 'zh');
});

Object.values(OVL).forEach(fn => {
  const svg = (typeof fn === 'function') ? fn() : '';
  const tags = svg.match(/class="part"[^>]*>/g) || [];
  tags.forEach(tag => {
    const name = (tag.match(/data-name="([^"]*)"/) || [])[1];
    const nameZh = (tag.match(/data-namezh="([^"]*)"/) || [])[1];
    if (name) add(`word_${sanitize(name)}_en`, name, 'en');
    if (nameZh) add(`word_${sanitize(name)}_zh`, nameZh, 'zh');
  });
});

PAGES.forEach((p) => {
  if (p.glossary) {
    p.glossary.forEach(g => {
      if (g.en) add(`word_${sanitize(g.en)}_en`, g.en, 'en');
      if (g.zh) add(`word_${sanitize(g.en)}_zh`, g.zh, 'zh');
    });
  }
});

const outPath = path.join(absDir, '_manifest.json');
fs.writeFileSync(outPath, JSON.stringify({ book: BOOK.id, audioDir: BOOK.audioDir || 'audio', entries }, null, 2));
console.log(`${BOOK.id}: ${entries.length} audio entries -> ${outPath}`);
