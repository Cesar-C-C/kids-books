// Match static production hosting: native media Range requests get 206, full GETs get 200.
const fs = require('node:fs');
const path = require('node:path');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.mp3': 'audio/mpeg' };
function serveFile(req, res, file) {
  const size = fs.statSync(file).size;
  const ext = path.extname(file);
  const headers = { 'Content-Type': mime[ext] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Content-Length': size };
  let start = 0, end = size - 1, status = 200;
  if (ext === '.mp3') {
    headers['Accept-Ranges'] = 'bytes';
    headers.Vary = 'Accept-Encoding'; // GitHub Pages: fetch vs identity native-media variants.
    if (req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (match && (match[1] || match[2])) {
        if (!match[1]) start = Math.max(0, size - Number(match[2]));
        else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
      }
      if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
        res.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}`, 'Content-Length': 0 });
        res.end(); return { status: 416, size: 0 };
      }
      status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
      headers['Content-Length'] = end - start + 1;
    }
  }
  res.writeHead(status, headers);
  if (req.method === 'HEAD') res.end();
  else fs.createReadStream(file, status === 206 ? { start, end } : undefined).pipe(res);
  return { status, size: headers['Content-Length'], contentRange: headers['Content-Range'] || null };
}
module.exports = { serveFile };
if (require.main === module) {
  const assert = require('node:assert/strict');
  const http = require('node:http');
  const file = path.join(__dirname, '../labs/earthquake/audio/result-result-initial-zh.mp3');
  const expected = fs.readFileSync(file);
  const server = http.createServer((req, res) => serveFile(req, res, file));
  (async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/real.mp3`;
    try {
      const full = await fetch(url);
      assert.equal(full.status, 200);
      assert.equal(full.headers.get('content-range'), null);
      assert.equal(full.headers.get('vary'), 'Accept-Encoding');
      assert.deepEqual(Buffer.from(await full.arrayBuffer()), expected);
      for (const [range, start, end] of [['bytes=0-1023', 0, 1023], ['bytes=0-', 0, expected.length - 1], ['bytes=-64', expected.length - 64, expected.length - 1]]) {
        const partial = await fetch(url, { headers: { Range: range } });
        assert.equal(partial.status, 206);
        assert.equal(partial.headers.get('content-range'), `bytes ${start}-${end}/${expected.length}`);
        assert.deepEqual(Buffer.from(await partial.arrayBuffer()), expected.subarray(start, end + 1));
      }
      assert.equal((await fetch(url, { headers: { Range: 'bytes=99999999-' } })).status, 416);
      console.log('Earthquake real-MP3 HTTP fixture: full 200, byte-range 206 and unsatisfiable 416 PASS');
    } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
