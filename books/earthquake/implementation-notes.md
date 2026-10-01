# SDD ledger — plan: docs/superpowers/plans/2026-10-01-earthquake-book.md

Baseline: 5428f938f579d46fbc8a2d9af853c91ee37a5675, codex/earthquake-topic. QA-confirmed isolated checkout. No commits or publishing.

Ruling: User's routed implementation approval supersedes stale planning-only text; preserve approved scope. Audio owner owns all manifests, including pending ones. Missing manifest means unavailable, never fake hashes.

Ruling: Bash skill helpers unavailable in this Windows shell; use an explicit per-task ledger here and apply_patch rather than inventing a shell runtime. Keep ledger through handoff because no commits exist.

Pre-flight: Tasks 1/5 share image IDs: validate logical IDs first; enforce existing reviewed images only at art delivery. Tasks 2/3/4 share immutable UMD models. Tasks 6/QA share cache readiness; unknown offline readiness fails closed. Task 7 uses audio schemaVersion 2, not contentHash.

Baseline check: node tests/qa_sound_soap_models.cjs PASS. Whole-project and browser QA remain QA-owned; no claim of full suite passage.

Task 1: complete content candidate (not frozen): RED missing story assertion, GREEN node tests/qa_earthquake_book_content.cjs: 8 scenes, 14 interactions. Images still pending Task 5.

Task 2: complete pure models: RED missing model assertion, GREEN node tests/qa_earthquake_book_models.cjs. Permanent slip at 30/120Hz both 0.10459907417634327; traced particle max displacement 0.025606601717798234 < 0.03. Tests cover pause, release-not-trigger, bounded dt, one event, flags/equal distances and finite pulse. Browser geometry not yet verified.

Ruling: Fixed spring/friction parameters are dimensionless teaching choices, not USGS constants. Near tracer is (0,-0.5), far tracer (0.75,-0.5); both are distinct from source (0,-1). No contact controls or shared runtime state.

Tasks 3/4: implemented candidate; independent QA pending. Browser RED: no index/fault control. GREEN: complete story, fault single-step reaches settled; equal-distance flags produce together; help arranges exhibition without a reading gate. Language-prediction regression observed then fixed. Stop/blur hooks exist; full lifecycle/replay stress tests still QA-owned and not claimed passed.

Task 5: five built-in image_gen illustrations generated and visually inspected; WebP encoding preserves alpha. Content --art RED missing reviewed opening, then GREEN after assets. Character is a reference/cutout; four museum images are story layers, SVG provides scientific evidence. Original files remain in generated-image storage; public manifest records only opaque batch and basename, no absolute local paths. opening_card480.webp generated with existing --book earthquake tool. Role segments explicitly tagged narrator/yanyan; source remains frozen=false.

Layout checks: 320/390/820/1024 widths show no horizontal overflow. 390 phone fault controls/result visually inspected. 844x390 result initially bottom=495.825 >390 (RED); compact split layout gives bottom=265.675 (GREEN), screenshot inspected. Browser testing temporarily bypassed development cache; settings restored, not an offline/upgrade claim.

Task 6: routes RED missing implementation then GREEN. KBOfflineLab.check('earthquake') adapter integrated; offline/cross-page independent tests pending. No arbitrary return URL is consumed.

Tasks 7/8: NOT COMPLETE. No formal audio, no candidate approval/freeze yet, no audio.js or manifest-based playback yet, no full independent browser/offline acceptance. No commits/push/publication. QA received candidate URL and contracts; wait for review before audio freeze.

Ruling: Source illustrations depict separate museum exhibits; precise fault/wave geometry is kept in the live SVG, not inferred from narrative rocks. Cost if misunderstood: viewers may confuse the props with the mathematical model; review alongside the story context.

Content freeze: earthquake-story-v1 frozen=true after full bilingual/segment reread and QA's independent candidate report (art display, fault settled/permanent offset/reset/pointercancel, English chapter links, 320/390/820/1024 widths, >=44px primary buttons, offline uncached-lab fallback). 28 voiced items / 56 bilingual entries; narrator and yanyan explicit scene roles, guide remains narrator. This freezes text, not a voice audition or batch/publication approval. Formal playback, full audio QA and joint bidirectional routes remain incomplete.

Task 7 playback implementation (2026-10-02): audio.js added after RED missing-narrator assertion, then GREEN tests/qa_earthquake_book_audio.cjs. The consumer independently checks frozen source SHA256, schema/owner/version, exact bilingual text, role/spoken utterance hashes, unique keys, ready status and whitelisted paths; actual bytes are hashed on explicit play. It never requests unknown/pending/stale paths, never uses device TTS, aborts loading and settles outstanding play on session cancellation, and ignores late callbacks. Scene/vocab/current prompt/result controls use frozen text. Exhibit result ID persists through cancellation; local-motion narration lives beside marker controls. No story/manifest/audio changes.

Task 7 Ruling: add sourceRaw and injectable media I/O to the planned factory, plus a ready promise, because an unvalidated manifest cannot prove its own text/hash. Blob playback follows byte-hash verification. Cost: a full clip must download before playing (20-second startup timeout); offline cached files remain eligible. No shared runtime changes.

Task 7 Ruling: reuse the existing independent QA chat for browser/final review under the approved ownership map; do not spawn replacement reviewers. No commits or publication per QA request.

Local evidence: content --art, models, routes, book_audio all PASS; audio manifest tests 9/9; sound/soap model regression PASS. node qa_books.js reports one shared library-count failure (19 shelf entries vs old 14+4 roster, unexpected earthquake); all 14 legacy book validations pass. QA notified; this is NOT a green whole-project suite claim.

CUA fresh-code smoke: Chinese scene reaches playing; English vocab reaches ended; exhibit-complete playback preserves displayed result. 320/390/820/1024 widths no horizontal overflow, visible listen buttons minimum 44px; 844x390 English fault result bottom 320.16px. Temporary cache bypass/cache-disable and viewport override restored. Not offline/installed-upgrade proof or naturalness approval. QA owns comprehensive 56-entry online/offline ended, lifecycle/browser regressions and PWA fingerprint refresh. Task 8 remains pending.
