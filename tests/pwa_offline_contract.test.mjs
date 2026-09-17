import assert from 'node:assert/strict';
import test from 'node:test';

test('offline QA selects the current audio URL from the PWA manifest', async () => {
  let selectOfflineAudio;
  try {
    ({ selectOfflineAudio } = await import('../tools/pwa_offline_contract.mjs'));
  } catch {}

  assert.equal(typeof selectOfflineAudio, 'function');

  const manifest = {
    books: {
      airplane: {
        files: [
          'books/airplane/audio/page_01_en.mp3?v=5',
          'books/airplane/audio/page_01_zh.mp3?v=5',
        ],
      },
    },
  };

  assert.equal(
    selectOfflineAudio(manifest, 'airplane'),
    'audio/page_01_en.mp3?v=5',
  );
});
