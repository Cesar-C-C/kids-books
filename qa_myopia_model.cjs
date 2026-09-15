const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;
const context = vm.createContext({
  window: {},
  Reader: { init() {} },
  console
});

for (const file of [
  'shared/overlays.js',
  'books/myopia/overlays.js',
  'books/myopia/book.js'
]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const { BOOK, PAGES } = context.window;

assert.equal(BOOK.id, 'myopia');
assert.equal(PAGES.length, 14);
assert.equal(PAGES[0].cover, true);
assert.equal(PAGES[0].img, BOOK.coverImg);
assert.deepEqual(PAGES.filter(p => p.activity).map(p => p.activity.type), ['focus-model']);
assert.deepEqual(
  PAGES.map((page, index) => page.editableLayer && [index, page.editableLayer.type]).filter(Boolean),
  [
    [1, 'blurred-kite-number'],
    [4, 'eye-diagram-labels'],
    [5, 'eye-diagram-labels'],
    [6, 'eye-diagram-labels']
  ]
);
assert.equal(PAGES[13].glossary.length, 6);
for (const [i, page] of PAGES.entries()) {
  assert.ok(page.en && page.zh, `page ${i} bilingual copy`);
  assert.match(page.img, new RegExp(`assets/${String(i).padStart(2, '0')}_.*_v1\\.webp$`));
  const imagePath = path.join(root, 'books/myopia', page.img);
  assert.ok(fs.existsSync(imagePath), `page ${i} illustration exists`);
  const image = fs.readFileSync(imagePath);
  assert.ok(image.length > 10 * 1024, `page ${i} illustration is larger than 10 KB`);
  assert.equal(image.toString('ascii', 0, 4), 'RIFF', `page ${i} RIFF container`);
  assert.equal(image.toString('ascii', 8, 12), 'WEBP', `page ${i} WebP format`);
}
const allCopy = PAGES.map(p => `${p.en} ${p.zh}`).join(' ');
for (const forbidden of ['screens cause myopia', '眼保健操治愈近视', 'glasses weaken', '戴眼镜会加深近视']) {
  assert.ok(!allCopy.includes(forbidden), `forbidden claim: ${forbidden}`);
}

console.log('myopia model: OK');
