#!/usr/bin/env python3
"""
Generate preview diagnostics for steamtrain book v3:
For each overlay function in overlays.js, draw red crosshairs on the
corresponding assets/*_v3.webp image at the px,py of every partSVG
and arrowSVG call. Reads the actual JS source for coords.

This script does NOT depend on Node or any JS evaluator. It parses
overlays.js with regex to extract partSVG/arrowSVG calls.
"""
import re
import os
from pathlib import Path
from PIL import Image, ImageDraw

ASSETS = Path("assets")
OUT = Path("../preview_overlays")
OUT.mkdir(exist_ok=True)

JS_FILE = Path("overlays.js")

# overlay-func -> image file (relative to assets/)
FUNC2IMG = {
    "st_parts":    "02_overview_v2.webp",
    "st_firebox":  "03_firebox_v3.webp",
    "st_boiler":   "04_boiler_v3.webp",
    "st_steamdome":"05_steamdome_v3.webp",
    "st_piston":   "06_piston_v3.webp",
    "st_rod":      "07_rod_v3.webp",
    "st_wheels":   "08_wheels_v3.webp",
    "st_whistle":  "09_whistle_v3.webp",
    "st_chimney":  "10_chimney_v3.webp",
    "st_tender":   "11_tender_v3.webp",
    "st_journey":  "12_journey_v3.webp",
    "st_vocab":    "13_vocab_v3.webp",
}

# Read overlays.js
src = JS_FILE.read_text(encoding='utf-8')

# Per-function body extract (greedy from "func(){" to matching closing "}")
def get_func_body(name, text):
    m = re.search(rf'\b{re.escape(name)}\s*\(\s*\)\s*\{{', text)
    if not m:
        return None
    start = m.end()
    depth = 1
    i = start
    while i < len(text) and depth > 0:
        c = text[i]
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
        i += 1
    return text[start:i-1] if depth == 0 else None

# Parse partSVG({px:..., py:..., ...}) and arrowSVG({x1:..., y1:..., ...}) calls
PARTS = []
ARROWS = []
def parse_func(name, body):
    """Extract parts and arrows. Each part: (px,py,lx,ly,name,anc). Each arrow: (x1,y1,x2,y2,col,name,anc)."""
    parts = []
    arrows = []
    # partSVG calls
    for m in re.finditer(r'partSVG\(\s*\{([^}]+)\}', body):
        d = m.group(1)
        def grab(key):
            mm = re.search(rf'{key}\s*:\s*([\'"]?)([^,\'\"]+)\1', d)
            if not mm: return None
            return mm.group(2)
        px = int(grab('px') or 0); py = int(grab('py') or 0)
        lx = int(grab('lx') or 0); ly = int(grab('ly') or 0)
        nm = grab('name') or ''
        parts.append((px,py,lx,ly,nm))
    # arrowSVG calls
    for m in re.finditer(r'arrowSVG\(\s*\{([^}]+)\}', body):
        d = m.group(1)
        def grab(key):
            mm = re.search(rf'{key}\s*:\s*([\'"]?)([^,\'\"]+)\1', d)
            if not mm: return None
            return mm.group(2)
        x1 = int(grab('x1') or 0); y1 = int(grab('y1') or 0)
        x2 = int(grab('x2') or 0); y2 = int(grab('y2') or 0)
        nm = grab('name') or ''
        col = grab('col') or '#ef476f'
        arrows.append((x1,y1,x2,y2,nm,col))
    return parts, arrows

RED = (255, 0, 0)
GREEN = (0, 200, 0)
BLUE = (0, 100, 255)

for func, img_name in FUNC2IMG.items():
    body = get_func_body(func, src)
    if body is None:
        print(f"SKIP {func}: not found in overlays.js")
        continue
    parts, arrows = parse_func(func, body)
    img_path = ASSETS / img_name
    if not img_path.exists():
        print(f"MISSING IMG for {func}: {img_path}")
        continue
    base = Image.open(img_path).convert("RGB")
    draw = ImageDraw.Draw(base)
    # draw arrows first (so crosshairs overlay)
    for x1,y1,x2,y2,nm,col in arrows:
        color = BLUE if 'grn' in (col or '') else RED
        draw.line([(x1,y1),(x2,y2)], fill=color, width=4)
        draw.ellipse([x1-8,y1-8,x1+8,y1+8], outline=color, width=3)
    # draw parts (red crosshair)
    for px,py,lx,ly,nm in parts:
        # crosshair
        draw.line([(px-22,py),(px+22,py)], fill=RED, width=4)
        draw.line([(px,py-22),(px,py+22)], fill=RED, width=4)
        # partSVG invisible hot area
        draw.ellipse([px-40,py-40,px+40,py+40], outline=(255,200,200), width=2)
        # leader line to label
        draw.line([(px,py),(lx,ly)], fill=(100,100,100), width=2)
        # label tag at lx,ly
        draw.text((lx,ly-12), nm, fill=(50,50,50))
    out = OUT / f"steamtrain_v3_{func}_{Path(img_name).stem}.webp"
    base.save(out, "WEBP", quality=80)
    print(f"{func}: {len(parts)} parts, {len(arrows)} arrows  ->  {out.name}")