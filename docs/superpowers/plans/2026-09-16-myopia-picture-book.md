# Myopia Picture Book Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and integrate the 14-page bilingual interactive picture book 《眼睛为什么看不清了？》 / *Why Do Faraway Things Look Blurry?* as the first book in the knowledge-gap roadmap.

**Architecture:** Add a self-contained `books/myopia/` package that uses the existing `window.BOOK`, `window.PAGES`, `window.OVL`, and `Reader.init()` contract. Keep the focus simulation in a book-local `myopia.js` module with pure calculation functions for Node tests and DOM mounting for the browser; do not change `shared/reader.js`. Register the finished book through the existing shelf, QA arrays, derived cover, generated audio manifest, and generated PWA asset list.

**Tech Stack:** Static HTML/CSS, classic browser JavaScript, SVG/HTML controls, Node.js `assert`/`vm` QA, Playwright browser QA, WebP illustrations, pre-generated bilingual MP3, Python PWA generators.

**Spec:** `docs/superpowers/specs/2026-09-16-seven-book-knowledge-roadmap-design.md`

## Global Constraints

- Audience is approximately ages 4–8; Chinese and English come from one content source and preserve the same scientific meaning.
- Use one independent protagonist and story; do not introduce a recurring universe required by later books.
- Keep one primary mechanism chain: light → cornea/lens → focus → retina → faraway blur when focus falls in front of the retina.
- Do not claim screens alone cause myopia, outdoor time guarantees prevention, eye exercises cure myopia, or glasses weaken eyes.
- The focus activity is an explanatory model, never a vision test or diagnosis.
- Use the existing reader, touch, audio, offline, and resource contracts; do not rebuild the site for this book.
- New bitmap illustrations use new versioned filenames, intrinsic size 1216×832, with translatable labels rendered in HTML/SVG rather than baked into art.
- Generated files are not accepted until the real shelf and reader reference them.
- Static, browser, and online verification are reported separately. Publishing requires separate user authorization.

---

## File Structure

**Create**

- `books/myopia/index.html` — standard reader entry point and script order.
- `books/myopia/book.js` — `BOOK`, 14-page bilingual content, glossary, and activity metadata.
- `books/myopia/overlays.js` — book overlay export; initially empty because the teaching interaction is HTML/SVG, not image-coordinate hotspots.
- `books/myopia/myopia.js` — pure focus model plus accessible activity mounting.
- `books/myopia/myopia.css` — focus diagram, controls, focus states, mobile layout, and reduced-motion rules.
- `books/myopia/SOURCES.md` — scientific scope, simplifications, caregiver notes, and citations.
- `books/myopia/ART-PROMPTS.md` — character sheet and one prompt record per illustration.
- `books/myopia/assets/00_cover_v1.webp` through `13_glossary_v1.webp` — 14 approved 1216×832 illustrations.
- `books/myopia/assets/00_cover_v1_card480.webp` — generated shelf cover.
- `books/myopia/audio/*.mp3` — 28 page clips and 12 glossary clips.
- `books/myopia/_manifest.json` — generated 40-entry narration contract.
- `qa_myopia_model.cjs` — data, wording, activity, filename, and audio-contract checks.
- `qa_myopia_browser.cjs` — real reader, keyboard, touch, focus activity, audio decoding, and responsive checks.

**Modify**

- `qa_books.js:9` — add `myopia` to the canonical shared-reader book list.
- `qa_runtime.js:10` — add `myopia` to runtime initialization coverage.
- `index.html:30-148` — add the shelf card using the derived cover.
- `pwa-assets.js` — regenerate; never edit manually.

## Stable Interfaces

`book.js` produces:

```js
window.BOOK = {
  id: 'myopia',
  title: 'Why Do Faraway Things Look Blurry?',
  titleZh: '眼睛为什么看不清了？',
  subtitle: 'Duoduo follows light into the eye',
  subtitleZh: '朵朵跟着光走进眼睛',
  age: '4-8 岁',
  coverImg: 'assets/00_cover_v1.webp',
  audioDir: 'audio'
};
```

Activity pages add only this ignored-by-the-shared-reader metadata:

```js
activity: { type: 'focus-model', label: 'Focus model', labelZh: '光线聚焦模型' }
```

`myopia.js` produces:

```js
window.MyopiaActivity = {
  calculateFocusModel({ eyeGrowth, lensCorrection }),
  mountAll(document, window.PAGES)
};
```

`calculateFocusModel` accepts normalized numbers from 0 through 1 and returns `{retinaX, focusX, isFocused}` in diagram percentages. It is explicitly a visual model, not a diopter or axial-length calculation.

---

### Task 1: Lock the scientific and narrative contract

**Files:**
- Create: `books/myopia/SOURCES.md`
- Create: `books/myopia/ART-PROMPTS.md`

**Interfaces:**
- Consumes: the approved roadmap spec and its NEI sources.
- Produces: the factual boundaries and character continuity rules used by every later task.

- [ ] **Step 1: Write the source note with claim-to-page mapping**

Record the review date and map these claims to pages: normal retinal focus (pages 4–5), myopic focus in front of the retina (page 6), glasses redirecting focus (page 7), combined genetic/environmental influences (page 8), outdoor association without a guarantee (page 9), and reporting symptoms/obtaining an eye exam (pages 2–3 and 12).

Use these primary sources:

```text
https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/nearsightedness-myopia
https://www.nei.nih.gov/eye-health-information/healthy-vision/nei-for-kids/healthy-vision-tips
```

- [ ] **Step 2: Write the simplification and medical-safety section**

State verbatim in `SOURCES.md` that the interactive diagram is not to scale, not a vision test, and not medical advice; blurred vision, frequent squinting, or eye discomfort should be reported to an adult and assessed by an eye-care professional.

- [ ] **Step 3: Define the visual continuity sheet**

In `ART-PROMPTS.md`, lock Duoduo as a 6-year-old Chinese girl with a yellow windbreaker, teal backpack, short black bob, and red kite spool. Lock the father, optometrist, kite-field palette, eye-exam room, and the rule that diagrams use a clearly labeled cutaway style rather than photorealistic surgery imagery.

- [ ] **Step 4: Verify the source contract contains every guardrail**

Run:

```powershell
rg -n "视网膜|遗传|环境|户外|不保证|不是视力测试|眼科|NEI" books/myopia/SOURCES.md
```

Expected: at least one line for each term and two NEI URLs.

- [ ] **Step 5: Commit the content contract**

```powershell
git add books/myopia/SOURCES.md books/myopia/ART-PROMPTS.md
git commit -m "docs: define myopia book science and art contract"
```

---

### Task 2: Build the 14-page bilingual reader data

**Files:**
- Create: `qa_myopia_model.cjs`
- Create: `books/myopia/index.html`
- Create: `books/myopia/book.js`
- Create: `books/myopia/overlays.js`

**Interfaces:**
- Consumes: `window.Reader.init()` and the existing `BOOK`/`PAGES` schema.
- Produces: `BOOK.id === 'myopia'`, exactly 14 pages, one `focus-model` activity, and six glossary entries.

- [ ] **Step 1: Write the failing model test**

Create a Node test that loads `shared/overlays.js`, the book overlay, and `book.js` in one VM context. Include these exact assertions:

```js
assert.equal(BOOK.id, 'myopia');
assert.equal(PAGES.length, 14);
assert.equal(PAGES[0].cover, true);
assert.equal(PAGES[0].img, BOOK.coverImg);
assert.deepEqual(PAGES.filter(p => p.activity).map(p => p.activity.type), ['focus-model']);
assert.equal(PAGES[13].glossary.length, 6);
for (const [i, page] of PAGES.entries()) {
  assert.ok(page.en && page.zh, `page ${i} bilingual copy`);
  assert.match(page.img, new RegExp(`assets/${String(i).padStart(2, '0')}_.*_v1\\.webp$`));
}
const allCopy = PAGES.map(p => `${p.en} ${p.zh}`).join(' ');
for (const forbidden of ['screens cause myopia', '眼保健操治愈近视', 'glasses weaken', '戴眼镜会加深近视']) {
  assert.ok(!allCopy.includes(forbidden), `forbidden claim: ${forbidden}`);
}
```

- [ ] **Step 2: Run the model test and confirm the missing book failure**

Run: `node qa_myopia_model.cjs`

Expected: FAIL because `books/myopia/book.js` does not exist.

- [ ] **Step 3: Create the standard HTML entry**

Copy the structural pattern from `books/seed/index.html`. Preserve `<main id="reader">` and this exact script order:

```html
<script src="../../shared/cdn.js"></script>
<script src="../../shared/overlays.js"></script>
<script src="../../shared/reader.js"></script>
<script src="overlays.js"></script>
<script src="book.js"></script>
<script src="myopia.js"></script>
<script src="../../shared/pwa.js"></script>
```

Add `myopia.css` after `../../shared/style.css`.

- [ ] **Step 4: Author the page array from the fixed page map**

Use these page indices, asset stems, and purposes:

| Index | Asset stem | Required beat |
|---:|---|---|
| 0 | `00_cover_v1.webp` | Cover: Duoduo and the kite field |
| 1 | `01_kite-clue_v1.webp` | Near spool clear, far kite number blurry |
| 2 | `02_speak-up_v1.webp` | Duoduo tells her father instead of hiding it |
| 3 | `03_eye-exam_v1.webp` | Calm, painless professional eye exam |
| 4 | `04_light-path_v1.webp` | Light enters through cornea and lens |
| 5 | `05_retina-focus_v1.webp` | Normal focus reaches the retina |
| 6 | `06_myopic-focus_v1.webp` | Longer eye model places focus in front of retina |
| 7 | `07_glasses-help_v1.webp` | Glasses redirect light to the retina |
| 8 | `08_many-influences_v1.webp` | Family and environment; no blame |
| 9 | `09_outdoor-play_v1.webp` | Outdoor play as a helpful habit, not a guarantee |
| 10 | `10_look-far-break_v1.webp` | Pause near work and look into the distance |
| 11 | `11_focus-model_v1.webp` | Focus-model interaction and explicit simulation label |
| 12 | `12_tell-an-adult_v1.webp` | Symptom recap and seek-adult action |
| 13 | `13_glossary_v1.webp` | Glossary and positive ending at the kite festival |

The glossary entries are exactly: `Cornea / 角膜`, `Lens / 晶状体`, `Retina / 视网膜`, `Focus / 聚焦`, `Myopia / 近视`, and `Glasses / 眼镜`.

- [ ] **Step 5: Export the overlay object and initialize the reader**

`overlays.js` contains only the book-level export required by QA:

```js
window.OVL = OVL;
```

End `book.js` with:

```js
Reader.init();
```

- [ ] **Step 6: Run the model test**

Run: `node qa_myopia_model.cjs`

Expected: PASS with 14 bilingual pages, one focus activity, six glossary items, and no forbidden claims.

- [ ] **Step 7: Commit the reader data**

```powershell
git add qa_myopia_model.cjs books/myopia/index.html books/myopia/book.js books/myopia/overlays.js
git commit -m "feat: add myopia picture book story data"
```

---

### Task 3: Produce and visually approve the illustration set

**Files:**
- Create: `books/myopia/assets/00_cover_v1.webp` through `books/myopia/assets/13_glossary_v1.webp`
- Update: `books/myopia/ART-PROMPTS.md`

**Interfaces:**
- Consumes: the page map and locked character sheet.
- Produces: 14 distinct 1216×832 WebP files referenced by `book.js`.

- [ ] **Step 1: Generate the cover reference first**

Use the image-generation skill during execution. Generate Duoduo, her father, the kite field, and the soft cut-paper/gouache visual language without baked-in title text. Save only the approved result as `00_cover_v1.webp`.

- [ ] **Step 2: Inspect the cover at original resolution**

Confirm 1216×832 dimensions, intact hands and kite spool, clear near/far composition, room for HTML text, and no medical equipment on the cover.

- [ ] **Step 3: Generate pages 1–13 with the cover as character reference**

For every page, append the final prompt, referenced image, generation date, and acceptance note to `ART-PROMPTS.md`. Eye cutaways must show only the structures needed by the story; labels remain outside the bitmap.

- [ ] **Step 4: Run a mechanical asset check**

Run:

```powershell
python -c "from PIL import Image; from pathlib import Path; p=Path('books/myopia/assets'); fs=sorted(p.glob('*_v1.webp')); assert len(fs)==14; assert all(Image.open(f).size==(1216,832) for f in fs); print('PASS myopia art: 14 images at 1216x832')"
```

Expected: `PASS myopia art: 14 images at 1216x832`.

- [ ] **Step 5: Render a contact sheet and inspect continuity**

Use the project’s visual review tooling or an equivalent contact sheet. Check Duoduo’s hair, yellow jacket, teal backpack, father, exam-room sequence, left/right eye orientation, and the difference between normal and myopic focus diagrams.

- [ ] **Step 6: Re-run the model test with file-existence assertions enabled**

Update `qa_myopia_model.cjs` to assert each `page.img` exists, is WebP, and is larger than 10 KB. Run `node qa_myopia_model.cjs`; expected PASS.

- [ ] **Step 7: Commit approved art**

```powershell
git add books/myopia/assets books/myopia/ART-PROMPTS.md qa_myopia_model.cjs
git commit -m "feat: add approved myopia picture book art"
```

---

### Task 4: Implement the accessible focus model

**Files:**
- Create: `books/myopia/myopia.js`
- Create: `books/myopia/myopia.css`
- Create: `qa_myopia_activity.cjs`
- Modify: `qa_myopia_model.cjs`

**Interfaces:**
- Consumes: `PAGES[i].activity.type === 'focus-model'` and the corresponding rendered `.page` element.
- Produces: `MyopiaActivity.calculateFocusModel()` and `MyopiaActivity.mountAll()`.

- [ ] **Step 1: Write failing pure-function tests**

Test the normalized model with these assertions:

```js
assert.deepEqual(api.calculateFocusModel({eyeGrowth: 0, lensCorrection: 0}), {
  retinaX: 82, focusX: 82, isFocused: true
});
assert.equal(api.calculateFocusModel({eyeGrowth: 1, lensCorrection: 0}).isFocused, false);
assert.equal(api.calculateFocusModel({eyeGrowth: 1, lensCorrection: 1}).isFocused, true);
assert.equal(api.calculateFocusModel({eyeGrowth: -3, lensCorrection: 9}).retinaX, 82);
```

- [ ] **Step 2: Run the activity test and verify failure**

Run: `node qa_myopia_activity.cjs`

Expected: FAIL because `books/myopia/myopia.js` does not exist.

- [ ] **Step 3: Implement the pure model**

Clamp both inputs to `[0, 1]`. Use `retinaX = 82 + 10 * eyeGrowth`, `focusX = 82 + 10 * lensCorrection`, and `isFocused = Math.abs(retinaX - focusX) < 0.6`. Include a source comment stating that percentages are illustrative screen coordinates, not anatomical measurements.

- [ ] **Step 4: Mount the interaction after `Reader.init()`**

`mountAll(document, PAGES)` finds `#pages .page` by page index, reads activity metadata, and appends one `<section class="myopia-focus" aria-label="光线聚焦模型 / Focus model">` to the page’s `.text`. Provide:

- an eye-growth range input with an associated bilingual label;
- a checkbox/button for corrective lenses;
- a diagram containing cornea, lens, retina, and focus point;
- a live status that says either “焦点落在视网膜上” or “焦点落在视网膜前方” with English beneath it;
- a permanent note: “原理示意，不是视力测试 / Explanation only — not a vision test.”

- [ ] **Step 5: Make all controls keyboard and touch accessible**

Use native `input` and `button` elements, minimum 44×44 CSS-pixel targets, visible `:focus-visible`, no drag-only requirement, and no animation when `prefers-reduced-motion: reduce` is active.

- [ ] **Step 6: Run activity and model checks**

Run:

```powershell
node qa_myopia_activity.cjs
node qa_myopia_model.cjs
```

Expected: both PASS.

- [ ] **Step 7: Commit the focus interaction**

```powershell
git add books/myopia/myopia.js books/myopia/myopia.css qa_myopia_activity.cjs qa_myopia_model.cjs
git commit -m "feat: add accessible myopia focus model"
```

---

### Task 5: Generate and validate the bilingual audio contract

**Files:**
- Create: `books/myopia/_manifest.json`
- Create: `books/myopia/audio/page_00_en.mp3` through `page_13_zh.mp3`
- Create: `books/myopia/audio/word_{cornea,lens,retina,focus,myopia,glasses}_{en,zh}.mp3`
- Update: `books/myopia/SOURCES.md`

**Interfaces:**
- Consumes: final `PAGES` text and six glossary terms from `book.js`.
- Produces: exactly 40 finite, decodable MP3 files using the shared reader naming contract.

- [ ] **Step 1: Generate the manifest from the final content source**

Run: `node gen_book_manifest.js books/myopia`

Expected: `myopia: 40 audio entries -> .../_manifest.json`.

- [ ] **Step 2: Assert the manifest is the only narration source**

Run:

```powershell
node -e "const m=require('./books/myopia/_manifest.json'); if(m.book!=='myopia'||m.entries.length!==40)process.exit(1); console.log('PASS myopia manifest',m.entries.length)"
```

Expected: `PASS myopia manifest 40`.

- [ ] **Step 3: Hand the manifest to the “配音与音频” task**

Request gentle bilingual narration with one consistent narrator and a warm, curious Duoduo voice. The audio task must return the 40 exact filenames above and its engine/reference-source record; it must validate finite samples, positive duration, and successful decode before handoff.

- [ ] **Step 4: Integrate only approved MP3 files**

Copy approved final MP3s into `books/myopia/audio/`. Do not commit intermediate WAV, reference voices, cache folders, or generation logs.

- [ ] **Step 5: Add audio provenance and listening notes**

In `SOURCES.md`, record engine, model/version, generation date, voice provenance, disclosure that voices are synthetic, sample-review findings, and any pronunciation overrides for `cornea`, `retina`, and `myopia`.

- [ ] **Step 6: Validate the file contract**

Run:

```powershell
node qa_myopia_model.cjs
node qa_books.js
```

Expected: the myopia-specific test passes; the shared test may still omit myopia until Task 6 registers it, which must be recorded rather than misreported.

- [ ] **Step 7: Commit final audio and manifest**

```powershell
git add books/myopia/audio books/myopia/_manifest.json books/myopia/SOURCES.md
git commit -m "feat: add myopia bilingual narration"
```

---

### Task 6: Register the book in the shelf, shared QA, and offline package

**Files:**
- Modify: `qa_books.js:9`
- Modify: `qa_runtime.js:10`
- Modify: `index.html:30-148`
- Create: `books/myopia/assets/00_cover_v1_card480.webp`
- Modify: `pwa-assets.js` by generator only

**Interfaces:**
- Consumes: complete `books/myopia/` runtime package.
- Produces: a shelf entry, shared-QA registration, runtime registration, derived cover, and PWA book bundle.

- [ ] **Step 1: Add failing shared-QA registrations**

Append `'myopia'` to the arrays in `qa_books.js` and `qa_runtime.js`.

- [ ] **Step 2: Run shared QA before shelf/PWA integration**

Run:

```powershell
node qa_books.js
node qa_runtime.js
```

Expected: runtime data passes; `qa_books.js` fails because the shelf card and/or derived cover are not yet present.

- [ ] **Step 3: Add the shelf card**

Insert after the cloud card:

```html
<a class="book-card" href="books/myopia/index.html">
  <img class="cover" loading="lazy" decoding="async"
       src="books/myopia/assets/00_cover_v1_card480.webp"
       data-kbc="books/myopia/assets/00_cover_v1_card480.webp" data-kbi="0"
       onerror="KBCDN.retry(this)" alt="眼睛为什么看不清了">
  <div class="meta">
    <h3>Why Do Faraway Things Look Blurry?</h3>
    <p class="zh">眼睛为什么看不清了？</p>
    <span class="tag">新书 · 4-8 岁 · 身体与健康</span>
  </div>
</a>
```

- [ ] **Step 4: Generate and validate the shelf cover**

Run:

```powershell
python tools/gen_pwa_covers.py
python tools/gen_pwa_covers.py --check
```

Expected: `00_cover_v1_card480.webp` is 480 pixels wide and the check exits 0.

- [ ] **Step 5: Regenerate the PWA source of truth**

Run: `python tools/gen_pwa_assets.py`

Expected: output lists `myopia` with its HTML, JS, CSS, 14 referenced illustrations, and 40 audio files.

- [ ] **Step 6: Run static and offline validation**

Run:

```powershell
node qa_books.js
node qa_runtime.js
python qa_pwa.py
python tools/qa_offline_manifest.py
git diff --check
```

Expected: all commands exit 0; shared QA reports 13 canonical shared-reader books after adding myopia, while the shelf contains 14 total entries including the custom cloud book.

- [ ] **Step 7: Commit integration files**

```powershell
git add qa_books.js qa_runtime.js index.html books/myopia/assets/00_cover_v1_card480.webp pwa-assets.js
git commit -m "feat: integrate myopia book into library"
```

---

### Task 7: Prove the real reader experience

**Files:**
- Create: `qa_myopia_browser.cjs`
- Modify: book-local files only if the browser test exposes defects

**Interfaces:**
- Consumes: the shelf-integrated book and project-local/local-available Playwright.
- Produces: evidence for browser behavior at desktop, tablet, and mobile sizes.

- [ ] **Step 1: Write the browser QA before fixing browser-only defects**

Follow the local HTTP-server pattern in `qa_cloud.cjs`. The test must assert:

- shelf navigation reaches `books/myopia/index.html`;
- all 14 illustrations decode with `naturalWidth > 0`;
- next/previous buttons, arrow keys, language selection, and page narration work;
- every page has both language blocks;
- the focus slider changes retina/focus separation and the live status;
- the corrective-lens control returns the focus point to the retina;
- the interaction is operable with keyboard alone and has visible focus;
- leaving the activity page produces no stale status or audio overlap;
- all 40 MP3 files decode through `AudioContext` with positive duration;
- 390×844 and 1024×768 viewports have no horizontal overflow;
- console and page-error arrays stay empty.

- [ ] **Step 2: Run the browser QA and capture the initial failure**

Run: `node qa_myopia_browser.cjs`

Expected before browser fixes: at least one meaningful failed assertion, not a missing-test success. If Playwright is absent, request authorization to install it under project-local `.qa-deps`; do not label the browser layer as passed until the test actually runs.

- [ ] **Step 3: Fix only observed browser defects**

Keep corrections within `books/myopia/` unless evidence proves a shared-reader defect affecting existing books. Re-run the focused failing assertion after each correction.

- [ ] **Step 4: Run the full local verification matrix**

Run:

```powershell
node qa_myopia_model.cjs
node qa_myopia_activity.cjs
node qa_myopia_browser.cjs
node qa_books.js
node qa_runtime.js
python tools/gen_pwa_covers.py --check
python qa_pwa.py
python tools/qa_offline_manifest.py
git diff --check
```

Expected: every command exits 0, with browser evidence explicitly separated from static/offline evidence.

- [ ] **Step 5: Perform an editorial spot check**

Read the Chinese and English pages side by side. Confirm the same mechanism, no diagnosis language, no claim that glasses cure myopia, no blame attached to Duoduo, and clear labeling of all diagram simplifications.

- [ ] **Step 6: Commit browser QA and final corrections**

```powershell
git add qa_myopia_browser.cjs books/myopia
git commit -m "test: verify myopia book reader experience"
```

- [ ] **Step 7: Hand off publication without performing it**

Send the commit range and verification evidence to “测试发布与线上问题”. That task must obtain separate authorization for push/merge/Pages and then verify the remote ref, Pages build, final shelf card, book URL, focus activity, audio, Service Worker, and CDN image URLs.
