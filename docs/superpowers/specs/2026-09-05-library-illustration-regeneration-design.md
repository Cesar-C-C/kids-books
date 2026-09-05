# Library Illustration Regeneration Design

**Goal:** Replace the active illustrations for the eleven non-schoolbus books with newly generated, child-safe, text-faithful art while preserving interactive behavior, fast CDN delivery, and the existing schoolbus work.

## Scope

- Include: `airplane`, `bigbang`, `bus`, `capsule`, `hsr`, `ocean`, `penguin`, `rocket`, `seed`, `station`, and `steamtrain`.
- Exclude: `schoolbus`; its regenerated WebP v2 assets and its open CDN correction PR remain unchanged.
- Deliver 137 active, unique replacement image assets in one branch and one pull request update. The eleven books render 138 pages because the airplane book intentionally reuses one cruise image.
- Do not alter story text, audio, reader behavior, or book routing unless a new image requires a hotspot-coordinate change.

## Asset Contract

Every replacement asset must meet all of these conditions:

1. Be generated as a raster children's-book illustration at a 1216 by 832 canvas ratio.
2. Be converted to WebP at quality 90 with method 6, retaining the 1216 by 832 dimensions.
3. Use a new versioned filename ending in `_r2.webp`; no existing image filename may be overwritten because jsDelivr caches repository paths.
4. Be the only newly referenced illustration for its page. Source PNGs are temporary generation inputs and must be removed before commit.
5. Be referenced by the relevant `book.js` file using a relative `assets/..._r2.webp` path. The shared reader must continue to resolve images through its existing jsDelivr URL builder and same-origin fallback.

## Art Direction

Each book receives its own visual anchor made from its overview or cover concept. All remaining images in that book use the anchor's recurring subject design, line treatment, lighting, and palette. Books deliberately retain distinct thematic palettes:

| Book | Visual direction |
|---|---|
| airplane | clear blue skies, friendly accurate aircraft diagrams and travel scenes |
| bigbang | warm cosmic gradients, readable early-universe scale and cause/effect |
| bus | lively city palette, safe double-decker vehicle geometry |
| capsule | clean spaceflight engineering, readable cutaways and safe landing scenes |
| hsr | modern Chinese rail travel, correct train-track-contact and infrastructure |
| ocean | layered blue water, scientifically distinct ocean zones and life |
| penguin | Antarctic blues and gentle family scenes with accurate anatomy |
| rocket | energetic launch-to-return sequence with physically coherent spacecraft |
| seed | warm garden palette, clear plant growth stages and botanical structure |
| station | calm orbital scenes, readable space-station interiors and operations |
| steamtrain | warm heritage machinery, correct boiler, wheel, rail, and safety details |

All illustrations must have no readable text, no labels, no watermarks, and no baked-in arrows. Labels, arrows, and interactive regions remain in the SVG overlay layer.

## Generation and Review Flow

1. Extract each book's page text, active image path, overlay key, and asset count from `book.js` and `overlays.js` into a generation manifest.
2. Define page-specific prompts from the text. Each prompt specifies the required visual form: overview, cutaway, close-up, scene, process, or recap. Side-view overview images are limited to the cover and one parts map per book.
3. Generate one asset at a time. Each book's anchor is the style reference for its following pages.
4. Inspect every result before accepting it. Reject and regenerate images that drift from the anchor, fail to explain the page text, contradict physical or everyday reality, or place key visual material in the lower-right watermark-safe area.
5. For each accepted image, inspect its actual subject placement and update the corresponding overlay coordinates. Do not reuse old coordinates based only on the prompt.
6. Convert accepted raster sources to versioned WebP assets, update image references, and remove temporary PNGs.

## Quality Gates

### Per-image gate

- Visual: consistent subject identity, palette, perspective, and child-friendly style within the book.
- Educational: the central object or process visibly explains the English and Chinese page text.
- Reality: vehicles rest on support surfaces; trains use rails correctly; gravity, scale, anatomy, and scene time-of-day are coherent.
- Interaction: important hotspot subjects have enough unobstructed area to support their SVG interaction; no baked-in text competes with overlays.
- Technical: canvas is 1216 by 832 and the final WebP opens correctly.

### Per-book gate

- Every active `book.js` image path resolves to an existing `_r2.webp` asset.
- Every overlay key still exists; each altered image has recalibrated coordinates.
- The page structure, glossary, text, and audio contracts remain unchanged.

### Library gate

- All 137 replacement assets are WebP `_r2` resources; no temporary PNG is added to Git.
- The asset QA verifies image format, dimensions, references, and no collision with old CDN paths.
- `node qa_books.js` reports zero errors across all books.
- `node qa_runtime.js books/<book>/index.html` passes for every book.
- Render/overlay diagnostics are inspected for every updated book.
- `git diff --check` passes before commit.

## Failure Handling

- Generation failure: retry only that asset; never substitute a mismatched previous book image.
- Style or content failure: regenerate from the book's anchor with one targeted prompt correction.
- Coordinate failure: remeasure from the final image and rerun the overlay diagnostic; do not change the art solely to preserve old coordinates.
- Compression failure: keep the generated source outside Git until conversion succeeds, then retry conversion. Do not ship the PNG fallback.
- CDN concern: create a new versioned filename rather than overwriting an existing asset or relying on a query string.

## Delivery

The complete set will remain on `codex/regenerate-schoolbus-art`, which already contains the schoolbus CDN correction. The existing draft PR will be updated with the new 11-book art regeneration, validation report, and a concise asset-size summary. The schoolbus images themselves will not be regenerated.
