#!/usr/bin/env python3
"""Regression contract for the eleven-book r2 illustration migration."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
TARGET_BOOKS = (
    "airplane", "bigbang", "bus", "capsule", "hsr", "ocean",
    "penguin", "rocket", "seed", "station", "steamtrain",
)

def active_paths(book_id: str) -> set[str]:
    source = (ROOT / "books" / book_id / "book.js").read_text(encoding="utf-8")
    return set(re.findall(r"(?:img|coverImg)\s*:\s*['\"](assets/[^'\"]+)['\"]", source))

for book_id in TARGET_BOOKS:
    paths = active_paths(book_id)
    assert paths, f"{book_id}: no active image paths found"
    assert all(path.endswith("_r2.webp") for path in paths), (
        f"{book_id}: active images must use cache-busted _r2.webp paths: {sorted(paths)}"
    )

schoolbus_paths = active_paths("schoolbus")
assert schoolbus_paths and all(path.endswith("_v2.webp") for path in schoolbus_paths), (
    "schoolbus must retain its existing _v2.webp contract"
)

print("LIBRARY R2 PATH QA PASS")
