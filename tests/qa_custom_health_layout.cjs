const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function requireFresh(relativePath) {
  const absolutePath = path.join(root, relativePath);
  delete require.cache[require.resolve(absolutePath)];
  return require(absolutePath);
}

function assertCustomShell(bookId, sectionIds, scriptName, styleName) {
  const html = read(`books/${bookId}/index.html`);
  assert.match(html, /<main\s+id="experience"/i, `${bookId} exposes a custom experience main`);
  assert.doesNotMatch(html, /shared\/reader\.js/i, `${bookId} does not load the shared paged reader`);
  assert.doesNotMatch(html, /id="reader"/i, `${bookId} does not expose the shared reader mount`);
  assert.doesNotMatch(html, /maximum-scale|user-scalable/i, `${bookId} preserves browser zoom`);
  assert.match(html, new RegExp(`<script[^>]+${scriptName.replace('.', '\\.')}`), `${bookId} loads its experience script`);
  assert.match(html, new RegExp(`<link[^>]+${styleName.replace('.', '\\.')}`), `${bookId} loads its experience style`);
  for (const sectionId of sectionIds) {
    assert.match(html, new RegExp(`id="${sectionId}"`), `${bookId} exposes #${sectionId}`);
  }
  assert.match(html, /<noscript>[\s\S]*中文[\s\S]*English/i, `${bookId} keeps bilingual no-script guidance`);
}

assertCustomShell(
  'myopia',
  ['discover', 'follow-light', 'focus-lab', 'take-action'],
  'myopia-experience.js',
  'myopia-experience.css'
);

assertCustomShell(
  'cavities',
  ['bedtime-story', 'tooth-city', 'brushing-route'],
  'cavities-experience.js',
  'cavities-experience.css'
);

const myopia = requireFresh('books/myopia/myopia-experience.js');
assert.deepEqual(myopia.GROUPS, {
  discover: [0, 1, 2, 3],
  'follow-light': [4, 5, 6, 7],
  'focus-lab': [11],
  'take-action': [8, 9, 10, 12, 13]
});
assert.deepEqual(myopia.flattenGroups(), [...Array(14).keys()]);
assert.equal(myopia.normalizeChapter('#focus-lab'), 'focus-lab');
assert.equal(myopia.normalizeChapter('#missing'), 'discover');

const cavities = requireFresh('books/cavities/cavities-experience.js');
assert.deepEqual(cavities.GROUPS, {
  'bedtime-story': [0, 1, 2],
  'tooth-city': [3, 4, 5, 6, 7, 8, 9],
  'brushing-route': [10, 11, 12, 13]
});
assert.deepEqual(cavities.flattenGroups(), [...Array(14).keys()]);
assert.equal(cavities.normalizeSection('#tooth-city'), 'tooth-city');
assert.equal(cavities.normalizeSection('#missing'), 'bedtime-story');

for (const bookId of ['myopia', 'cavities']) {
  const book = read(`books/${bookId}/book.js`);
  assert.match(book, /if\s*\(window\.Reader\)\s*Reader\.init\(\)/,
    `${bookId} initializes the shared reader only when it is present`);
}

console.log('PASS custom health layout contract');
