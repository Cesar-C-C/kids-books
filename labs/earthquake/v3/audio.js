(function (root) {
  'use strict';
  const normalize = value => String(value).normalize('NFC').replace(/\r\n/g, '\n');
  const keyOf = (kind, id, lang) => `${kind}:${id}:${lang}`;
  const validHash = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
  async function shaBytes(bytes) {
    const digest = await root.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  const sha = value => shaBytes(new TextEncoder().encode(normalize(value)));
  function create({ manifestUrl, contentVersion, contentUrl = 'content.json', fetcher = root.fetch.bind(root), AudioClass = root.Audio, baseUrl = root.location?.href || 'https://example.invalid/labs/earthquake/', onStatus = () => {} }) {
    let disposed = false;
    let generation = 0;
    let player = null;
    let transfer = null;
    const entries = new Map();
    const manifestAddress = new URL(manifestUrl, baseUrl);

    const ready = (async () => {
      try {
        const [contentResponse, manifestResponse] = await Promise.all([fetcher(contentUrl), fetcher(manifestUrl)]);
        if (!contentResponse.ok || !manifestResponse.ok) return false;
        const [contentRaw, manifestRaw] = await Promise.all([contentResponse.text(), manifestResponse.text()]);
        const source = JSON.parse(contentRaw);
        const manifest = JSON.parse(manifestRaw);
        if (source.contentVersion !== contentVersion || manifest.schemaVersion !== 2 || manifest.owner !== 'lab' || manifest.contentVersion !== contentVersion || manifest.sourceSha256 !== await sha(contentRaw)) return false;
        const byItem = new Map(source.entries.map(item => [`${item.kind}:${item.id}`, item]));
        for (const entry of manifest.entries || []) {
          if (entry.status !== 'ready' || entry.owner !== 'lab' || entry.contentVersion !== contentVersion || !['zh', 'en'].includes(entry.lang)) continue;
          const item = byItem.get(`${entry.kind}:${entry.itemId}`);
          if (!item || !item.narrationNeeded || item.contentVersion !== contentVersion) continue;
          const id = `${entry.kind}-${entry.itemId}-${entry.lang}`;
          if (entry.id !== id || entry.output !== `audio/${id}.mp3` || !validHash(entry.fileSha256)) continue;
          const text = normalize(item[entry.lang]);
          if (!text || entry.text !== text || entry.textSha256 !== await sha(text)) continue;
          const sourceSegments = item.segments?.[entry.lang] || [{ role: 'narrator', sourceText: text }];
          const segments = sourceSegments.map(segment => ({ role: segment.role, sourceText: normalize(segment.sourceText), spokenText: normalize(segment.spokenText ?? segment.sourceText) }));
          if (segments.map(segment => segment.sourceText).join('') !== text) continue;
          const utterance = { kind: entry.kind, id: entry.itemId, lang: entry.lang, text, segments };
          if (entry.utteranceSha256 !== await sha(JSON.stringify(utterance))) continue;
          entries.set(keyOf(entry.kind, entry.itemId, entry.lang), entry);
        }
        return true;
      } catch (error) {
        return false;
      }
    })();

    function available(kind, id, lang) { return !disposed && entries.has(keyOf(kind, id, lang)); }
    function stop() {
      generation++;
      if (transfer) { transfer.abort(); transfer = null; }
      if (player) { player.pause(); player = null; }
    }
    async function play(kind, id, lang) {
      // Reserve the ticket before awaiting metadata: the latest click always wins.
      stop();
      const token = generation;
      await ready;
      if (disposed || token !== generation) return { ok: false, reason: 'cancelled' };
      if (!available(kind, id, lang)) { onStatus('unavailable', { kind, id, lang }); return { ok: false, reason: 'unavailable' }; }
      const entry = entries.get(keyOf(kind, id, lang));
      const url = new URL(entry.output, manifestAddress);
      // A regenerated clip at the same path must not reuse older cache-first bytes.
      url.searchParams.set('v', entry.fileSha256.toLowerCase());
      const controller = new root.AbortController();
      transfer = controller;
      const timeout = root.setTimeout(() => controller.abort(), 15000);
      let current = null;
      try {
        // Native Audio commonly requests Range/206, which cannot warm a full cache entry.
        // Only a user play fetches complete bytes, and verifies them before creating a player.
        const response = await fetcher(url.href, { signal: controller.signal });
        if (disposed || token !== generation) return { ok: false, reason: 'cancelled' };
        if (response.status !== 200 || response.headers.has('Content-Range')) throw new Error('Incomplete narration');
        const bytes = await response.arrayBuffer();
        if (disposed || token !== generation) return { ok: false, reason: 'cancelled' };
        const hash = await shaBytes(bytes);
        if (disposed || token !== generation) return { ok: false, reason: 'cancelled' };
        if (hash !== entry.fileSha256.toLowerCase()) throw new Error('Narration hash mismatch');
        root.clearTimeout(timeout);
        if (transfer === controller) transfer = null;
        current = new AudioClass(url.href);
        current.preload = 'auto';
        player = current;
        await current.play();
        if (disposed || token !== generation) { current.pause(); return { ok: false, reason: 'cancelled' }; }
        onStatus('playing', { kind, id, lang });
        return { ok: true };
      } catch (error) {
        if (player === current) { current?.pause(); player = null; }
        if (token !== generation || disposed) return { ok: false, reason: 'cancelled' };
        onStatus('unavailable', { kind, id, lang });
        return { ok: false, reason: 'unavailable' };
      } finally {
        root.clearTimeout(timeout);
        if (transfer === controller) transfer = null;
      }
    }
    function dispose() { stop(); disposed = true; entries.clear(); }
    return { ready, play, stop, dispose, available };
  }
  const api = { create };
  root.EarthquakeLabAudio = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
