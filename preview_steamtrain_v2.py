"""Hotspot preview for steamtrain v2 images (reads .webp directly)."""
import os, re
from PIL import Image, ImageDraw

ROOT = "C:/Users/Administrator/WorkBuddy/cesar_agent_fold/kids-books"
OUT = os.path.join(ROOT, "preview_overlays")
os.makedirs(OUT, exist_ok=True)

def parse_overlays(path):
    with open(path, 'r', encoding='utf-8') as f:
        src = f.read()
    blocks = []
    for m in re.finditer(r"\b(\w+)\s*(?::\s*\(\s*\)\s*=>|\(\s*\)\s*\{)", src):
        key = m.group(1)
        if key in ('svgWrap', 'partSVG', 'arrowSVG', 'capSVG'):
            continue
        if '=>' in m.group(0):
            arrow_start = src.find('=>', m.start())
            call_match = re.search(r"svgWrap\s*\(", src[arrow_start:])
            abs_start = arrow_start + call_match.end()
            depth, i = 1, abs_start
            while i < len(src) and depth > 0:
                if src[i] == '(': depth += 1
                elif src[i] == ')': depth -= 1
                i += 1
            body = src[abs_start:i-1]
        else:
            start, depth, i = m.end(), 1, m.end()
            while i < len(src) and depth > 0:
                if src[i] == '{': depth += 1
                elif src[i] == '}': depth -= 1
                i += 1
            body = src[start:i-1]
        parts = []
        for pm in re.finditer(r"\{([^{}]+)\}", body):
            inner = pm.group(1)
            if 'px' not in inner: continue
            def get(k):
                mm = re.search(rf"{k}\s*:\s*['\"]?([^,'\"}}]+)", inner)
                return mm.group(1).strip() if mm else None
            try:
                px = int(get('px')); py = int(get('py'))
            except (TypeError, ValueError):
                continue
            parts.append({'px': px, 'py': py, 'name': get('name'), 'nameZh': get('nameZh')})
        blocks.append({'key': key, 'parts': parts})
    return blocks

def map_keys(book):
    bookpath = os.path.join(ROOT, 'books', book, 'book.js')
    with open(bookpath, 'r', encoding='utf-8') as f: src = f.read()
    out, depth, in_page, cur = {}, 0, False, []
    for i, ch in enumerate(src):
        if ch == '[' and depth == 0: depth = 1; continue
        if ch == ']' and depth == 1: depth = 0; continue
        if depth == 0: continue
        if ch == '{':
            if depth == 1: cur = ['{']; in_page = True; depth = 2; continue
            depth += 1
            if in_page: cur.append(ch)
        elif ch == '}':
            depth -= 1
            if in_page: cur.append(ch)
            if depth == 1 and in_page:
                entry = ''.join(cur); cur = []; in_page = False; depth = 1
                img_m = re.search(r"img\s*:\s*['\"]([^'\"]+)['\"]", entry)
                ov_m = re.search(r"ov\s*:\s*['\"]([^'\"]+)['\"]", entry)
                if img_m and ov_m:
                    img = img_m.group(1).replace('assets/', '')
                    key = ov_m.group(1)
                    if key not in out: out[key] = img
        elif in_page: cur.append(ch)
    return out

BOOK = 'steamtrain'
overlays = parse_overlays(os.path.join(ROOT, 'books', BOOK, 'overlays.js'))
by_key = {b['key']: b for b in overlays}
key_map = map_keys(BOOK)
for key, img_name in key_map.items():
    img_path = os.path.join(ROOT, 'books', BOOK, 'assets', img_name)
    if not os.path.exists(img_path):
        print(f"  MISSING: {img_path}"); continue
    img = Image.open(img_path).convert('RGB')
    draw = ImageDraw.Draw(img)
    block = by_key.get(key)
    if not block: print(f"  NO overlay key '{key}'"); continue
    for p in block['parts']:
        rx, ry, R = int(p['px']), int(p['py']), 24
        draw.ellipse([rx-R, ry-R, rx+R, ry+R], outline=(255,0,0), width=6)
        for x1,y1,x2,y2 in [(rx-R-15,ry,rx-R-3,ry),(rx+R+3,ry,rx+R+15,ry),(rx,ry-R-15,rx,ry-R-3),(rx,ry+R+3,rx,ry+R+15)]:
            draw.line([x1,y1,x2,y2], fill=(255,0,0), width=4)
        draw.text((rx+30, ry-30), f"{p['name']}", fill=(255,255,0), stroke_width=2, stroke_fill=(0,0,0))
    out = os.path.join(OUT, f"{BOOK}_v2_{key}_{img_name}")
    img.save(out)
    print(f"  {out}  ({len(block['parts'])} hotspots)")
