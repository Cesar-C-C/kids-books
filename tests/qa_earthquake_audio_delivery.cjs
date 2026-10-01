// Verify every shipped MP3 against the frozen bilingual source and release manifest.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const normalized = value => value.normalize('NFC').replace(/\r\n/g, '\n');

function expectedEntries(owner, source) {
  const expected = new Map();
  const groups = owner === 'book'
    ? [['scene', source.scenes], ['vocab', source.vocab], [null, source.interactions]]
    : [[null, source.entries]];
  for (const [groupKind, items] of groups) {
    for (const item of items) {
      if (!item.narrationNeeded) continue;
      const kind = groupKind || item.kind;
      for (const lang of ['zh', 'en']) {
        const id = `${kind}-${item.id}-${lang}`;
        assert(!expected.has(id), `duplicate source audio id: ${id}`);
        expected.set(id, normalized(item[lang]));
      }
    }
  }
  return expected;
}

function verify(owner, manifestOverride) {
  const base = path.join(root, owner === 'book' ? 'books' : 'labs', 'earthquake');
  const sourceRaw = fs.readFileSync(path.join(base, owner === 'book' ? 'story.json' : 'content.json'), 'utf8');
  const source = JSON.parse(sourceRaw);
  const manifest = manifestOverride || JSON.parse(fs.readFileSync(path.join(base, 'audio-manifest.json'), 'utf8'));
  const expected = expectedEntries(owner, source);
  assert.equal(manifest.schemaVersion, 2);
  assert.equal(manifest.owner, owner);
  assert.equal(manifest.topicId, 'earthquake');
  assert.equal(manifest.sourceSha256, sha(normalized(sourceRaw)), `${owner} source changed after narration`);
  assert.equal(manifest.entries.length, expected.size, `${owner} bilingual coverage`);
  const seen = new Set();
  for (const entry of manifest.entries) {
    assert(!seen.has(entry.id), `duplicate manifest id: ${entry.id}`);
    seen.add(entry.id);
    assert.equal(entry.key, `${owner}:${entry.id}`);
    assert.equal(entry.owner, owner);
    assert.equal(entry.status, 'ready', `${entry.id} is not ready`);
    assert.equal(entry.text, expected.get(entry.id), `${entry.id} source text mismatch`);
    assert.equal(entry.textSha256, sha(entry.text), `${entry.id} text hash mismatch`);
    assert.equal(entry.output, `audio/${entry.id}.mp3`, `${entry.id} output mismatch`);
    assert.match(entry.fileSha256, /^[a-f0-9]{64}$/);
    const file = path.join(base, entry.output);
    assert.equal(sha(fs.readFileSync(file)), entry.fileSha256, `${entry.id} MP3 hash mismatch`);
  }
  assert.deepEqual([...seen].sort(), [...expected.keys()].sort(), `${owner} missing or extra bilingual audio`);
  const actualFiles = fs.readdirSync(path.join(base, 'audio')).filter(name => name.endsWith('.mp3')).sort();
  assert.deepEqual(actualFiles, [...seen].map(id => `${id}.mp3`).sort(), `${owner} unlisted MP3`);
  return seen.size;
}

const bookCount = verify('book');
const labCount = verify('lab');
for (const owner of ['book', 'lab']) {
  const base = path.join(root, owner === 'book' ? 'books' : 'labs', 'earthquake');
  const manifest = JSON.parse(fs.readFileSync(path.join(base, 'audio-manifest.json'), 'utf8'));
  manifest.entries[0].fileSha256 = '0'.repeat(64);
  assert.throws(() => verify(owner, manifest), /MP3 hash mismatch/);
}
console.log(`EARTHQUAKE_AUDIO_DELIVERY_PASS book=${bookCount} lab=${labCount} total=${bookCount + labCount}`);
