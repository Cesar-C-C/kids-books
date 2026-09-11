#!/usr/bin/env python3
"""Regression contract for the eleven-book r2 illustration migration."""
from pathlib import Path
import argparse
import json
import re
from PIL import Image

ROOT = Path(__file__).resolve().parent
TARGET_BOOKS = (
    "airplane", "bigbang", "bus", "capsule", "hsr", "ocean",
    "penguin", "rocket", "seed", "station", "steamtrain",
)

def active_paths(book_id: str) -> set[str]:
    """Active image paths referenced by book.js, with any cache-busting query
    stripped. A versioned URL such as 'assets/02_earth_c_r2.webp?v=6aea572'
    points at the same file as 'assets/02_earth_c_r2.webp'; the query only
    exists to defeat browser/CDN caches at runtime and is asserted separately
    by qa_books.js, so it must not break the file-level contract here."""
    source = (ROOT / "books" / book_id / "book.js").read_text(encoding="utf-8")
    raw = re.findall(r"(?:img|coverImg)\s*:\s*['\"](assets/[^'\"]+)['\"]", source)
    return {path.split("?", 1)[0] for path in raw}

parser = argparse.ArgumentParser()
parser.add_argument('--books', nargs='+', choices=TARGET_BOOKS)
args = parser.parse_args()
selected = args.books or TARGET_BOOKS
manifest = json.loads((ROOT / 'art/regeneration-manifest.json').read_text(encoding='utf-8'))
assert len(manifest) == 137
homepage = (ROOT / 'index.html').read_text(encoding='utf-8')
total_bytes = 0
total_assets = 0
for book_id in selected:
    paths = active_paths(book_id)
    assert paths, f"{book_id}: no active image paths found"
    assert all(path.endswith("_r2.webp") for path in paths), (
        f"{book_id}: active images must use cache-busted _r2.webp paths: {sorted(paths)}"
    )
    expected = {entry['newAsset'] for entry in manifest if entry['book'] == book_id}
    assert paths == expected, f'{book_id}: active asset set differs from approved manifest'
    cover = next(entry for entry in manifest if entry['book'] == book_id and entry['kind'] == 'cover')
    assert f"books/{book_id}/{cover['newAsset']}" in homepage, f'{book_id}: homepage cover is stale'
    assert f"books/{book_id}/{cover['oldAsset']}" not in homepage, f'{book_id}: old homepage cover remains'
    for asset in paths:
        file = ROOT / 'books' / book_id / asset
        assert file.is_file(), f'Missing image: {file}'
        with Image.open(file) as image:
            assert image.format == 'WEBP', f'{file}: not WebP'
            assert image.size == (1216, 832), f'{file}: incorrect dimensions {image.size}'
            image.load()
        size = file.stat().st_size
        assert 1000 < size <= 1024 * 1024, f'{file}: unreasonable asset size {size}'
        total_bytes += size
        total_assets += 1

schoolbus_paths = active_paths("schoolbus")
assert schoolbus_paths and all(path.endswith("_v2.webp") for path in schoolbus_paths), (
    "schoolbus must retain its existing _v2.webp contract"
)

scope = 'FULL LIBRARY' if not args.books else 'SUBSET ' + ', '.join(selected)
print(f'{scope} R2 ASSET QA PASS: {total_assets} images, {total_bytes:,} bytes')
