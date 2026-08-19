/* QA validator for the 4 new picture books.
   Checks: image existence, per-page bilingual audio, interactive word audio,
   overlay key presence, glossary structure, duplicate object keys. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const books = ['ocean', 'airplane', 'bigbang', 'seed', 'rocket', 'penguin', 'hsr', 'station', 'steamtrain', 'capsule', 'bus', 'schoolbus'];
const root = process.cwd();
const pad2 = n => String(n).padStart(2, '0');
const sanitize = s => (s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

let totalErrors = 0;

function loadBook(id) {
  const dir = path.join(root, 'books', id);
  const parts = [
    fs.readFileSync(path.join(root, 'shared', 'overlays.js'), 'utf8'),
    fs.readFileSync(path.join(dir, 'overlays.js'), 'utf8'),
    fs.readFileSync(path.join(dir, 'book.js'), 'utf8'),
    'globalThis.__BOOK = (typeof BOOK!=="undefined") ? BOOK : (window&&window.BOOK);',
    'globalThis.__PAGES = (typeof PAGES!=="undefined") ? PAGES : (window&&window.PAGES);',
    'globalThis.__OVL = (typeof OVL!=="undefined") ? OVL : (window&&window.OVL);'
  ].join('\n;\n');
  const sandbox = { window: {}, globalThis: {}, document: {}, Reader: { init() {} }, console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(parts, sandbox);
  return { BOOK: sandbox.__BOOK, PAGES: sandbox.__PAGES, OVL: sandbox.__OVL || {}, dir };
}

function exists(p) { return fs.existsSync(p); }

for (const id of books) {
  const errs = [];
  const warns = [];
  const { BOOK, PAGES, OVL, dir } = loadBook(id);
  if (!BOOK || !PAGES) { console.log(`\n[${id}] FATAL: cannot load BOOK/PAGES`); totalErrors++; continue; }

  // ---- index.html STRUCTURAL check (catches missing #reader mount point) ----
  // This is the #1 cause of "book renders blank": reader.js does
  // document.getElementById('reader') and will throw if it's absent.
  const idxPath = path.join(dir, 'index.html');
  if (!exists(idxPath)) {
    errs.push('index.html missing entirely');
  } else {
    const idx = fs.readFileSync(idxPath, 'utf8');
    if (!/id=["']reader["']/.test(idx)) errs.push('index.html missing <main id="reader"> mount point (reader.js will throw → blank page)');
    // scripts must load in this exact order, else Reader.init() runs before data exists
    const order = ['../../shared/overlays.js', '../../shared/reader.js', 'overlays.js', 'book.js'];
    let last = -1;
    for (const s of order) {
      const p = idx.indexOf(`src="${s}"`);
      if (p < 0) errs.push(`index.html missing script tag: ${s}`);
      else if (p < last) errs.push(`index.html script order wrong: ${s} appears before an earlier required script`);
      else last = p;
    }
  }

  // duplicate-key detection in book.js
  const raw = fs.readFileSync(path.join(dir, 'book.js'), 'utf8');
  const dupMatches = raw.match(/\b(glossary|cover|ov|img)\b\s*:\s*[^,}\n]+,\s*\n\s*\w+\s*:\s*|\b(glossary)\b\s*:\s*(true|\[)|/g);
  if (/glossary\s*:\s*true[\s\S]*glossary\s*:/.test(raw)) {
    warns.push('book.js has duplicate `glossary` key (flag overridden by array — renders OK, but should be cleaned)');
  }

  // cover image
  if (BOOK.coverImg && !exists(path.join(dir, BOOK.coverImg))) errs.push(`coverImg missing: ${BOOK.coverImg}`);

  const audioDir = path.join(dir, BOOK.audioDir || 'audio');
  if (!exists(audioDir)) errs.push(`audio dir missing: ${BOOK.audioDir}`);

  PAGES.forEach((p, i) => {
    const idx = pad2(i);
    // image
    if (p.img) {
      if (!exists(path.join(dir, p.img))) errs.push(`page ${idx} img missing: ${p.img}`);
    } else if (!p.cover) {
      warns.push(`page ${idx} has no img (non-cover)`);
    }
    // bilingual page audio
    if (!p.cover && !p.glossary) {
      if (p.en && !exists(path.join(audioDir, `page_${idx}_en.mp3`))) errs.push(`page ${idx} en audio missing`);
      if (p.zh && !exists(path.join(audioDir, `page_${idx}_zh.mp3`))) errs.push(`page ${idx} zh audio missing`);
    } else if (p.cover) {
      if (p.en && !exists(path.join(audioDir, `page_${idx}_en.mp3`))) errs.push(`cover ${idx} en audio missing`);
      if (p.zh && !exists(path.join(audioDir, `page_${idx}_zh.mp3`))) errs.push(`cover ${idx} zh audio missing`);
    }
    // overlay key exists
    if (p.ov) {
      if (!OVL[p.ov]) errs.push(`page ${idx} ov key "${p.ov}" not found in overlays.js`);
      else {
        const svg = typeof OVL[p.ov] === 'function' ? OVL[p.ov]() : '';
        const tags = svg.match(/class="part"[^>]*>/g) || [];
        tags.forEach(tag => {
          const name = (tag.match(/data-name="([^"]*)"/) || [])[1];
          const nameZh = (tag.match(/data-namezh="([^"]*)"/) || [])[1];
          if (name && !exists(path.join(audioDir, `word_${sanitize(name)}_en.mp3`))) errs.push(`page ${idx} word en audio missing: ${name}`);
          if (nameZh && !exists(path.join(audioDir, `word_${sanitize(name)}_zh.mp3`))) errs.push(`page ${idx} word zh audio missing: ${nameZh}`);
          // bubble-mode hotspot: pre-generated line mp3 must exist
          const lineKey = (tag.match(/data-linekey="([^"]*)"/) || [])[1];
          if (lineKey) {
            if (!exists(path.join(audioDir, `line_${lineKey}_en.mp3`))) errs.push(`page ${idx} line en audio missing: ${lineKey}`);
            if (!exists(path.join(audioDir, `line_${lineKey}_zh.mp3`))) errs.push(`page ${idx} line zh audio missing: ${lineKey}`);
          }
        });
      }
    }
    // glossary
    if (p.glossary) {
      if (!Array.isArray(p.glossary)) errs.push(`page ${idx} glossary present but not an array`);
      else p.glossary.forEach(g => {
        if (g.en && !exists(path.join(audioDir, `word_${sanitize(g.en)}_en.mp3`))) errs.push(`page ${idx} glossary en audio missing: ${g.en}`);
        if (g.zh && !exists(path.join(audioDir, `word_${sanitize(g.en)}_zh.mp3`))) errs.push(`page ${idx} glossary zh audio missing: ${g.zh}`);
      });
    }
  });

  totalErrors += errs.length;
  console.log(`\n=== ${id} (${BOOK.title} / ${BOOK.titleZh}) ===`);
  console.log(`  pages: ${PAGES.length}, overlays: ${Object.keys(OVL).length}`);
  if (warns.length) warns.forEach(w => console.log(`  WARN: ${w}`));
  if (errs.length) errs.forEach(e => console.log(`  ERROR: ${e}`));
  if (!errs.length && !warns.length) console.log('  OK ✓');
  else if (!errs.length) console.log('  OK (no errors) ✓');
}

console.log(`\n--- QA summary: ${totalErrors} error(s) across ${books.length} books ---`);
process.exit(totalErrors ? 1 : 0);
