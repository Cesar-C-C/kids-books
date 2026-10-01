# Earthquake 3D Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual, explorable 3D geology lab that lets children see fault loading and slip, compare fault motions, locate focus/epicenter, and distinguish a travelling wave from local particle motion.

**Architecture:** One persistent Three.js geology scene is driven by a DOM-free, fixed-step teaching model. Four card controllers share the scene but reset the relevant experiment on mode changes; an SVG/HTML renderer consumes the same semantic snapshots when WebGL is unavailable. Book and lab share concept IDs and deep-link rules, not mutable simulation state.

**Tech Stack:** Existing static HTML/CSS/JavaScript, `labs/shared/vendor/three.min.js`, Node `assert` tests, existing Playwright browser-test pattern and PWA tooling. No new runtime dependency.

**Spec:** [3D lab design](../specs/2026-10-01-earthquake-3d-lab-design.md); paired [book design](../specs/2026-10-01-earthquake-design.md). Both designs were approved in the planning task on 2026-10-01; their older “待审阅” status lines describe the pre-approval snapshot.

## Global Constraints

- This plan is not execution approval. Review it together with the book, audio and integration plans before product code, generated media or audio. Commit, push, PR, merge and publication remain separate authorization gates.
- Preserve all current uncommitted station work and the two untracked approved specs. At execution, QA first records a common baseline and arranges an isolated checkout containing both specs; do not start from stale `main` or copy the entire dirty checkout.
- 3D owner edits only `labs/earthquake/**` (except generated audio and manifest) and `tests/qa_earthquake_lab_*.cjs`; QA/integration alone owns `labs/catalog.js`, `labs/directory.js`, `labs/shared/navigation.js`, generated `pwa-assets.js` and global QA. Audio owner owns produced `labs/earthquake/audio/**` and `audio-manifest.json`; coordinate before overlapping either path.
- One continuous rock block; default inward compression makes the hanging wall rise along a dipping reverse-fault plane. Normal and strike-slip are separate reset presets. The book uses the same mechanism, but no cross-page state transfer.
- Card IDs: `elastic-rebound`, `fault-types`, `focus-epicenter`, `waves`. Default path is cards 1 and 4; 2 and 3 are optional. A mode switch resets that experiment and retains the same scene identity.
- Only `lang=zh|en` and `from=earthquake-fault|earthquake-waves` are accepted. Book return anchors are `#fault-lab` and `#wave-lab`; invalid values fall back safely. No arbitrary return URL or simulation/progress parameter.
- Default silent; no surprise shake/flash/volume. Controls have roughly 44px targets, keyboard/focus alternatives, and do not block mobile scroll/zoom. Reduced motion and no WebGL retain all four teaching questions and their evidence.
- New publishable assets, excluding shared Three.js and later audio, target ≤2 MB; visible geometry targets ≲100k triangles and ≲250 draw calls. Android device performance, child comprehension and deployed behavior require separate evidence.
- QA's integration plan owns offline packaging: core lab resources enter the first shell, but lab MP3 is on-demand and is only available offline after a successful full-response cache fill. Book audio follows the book-package policy. Neither policy changes the lab's silent, fully operable no-audio path.

## Review Focus

1. Release during a long press, `pointercancel`, blur or page hide must never schedule a late slip or resume loading: Task 4 browser lifecycle test.
2. Switching card or language while replay is pending must not apply stale frames to the new card or restart speech: Tasks 4 and 6 browser tests.
3. An invalid URL, missing `from`, or direct valid deep link must preserve only the allowed card/source semantics: Task 5 route tests.
4. WebGL creation, model script or content fetch failure must leave a readable learning path or explicit error and a working book link, never a blank canvas: Task 6 forced-failure browser test.
5. A wave flag at equal distance, a stopped tracked point, or a partial audio manifest must not falsely imply different arrivals, transported rock, or available narration: Tasks 2 and 7 tests.

---

### Task 1: Fixed-step fault model and contact-comparison gate

**Files:** Create `labs/earthquake/v3/model.js`; test `tests/qa_earthquake_lab_model.cjs`.

**Interfaces:** Produce `window.EarthquakeModel` and CommonJS export with `createFault({contactPreset = 'low'} = {}) -> FaultState`, `stepFault(state, {drive = false} = {}) -> FaultState`, `resetFault(state) -> FaultState`. Each call to `stepFault` advances one fixed model tick, not wall-clock time. `FaultState` includes `tick`, `phase`, `driverDisplacement`, `elasticStrain`, `slipOffset`, `contactPreset`, `justSlipped`; phases are `initial|locked|slipped|settled`. All functions return new serializable state; no DOM, randomness or real-world countdown. The UI owns pause and recorded-frame replay: when paused it does not call `stepFault` except for an explicit one-step action.

- [ ] **Step 1: Write failing tests.** Assert that repeated drive while locked raises `elasticStrain` with near-zero `slipOffset`; `drive:false` alone never triggers slip; a driven threshold crossing sets `justSlipped`; subsequent settled state retains positive `slipOffset`; `resetFault` clears it. Assert equal tick sequences yield equal snapshots regardless of render cadence and bounded finite values for 600 ticks.
- [ ] **Step 2: Run red.** `node tests/qa_earthquake_lab_model.cjs` must fail because `v3/model.js` does not exist.
- [ ] **Step 3: Implement the minimal pure model.** Drive displacement, elastic strain and permanent slip are separate variables. Return partial elastic rebound after the driven slip; do not zero the permanent offset. Simulate a local locked segment, not a numerical earthquake prediction.
- [ ] **Step 4: Test the optional contact comparison.** In the same test file, drive `low` and `high` with an identical input sequence. Compare complete parameter snapshots: only the static-friction limit may differ; dynamic resistance, initial state, drive increment, stiffness, mass and damping are identical. Require a stable, interpretable different onset/strain response across repeated runs; document the outcome in a short comment above the assertion. If it fails scientifically or visually, remove the optional comparison from later card UI instead of fabricating an animation; keep the fixed-condition core.
- [ ] **Step 5: Run green and review.** `node tests/qa_earthquake_lab_model.cjs` passes. Commit only if separately authorized; otherwise leave the scoped work reviewable and uncommitted.

### Task 2: Fault-motion and wave semantics

**Files:** Modify `labs/earthquake/v3/model.js`; extend `tests/qa_earthquake_lab_model.cjs`.

**Interfaces:** Produce `faultMotion(type, amount) -> {hangingWall:{x,y,z},footwall:{x,y,z},driver:{x,y,z}}` for `normal|reverse|strike-slip`, with +Y upward and +Z along strike; the plane dips toward +X, so reverse hanging-wall motion is up-dip (−X,+Y). Produce `FOCUS:{x,y,z}`, `EPICENTER:{x,y,z}` (same X/Z, surface Y=0), `FLAGS` (one near and one far), `createWave({mode='combined'}={}) -> WaveState`, `stepWave(state) -> WaveState`, `particleOffset(state, kind) -> {radial,tangential}` for `p|s`. `WaveState` exposes tick, wavefront radii, flag arrival ticks and a bounded local particle offset.

- [ ] **Step 1: Write failing scientific assertions.** `faultMotion('reverse',1).hangingWall.y > 0`, normal `< 0`, strike-slip has opposite ±Z relative motion and no vertical motion; the marker line follows these offsets. `FOCUS.y < 0`, `EPICENTER.y === 0`, X/Z equal. Near flag arrives before far flag; equal-distance test flags arrive together; at the same flag P precedes S; P particle motion is radial, S tangential, both return near the fixed origin after the pulse.
- [ ] **Step 2: Run red.** `node tests/qa_earthquake_lab_model.cjs` fails on missing exports.
- [ ] **Step 3: Implement the minimum deterministic wave/type functions.** Use one uniform illustrative medium and one focus. `mode=p|s|combined` isolates a wave type without creating a new earthquake. Arrival order is based on distance and fixed model speeds, never on arbitrary animation delays; flags are not a unique epicenter-location tool.
- [ ] **Step 4: Run green.** `node tests/qa_earthquake_lab_model.cjs` passes; check no source text claims real timing, magnitude or prediction. Commit only if separately authorized.

### Task 3: Continuous geology scene and inspectable detail catalog

**Files:** Create `labs/earthquake/v3/geometry.js`, `labs/earthquake/parts.js`, `labs/earthquake/detail-parts.js`; test `tests/qa_earthquake_lab_geometry.cjs`.

**Interfaces:** `window.EarthquakeGeometry.createGeology(THREE) -> {root,anchors,renderFault(state),renderType(type,amount),renderFocus(selection),renderWave(state),setCutaway(on),metrics(),dispose()}`. `anchors` has focus, epicenter and flag positions matching Task 2. `metrics()` returns `{triangles,drawCalls}`. The model root identity and anchor world coordinates persist across card/camera/cutaway changes. Parts/details carry stable `id`, `region`, `conceptId` and refer to Task 4's single bilingual content table; they identify real selectable geology, not fake “discovery” progress.

- [ ] **Step 1: Write a failing scene contract test.** Follow `qa_v3_rocket_model.cjs`: load `labs/shared/vendor/three.min.js`, `v3/model.js`, `v3/geometry.js` and parts/details into a Node `vm` context. Assert one root contains surface, two rock volumes, continuous strata/marker, dipping fault plane and locked patch, driver arrows, focus/projection, two flags, wavefront and tracked point with stationary outline. Assert `setCutaway` does not alter Task 1 state or world anchors; all part/detail IDs resolve to geometry; `metrics()` stays within the design budget.
- [ ] **Step 2: Run red.** `node tests/qa_earthquake_lab_geometry.cjs` fails on missing files.
- [ ] **Step 3: Build low-poly geometry and semantic update methods.** Keep warm rock, rust fault, cyan wavefront and outlined amber particle plus non-color arrows/line styles. `renderType` uses `faultMotion`, `renderWave` uses Task 2 positions; fading strata in wave mode is labelled “均匀介质示意”. Camera framing belongs to Task 4, not this module.
- [ ] **Step 4: Run green.** `node tests/qa_earthquake_lab_geometry.cjs` passes; do a browser-side visual review before claiming perceptual clarity. Commit only if separately authorized.

### Task 4: Core cards, controls and same-screen feedback

**Files:** Create `labs/earthquake/index.html`, `labs/earthquake/content.json`, `labs/earthquake/v3/app.js`, `labs/earthquake/v3/earthquake.css`, `labs/earthquake/v3/studio.css` (byte-identical copy of an existing studio sheet), `labs/earthquake/preview.png`; test `tests/qa_earthquake_lab_browser.cjs`.

**Interfaces:** `window.earthquakeLab.snapshot() -> {card,language,phase,model,view,cutaway,playing,source,renderer}` is a read-only test surface. `content.json` is the lab's sole bilingual text source: `{contentVersion,entries:[{id,kind,conceptId,zh,en,narrationNeeded,contentVersion}]}` with `kind=knowledge|prompt|result`; part/detail IDs resolve to entries. App consumes Tasks 1–3, not retired `labs/<id>/model.js`. Cards 1/4 are the default guided path; cards 2/3 stay available as optional detail. The page loads `v3/model.js` and `v3/geometry.js` before `v3/app.js`, as required by `qa_models.cjs`.

- [ ] **Step 1: Write the failing browser test.** From card 1, hold or step to locked→slipped→settled and observe a persistent bent/offset marker plus state text; release/`pointercancel`/blur/page hide stops driving. Pause keeps the snapshot fixed; a single step advances exactly one tick; slow replay uses the recorded frames, not a recomputed outcome. Card 4 shows near/far flags, P-before-S optional overlay and a particle moving only around its fixed outline. Assert 3D rotate/zoom/cutaway and view presets do not modify model state. Parse `content.json` and assert every visible semantic ID resolves to zh/en text.
- [ ] **Step 2: Run red.** `node tests/qa_earthquake_lab_browser.cjs` fails because the page is absent.
- [ ] **Step 3: Implement the page/controller and content.** Put the question, major action and persistent result in one viewport; add visible focus, keyboard activation, ~44px targets, camera reset/side/top, cutaway and explicit reset. Cards 2/3 consume Task 2: choose a fault type to reset/show one motion, and choose among three surface marks to reveal the focus-to-epicenter projection with retry cue. Bind cancellation through one disposer per mode; language changes resolve another field from `content.json` without restarting the state. Keep page silent until the user activates approved audio later.
- [ ] **Step 4: Run green.** Create the small `preview.png` from a visually checked model screenshot, not generated scientific geometry. `node tests/qa_earthquake_lab_browser.cjs`, `node qa_models.cjs`, and `node tests/qa_earthquake_lab_geometry.cjs` then pass. Commit only if separately authorized.

### Task 5: Bilingual content and guarded book routes

**Files:** Create `labs/earthquake/v3/route.js`; modify `labs/earthquake/index.html`, `labs/earthquake/v3/app.js`; test `tests/qa_earthquake_lab_routes.cjs` and extend `tests/qa_earthquake_lab_browser.cjs`.

**Interfaces:** Reuse Task 4's `content.json`: content `id` is stable and models emit semantic IDs, never dynamically assembled spoken strings. `window.EarthquakeRoute.parse(search,hash) -> {lang,from,card}` and `bookHref({lang,from}) -> string` are pure functions. `from` is fixed on entry; current `lang` is used at click time.

- [ ] **Step 1: Write failing route/content tests.** Exact two book-origin URLs open `elastic-rebound`/`waves`; four valid card hashes work; invalid lang→`zh`, invalid from→`null`, invalid hash→first card. `bookHref` maps `earthquake-fault`→`#fault-lab`, `earthquake-waves`→`#wave-lab`, no source→book start, and cannot accept a `returnUrl`. All UI/part/detail IDs resolve to complete zh/en entries and the approved concept IDs.
- [ ] **Step 2: Run red.** `node tests/qa_earthquake_lab_routes.cjs` fails on missing route/content files.
- [ ] **Step 3: Implement route and content binding.** Provide a distinct “回到刚才的绘本” control for sourced visits; ordinary shared navigation can still point to book start. Switching card does not overwrite source; switching language changes labels and the eventual return URL without resetting simulation. Include the toy-model, uniform-wave, no-prediction and focus/epicenter caveats in the visible appropriate cards.
- [ ] **Step 4: Run green.** `node tests/qa_earthquake_lab_routes.cjs` and `node tests/qa_earthquake_lab_browser.cjs` pass for zh/en, source/no-source and invalid URLs. Commit only if separately authorized.

### Task 6: Reduced-motion, WebGL and resource-failure paths

**Files:** Create `labs/earthquake/v3/fallback.js`; modify `labs/earthquake/index.html`, `labs/earthquake/v3/app.js`, `labs/earthquake/v3/earthquake.css`; extend `tests/qa_earthquake_lab_browser.cjs`.

**Interfaces:** `window.EarthquakeFallback.create(mount) -> {render({card,model}),dispose()}` displays the same semantic state as Tasks 1–2 with SVG/HTML cutaway frames. It does not need a WebGL context.

- [ ] **Step 1: Write failing forced-fallback tests.** Disable `WebGLRenderingContext`/renderer construction in Playwright: all four cards remain operable with step controls, offset marker, focus projection, flag arrival order and P/S distinction. Set `prefers-reduced-motion: reduce`: transitions jump between meaningful keyframes without losing state. Block `model.js` or `content.json`: an explicit error and fixed book link remain; no blank canvas or fake narration button. Rapid card/language changes do not leak previous timers or announce per frame.
- [ ] **Step 2: Run red.** `node tests/qa_earthquake_lab_browser.cjs` fails on absent fallback behavior.
- [ ] **Step 3: Implement the semantic fallback and error boundary.** Static HTML includes a usable book link before scripts load. `aria-live` fires on state transitions only. Keep fallback CSS separate from byte-identical `studio.css`; do not disable normal page scroll or browser zoom.
- [ ] **Step 4: Run green.** `node tests/qa_earthquake_lab_browser.cjs` passes at 320/390/820/1024 widths and short landscape. Commit only if separately authorized.

### Task 7: Audio handoff and local integration evidence

**Files:** Create `labs/earthquake/v3/audio.js`; modify `labs/earthquake/v3/app.js` only after the audio task supplies `labs/earthquake/audio-manifest.json`; test `tests/qa_earthquake_lab_audio.cjs`; extend `tests/qa_earthquake_lab_browser.cjs`. Shared catalog/PWA files remain QA-owned, not part of this task’s edits.

**Interfaces:** `window.EarthquakeLabAudio.create({manifestUrl,contentVersion}) -> {play(kind,id,lang),stop(),dispose(),available(kind,id,lang)}` consumes the audio owner's schema-2 manifest: top-level `owner='lab'`, `contentVersion`, `sourceSha256`; entry `id=kind-itemId-lang`, `itemId`, `kind`, `lang`, `utteranceSha256`, `status`, `fileSha256`, `output`. The `id` argument to `play/available` is the source `itemId`, not the composite entry ID. Only `ready` entries whose version and utterance/text hash match `content.json` are available. The content table remains the only text source. No manifest or stale hash means `available=false` and no enabled listen control; this does not block reading or experimentation. The book keeps its own page-local `books/earthquake/audio.js`; there is no competing shared theme player.

- [ ] **Step 1: Write failing audio tests with fake `Audio`.** Missing/partial/stale manifest never advertises a working button; matching zh/en `kind+itemId` plays only on click; stop on language change, card change, reset and page hide aborts the old player without late playback. A warmed lab MP3 replays offline, whereas an unwarmed one gives a readable unavailable message without blocking controls. No device TTS silently substitutes for missing Fun-CosyVoice 3 assets. Test named IDs instead of assuming the old book’s clip count.
- [ ] **Step 2: Run red.** `node tests/qa_earthquake_lab_audio.cjs` fails on missing adapter.
- [ ] **Step 3: Implement the scoped adapter after content freeze and audio delivery.** Do not change `labs/shared/speech.js` for other labs. Audio owner validates reference provenance, exact bilingual text, sample listening and file integrity; this task only binds approved files and handles lifecycle.
- [ ] **Step 4: Run green and hand off.** `node tests/qa_earthquake_lab_audio.cjs`, `node tests/qa_earthquake_lab_browser.cjs`, `node tests/qa_earthquake_lab_routes.cjs`, `node tests/qa_earthquake_lab_model.cjs`, `node tests/qa_earthquake_lab_geometry.cjs`, `node qa_models.cjs` pass. QA owner alone then registers `earthquake` as `ready` after `books/earthquake/index.html`, page, preview, model and browser checks exist, regenerates `pwa-assets.js`, and runs `node qa_labs.cjs`, `python tools/gen_pwa_assets.py`, `python qa_pwa.py`, `python tools/qa_offline_manifest.py` plus fresh-offline and installed-upgrade browser checks. Record actual asset bytes/triangles/draw calls and distinguish desktop, Android device, child observation and deployed results. Commit only if separately authorized.

## Cross-task handoff

The content task owns `books/earthquake/**` and the `#fault-lab`/`#wave-lab` anchors. Its `story.json` and the lab's `content.json` remain separate bilingual sources with shared concept IDs, not shared narration strings or state. The audio task exports typed narration from those sources after text freeze, with `owner` distinguishing duplicate IDs. QA/integration resolves the exact common checkout, single shared-file owner and readiness gate before any `ready` catalog entry. The book plan's older candidate `contentHash` field must be reconciled with the audio owner's schema-2 `utteranceSha256` before its audio task begins; the content task currently has a separate drum-sound scope and should not be overwritten by this task. If the optional contact comparison fails Task 1, remove only that lab deep-look control and notify planning/content/QA; the two core book experiments and lab cards remain valid.
