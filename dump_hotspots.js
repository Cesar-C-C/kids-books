/* dump_hotspots.js — export every page's interactive hotspots (image-pixel
   coordinates) so we can draw numbered calibration crosshairs and let GLM
   vision verify each one sits on the correct part.
   Output: calib/hotspots.json  { book: { audioDir, pages:[{page,ov,img,spots:[{n,px,py,name}]}] } } */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = process.cwd();
const books = ['ocean','airplane','bigbang','seed','rocket','penguin','hsr','station','steamtrain','capsule','bus'];
const IMG_W=1216, IMG_H=832, LEFT=12.6, VIS=974.8, VB_H=667;
const toPx = ovx => (ovx-LEFT)/VIS*IMG_W;
const toPy = ovy => ovy/VB_H*IMG_H;

const out = {};
for (const id of books) {
  const dir = path.join(root, 'books', id);
  const code = [
    fs.readFileSync(path.join(root,'shared','overlays.js'),'utf8'),
    fs.readFileSync(path.join(dir,'overlays.js'),'utf8'),
    fs.readFileSync(path.join(dir,'book.js'),'utf8'),
    'globalThis.__BOOK=(typeof BOOK!=="undefined")?BOOK:(window&&window.BOOK);',
    'globalThis.__PAGES=(typeof PAGES!=="undefined")?PAGES:(window&&window.PAGES);',
    'globalThis.__OVL=(typeof OVL!=="undefined")?OVL:(window&&window.OVL);'
  ].join('\n;\n');
  const sandbox = { window:{}, globalThis:{}, document:{}, Reader:{init(){}}, console };
  sandbox.globalThis = sandbox; vm.createContext(sandbox); vm.runInContext(code, sandbox);
  const BOOK = sandbox.__BOOK, PAGES = sandbox.__PAGES, OVL = sandbox.__OVL || {};
  const pages = [];
  PAGES.forEach((p,i) => {
    if (!p.ov || !OVL[p.ov]) return;
    const svg = OVL[p.ov]();
    const spots = [];
    const re = /<circle class="part"[^>]*cx="([\d.]+)"[^>]*cy="([\d.]+)"[^>]*data-name="([^"]*)"[^>]*>/g;
    let m, n=0;
    while ((m = re.exec(svg))) { n++; spots.push({ n, px:Math.round(toPx(parseFloat(m[1]))), py:Math.round(toPy(parseFloat(m[2]))), name:m[3] }); }
    pages.push({ page:i, ov:p.ov, img:p.img, spots });
  });
  out[id] = { audioDir: BOOK.audioDir || 'audio', pages };
}
fs.mkdirSync('calib', { recursive:true });
fs.writeFileSync('calib/hotspots.json', JSON.stringify(out, null, 1));
let total = 0; for (const b of Object.keys(out)) for (const pg of out[b].pages) total += pg.spots.length;
console.log(`dumped ${Object.keys(out).length} books, ${total} hotspots -> calib/hotspots.json`);
