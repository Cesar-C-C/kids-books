# QA progress before v2 narration adoption — 2026-10-02

Publication is authorized by the human request, but is not ready. No remote push,
PR, merge or Pages release has been performed in this v2 workflow.

## Passed

- Exact 25-file author transfer and both frozen source hashes; private runtime
  deltas recorded separately. Book 74 + lab 72 = 146 narration targets.
- Book content/models/routes and audio-adapter fixture guards.
- Lab depth/geometry/routes and audio-adapter fixture guards.
- Existing books/runtime/labs/models/exhibit checks; 9 manifest tests; 19 Python tests.
- Lab candidate browser and native scrolling. These are not formal voice acceptance.
- Five PWA status/upgrade/offline contract tests.
- Reproduced stale mutable download core: the real SW message handler kept v1 story
  bytes on a new download. A minimal refresh of non-media book resources fixes it;
  dedicated regression passes while preserving immutable media.
- Existing airplane book: isolated Chrome, 115/115 downloaded files; server actually
  closed plus browser offline; shelf covers 19/19, book images 13/13, narration
  HTTP 200 from cache, no JavaScript exception. This is a regression of the SW fix,
  not the new earthquake v2 offline release.

## Still pending

- Audio owner: 126 new/changed clips and 20 provenance-gated reuse candidates in its
  own worktree derived from QA snapshot e06326a3ded1b4613300b9c116bebfed5eb4426c.
- All 146 formal v2 entries, MP3 hashes/decoding, and real UI playback.
- Book full 74-clip native online and downloaded-offline tests.
- Private lab Range-aware full-clip caching and accurate failure-state delta.
  Public Range returns 206 and a cold exact native-playback key lacks full Cache
  Storage bytes. IAB page-only offline emulation is not worker-network isolation.
- Regenerated v2 PWA inventory; ordinary installed-v1-to-v2 upgrade and preservation
  of unrelated downloaded books; CI; Pages deployment and public verification.

The existing pwa-assets.js still has the earlier release fingerprint. Do not treat
that staging manifest or the still-v1 narration manifests as a complete v2 release.
The unrelated dirty primary checkout remains untouched.
