# Installed application: new books stuck loading

2026-09-20. User reported sound/soap download rows stuck at 读取中 in an installed desktop/home-screen application.

## Reproduction and root cause

The prior clean-profile tests did not cover an existing installation with a fresh HTTP-cached imported manifest. The browser regression now loads the actual pre-fix worker/client from commit `87b7b8795bb4c30b5e4f7f0b0b8230621cfd076c`, caches an older catalogue without the two new books, and retains all browser storage. With the default registration `updateViaCache: imports`, an ordinary reload can reuse that catalogue even though the visible shelf has new entries. Both rows remain disabled and display 读取中. The worker has no waiting/installing update in this reproduced state.

## Repair

- The manifest generator also writes its content fingerprint into the worker's import URL. Each new catalogue changes the top-level worker bytes and uses a fresh manifest URL, bootstrapping legacy cached clients.
- Completed worker installation activates without depending on a cached page observing an update event. The existing fixed asset cache is retained; no unregister, cache clear or reinstall is used.
- New client registration bypasses the HTTP cache for worker updates, watches an already-installing worker, checks for updates on reopening the panel/foreground/reconnection, and queries the current controller.
- Missing catalogue entries and status timeouts offer retry instead of permanent disabled loading. Older delayed status replies cannot overwrite a newer request. Bulk download excludes unknown entries.

## Evidence

`node tests/qa_installed_pwa_upgrade.cjs` first reproduces the original two stuck rows, then switches only the server release and normally reloads the same page. Both actual UI download buttons work. All 115 previously downloaded airplane resources retain identical bytes, both new packages download completely, and four bilingual sample tracks play after disconnecting. The test does not call registration.update directly or clear storage. It runs in real Chrome with standalone display mode emulated; it is not a physical OS-installed app test.

Unit tests cover status timeout/retry without unknown downloads, stale response rejection, existing waiting/installed workers and updateViaCache configuration. Static PWA fingerprints and all 18 books' resource closures pass. The release workflow runs the historical-installation regression after the existing offline checks.

Screenshots and detailed runtime results are local `.qa-labs/installed-upgrade/` artifacts. Publication and live verification are separate gates. Book text, illustrations and MP3s are unchanged.
