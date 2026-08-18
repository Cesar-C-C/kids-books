/* Runtime QA: simulate the browser executing classic <script> tags in one
   shared global (window === global). Confirms that after our fix the new
   books expose window.BOOK / window.PAGES / window.OVL and that Reader.init()
   receives the data (the exact path that was broken before). */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = process.cwd();
const books = ['ocean', 'airplane', 'bigbang', 'seed', 'rocket', 'penguin', 'hsr', 'station', 'steamtrain', 'capsule', 'bus'];
let fail = 0;

for (const id of books) {
  const dir = path.join(root, 'books', id);
  let initCalled = false, initHadData = false;
  const sandbox = {};
  sandbox.window = sandbox;            // browser-like: window IS the global
  sandbox.globalThis = sandbox;
  sandbox.console = console;
  sandbox.document = { getElementById: () => ({}), addEventListener: () => {}, querySelectorAll: () => [], querySelector: () => null };
  sandbox.localStorage = { getItem: () => null, setItem: () => {} };
  sandbox.speechSynthesis = { getVoices: () => [], cancel: () => {}, onvoiceschanged: null };
  sandbox.Reader = { init() { initCalled = true; initHadData = !!(sandbox.window.BOOK && sandbox.window.PAGES); } };

  const code = [
    fs.readFileSync(path.join(root, 'shared', 'overlays.js'), 'utf8'),
    fs.readFileSync(path.join(dir, 'overlays.js'), 'utf8'),
    fs.readFileSync(path.join(dir, 'book.js'), 'utf8')
  ].join('\n;\n');

  vm.createContext(sandbox);
  try { vm.runInContext(code, sandbox); }
  catch (e) { console.log(`[${id}] ERROR executing scripts: ${e.message}`); fail++; continue; }

  const ok = initCalled && initHadData && sandbox.window.BOOK && sandbox.window.PAGES && sandbox.window.OVL;
  const ovKeys = sandbox.window.OVL ? Object.keys(sandbox.window.OVL).length : 0;
  console.log(`[${id}] initCalled=${initCalled} dataPresent=${initHadData} BOOK=${!!sandbox.window.BOOK} PAGES=${!!sandbox.window.PAGES} OVL(keys=${ovKeys})=${!!sandbox.window.OVL} -> ${ok ? 'PASS' : 'FAIL'}`);
  if (!ok) fail++;
}

console.log(fail ? `\nRUNTIME QA FAILED (${fail} book(s))` : '\nRUNTIME QA PASS ✓');
process.exit(fail ? 1 : 0);
