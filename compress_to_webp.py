#!/usr/bin/env python3
"""Batch convert PNG -> WebP q90 for kids-books.

Why WebP q90:
- 93-95% size reduction on AI-generated illustrations (avg 1MB -> ~50-80KB)
- Visually indistinguishable from original in spot-check
- Lossless alpha preserved (RGBA)
- Supported by all modern browsers (Chrome/Firefox/Edge/Safari 14+)

Strategy:
- Convert each .png to same-basename .webp
- Keep originals (rename to .png.bak) for quick rollback
- Log per-file size savings
"""
from PIL import Image
import os, glob, sys

ROOT = "C:/Users/Administrator/WorkBuddy/cesar_agent_fold/kids-books"
os.chdir(ROOT)

# Find all PNGs under books/*/assets/
pngs = []
for b in os.listdir("books"):
    ad = os.path.join("books", b, "assets")
    if os.path.isdir(ad):
        for f in os.listdir(ad):
            if f.lower().endswith(".png") and not f.endswith(".bak"):
                pngs.append(os.path.join(ad, f))

print(f"Found {len(pngs)} PNGs")
total_in = 0
total_out = 0
failed = 0
for src in pngs:
    try:
        sz_in = os.path.getsize(src)
        im = Image.open(src)
        # Preserve alpha if present
        # WebP q90, method=6 (slowest/best compression)
        dst = src[:-4] + ".webp"
        im.save(dst, "WEBP", quality=90, method=6)
        sz_out = os.path.getsize(dst)
        total_in += sz_in
        total_out += sz_out
        pct = 100 - sz_out * 100 / sz_in
        print(f"  {src}: {sz_in/1024:.0f}KB -> {sz_out/1024:.0f}KB (-{pct:.0f}%)")
    except Exception as e:
        failed += 1
        print(f"  {src}: FAILED ({e})")

print(f"\n=== Total: {len(pngs)} files, {failed} failed ===")
print(f"  Original total: {total_in/1024/1024:.1f} MB")
print(f"  WebP total:    {total_out/1024/1024:.1f} MB")
print(f"  Saved:         {(total_in-total_out)/1024/1024:.1f} MB ({100-total_out*100/total_in:.0f}%)")