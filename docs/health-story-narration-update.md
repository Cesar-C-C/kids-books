# Health books: revised story narration

The story text now keeps the reader in the scene. Explanations about scale,
illustrative conventions and diagnostic limitations are in one collapsed
parent note at the end of each book.

Replacement recordings completed on 2026-09-19 for both languages of these zero-based pages:

- Myopia: 04, 05, 11.
- Cavities: 02, 03, 04, 05, 06.

The 16 synthesis inputs match the current `zh` and `en` fields exactly. Parent
notes are excluded. All 16 MP3s were adopted and manifest texts updated; all 64
other MP3 hashes across these two books are unchanged. The eight completed
bilingual pairs no longer have `narrationNeedsUpdate` flags.

Generation used local Fun-CosyVoice 3, CUDA FP32, and the same bundled
`zero_shot_prompt.wav` and default prompt as the original recordings. The
standard launcher failed before generation; `tools/health_narration_batch.py`
uses the existing base Python and runtime libraries without modifying them.
WAV and MP3 decoding checks passed for all 16: 24 kHz, mono, finite samples,
positive duration and non-silent signal. This is AI-generated narration, not a
human recording. Human pronunciation, naturalness and voice approval remain
unverified; input equality does not prove every spoken word is correct.

Both custom readers now request audio with `?v=6`. The PWA generator detects
their active experience scripts, while other readers retain their own versions.
The cavities timeline now exposes a Listen button for the selected story page.

Verification passed:

- `node tests/qa_health_narration.cjs`: 32 native browser playback checks
  (16 online, 16 offline after service-worker download and offline reload),
  exact visible text, versioned MP3 URLs, positive advancing playback.
- `node tests/qa_custom_health_browser.cjs`: structures, all 14 pages per book,
  images, language switching, interactions and responsive overflow.
- `node tests/qa_custom_health_layout.cjs`: layout contract.
- `python tools/qa_offline_manifest.py`: all 15 books aligned.

Evidence: `workbench/health-narration-update/validation.json`,
`browser-validation.json`, `jobs.json`, and `before.json`. Reproduction helpers:
`tools/health_narration_jobs.cjs`, `tools/health_narration_batch.py`, and
`tools/adopt_health_narration.cjs`. Generated `books/*/_manifest.json` files
remain ignored under the repository convention; regenerate them with
`node gen_book_manifest.js books/myopia` and the equivalent cavities command.
Only the four JSON evidence files are delivered; intermediate WAV, MP3 copies
and runtime caches are excluded.

For production browser checks, set `HEALTH_QA_BASE_URL` to the Pages base URL
and run both browser tests above. Live audio evidence goes to
`.deploy_verify/health-browser-validation.json` (create the directory first).
