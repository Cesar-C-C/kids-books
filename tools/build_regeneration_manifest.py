#!/usr/bin/env python3
"""Build the active-image manifest for the eleven-book r2 art regeneration."""
from __future__ import annotations

import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
TARGET_BOOKS = (
    "airplane", "bigbang", "bus", "capsule", "hsr", "ocean",
    "penguin", "rocket", "seed", "station", "steamtrain",
)
NODE_PROGRAM = r'''
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const [root, id] = process.argv.slice(1);
const dir = path.join(root, 'books', id);
const source = [
  fs.readFileSync(path.join(root, 'shared', 'overlays.js'), 'utf8'),
  fs.readFileSync(path.join(dir, 'overlays.js'), 'utf8'),
  fs.readFileSync(path.join(dir, 'book.js'), 'utf8'),
  'globalThis.__BOOK = window.BOOK;',
  'globalThis.__PAGES = window.PAGES;'
].join('\n;\n');
const sandbox = { window: {}, globalThis: {}, document: {}, Reader: { init() {} } };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: id + '/book.js' });
process.stdout.write(JSON.stringify({ book: sandbox.__BOOK, pages: sandbox.__PAGES }));
'''


def replacement_path(old_path: str) -> str:
    source = Path(old_path)
    return str(source.with_name(f"{source.stem}_r2.webp")).replace("\\", "/")


def load_book(node: str, book_id: str) -> dict:
    result = subprocess.run(
        [node, "-e", NODE_PROGRAM, str(ROOT), book_id],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return json.loads(result.stdout)


def main() -> None:
    node = shutil.which("node")
    if not node:
        raise SystemExit("Node.js is required to evaluate book.js data")

    entries: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for book_id in TARGET_BOOKS:
        data = load_book(node, book_id)
        candidates = [{"pageIndex": -1, "kind": "cover", "img": data["book"]["coverImg"]}]
        candidates.extend(
            {
                "pageIndex": index,
                "kind": "page",
                "img": page.get("img"),
                "en": page.get("en", ""),
                "zh": page.get("zh", ""),
                "overlayKey": page.get("ov"),
            }
            for index, page in enumerate(data["pages"])
            if page.get("img")
        )
        for candidate in candidates:
            old_asset = candidate["img"]
            key = (book_id, old_asset)
            if key in seen:
                continue
            seen.add(key)
            entries.append(
                {
                    "book": book_id,
                    "pageIndex": candidate["pageIndex"],
                    "kind": candidate["kind"],
                    "oldAsset": old_asset,
                    "newAsset": replacement_path(old_asset),
                    "en": candidate.get("en", ""),
                    "zh": candidate.get("zh", ""),
                    "overlayKey": candidate.get("overlayKey"),
                }
            )

    output = ROOT / "art" / "regeneration-manifest.json"
    output.parent.mkdir(exist_ok=True)
    output.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    counts = {book_id: sum(entry["book"] == book_id for entry in entries) for book_id in TARGET_BOOKS}
    assert len(entries) == 137, f"expected 137 unique assets, got {len(entries)}"
    print(json.dumps(counts, ensure_ascii=False, sort_keys=True))
    print(f"Wrote {len(entries)} entries to {output.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
