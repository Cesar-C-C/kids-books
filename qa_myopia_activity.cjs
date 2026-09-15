const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const vm = require('node:vm');

const root = __dirname;
const api = require('./books/myopia/myopia.js');

assert.deepEqual(api.calculateFocusModel({ eyeGrowth: 0, lensCorrection: 0 }), {
  retinaX: 82,
  focusX: 82,
  isFocused: true
});
assert.equal(api.calculateFocusModel({ eyeGrowth: 1, lensCorrection: 0 }).isFocused, false);
assert.equal(api.calculateFocusModel({ eyeGrowth: 1, lensCorrection: 1 }).isFocused, true);
assert.equal(api.calculateFocusModel({ eyeGrowth: -3, lensCorrection: 9 }).retinaX, 82);

const dataContext = vm.createContext({ window: {}, Reader: { init() {} }, console });
vm.runInContext(fs.readFileSync(path.join(root, 'books/myopia/book.js'), 'utf8'), dataContext, {
  filename: 'books/myopia/book.js'
});

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ].filter(Boolean);
  return candidates.find(candidate => fs.existsSync(candidate));
}

const browser = findBrowser();
assert.ok(browser, 'Chrome or Edge is available for DOM behavior checks');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-myopia-'));
try {
  const pagesMarkup = dataContext.window.PAGES.map((_, index) =>
    `<div class="page" data-page="${index}"><div class="art"></div><div class="text"></div></div>`
  ).join('');
  const scriptUrl = pathToFileURL(path.join(root, 'books/myopia/myopia.js')).href;
  const styleUrl = pathToFileURL(path.join(root, 'books/myopia/myopia.css')).href;
  const htmlPath = path.join(tempDir, 'fixture.html');
  const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${styleUrl}"></head>
<body><main id="pages">${pagesMarkup}</main><pre id="result"></pre>
<script>window.PAGES=${JSON.stringify(dataContext.window.PAGES)};</script>
<script src="${scriptUrl}"></script>
<script>
  const checks = [];
  const check = (condition, message) => checks.push({ ok: Boolean(condition), message });
  const pages = document.querySelectorAll('#pages .page');
  MyopiaActivity.mountAll(document, window.PAGES);
  MyopiaActivity.mountAll(document, window.PAGES);

  check(pages[1].querySelectorAll('.myopia-kite-clue').length === 1, 'blurred kite number mounts once');
  check(pages[1].querySelector('.myopia-kite-number').textContent === '8', 'kite number stays editable text');
  check(pages[1].querySelector('.myopia-kite-clue').getAttribute('role') === 'img',
    'blurred visual clue has image semantics');
  for (const index of [4, 5, 6]) {
    const layer = pages[index].querySelector('.myopia-eye-labels');
    check(Boolean(layer), 'eye label SVG mounts on page ' + index);
    check(['角膜', 'Cornea', '晶状体', 'Lens', '视网膜', 'Retina', '聚焦', 'Focus']
      .every(label => layer.textContent.includes(label)), 'all four bilingual labels appear on page ' + index);
    check(pages[index].querySelector('.myopia-scale-note').textContent.includes('原理示意，不按真实比例'),
      'bilingual scale notice appears on page ' + index);
  }

  const activity = pages[11].querySelector('.myopia-focus');
  check(pages[11].querySelectorAll('.myopia-focus').length === 1, 'focus model mounts once');
  check(activity.getAttribute('aria-label') === '光线聚焦模型 / Focus model', 'focus model has its bilingual name');
  const range = activity.querySelector('input[type="range"]');
  const rangeLabel = activity.querySelector('label');
  const correction = activity.querySelector('button');
  const status = activity.querySelector('[role="status"]');
  check(rangeLabel.htmlFor === range.id, 'eye growth label is associated with its range');
  check(correction.getAttribute('aria-pressed') === 'false', 'correction starts off');
  check(['cornea', 'lens', 'retina', 'focus'].every(part => activity.querySelector('[data-part="' + part + '"]')),
    'diagram exposes cornea, lens, retina and focus');
  check(status.textContent.includes('焦点落在视网膜上') && status.textContent.includes('Focus lands on the retina.'),
    'initial focus status is bilingual and focused');
  check(activity.querySelector('.myopia-disclaimer').textContent ===
    '原理示意，不是视力测试 / Explanation only — not a vision test.', 'non-diagnostic note is permanent');

  range.value = '1';
  range.dispatchEvent(new Event('input', { bubbles: true }));
  check(status.textContent.includes('焦点落在视网膜前方'), 'eye growth moves focus in front of the retina');
  correction.click();
  check(correction.getAttribute('aria-pressed') === 'true', 'correction button reports pressed state');
  check(status.textContent.includes('焦点落在视网膜上'), 'correction brings focus to the retina');
  range.value = '0.4';
  range.dispatchEvent(new Event('input', { bubbles: true }));
  check(status.textContent.includes('焦点落在视网膜上'), 'correction follows the selected eye growth');
  check(parseFloat(getComputedStyle(range).height) >= 44, 'range has a 44px touch target');
  check(parseFloat(getComputedStyle(correction).minHeight) >= 44, 'button has a 44px touch target');
  check(getComputedStyle(activity.querySelector('.myopia-focus-point')).transitionDuration === '0s',
    'reduced motion disables focus movement transitions');
  let escapedTouch = 0;
  let escapedArrow = 0;
  document.getElementById('pages').addEventListener('touchstart', () => escapedTouch++);
  document.addEventListener('keydown', event => { if (event.key === 'ArrowRight') escapedArrow++; });
  range.dispatchEvent(new Event('touchstart', { bubbles: true }));
  range.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  check(escapedTouch === 0, 'model touch gestures do not turn the reader page');
  check(escapedArrow === 0, 'range arrow keys do not turn the reader page');

  document.getElementById('result').textContent = JSON.stringify(checks);
</script></body></html>`;
  fs.writeFileSync(htmlPath, html, 'utf8');
  const output = execFileSync(browser, [
    '--headless=new',
    '--no-sandbox',
    '--single-process',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-sync',
    '--incognito',
    '--log-level=3',
    '--no-first-run',
    '--force-prefers-reduced-motion=reduce',
    '--allow-file-access-from-files',
    '--virtual-time-budget=1000',
    '--dump-dom',
    pathToFileURL(htmlPath).href
  ], { encoding: 'utf8', windowsHide: true });
  const resultMatch = output.match(/<pre id="result">([^<]*)<\/pre>/);
  assert.ok(resultMatch, `browser activity checks produced a result; dump length ${output.length}: ${output.slice(0, 240)}`);
  const checks = JSON.parse(resultMatch[1].replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
  assert.deepEqual(checks.filter(check => !check.ok), []);
} finally {
  if (!process.env.KEEP_MYOPIA_FIXTURE) fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log('myopia activity: OK');
