# Moon candidate 2026-09-19 — local acceptance complete

Final local status: **PASS** for `moon-story-v1` / `AUDIO_VER=1` / PWA `562723b37a6b`. The complete book contains 53 offline resources (about 5.7 MiB), including all 40 user-accepted Fun-CosyVoice v3 MP3s. See [final audio/offline acceptance report](moon-final-audio-offline-2026-09-19.md). This is a local, uncommitted candidate, not a published release.

## Scope and freeze

Worktree: `C:/Users/Cesar/Documents/ChatGPT/儿童绘本开发/.worktrees/moon-diary`

Branch `codex/moon-diary`; base/HEAD `5cfb30f91a986d5c537680b9f072740c87221dc8`. Candidate remains uncommitted, not a published release. Current baseline includes the independent QA fixes documented in [moon-independent-qa-2026-09-19.md](moon-independent-qa-2026-09-19.md); do not restore the earlier runtime. Frozen story and audio contract remain unchanged. The audio task delivered 40 formal Fun-CosyVoice v3 MP3s, and QA completed bookshelf/PWA integration and full local verification. Preserve these accepted production resources and shared files. No Moon publishing authorization.

Entry `books/moon/index.html`; bookId `moon`. Local preview `http://127.0.0.1:63419/books/moon/` while preview service is running. Must use HTTP, not file://, because story.json is loaded with fetch.

## Files and interfaces

- Candidate revision `moon-content-qa-r1`; `moon-experience.js` SHA256 `8005edef0a1b2bbc7abccb7328d51f1c03642bcfa2f3aa634c7bc56c769377c2`, directly rechecked against disk after QA handoff. This revision labels the fixed view as Northern Hemisphere, north pole up; cloud scene retains the preceding half moon. Lamp controls include step buttons and preserve angle; album navigation restores focus; unsaved diary fields survive navigation/language changes.
- `story.json`: frozen `moon-story-v1`, 14 stable scene IDs + 6 terms. SHA256 `a4936f906d0d1216050daf3285d27359a7561f852c94065532971cdd587efcee`.
- `audio-manifest.json`: 40 requested entries, stable scene/term IDs, exact zh/en, role narrator, per-entry hash/output. SHA256 `6a03d4283f12e6fdba0c49819d25b810ee9849416b84153847670172806dd017`.
- `moon-model.js`: `MoonModel.state(angle)` and `path(angle,radius,cx,cy)`. Angle degrees, new=0,right of Earth; full=180,left. In SVG screen coords Earth=(200,165), orbital radius130, x=200+130cos(a), y=165-130sin(a). Sun at right, rays toward left; moon always right-lit in space view. Northern top-down orbit. Earth view fractional illumination=(1-cos(a))/2; right-lit waxing, left-lit waning, fixed northern orientation. Not date-based or an eclipse simulator; limitations in collapsed parent notes and SOURCES.
- `MoonBook.getState()` returns lang,album,angle,audioVersion,entryCount. `setAngle(a)` and `stop()` available to QA.
- Scene data attributes retain all story IDs; adjacent story segments sharing illustration are grouped. `#album` four-card manual turn; `#light` lamp-view slider; `#orbit` paired space/Earth views, range and step buttons, prediction retries; `#cycle` selectable eight phases; `#ending` gift and diary.
- Seven `images/{gift,compare,experiment,window,full,morning,grandma}.webp`. All story image keys map directly. Accurate moon shapes separate from the art. `ART.md` contains prompt set and visual checks. PNG masters ignored, recoverable, not part of publication.
- Audio lookup: `audio/{scene|vocab}-{stable-id}-{zh|en}.mp3?v=1`. `AUDIO_VER=1` remains unchanged: synthesis profile v3 is not URL asset version 3. All 40 formal MP3s are now adopted from `cosyvoice-v3/batch-r2`, not v2 or Kokoro. Missing files still trigger a labeled device-voice fallback once; text always readable. Stop/lang/album/pagehide/hidden stop playback. Device speech is not a substitute for verified offline narration.
- Diary localStorage key `moon-diary-v1`; entries date/time/shape/weather. Not found and not observed distinct. Export JSON; deletion confirmation. No network upload. Storage write failure status shown.

## Checks completed

- Independent QA report above records `node tests/qa_moon_geometry.cjs` passing 84,666 independent three-dimensional illumination samples and `node tests/qa_moon_interactions.cjs` passing 10 groups of keyboard/touch-click, focus, diary failure/data validation, reduced-motion and mocked audio lifecycle checks. QA also reran the original model/browser suites after repairs. These results are the QA task's execution evidence, not a second rerun during this document alignment.
- `node tests/qa_moon_model.cjs`: exit0; cardinal positions, 73 polygon illumination areas, frozen content/manifest mapping and hashes.
- `node tests/qa_moon_browser.cjs`: exit0 after final image encoding and contrast fix. Headless Chrome widths320/390/820/1024/1280, Chinese and English no horizontal overflow; album controls, selected phase angles, prediction retries, save/reload diary persistence, final images loaded, no JS page errors.
- `node --check books/moon/moon-experience.js`: exit0.
- `git diff --check`: exit0 (new files remain untracked; QA should include them explicitly).
- `.qa-labs/moon/album-mobile.png`, `mobile.png`, `lab.png`: local evidence. Album mobile personally inspected after contrast correction; desktop lab inspected for model/controls separation.

## Content-stage acceptance and historical voice decisions

Content-stage independent QA is complete within the report's stated scope. It repaired Audio release and a ten-second startup timeout with at most one fallback, rejected malformed stored diary entries, and checked model geometry and rendered overlays. Audio lifecycle evidence uses controlled mocks, not actual formal recordings. No full WCAG audit or physical-device gesture/assistive-technology validation is claimed.

The user declined Kokoro and the Fun-CosyVoice v2 audition. Neither is adopted. Following the v3 Chinese audition, the user said to continue, authorizing production using the restored instructed gentle-narrator recipe. Subsequently the user explicitly said “试听通过。” for the delivered full 40-clip v3 batch-r2 audition. That exact delivery is now user-accepted; the earlier candidates remain historical evidence only. Fun-CosyVoice 3 remains the first-choice engine.

## Formal audio delivery and hash alignment

- Authority: `workbench/moon-audio-v1/cosyvoice-v3/DELIVERY.md`; configuration and per-segment evidence in `batch-r2/config.json`, `validation.json`, `progress.json`, `delivery-validation.json` and `reader-playback.json`.
- Adopted: 28 story + 12 vocabulary MP3s, 20 per language, under `books/moon/audio/`. Both languages use instructed synthesis, FP32, native text frontend and quote-aware segmentation. Only the specific ball-zh segment uses `[b][èi]` with normalization bypass. Frozen story and manifest are unchanged.
- Content owner directly rehashed all 40 formal MP3s against delivery-validation: 40/40 match. Delivery report SHA256 `e0f6125df96b505b22917ac7f48599ba9b5c8316fb4a8c54dfd545b8facdbd56`. Canonical audio-set SHA256 `21945ccad3344ba138684f17f1d9caf81664d81fcea043324ca206b621454935`, calculated over sorted lines `audio/<filename>.mp3 <sha256>` joined with LF and a final LF. Per-file hashes remain in the delivery report.
- Story, manifest and runtime were directly rechecked and still match the three full hashes above. QA's final verified PWA fingerprint is `562723b37a6b`; package `complete=true`, 53 resources, no missing audio. Initial formal audio uses the predeclared `?v=1` URLs; future byte replacements require versioning and renewed validation.
- Audio task reports 10 configuration tests, source/reference/segment hash and decode checks, and 40 real reader-button native-Audio plays with zero speech fallbacks or page errors. This document alignment independently checks hashes only; it does not pretend to rerun the audio task's decoder or browser tests.
- Chinese reference reproduces the existing bundled recipe; this is not a newly completed upstream rights-clearance claim. English reference is the documented Kara/LibriTTS cropped recording; source, attribution, changes and limitations are in DELIVERY.md and the referenced metadata. Synthesized book speech is not the speaker's original performance or endorsement. Preserve relevant notices and avoid implying comprehensive legal clearance.
- User listening acceptance: **PASS for this exact 40-clip v3 batch-r2 delivery**. Recorded in `workbench/moon-audio-v1/cosyvoice-v3/batch-r2/user-approval.json`, user message “试听通过。”, recorded at `2026-09-19T22:41:20+08:00`, bound to delivery report SHA256 `e0f6125df96b505b22917ac7f48599ba9b5c8316fb4a8c54dfd545b8facdbd56`. This supersedes prior user-listening-pending status for these files only. It is user acceptance, not independent agent hearing or a claim of exhaustive phonetic analysis. Changed audio requires appropriately scoped revalidation; old v2/Kokoro candidates are not approved by this acceptance.
- V3 keep-zh is byte-identical to the audition. Full local package and cache-upgrade acceptance are now complete, as recorded below. User listening approval does not authorize publishing. No live deployment.

## Final local technical acceptance

The QA task's completed report is [moon-final-audio-offline-2026-09-19.md](moon-final-audio-offline-2026-09-19.md). Its evidence, read during this document alignment, supersedes earlier partial-package status; no production files were modified for this alignment.

- 40 online + 40 downloaded/offline real reader-button/native HTMLAudio runs all reached `ended`, at 4x speed without seeking. Zero device-speech fallbacks, media errors or page JavaScript errors. These are technical playback checks, separate from the user's normal audition acceptance.
- Old 13-resource partial package correctly upgrades to 53 resources without prematurely displaying complete. All 40 cache hashes match formal MP3s; incorrect `?v=0` cache entries cannot substitute for `?v=1`; offline audio requests reaching the server were zero. Stop, language change and album navigation clean up prior audio in both modes.
- Deleting Moon removes its cache while preserving the existing airplane package. Redownload restores 53/53 resources and all 40 audio hashes; Chinese and English playback after another offline reload reaches `ended`.
- Prior health-book narration regression passes 32 online/offline plays. Model, independent 84,666-point geometry, exact bilingual content/audio-route mapping, interaction, five-width browser, PWA static, Python/Node and legacy book/runtime checks all pass within the final report's stated scope.
- Evidence: `.qa-labs/moon-audio-offline/delivery-audit.json`, `playback-report.json`, `health-regression.json`, and `.qa-labs/moon-offline/report.json`. Screenshot evidence includes `old-partial.png` and `complete-download.png` under `.qa-labs/moon-audio-offline/`. Local test evidence is not a claim of remote CI execution.

## Remaining boundaries

No local content/audio/offline acceptance item remains pending for this exact candidate. Physical phone/tablet hardware and assistive technology, production/CDN and deployment have not been validated. Reference-source limitations above remain; no new legal rights audit is claimed. The candidate is not committed, pushed, merged or published. Further publication requires explicit authorization and actual deployed-site checks. Future changes require proportionate regression and do not automatically inherit audio acceptance.

Shared bookshelf/PWA integration owned by QA. No fixed page count or legacy page_01 audio assumption. Keep reference voice data, intermediate WAVs and caches out of publication.
