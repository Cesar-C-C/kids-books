(function (root) {
  'use strict';
  const normalize = value => String(value).normalize('NFC').replace(/\r\n/g, '\n');
  const keyOf = (kind, id, lang) => `${kind}:${id}:${lang}`;
  const validHash = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
  async function sha(value) {
    const bytes = new TextEncoder().encode(normalize(value));
    const digest = await root.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  function create({ manifestUrl, contentVersion, contentUrl = 'content.json', fetcher = root.fetch.bind(root), AudioClass = root.Audio, baseUrl = root.location?.href || 'https://example.invalid/labs/earthquake/', onStatus = () => {} }) {
    let disposed = false;
    let generation = 0;
    let player = null;
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
      if (player) { player.pause(); player = null; }
    }
    async function play(kind, id, lang) {
      const requestedGeneration = generation;
      await ready;
      if (disposed || requestedGeneration !== generation) return { ok: false, reason: 'cancelled' };
      if (!available(kind, id, lang)) { onStatus('unavailable', { kind, id, lang }); return { ok: false, reason: 'unavailable' }; }
      stop();
      const token = generation;
      const entry = entries.get(keyOf(kind, id, lang));
      const url = new URL(entry.output, manifestAddress);
      // A regenerated clip at the same path must not reuse older cache-first bytes.
      url.searchParams.set('v', entry.fileSha256.toLowerCase());
      const current = new AudioClass(url.href);
      current.preload = 'auto';
      player = current;
      try {
        await current.play();
        if (disposed || token !== generation) { current.pause(); return { ok: false, reason: 'cancelled' }; }
        onStatus('playing', { kind, id, lang });
        return { ok: true };
      } catch (error) {
        if (player === current) { current.pause(); player = null; }
        if (token !== generation || disposed) return { ok: false, reason: 'cancelled' };
        onStatus('unavailable', { kind, id, lang });
        return { ok: false, reason: 'unavailable' };
      }
    }
    function dispose() { stop(); disposed = true; entries.clear(); }
    return { ready, play, stop, dispose, available };
  }
  const api = { create };
  root.EarthquakeLabAudio = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
