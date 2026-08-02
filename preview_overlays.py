"""Render overlay preview: draw hotspot dots on top of each base image
   so the user can visually verify hotspots land on the right elements.

   Mapping: image 1216x832, overlay viewBox 1000x667 (preserveAspectRatio=none).
   In render: actual pixel = (ovx/1000)*W, (ovy/667)*H.
"""
import os, re, glob
from PIL import Image, ImageDraw

ROOT = "C:/Users/Administrator/WorkBuddy/cesar_agent_fold/kids-books"
OUT = os.path.join(ROOT, "preview_overlays")
os.makedirs(OUT, exist_ok=True)

def parse_overlays(path):
    """Extract overlay blocks. Each block has key + list of {px,py,ovx,ovy,name,nameZh}.
    Supports both:
      - `key(){ partSVG({px:..,...}) ... }` (penguin/station style)
      - `key(){ const parts=[{...},{...}]; return svgWrap(parts.map(partSVG).join('')); }` (bigbang/star style)
    """
    with open(path, 'r', encoding='utf-8') as f:
        src = f.read()
    blocks = []
    for m in re.finditer(r"\b(\w+)\s*\(\s*\)\s*\{", src):
        key = m.group(1)
        if key in ('svgWrap', 'partSVG', 'arrowSVG', 'capSVG', 'parts', 'Object'):
            continue
        start = m.end()
        depth = 1
        i = start
        while i < len(src) and depth > 0:
            if src[i] == '{':
                depth += 1
            elif src[i] == '}':
                depth -= 1
            i += 1
        body = src[start:i-1]
        parts = []
        # Match every {...} object literal that contains px:N
        for pm in re.finditer(r"\{([^{}]+)\}", body):
            inner = pm.group(1)
            if 'px' not in inner:
                continue
            def get(k):
                mm = re.search(rf"{k}\s*:\s*['\"]?([^,'\"}}]+)", inner)
                return mm.group(1).strip() if mm else None
            try:
                px = int(get('px'))
                py = int(get('py'))
            except (TypeError, ValueError):
                continue
            parts.append({
                'px': px,
                'py': py,
                # convert to overlay (viewBox) coords
                'ovx': 12.6 + px/1216*974.8,
                'ovy': py/832*667,
                'name': get('name'),
                'nameZh': get('nameZh'),
                'lx': int(get('lx') or 0),
                'ly': int(get('ly') or 0),
            })
        blocks.append({'key': key, 'parts': parts})
    return blocks

def render_book(book, asset_map, out_dir):
    overlays = parse_overlays(os.path.join(ROOT, 'books', book, 'overlays.js'))
    by_key = {b['key']: b for b in overlays}
    total = 0
    for key, img_name in asset_map.items():
        img_path = os.path.join(ROOT, 'books', book, 'assets', img_name)
        if not os.path.exists(img_path):
            print(f"  MISSING: {img_path}")
            continue
        img = Image.open(img_path).convert('RGB')
        W, H = img.size
        draw = ImageDraw.Draw(img)
        block = by_key.get(key)
        if not block:
            print(f"  NO overlay key '{key}' for {img_name}")
            continue
        for p in block['parts']:
            rx = int(p['ovx'] / 1000 * W)
            ry = int(p['ovy'] / 667 * H)
            R = 24
            draw.ellipse([rx-R, ry-R, rx+R, ry+R], outline=(255,0,0), width=6)
            for ax, ay in [(rx-R-15, ry), (rx+R+15, ry), (rx, ry-R-15), (rx, ry+R+15)]:
                pass
            draw.line([rx-R-15, ry, rx-R-3, ry], fill=(255,0,0), width=4)
            draw.line([rx+R+3, ry, rx+R+15, ry], fill=(255,0,0), width=4)
            draw.line([rx, ry-R-15, rx, ry-R-3], fill=(255,0,0), width=4)
            draw.line([rx, ry+R+3, rx, ry+R+15], fill=(255,0,0), width=4)
            label = f"{p['name']}/{p['nameZh']} at px({p['px']},{p['py']})"
            draw.text((rx+30, ry-30), label, fill=(255,255,0), stroke_width=2, stroke_fill=(0,0,0))
            total += 1
        out = os.path.join(out_dir, f"{book}_{key}_{img_name}")
        img.save(out)
        print(f"  {out}  ({len(block['parts'])} hotspot)")
    print(f"  total: {total} hotspots")

# bigbang
print("=== bigbang ===")
BIGBANG_MAP = {
    'singularity': '01_singularity.png',
    'bigbang': '03_bang.png',
    'expanding': '02_expand.png',
    'light': '04_light.png',
    'particles': '05_particles.png',
    'star': '06_star.png',
    'galaxy': '07_galaxy.png',
    'solar': '08_solar.png',
    'universe': '09_universe.png',
}
render_book('bigbang', BIGBANG_MAP, OUT)
