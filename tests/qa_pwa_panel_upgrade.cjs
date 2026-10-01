// Opening the offline panel must not start a second SW update that strands an upgrade.
const cp = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');

const diagnostic = path.join(__dirname, 'diagnostics', 'qa_sw_repo_min_page.cjs');
const output = cp.execFileSync(process.execPath, [diagnostic], {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, KB_DIAG_HTML: 'real', KB_DIAG_MODE: 'panel-no-download',
    KB_DIAG_USE_CURRENT_CLIENT_OLD_STAGE: '1', KB_DIAG_OPEN_NO_UPDATE: '',
    KB_DIAG_PRE_STAGE_WAIT_MS: '', KB_DIAG_NEW_SKIP_EARLY: '' },
  encoding: 'utf8', timeout: 60000
});
const line = output.split(/\r?\n/).find(item => item.startsWith('REPO_SW_MIN_PAGE '));
assert(line, 'missing browser lifecycle result');
const result = JSON.parse(line.slice('REPO_SW_MIN_PAGE '.length));
assert.equal(result.final, result.current,
  'opening offline panel stranded the new worker: ' + JSON.stringify(result));
assert.deepEqual(result.workerFetches, ['old', 'current'],
  'opening panel initiated a redundant Service Worker update');
console.log('PWA_PANEL_UPGRADE_PASS', result.old, '->', result.current);
