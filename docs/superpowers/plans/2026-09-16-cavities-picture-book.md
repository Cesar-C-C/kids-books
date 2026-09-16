# Cavities Picture Book Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and integrate the 14-page bilingual interactive picture book 《牙齿里的小洞洞》 / *The Little Hole in a Tooth* so children understand tooth decay and practise a calm, repeatable brushing routine.

**Architecture:** Add a self-contained `books/cavities/` package on the existing shared reader contract. Put brushing-state and timer logic in a book-local `cavities.js` module with pure functions for Node tests and accessible button-based activities for the browser; do not change `shared/reader.js` and do not depend on myopia assets or scripts. Execute this plan after the myopia plan’s library-integration task so shared QA counts and shelf order remain deterministic.

**Tech Stack:** Static HTML/CSS, classic browser JavaScript, SVG/HTML controls, Node.js `assert`/`vm` QA, Playwright browser QA, WebP illustrations, pre-generated bilingual MP3, Python PWA generators.

**Spec:** `docs/superpowers/specs/2026-09-16-seven-book-knowledge-roadmap-design.md`

## Global Constraints

- Audience is approximately ages 4–8; Chinese and English come from one content source and preserve the same scientific meaning.
- Use one independent protagonist and story; do not reuse Duoduo or require the myopia story to understand this book.
- Keep one primary mechanism chain: sugars/starches + some oral bacteria → acid → repeated enamel mineral loss → cavity.
- Show saliva and fluoride helping protect and remineralize early enamel damage; never claim brushing repairs an established cavity.
- Do not use a literal tooth worm, describe all bacteria as bad, shame the child, or use frightening extraction/pain imagery.
- The behavior goal is fluoride toothpaste twice daily, two minutes per session, adult help/supervision for young children, and telling an adult about pain or a suspected cavity.
- The timer is optional and must not require the child to stare at the screen while brushing.
- Use the existing reader, touch, audio, offline, and resource contracts; do not rebuild the site for this book.
- New bitmap illustrations use new versioned filenames, intrinsic size 1216×832, with translatable labels rendered in HTML/SVG rather than baked into art.
- Generated files are not accepted until the real shelf and reader reference them.
- Static, browser, and online verification are reported separately. Publishing requires separate user authorization.

---

## File Structure

**Create**

- `books/cavities/index.html` — standard reader entry point and script order.
- `books/cavities/book.js` — `BOOK`, 14-page bilingual content, glossary, and two activity records.
- `books/cavities/overlays.js` — book overlay export; no coordinate hotspots in the first release.
- `books/cavities/cavities.js` — pure brushing/timer state functions plus accessible DOM mounting.
- `books/cavities/cavities.css` — tooth-zone controls, timer, responsive states, and reduced-motion rules.
- `books/cavities/SOURCES.md` — scientific scope, age-specific guidance, simplifications, and citations.
- `books/cavities/ART-PROMPTS.md` — protagonist sheet and one prompt record per illustration.
- `books/cavities/assets/00_cover_v1.webp` through `13_glossary_v1.webp` — 14 approved 1216×832 illustrations.
- `books/cavities/assets/00_cover_v1_card480.webp` — generated shelf cover.
- `books/cavities/audio/*.mp3` — 28 page clips and 12 glossary clips.
- `books/cavities/_manifest.json` — generated 40-entry narration contract.
- `qa_cavities_model.cjs` — data, claim, activity, filename, and audio-contract checks.
- `qa_cavities_activity.cjs` — brushing reducer and timer boundary tests.
- `qa_cavities_browser.cjs` — real reader, brushing flow, timer, audio decoding, responsive, keyboard, and touch checks.

**Modify**

- `qa_books.js:9` — add `cavities` after `myopia` in the canonical shared-reader list.
- `qa_runtime.js:10` — add `cavities` after `myopia`.
- `index.html:30-148` — add the shelf card directly after the myopia card.
- `pwa-assets.js` — regenerate; never edit manually.

## Stable Interfaces

`book.js` produces:

```js
window.BOOK = {
  id: 'cavities',
  title: 'The Little Hole in a Tooth',
  titleZh: '牙齿里的小洞洞',
  subtitle: 'Paopao and the midnight acid alarm',
  subtitleZh: '泡泡和午夜酸雨警报',
  age: '4-8 岁',
  coverImg: 'assets/00_cover_v1.webp',
  audioDir: 'audio'
};
```

Activity pages use:

```js
activity: { type: 'brush-zones', label: 'Brush every surface', labelZh: '刷到每一个牙面' }
activity: { type: 'brush-timer', label: 'Two-minute timer', labelZh: '两分钟刷牙计时' }
```

`cavities.js` produces:

```js
window.CavitiesActivity = {
  BRUSH_ZONES,
  markZone(state, zone),
  remainingMs(startedAt, now, durationMs),
  mountAll(document, window.PAGES)
};
```

`BRUSH_ZONES` is exactly `['outer', 'inner', 'chewing']`. `markZone` returns a new state object without mutating its input. `remainingMs` returns an integer clamped to `0..durationMs` and defaults to 120000 milliseconds.

---

### Task 1: Lock the oral-health and story contract

**Files:**
- Create: `books/cavities/SOURCES.md`
- Create: `books/cavities/ART-PROMPTS.md`

**Interfaces:**
- Consumes: the approved roadmap and professional oral-health sources.
- Produces: factual boundaries, age-specific caregiver guidance, and visual continuity rules.

- [ ] **Step 1: Write the claim-to-page source map**

Map these claims: diverse mouth microbes (page 3), bacteria using sugars/starches to make acid (pages 4–5), enamel mineral loss (page 6), saliva/fluoride and early remineralization (page 7), established cavity requiring dental care (pages 8–9), and twice-daily supervised brushing (pages 10–12).

Use these sources:

```text
https://www.nidcr.nih.gov/health-info/tooth-decay/more-info/tooth-decay-process
https://cdc.gov/oral-health/prevention/oral-health-tips-for-children.html
https://www.mouthhealthy.org/all-topics-a-z/fluoride
```

- [ ] **Step 2: Record the age-specific safety wording**

State that children ages 3–6 use a pea-sized amount of fluoride toothpaste, spit rather than swallow, and need adult help or supervision. State that individual advice from a child’s dentist or doctor overrides the general story guidance.

- [ ] **Step 3: Define visual continuity and tone**

Lock Paopao as a 5-year-old young hippo with lavender-gray skin, mint pajamas, and a yellow toothbrush. The tooth-city cutaway uses warm ivory enamel, blue saliva, pale green fluoride shields, and orange acid droplets. No insects, monsters, drilled teeth, needles, blood, black cavities, or distressed dental-chair imagery.

- [ ] **Step 4: Verify the contract**

Run:

```powershell
rg -n "细菌|糖|淀粉|酸|牙釉质|唾液|氟|豌豆|两次|牙医|NIDCR|CDC" books/cavities/SOURCES.md
```

Expected: all concepts and all three source organizations appear.

- [ ] **Step 5: Commit the content contract**

```powershell
git add books/cavities/SOURCES.md books/cavities/ART-PROMPTS.md
git commit -m "docs: define cavities book science and art contract"
```

---

### Task 2: Build the 14-page bilingual reader data

**Files:**
- Create: `qa_cavities_model.cjs`
- Create: `books/cavities/index.html`
- Create: `books/cavities/book.js`
- Create: `books/cavities/overlays.js`

**Interfaces:**
- Consumes: `window.Reader.init()` and the existing `BOOK`/`PAGES` schema.
- Produces: `BOOK.id === 'cavities'`, exactly 14 pages, one brush-zones activity, one timer activity, and six glossary entries.

- [ ] **Step 1: Write the failing model test**

Create a VM-based test following `qa_myopia_model.cjs` and include:

```js
assert.equal(BOOK.id, 'cavities');
assert.equal(PAGES.length, 14);
assert.equal(PAGES[0].cover, true);
assert.equal(PAGES[0].img, BOOK.coverImg);
assert.deepEqual(PAGES.filter(p => p.activity).map(p => p.activity.type), [
  'brush-zones', 'brush-timer'
]);
assert.equal(PAGES[13].glossary.length, 6);
for (const [i, page] of PAGES.entries()) {
  assert.ok(page.en && page.zh, `page ${i} bilingual copy`);
  assert.match(page.img, new RegExp(`assets/${String(i).padStart(2, '0')}_.*_v1\\.webp$`));
}
const allCopy = PAGES.map(p => `${p.en} ${p.zh}`).join(' ');
for (const forbidden of ['tooth worm', '蛀牙虫真的住在牙齿里', 'brushing fixes a cavity', '刷牙能补好蛀洞']) {
  assert.ok(!allCopy.includes(forbidden), `forbidden claim: ${forbidden}`);
}
```

- [ ] **Step 2: Run the model test and verify the missing book failure**

Run: `node qa_cavities_model.cjs`

Expected: FAIL because `books/cavities/book.js` does not exist.

- [ ] **Step 3: Create the standard HTML entry**

Follow `books/seed/index.html`, preserving `<main id="reader">` and this script order:

```html
<script src="../../shared/cdn.js"></script>
<script src="../../shared/overlays.js"></script>
<script src="../../shared/reader.js"></script>
<script src="overlays.js"></script>
<script src="book.js"></script>
<script src="cavities.js"></script>
<script src="../../shared/pwa.js"></script>
```

Load `cavities.css` after the shared reader style.

- [ ] **Step 4: Author the page array from the fixed page map**

| Index | Asset stem | Required beat |
|---:|---|---|
| 0 | `00_cover_v1.webp` | Cover: Paopao, toothbrush, and friendly tooth-city doorway |
| 1 | `01_skip-brushing_v1.webp` | Paopao wants to skip brushing after frequent snacks |
| 2 | `02_acid-alarm_v1.webp` | Tooth city sounds a gentle acid alert |
| 3 | `03_mouth-community_v1.webp` | Many kinds of microbes; not all are villains |
| 4 | `04_sugar-and-starch_v1.webp` | Food leftovers meet plaque bacteria |
| 5 | `05_acid-attack_v1.webp` | Some bacteria produce acid |
| 6 | `06_mineral-loss_v1.webp` | Repeated acid exposure removes enamel minerals |
| 7 | `07_saliva-fluoride_v1.webp` | Saliva and fluoride support early remineralization |
| 8 | `08_cavity-forms_v1.webp` | Continued damage becomes a permanent hole |
| 9 | `09_dentist-check_v1.webp` | Calm dental visit and early help |
| 10 | `10_outer-surfaces_v1.webp` | Begin brushing outer surfaces |
| 11 | `11_all-surfaces_v1.webp` | Brush-zone interaction: outer, inner, chewing |
| 12 | `12_two-minute-routine_v1.webp` | Optional timer, twice-daily routine, adult help |
| 13 | `13_glossary_v1.webp` | Glossary and Paopao’s calm bedtime routine |

The glossary is exactly: `Bacteria / 细菌`, `Plaque / 牙菌斑`, `Acid / 酸`, `Enamel / 牙釉质`, `Fluoride / 氟化物`, and `Cavity / 蛀洞`.

- [ ] **Step 5: Export overlays and initialize**

Use `window.OVL = OVL;` in `overlays.js` and end `book.js` with `Reader.init();`.

- [ ] **Step 6: Run the model test**

Run: `node qa_cavities_model.cjs`

Expected: PASS with 14 bilingual pages, the two ordered activities, six glossary items, and no forbidden claims.

- [ ] **Step 7: Commit the reader data**

```powershell
git add qa_cavities_model.cjs books/cavities/index.html books/cavities/book.js books/cavities/overlays.js
git commit -m "feat: add cavities picture book story data"
```

---

### Task 3: Produce and visually approve the illustration set

**Files:**
- Create: `books/cavities/assets/00_cover_v1.webp` through `books/cavities/assets/13_glossary_v1.webp`
- Update: `books/cavities/ART-PROMPTS.md`

**Interfaces:**
- Consumes: page map and character/tone contract.
- Produces: 14 distinct 1216×832 WebP files referenced by `book.js`.

- [ ] **Step 1: Generate the cover reference first**

Use the image-generation skill during execution. Establish Paopao, the mint pajamas, yellow toothbrush, warm bedtime bathroom, and friendly tooth-city motif without baked-in title text.

- [ ] **Step 2: Inspect the cover at original resolution**

Confirm consistent hippo anatomy, a correctly held toothbrush, no toothpaste ingestion, no frightening dental imagery, and sufficient clear space for reader text.

- [ ] **Step 3: Generate pages 1–13 using the cover reference**

Record each final prompt, reference image, date, and acceptance decision in `ART-PROMPTS.md`. The microbe/acid/enamel pages must be labeled in the prompt as enlarged conceptual cutaways; do not put translatable words into the bitmap.

- [ ] **Step 4: Run the mechanical asset check**

Run:

```powershell
python -c "from PIL import Image; from pathlib import Path; p=Path('books/cavities/assets'); fs=sorted(p.glob('*_v1.webp')); assert len(fs)==14; assert all(Image.open(f).size==(1216,832) for f in fs); print('PASS cavities art: 14 images at 1216x832')"
```

Expected: `PASS cavities art: 14 images at 1216x832`.

- [ ] **Step 5: Review the full sequence visually**

Check Paopao’s body proportions, pajamas and toothbrush; tooth numbering/orientation across brush pages; visual continuity from mineral loss to dentist visit; and the absence of worms, scary black holes, needles, blood, or shame expressions.

- [ ] **Step 6: Enable and run asset-existence assertions**

Update `qa_cavities_model.cjs` to assert each `page.img` exists, is WebP, and exceeds 10 KB. Run `node qa_cavities_model.cjs`; expected PASS.

- [ ] **Step 7: Commit approved art**

```powershell
git add books/cavities/assets books/cavities/ART-PROMPTS.md qa_cavities_model.cjs
git commit -m "feat: add approved cavities picture book art"
```

---

### Task 4: Implement brushing and timer activities

**Files:**
- Create: `books/cavities/cavities.js`
- Create: `books/cavities/cavities.css`
- Create: `qa_cavities_activity.cjs`
- Modify: `qa_cavities_model.cjs`

**Interfaces:**
- Consumes: `brush-zones` and `brush-timer` metadata plus corresponding rendered page elements.
- Produces: immutable zone state, bounded timer math, and two accessible activities.

- [ ] **Step 1: Write failing state tests**

Use these exact behavior assertions:

```js
assert.deepEqual(api.BRUSH_ZONES, ['outer', 'inner', 'chewing']);
const empty = {completed: []};
const one = api.markZone(empty, 'outer');
assert.deepEqual(empty, {completed: []});
assert.deepEqual(one, {completed: ['outer']});
assert.deepEqual(api.markZone(one, 'outer'), one);
assert.throws(() => api.markZone(one, 'tongue'), /Unknown brush zone/);
assert.equal(api.remainingMs(1000, 1000, 120000), 120000);
assert.equal(api.remainingMs(1000, 61000, 120000), 60000);
assert.equal(api.remainingMs(1000, 130000, 120000), 0);
```

- [ ] **Step 2: Run the activity test and verify failure**

Run: `node qa_cavities_activity.cjs`

Expected: FAIL because `books/cavities/cavities.js` does not exist.

- [ ] **Step 3: Implement pure state functions**

`markZone` returns a fresh `{completed}` array for a valid new zone, returns an equivalent state for a duplicate, and throws for values outside `BRUSH_ZONES`. `remainingMs` defaults to 120000 and returns `Math.max(0, Math.min(durationMs, durationMs - (now - startedAt)))` rounded to an integer.

- [ ] **Step 4: Mount the brush-zone activity**

Append a bilingual `<section class="brush-zones">` with three native buttons: outer, inner, and chewing surfaces. Each button has a 44×44 minimum target, toggles `aria-pressed` from false to true, and updates a polite live region. Completing all three displays “每个牙面都刷到了 / Every surface is brushed” without scores or streaks.

- [ ] **Step 5: Mount the optional two-minute timer**

Provide start, pause, resume, and reset buttons; a text countdown with `role="timer"`; and the permanent instruction that the child may put the device down while brushing. Stop the interval on page exit, `visibilitychange`, and `pagehide`. Re-entering the page must not create duplicate intervals.

- [ ] **Step 6: Add accessible visual behavior**

Use visible `:focus-visible`, text plus color for completion, reduced-motion handling, and layouts that fit 390×844 and 1024×768 without horizontal scrolling. Do not require drag gestures.

- [ ] **Step 7: Run unit and model checks**

Run:

```powershell
node qa_cavities_activity.cjs
node qa_cavities_model.cjs
```

Expected: both PASS.

- [ ] **Step 8: Commit the activities**

```powershell
git add books/cavities/cavities.js books/cavities/cavities.css qa_cavities_activity.cjs qa_cavities_model.cjs
git commit -m "feat: add accessible cavities brushing activities"
```

---

### Task 5: Generate and validate bilingual narration

**Files:**
- Create: `books/cavities/_manifest.json`
- Create: `books/cavities/audio/page_00_en.mp3` through `page_13_zh.mp3`
- Create: `books/cavities/audio/word_{bacteria,plaque,acid,enamel,fluoride,cavity}_{en,zh}.mp3`
- Update: `books/cavities/SOURCES.md`

**Interfaces:**
- Consumes: final page text and glossary from `book.js`.
- Produces: exactly 40 finite, decodable MP3 files using the shared naming contract.

- [ ] **Step 1: Generate the audio manifest**

Run: `node gen_book_manifest.js books/cavities`

Expected: `cavities: 40 audio entries -> .../_manifest.json`.

- [ ] **Step 2: Validate the generated manifest**

Run:

```powershell
node -e "const m=require('./books/cavities/_manifest.json'); if(m.book!=='cavities'||m.entries.length!==40)process.exit(1); console.log('PASS cavities manifest',m.entries.length)"
```

Expected: `PASS cavities manifest 40`.

- [ ] **Step 3: Hand off to the “配音与音频” task**

Request a warm narrator, a lively but never scolded Paopao, and calm caregiver/dentist lines. The audio task must return all 40 exact filenames, validate finite samples and positive duration, and explicitly review English pronunciation of `bacteria`, `plaque`, `enamel`, `fluoride`, and `cavity`.

- [ ] **Step 4: Integrate approved final MP3s only**

Place final MP3s in `books/cavities/audio/`. Keep WAV masters, reference voices, caches, and logs outside the published book directory.

- [ ] **Step 5: Record provenance and listening results**

Add engine/model/version, generation date, voice provenance, synthetic-voice disclosure, reviewed samples, and pronunciation overrides to `SOURCES.md`.

- [ ] **Step 6: Validate the audio file contract**

Run `node qa_cavities_model.cjs` after enabling exact filename/size assertions. Expected: PASS with 40 files and no missing language.

- [ ] **Step 7: Commit final audio and manifest**

```powershell
git add books/cavities/audio books/cavities/_manifest.json books/cavities/SOURCES.md qa_cavities_model.cjs
git commit -m "feat: add cavities bilingual narration"
```

---

### Task 6: Register the book in the shelf, shared QA, and offline package

**Files:**
- Modify: `qa_books.js:9`
- Modify: `qa_runtime.js:10`
- Modify: `index.html:30-148`
- Create: `books/cavities/assets/00_cover_v1_card480.webp`
- Modify: `pwa-assets.js` by generator only

**Interfaces:**
- Consumes: completed myopia integration followed by the complete cavities package.
- Produces: first-batch shelf order `cloud → myopia → cavities`, shared-QA registration, derived cover, and PWA bundle.

- [ ] **Step 1: Add failing shared-QA registrations**

Append `'cavities'` after `'myopia'` in the arrays in `qa_books.js` and `qa_runtime.js`.

- [ ] **Step 2: Run shared QA before shelf integration**

Run:

```powershell
node qa_books.js
node qa_runtime.js
```

Expected: runtime data passes; `qa_books.js` fails on the missing shelf card and/or derived cover.

- [ ] **Step 3: Add the shelf card directly after myopia**

```html
<a class="book-card" href="books/cavities/index.html">
  <img class="cover" loading="lazy" decoding="async"
       src="books/cavities/assets/00_cover_v1_card480.webp"
       data-kbc="books/cavities/assets/00_cover_v1_card480.webp" data-kbi="0"
       onerror="KBCDN.retry(this)" alt="牙齿里的小洞洞">
  <div class="meta">
    <h3>The Little Hole in a Tooth</h3>
    <p class="zh">牙齿里的小洞洞</p>
    <span class="tag">新书 · 4-8 岁 · 身体与健康</span>
  </div>
</a>
```

- [ ] **Step 4: Generate and check the derived cover**

Run:

```powershell
python tools/gen_pwa_covers.py
python tools/gen_pwa_covers.py --check
```

Expected: `00_cover_v1_card480.webp` is 480 pixels wide and the check exits 0.

- [ ] **Step 5: Regenerate the PWA source of truth**

Run: `python tools/gen_pwa_assets.py`

Expected: output lists `cavities` with HTML, JS, CSS, 14 referenced illustrations, and 40 audio files.

- [ ] **Step 6: Run static and offline validation**

Run:

```powershell
node qa_books.js
node qa_runtime.js
python qa_pwa.py
python tools/qa_offline_manifest.py
git diff --check
```

Expected after both first-batch plans: all commands exit 0; shared QA reports 14 canonical shared-reader books, while the shelf contains 15 total entries including the custom cloud book.

- [ ] **Step 7: Commit integration files**

```powershell
git add qa_books.js qa_runtime.js index.html books/cavities/assets/00_cover_v1_card480.webp pwa-assets.js
git commit -m "feat: integrate cavities book into library"
```

---

### Task 7: Prove brushing behavior in the real reader

**Files:**
- Create: `qa_cavities_browser.cjs`
- Modify: book-local files only if browser evidence exposes defects

**Interfaces:**
- Consumes: the shelf-integrated book and available Playwright/Chrome environment.
- Produces: browser evidence at desktop, tablet, and mobile sizes.

- [ ] **Step 1: Write the browser QA before browser-specific fixes**

Follow the local HTTP-server pattern in `qa_cloud.cjs`. Assert:

- shelf navigation reaches `books/cavities/index.html`;
- all 14 images decode and all bilingual page blocks render;
- buttons, arrow keys, language selection, and page narration work;
- outer, inner, and chewing buttons are keyboard-operable and announce progress;
- a duplicate zone click does not inflate progress;
- all three zones produce the bilingual completion message;
- timer start/pause/resume/reset changes state exactly once per action;
- leaving the timer page stops its interval and returning does not duplicate it;
- the timer’s pure API reaches zero without waiting two real minutes;
- all 40 MP3 files decode through `AudioContext` with positive duration;
- 390×844 and 1024×768 have no horizontal overflow and at least 44×44 controls;
- console and page-error arrays remain empty.

- [ ] **Step 2: Run the browser QA and capture the initial failure**

Run: `node qa_cavities_browser.cjs`

Expected before browser fixes: at least one meaningful failed assertion. If Playwright is missing, request authorization to install it under project-local `.qa-deps`; do not claim browser validation from static checks.

- [ ] **Step 3: Fix only observed book-local defects**

Do not alter shared swipe or reader behavior unless a failing cross-book test proves the need. Verify timer cleanup with both page navigation and `visibilitychange`.

- [ ] **Step 4: Run the complete local verification matrix**

Run:

```powershell
node qa_cavities_model.cjs
node qa_cavities_activity.cjs
node qa_cavities_browser.cjs
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

Expected: every command exits 0. The myopia checks prove that adding cavities did not regress the first book.

- [ ] **Step 5: Perform an editorial and behavioral spot check**

Confirm that neither language mentions real tooth worms, all bacteria being bad, or brushing repairing a cavity. Confirm twice-daily/two-minute guidance, adult help for young children, calm dental-care language, and no shame-based reward streak.

- [ ] **Step 6: Commit browser QA and final corrections**

```powershell
git add qa_cavities_browser.cjs books/cavities
git commit -m "test: verify cavities book reader experience"
```

- [ ] **Step 7: Hand off publication without performing it**

Send the complete first-batch commit range and separated static/browser/offline evidence to “测试发布与线上问题”. That task must obtain distinct authorization for push, merge, and Pages publication, then verify the remote ref, build, final shelf order, both book URLs, both activities, bilingual audio, Service Worker downloads, and CDN image delivery.
