#!/usr/bin/env python3
"""Regression check for cache-busted, compressed school-bus illustration assets."""
from pathlib import Path
import re
from PIL import Image

ROOT = Path(__file__).resolve().parent
BOOK = ROOT / "books" / "schoolbus" / "book.js"
ASSETS = ROOT / "books" / "schoolbus" / "assets"

refs = re.findall(r"assets/([0-9]{2}_[a-z]+_c_v2\.webp)", BOOK.read_text(encoding="utf-8"))
expected = [
    "00_cover_c_v2.webp", "01_parts_c_v2.webp", "02_driver_c_v2.webp",
    "03_inside_c_v2.webp", "04_wheels_c_v2.webp", "05_stopsign_c_v2.webp",
    "06_doors_c_v2.webp", "07_aide_c_v2.webp", "08_road_c_v2.webp",
    "09_arrive_c_v2.webp", "10_vocab_c_v2.webp",
]

assert sorted(set(refs)) == expected, "book.js must reference all cache-busted WebP v2 assets"
assert ".png" not in BOOK.read_text(encoding="utf-8"), "book.js must not ship uncompressed PNG illustrations"

total = 0
for name in expected:
    path = ASSETS / name
    assert path.is_file(), f"missing compressed asset: {path}"
    with Image.open(path) as image:
        assert image.format == "WEBP", f"not WebP: {path}"
        assert image.size == (1216, 832), f"wrong dimensions: {path}: {image.size}"
    total += path.stat().st_size

assert total < 2_500_000, f"compressed WebP set is too large: {total} bytes"
print(f"SCHOOLBUS CDN ASSET QA PASS: {len(expected)} WebP v2 files, {total} bytes")
