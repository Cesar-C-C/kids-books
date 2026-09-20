# Sound / soap release QA

Local acceptance completed 2026-09-20 on Chrome with isolated profiles. Candidate PWA fingerprint: `55ba0b72dfe0`; shared audio version 5, each new reader audio version 1.

- Sound: 34 bilingual MP3s; 45 offline resources; package complete.
- Soap: 32 bilingual MP3s; 44 offline resources; package complete.
- Independent production receipt: all 66 MP3 identities and 129 source segments checked. Exact frozen source text, segment casting, reference file hashes, independently recomputed gain and cleanup, finite 24 kHz mono decoding and PCM reconstruction within one PCM16 step. Six approved clean samples preserved byte-for-byte. Public book-local audio-delivery.json omits machine paths and references.
- `node tests/qa_everyday_full.cjs`: 66 actual reader-button online plays and 66 offline plays reached native ended without seeking, with no fallback or page errors. Used 4x playback for technical execution, not human listening assessment. Stop/language cleanup and sound-effect/narration mutual exclusion passed.
- Real Service Worker partial-package upgrade: explicitly waited for the new worker version and expected resource totals; existing image downloads survived. Full packages downloaded successfully, all cached MP3 hashes matched final files. Offline illustrations and shelf covers rendered. Delete/redownload of either new book preserved the other new book plus Moon and airplane packages.
- `node tests/qa_sound_soap_browser.cjs`: 320/390/820/1024/1280 viewports, both languages, all image loads, scene ordering, soap phases/reset/foam, sound controls and reduced motion passed.
- `node tests/qa_sound_soap_models.cjs`: independent pitch/loudness, bounded local oscillation and constant propagation speed, no particle crossing, molecule head/tail orientation, foam independence and phase guard passed.
- Static gates: qa_pwa.py 6 checks with zero warnings/failures; all 18 runtime resource closures aligned; 9 Python tests passed; delivery hashes/casting, legacy book/runtime checks, cover derivatives, 137 R2 images and the 15 existing lab/model check scripts passed.
- Added both new-book model/delivery and real-browser full-audio checks to the PWA workflow. The static checker now uses actual entry-script audio versions rather than assuming a filename or the global reader version.

The first full-browser attempt passed online playback but raced the worker transition; its old-worker status was diagnosed explicitly. The corrected full rerun passed every gate above. No Service Worker production implementation change was needed.

Limits: emulated viewports are not physical-device QA; synthetic pagehide checks are not a real mobile backgrounding test. No independent human acceptance of every generated utterance is claimed. GitHub CI and production deployment are separate from this local evidence and must be checked after push. Earlier partial/sample notes are historical, not the current formal-audio state.
