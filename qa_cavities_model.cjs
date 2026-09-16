const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;
const bookPath = path.join(root, 'books/cavities/book.js');
assert.ok(fs.existsSync(bookPath), 'books/cavities/book.js exists');
const indexPath = path.join(root, 'books/cavities/index.html');
const activityPath = path.join(root, 'books/cavities/cavities.js');
const activityStylePath = path.join(root, 'books/cavities/cavities.css');
assert.ok(fs.existsSync(indexPath), 'books/cavities/index.html exists');
assert.ok(fs.existsSync(activityPath), 'books/cavities/cavities.js exists');
assert.ok(fs.existsSync(activityStylePath), 'books/cavities/cavities.css exists');

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const scriptSources = [...indexHtml.matchAll(/<script\s+src=["']([^"']+)["'][^>]*><\/script>/g)]
  .map(match => match[1]);
assert.deepEqual(scriptSources, [
  '../../shared/cdn.js',
  '../../shared/overlays.js',
  '../../shared/reader.js',
  'overlays.js',
  'book.js',
  'cavities.js',
  '../../shared/pwa.js'
]);
const styleSources = [...indexHtml.matchAll(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g)]
  .map(match => match[1]);
assert.ok(styleSources.indexOf('../../shared/style.css') < styleSources.indexOf('cavities.css'),
  'cavities.css loads after the shared reader style');

const bookSource = fs.readFileSync(bookPath, 'utf8');
assert.match(bookSource, /Reader\.init\(\);\s*$/,
  'book.js initializes the reader after defining BOOK and PAGES');
const context = vm.createContext({
  window: {},
  Reader: { init() {} },
  console
});

for (const file of [
  'shared/overlays.js',
  'books/cavities/overlays.js',
  'books/cavities/book.js'
]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const { BOOK, PAGES } = context.window;

assert.equal(BOOK.id, 'cavities');
assert.equal(BOOK.title, 'The Little Hole in a Tooth');
assert.equal(BOOK.titleZh, '牙齿里的小洞洞');
assert.equal(BOOK.subtitle, 'Paopao and the midnight acid alarm');
assert.equal(BOOK.subtitleZh, '泡泡和午夜酸雨警报');
assert.equal(BOOK.age, '4-8 岁');
assert.equal(BOOK.coverImg, 'assets/00_cover_v1.webp');
assert.equal(BOOK.audioDir, 'audio');
assert.equal(PAGES.length, 14);
assert.equal(PAGES[0].cover, true);
assert.equal(PAGES[0].img, BOOK.coverImg);
assert.equal(PAGES[0].en, BOOK.title);
assert.equal(PAGES[0].zh, BOOK.titleZh);

assert.deepEqual(PAGES.filter(page => page.activity).map(page => page.activity), [
  { type: 'brush-zones', label: 'Brush every surface', labelZh: '刷到每一个牙面' },
  { type: 'brush-timer', label: 'Two-minute timer', labelZh: '两分钟刷牙计时' }
]);

const expectedAssets = [
  '00_cover_v1.webp',
  '01_skip-brushing_v1.webp',
  '02_acid-alarm_v1.webp',
  '03_mouth-community_v1.webp',
  '04_sugar-and-starch_v1.webp',
  '05_acid-attack_v1.webp',
  '06_mineral-loss_v1.webp',
  '07_saliva-fluoride_v1.webp',
  '08_cavity-forms_v1.webp',
  '09_dentist-check_v1.webp',
  '10_outer-surfaces_v1.webp',
  '11_all-surfaces_v1.webp',
  '12_two-minute-routine_v1.webp',
  '13_glossary_v1.webp'
];

for (const [i, page] of PAGES.entries()) {
  assert.ok(page.en && page.zh, `page ${i} bilingual copy`);
  assert.equal(page.img, `assets/${expectedAssets[i]}`, `page ${i} fixed asset`);
  assert.match(page.img, new RegExp(`assets/${String(i).padStart(2, '0')}_.*_v1\\.webp$`));
  const assetPath = path.join(root, 'books/cavities', page.img);
  assert.ok(fs.existsSync(assetPath), `page ${i} illustration exists`);
  assert.equal(path.extname(assetPath).toLowerCase(), '.webp', `page ${i} illustration is WebP`);
  assert.ok(fs.statSync(assetPath).size > 10 * 1024, `page ${i} illustration exceeds 10 KB`);
}

assert.equal(PAGES[13].glossary.length, 6);
assert.deepEqual(PAGES[13].glossary.map(({ en, zh }) => [en, zh]), [
  ['Bacteria', '细菌'],
  ['Plaque', '牙菌斑'],
  ['Acid', '酸'],
  ['Enamel', '牙釉质'],
  ['Fluoride', '氟化物'],
  ['Cavity', '蛀洞']
]);

const allCopy = PAGES.map(page => `${page.en} ${page.zh}`).join(' ');
for (const forbidden of [
  'tooth worm',
  '蛀牙虫真的住在牙齿里',
  'brushing fixes a cavity',
  '刷牙能补好蛀洞',
  'all bacteria are bad',
  '所有细菌都是坏蛋'
]) {
  assert.ok(!allCopy.toLowerCase().includes(forbidden.toLowerCase()), `forbidden claim: ${forbidden}`);
}

assert.match(allCopy, /some bacteria/i);
assert.match(allCopy, /部分细菌/);
assert.match(allCopy, /sugar.*starch|starch.*sugar/i);
assert.match(allCopy, /糖.*淀粉|淀粉.*糖/);
assert.match(allCopy, /cannot fix|cannot repair|does not fix|does not repair/i);
assert.match(allCopy, /不能.*补好|不能.*修复/);
assert.match(allCopy, /twice.*day/i);
assert.match(allCopy, /每天.*两次/);

assert.ok(context.window.OVL && typeof context.window.OVL === 'object');

console.log('cavities model: OK');
