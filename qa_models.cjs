const fs = require('fs'), path = require('path'), assert = require('assert/strict');
// Every 3D lab has been migrated off the retired explorer runtime
// (labs/shared/explorer.js + a per-lab model.js driving LAB_CONFIG /
// buildLabModel). Geometry now lives in a v3 studio module whose id doubles as
// the region key, and each lab is covered by its own qa_v3_*_model.cjs
// contract. This check keeps the two architectures from silently coexisting
// again, and enforces that the studio stylesheet is not forked per lab.
const root = __dirname, labs = path.join(root, 'labs');
const ids = fs.readdirSync(labs).filter(id => fs.existsSync(path.join(labs, id, 'index.html')));
assert.ok(ids.length >= 5, `expected the full lab set, saw ${ids.length}`);

// One lab (hsr) names its controller directory book-model/ rather than v3/, and
// can still carry a stale sibling directory. Trust the page: find the app.js the
// HTML really loads, not the first directory that happens to exist.
const controllerOf = id => {
  const html = fs.readFileSync(path.join(labs, id, 'index.html'), 'utf8');
  for (const dir of ['v3', 'book-model']) {
    const p = path.join(labs, id, dir, 'app.js');
    if (html.includes(`${dir}/app.js`) && fs.existsSync(p)) return { dir, app: p };
  }
  assert.fail(`${id}: index.html loads no v3|book-model/app.js controller`);
};

for (const id of ids) {
  const dir = path.join(labs, id);
  assert.equal(fs.existsSync(path.join(dir, 'model.js')), false, `${id}: a retired explorer model.js is still in the tree`);
  assert.ok(fs.existsSync(path.join(dir, 'parts.js')), `${id}: parts.js is required`);
  assert.ok(fs.existsSync(path.join(dir, 'detail-parts.js')), `${id}: detail-parts.js is required`);
  assert.ok(fs.existsSync(path.join(dir, 'preview.png')), `${id}: preview.png is required for the directory`);
  const { dir: ctrlDir, app: appPath } = controllerOf(id);
  const app = fs.readFileSync(appPath, 'utf8');
  assert.ok(/window\.\w+Lab\s*=/.test(app), `${id}/${ctrlDir}/app.js: must publish a window.<x>Lab test surface`);
  // The modules the page really loads have to sit beside the controller, and
  // every one of them must come before app.js so it can be consumed.
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const appAt = html.indexOf(`${ctrlDir}/app.js`);
  assert.ok(appAt >= 0, `${id}/index.html: must load ${ctrlDir}/app.js`);
  const loaded = [...html.matchAll(new RegExp(`${ctrlDir}/([\\w.-]+)\\.js`, 'g'))].map(m => m[1] + '.js');
  const modules = [...new Set(loaded)].filter(f => f !== 'app.js');
  assert.ok(modules.length >= 1, `${id}: at least one geometry module must be loaded beside app.js`);
  for (const f of modules) {
    assert.ok(fs.existsSync(path.join(labs, id, ctrlDir, f)), `${id}/index.html loads ${ctrlDir}/${f}, which does not exist`);
    assert.ok(html.indexOf(`${ctrlDir}/${f}`) < appAt, `${id}/index.html: ${ctrlDir}/${f} must load before app.js`);
  }
  // hsr keeps its controller in book-model/ but the stylesheet in v3/, so the
  // stylesheet may live in either; what matters is that the page loads exactly
  // one and that it is the shared one.
  const cssDirs = ['v3', 'book-model'].filter(d => fs.existsSync(path.join(labs, id, d, 'studio.css')));
  assert.equal(cssDirs.length, 1, `${id}: expected exactly one studio.css, found ${cssDirs.length}`);
  assert.ok(html.includes(`${cssDirs[0]}/studio.css`), `${id}/index.html: must link ${cssDirs[0]}/studio.css`);
}
// The studio look is shared verbatim, so nobody can fork one lab's styling.
const reference = fs.readFileSync(path.join(labs, ids[0], [...['v3', 'book-model'].filter(d => fs.existsSync(path.join(labs, ids[0], d, 'studio.css')))][0], 'studio.css'));
let compared = 0;
for (const id of ids) for (const d of ['v3', 'book-model']) {
  const p = path.join(labs, id, d, 'studio.css');
  if (!fs.existsSync(p)) continue;
  compared++;
  assert.ok(reference.equals(fs.readFileSync(p)), `${id}/${d}/studio.css: drifted from the shared studio stylesheet`);
}
assert.ok(compared >= ids.length, 'every lab must carry the shared studio stylesheet');
console.log(`PASS labs: ${ids.length} studio labs (${ids.join(', ')}), no retired explorer models, ${compared} copies of one shared studio.css.`);
