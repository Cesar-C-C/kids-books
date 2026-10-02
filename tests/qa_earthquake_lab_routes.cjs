const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parse, bookHref } = require('../labs/earthquake/v3/route.js');

assert.deepEqual(parse('?lang=zh&from=earthquake-fault', '#elastic-rebound'), { lang: 'zh', from: 'earthquake-fault', card: 'elastic-rebound' });
assert.deepEqual(parse('?lang=en&from=earthquake-waves', '#waves'), { lang: 'en', from: 'earthquake-waves', card: 'waves' });
for (const card of ['elastic-rebound', 'fault-types', 'focus-epicenter', 'waves']) assert.equal(parse('?lang=en', `#${card}`).card, card);
assert.deepEqual(parse('?lang=xx&from=https://bad.example/?returnUrl=evil', '#unknown'), { lang: 'zh', from: null, card: 'elastic-rebound' });
assert.deepEqual(parse('?lang=en&returnUrl=https://bad.example', ''), { lang: 'en', from: null, card: 'elastic-rebound' });
assert.equal(bookHref({ lang: 'zh', from: 'earthquake-fault' }), '../../books/earthquake/index.html?lang=zh#fault-lab');
assert.equal(bookHref({ lang: 'en', from: 'earthquake-waves' }), '../../books/earthquake/index.html?lang=en#wave-lab');
assert.equal(bookHref({ lang: 'en', from: null }), '../../books/earthquake/index.html?lang=en');
assert.equal(bookHref({ lang: 'bad', from: 'bad', returnUrl: 'https://bad.example' }), '../../books/earthquake/index.html?lang=zh');

const root = path.resolve(__dirname, '..');
const content = JSON.parse(fs.readFileSync(path.join(root, 'labs/earthquake/content.json'), 'utf8'));
const entries = new Map(content.entries.map(entry => [entry.id, entry]));
const validConcepts = new Set(['fault', 'elastic-strain', 'slip', 'focus', 'epicenter', 'wavefront', 'particle-motion', 'p-wave', 's-wave', 'fault-normal', 'fault-reverse', 'fault-strike-slip']);
assert.equal(entries.size, content.entries.length, 'no duplicate semantic content IDs');
for (const entry of entries.values()) {
  assert.ok(validConcepts.has(entry.conceptId), `${entry.id}: approved concept ID`);
  assert.ok(['knowledge', 'prompt', 'result'].includes(entry.kind), `${entry.id}: typed text`);
  assert.ok(entry.zh && entry.en && entry.contentVersion === content.contentVersion, `${entry.id}: bilingual current text`);
}
for (const file of ['parts.js', 'detail-parts.js']) {
  const vm = require('node:vm');
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'labs/earthquake', file), 'utf8'), context);
  for (const item of Object.values(context.window).flat()) assert.ok(entries.has(item.id), `${file}/${item.id}: bilingual content exists`);
}
console.log('Earthquake guarded routes and bilingual semantic content PASS');
