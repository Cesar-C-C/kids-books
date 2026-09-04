# Library Illustration Regeneration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 137 active illustration assets used by the eleven non-schoolbus books with validated, cache-busted WebP r2 assets in one branch and one pull-request update.

**Architecture:** A repository-local manifest records every active book image and its narrative context. Each book is regenerated from one visual anchor, then its `book.js` paths and image-dependent SVG hotspot coordinates are updated only after visual acceptance. The shared reader remains unchanged: versioned relative image paths are automatically served by jsDelivr and retain same-origin fallback.

**Tech Stack:** Built-in image generation, Python Pillow, Node.js, JavaScript `book.js`/`overlays.js`, existing `qa_books.js` and `qa_runtime.js`, Git/GitHub CLI.

**Spec:** `docs/superpowers/specs/2026-09-05-library-illustration-regeneration-design.md`

## Global Constraints

- Process exactly these books: airplane (12 assets), bigbang (11), bus (12), capsule (13), hsr (12), ocean (12), penguin (12), rocket (14), seed (12), station (14), steamtrain (13).
- Leave `books/schoolbus/` unchanged; it remains on its existing `_v2.webp` asset contract.
- Generate assets sequentially; no parallel image-generation calls.
- Final images are 1216×832 WebP, quality 90/method 6, named with `_r2.webp`; temporary PNG sources never enter Git.
- Do not modify text, audio, `shared/reader.js`, or routing. Modify an overlay only to calibrate it to its new image.
- Do not overwrite existing filenames: `_r2.webp` is the CDN cache-busting contract.
- Use explicit Git staging paths and update the existing pull request only after all verification passes.

---

### Task 1: Add the active-asset manifest and regression contract

**Files:**
- Create: `tools/build_regeneration_manifest.py`
- Create: `qa_library_r2_assets.py`
- Create: `art/regeneration-manifest.json`
- Test: `qa_library_r2_assets.py`

**Interfaces:**
- Consumes: every target `books/<id>/book.js` and `books/<id>/overlays.js`.
- Produces: `art/regeneration-manifest.json`, an ordered record with `book`, `pageIndex`, `oldAsset`, `newAsset`, `en`, `zh`, and `overlayKey` fields.
- Produces: `qa_library_r2_assets.py`, which validates active paths, WebP format, 1216×832 dimensions, `_r2.webp` names, and that schoolbus remains `_v2.webp`.

- [ ] **Step 1: Write the failing asset-contract test**

Create `qa_library_r2_assets.py` with the target book IDs and assert that all non-schoolbus `window.PAGES` image paths end in `_r2.webp`; assert that no referenced target image is PNG; assert that the `schoolbus` image paths end in `_v2.webp`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `python qa_library_r2_assets.py`

Expected: fail because the eleven target books still reference existing non-r2 assets.

- [ ] **Step 3: Implement the manifest builder**

Implement `tools/build_regeneration_manifest.py` to parse each target `book.js` through a Node subprocess that emits `window.PAGES` JSON, preserve first occurrence order for duplicate assets, and create the exact r2 path by replacing the source extension with `_r2.webp`. Include page text and overlay key for prompt and hotspot review.

- [ ] **Step 4: Generate and inspect the manifest**

Run: `python tools/build_regeneration_manifest.py`

Expected: `art/regeneration-manifest.json` contains 137 unique entries: 12, 11, 12, 13, 12, 12, 12, 14, 12, 14, and 13 by the target-book order.

- [ ] **Step 5: Commit the contract tooling**

Run:

```powershell
git add tools/build_regeneration_manifest.py qa_library_r2_assets.py art/regeneration-manifest.json
git commit -m "add illustration regeneration manifest"
```

### Task 2: Regenerate transport and mechanical books

**Files:**
- Modify: `books/airplane/book.js`, `books/airplane/overlays.js`, `books/airplane/assets/*_r2.webp`
- Modify: `books/bus/book.js`, `books/bus/overlays.js`, `books/bus/assets/*_r2.webp`
- Modify: `books/hsr/book.js`, `books/hsr/overlays.js`, `books/hsr/assets/*_r2.webp`
- Modify: `books/steamtrain/book.js`, `books/steamtrain/overlays.js`, `books/steamtrain/assets/*_r2.webp`
- Test: `qa_library_r2_assets.py`, per-book overlay diagnostic images

**Interfaces:**
- Consumes: manifest entries for `airplane`, `bus`, `hsr`, and `steamtrain` plus their current overlay keys.
- Produces: 49 WebP r2 assets and matching active image references with calibrated hotspot coordinates.

- [ ] **Step 1: Create one anchor and page prompts per book**

For airplane use a friendly blue-and-white aircraft overview; for bus use a bright safe city double-decker; for HSR use a modern train correctly resting on rails; for steamtrain use warm heritage machinery with wheels sitting on rails. Derive every remaining prompt from its manifest text and select cutaway, close-up, scene, or recap framing so side-view full-vehicle compositions occur at most twice per book.

- [ ] **Step 2: Generate and inspect one asset at a time**

Generate all 12 airplane, 12 bus, 12 HSR, and 13 steamtrain images sequentially. Reject an image unless the recurring vehicle design matches its book anchor, the requested mechanism is visible, wheels are on the road or rails, and no text or watermark competes with overlays.

- [ ] **Step 3: Convert accepted assets and update page paths**

Convert each accepted source to its manifest `newAsset` at WebP quality 90/method 6. Update only the matching `img` and `coverImg` strings in each `book.js` to r2 paths.

- [ ] **Step 4: Recalibrate and diagnose overlays**

For every page with an `overlayKey`, locate the actual subject positions in the final r2 image, update its `overlays.js` coordinates, and render a diagnostic image to verify every hotspot is on its described vehicle part or process.

- [ ] **Step 5: Run book-specific checks**

Run: `python qa_library_r2_assets.py`; `node qa_books.js`; `node qa_runtime.js books/airplane/index.html`; `node qa_runtime.js books/bus/index.html`; `node qa_runtime.js books/hsr/index.html`; `node qa_runtime.js books/steamtrain/index.html`.

Expected: all four books resolve their r2 assets and retain valid overlay keys.

### Task 3: Regenerate space and cosmology books

**Files:**
- Modify: `books/bigbang/book.js`, `books/bigbang/overlays.js`, `books/bigbang/assets/*_r2.webp`
- Modify: `books/capsule/book.js`, `books/capsule/overlays.js`, `books/capsule/assets/*_r2.webp`
- Modify: `books/rocket/book.js`, `books/rocket/overlays.js`, `books/rocket/assets/*_r2.webp`
- Modify: `books/station/book.js`, `books/station/overlays.js`, `books/station/assets/*_r2.webp`
- Test: `qa_library_r2_assets.py`, per-book overlay diagnostic images

**Interfaces:**
- Consumes: manifest entries for four space books and their overlay keys.
- Produces: 52 WebP r2 assets and calibrated active references.

- [ ] **Step 1: Create anchors and page-specific prompts**

Use a warm cosmic expansion anchor for Big Bang, a compact readable spacecraft engineering anchor for the return capsule, an energetic launch-to-return rocket anchor, and a calm orbital station anchor. Each cutaway must expose the requested interior within the body outline; force arrows and labels remain SVG-only.

- [ ] **Step 2: Generate and inspect one asset at a time**

Generate all 11 Big Bang, 13 capsule, 14 rocket, and 14 station images sequentially. Reject images with physically impossible trajectory, gravity, docking, re-entry, or station-interior logic, or with unrecognizable narrative cause and effect.

- [ ] **Step 3: Convert and switch active assets**

Encode the accepted images to manifest r2 WebP paths and replace their active `book.js` image strings. Keep the old assets untouched until the full library verification succeeds.

- [ ] **Step 4: Recalibrate and diagnose overlays**

Update coordinates for every affected overlay key from the final image pixels. Render and inspect diagnostics for overview, cutaway, forces, docking, re-entry, and vocabulary pages.

- [ ] **Step 5: Run book-specific checks**

Run: `python qa_library_r2_assets.py`; `node qa_books.js`; `node qa_runtime.js books/bigbang/index.html`; `node qa_runtime.js books/capsule/index.html`; `node qa_runtime.js books/rocket/index.html`; `node qa_runtime.js books/station/index.html`.

Expected: all four books load active r2 images and have valid overlay contracts.

### Task 4: Regenerate nature books

**Files:**
- Modify: `books/ocean/book.js`, `books/ocean/overlays.js`, `books/ocean/assets/*_r2.webp`
- Modify: `books/penguin/book.js`, `books/penguin/overlays.js`, `books/penguin/assets/*_r2.webp`
- Modify: `books/seed/book.js`, `books/seed/overlays.js`, `books/seed/assets/*_r2.webp`
- Test: `qa_library_r2_assets.py`, per-book overlay diagnostic images

**Interfaces:**
- Consumes: manifest entries for `ocean`, `penguin`, and `seed` plus their overlay keys.
- Produces: 36 WebP r2 assets and calibrated active references.

- [ ] **Step 1: Create anchors and page-specific prompts**

Use distinct layered ocean-zone lighting, Antarctic penguin family scenes, and a warm garden growth-cycle anchor. Preserve scientific sequence: ocean depth increases correctly, penguins retain accurate anatomy and habitat, and seeds germinate with roots downward and stems upward.

- [ ] **Step 2: Generate and inspect one asset at a time**

Generate all 12 ocean, 12 penguin, and 12 seed images sequentially. Reject anatomy errors, wrong depth/light logic, floating plants, inaccurate root direction, or scenes that do not visibly teach the page text.

- [ ] **Step 3: Convert and switch active assets**

Encode all accepted art to r2 WebP files and update only the target image references in the three `book.js` files.

- [ ] **Step 4: Recalibrate and diagnose overlays**

Reposition each hotspot based on the accepted r2 image, then inspect diagnostics for plant parts, animal features, ocean life, zone transitions, and recap scenes.

- [ ] **Step 5: Run book-specific checks**

Run: `python qa_library_r2_assets.py`; `node qa_books.js`; `node qa_runtime.js books/ocean/index.html`; `node qa_runtime.js books/penguin/index.html`; `node qa_runtime.js books/seed/index.html`.

Expected: all three books resolve r2 assets and retain valid interactions.

### Task 5: Verify the full library and publish the completed art set

**Files:**
- Modify: the 11 target books' `book.js` and `overlays.js` files
- Create: 137 target `books/<id>/assets/*_r2.webp` files
- Modify: `qa_library_r2_assets.py`, only if its expected-count data needs a correction supported by the manifest
- Test: full library QA suite and visual contact sheets

**Interfaces:**
- Consumes: all r2 assets, references, overlay diagnostics, and QA tools from Tasks 1–4.
- Produces: one verified Git commit range on `codex/regenerate-schoolbus-art` and an updated draft pull request.

- [ ] **Step 1: Run final resource checks**

Run: `python qa_library_r2_assets.py`; `python -c "from PIL import Image; import pathlib; assert all(Image.open(p).size==(1216,832) for p in pathlib.Path('books').glob('*/assets/*_r2.webp'))"`.

Expected: 137 r2 assets, all referenced, all WebP, all 1216×832, and no target PNG path in any target `book.js`.

- [ ] **Step 2: Run behavior and render checks**

Run: `node qa_books.js`; then run `node qa_runtime.js books/<id>/index.html` once for all eleven target book IDs; run the repository render check if its runtime dependency is present.

Expected: zero book-structure errors and runtime pass for every target book. If the render tool dependency is absent, record its exact missing package while retaining all available passed checks.

- [ ] **Step 3: Inspect contact sheets and diagnostics**

Create one contact sheet per target book from active r2 assets and inspect it together with hotspot diagnostic output. Regenerate only assets that fail visual, narrative, physical, or interaction gates, then rerun the affected book checks.

- [ ] **Step 4: Check the change set and commit deliberately**

Run: `git diff --check`; `git status --short`; `git diff --stat`.

Stage only manifest, QA tooling, the eleven target books' r2 assets, their changed `book.js`/`overlays.js` files, and diagnostic artifacts deliberately intended for the repository. Commit with `regenerate library illustration assets`.

- [ ] **Step 5: Push and update the existing draft pull request**

Push `codex/regenerate-schoolbus-art`, update the PR description with the 137-asset scope, compressed-size summary, cache-version policy, and the exact passed checks. Leave the PR as a draft unless the user explicitly asks to make it ready for review.
