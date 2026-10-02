# Earthquake v2 integration baseline

Base: `dce876b7d52c9c7554bda1aee42988c003aaf22e`.
Branch: `codex/earthquake-v2-integration`.

This is an internal, unpublished content/runtime snapshot. It is not a complete audio release.
The current human request in the QA conversation is “发布”; publication remains gated on
complete real v2 narration, actual UI playback, downloads/offline, ordinary installed-cache
upgrade, GitHub checks, and public Pages verification.

25 owner files were copied into this isolated checkout and verified against both formal owner
handoffs. See `content-freeze.json` and `narration-diff.json`.
Book source: `earthquake-story-v2`, 74 targets.
Lab source: `earthquake-lab-v2`, 72 targets.
126 new/changed clips and 20 provenance-gated reuse candidates.
Eight retired book v1 clips are preserved unchanged, excluded from the v2 runtime inventory.

The freeze's file hashes describe the original owner transfer. Any necessary private runtime
changes are recorded separately in `runtime-deltas.json`; they never change the two frozen
teaching-source hashes or any narration identity/text/utterance hash.

Static content/model/routes/audio-adapter, project books/runtime/labs/models, 9 manifest tests
and 19 Python tests passed in this checkout. Lab candidate browser and native scrolling passed.
These tests do not establish new real voice, offline, installed-upgrade, or public acceptance.
The formal v1 audio manifests remain present until the audio owner delivers verified v2 MP3s.

For narration, use an audio-owned isolated checkout from this local snapshot if the application
cannot attach an already-owned QA worktree. Verify the identical joint source/lock hashes before
synthesis. This is an ownership-safe staging copy of the joint baseline, not another author draft.
Return scoped narration/tooling changes for hash-verified adoption into this QA checkout.

Do not include these documents or the author's SOURCES.md/storyboard.md in required runtime
or offline resources. Preserve the unrelated dirty primary checkout and all existing downloads.
