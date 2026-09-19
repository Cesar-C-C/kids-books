const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'books/moon/story.json'), 'utf8');
const story = JSON.parse(src);
const sha = text => createHash('sha256').update(text).digest('hex');
const entries = [];
for (const [kind, items] of [['scene',story.scenes],['vocab',story.vocab]]) {
  for (const item of items) for (const lang of ['zh','en']) entries.push({
    id:`${kind}-${item.id}-${lang}`, kind,
    [kind === 'scene' ? 'sceneId' : 'termId']:item.id,
    role:'narrator', lang, text:item[lang], textSha256:sha(item[lang]),
    output:`audio/${kind}-${item.id}-${lang}.mp3`
  });
}
fs.writeFileSync(path.join(root, 'books/moon/audio-manifest.json'), JSON.stringify({bookId:story.bookId,scriptVersion:story.scriptVersion,scriptSha256:sha(src),entries},null,2)+'\n');
console.log(`${entries.length} audio entries generated`);
