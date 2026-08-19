"""Render overlay preview for all 8 books.
   Uses the same conversion formula as shared/overlays.js partSVG().
   Output: preview_overlays/<book>_<key>_<img>.png with red dots + labels.
"""
import os, re
from PIL import Image, ImageDraw

ROOT = "C:/Users/Administrator/WorkBuddy/cesar_agent_fold/kids-books"
OUT = os.path.join(ROOT, "preview_overlays")
os.makedirs(OUT, exist_ok=True)

IMG_W, IMG_H = 1216, 832
VB_W, VB_H = 1000, 667
LEFT_MARGIN = 12.6
VISIBLE_W = 974.8

def parse_overlays(path):
    with open(path, 'r', encoding='utf-8') as f:
        src = f.read()
    blocks = []
    # Match both styles: key: () => svgWrap(...) or key(){...}
    for m in re.finditer(r"\b(\w+)\s*(?::\s*\(\s*\)\s*=>|\(\s*\)\s*\{)", src):
        key = m.group(1)
        if key in ('svgWrap', 'partSVG', 'arrowSVG', 'capSVG', 'parts', 'Object'):
            continue
        # Find the matching closing brace or paren of the arrow function
        if '=>' in m.group(0):
            # arrow function: key: () => svgWrap(...)
            # Find the body inside svgWrap(...)
            arrow_start = src.find('=>', m.start())
            # Find the call: svgWrap(...)
            call_match = re.search(r"svgWrap\s*\(", src[arrow_start:])
            if not call_match:
                continue
            abs_start = arrow_start + call_match.end()
            # find matching ) for svgWrap()
            depth = 1
            i = abs_start
            while i < len(src) and depth > 0:
                if src[i] == '(':
                    depth += 1
                elif src[i] == ')':
                    depth -= 1
                i += 1
            body = src[abs_start:i-1]
        else:
            # regular function: key(){...}
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
                'px': px, 'py': py,
                'name': get('name'), 'nameZh': get('nameZh'),
            })
        blocks.append({'key': key, 'parts': parts})
    return blocks

# Extract overlay key → image filename from each book's book.js
def map_keys(book):
    bookpath = os.path.join(ROOT, 'books', book, 'book.js')
    with open(bookpath, 'r', encoding='utf-8') as f:
        src = f.read()
    out = {}
    # Find each page object — a top-level {...} inside window.PAGES = [ ... ]
    # Split by tracking brace depth, but skip the outer array [] wrapper
    depth = 0
    in_page = False
    cur = []
    for i, ch in enumerate(src):
        if ch == '[' and depth == 0:
            depth = 1
            continue
        if ch == ']' and depth == 1:
            depth = 0
            continue
        if depth == 0:
            continue
        if ch == '{':
            if depth == 1:
                # start of page object
                cur = ['{']
                in_page = True
                depth = 2
                continue
            else:
                depth += 1
                if in_page:
                    cur.append(ch)
        elif ch == '}':
            depth -= 1
            if in_page:
                cur.append(ch)
            if depth == 1 and in_page:
                # end of page object
                entry = ''.join(cur)
                cur = []
                in_page = False
                depth = 1
                img_m = re.search(r"img\s*:\s*['\"]([^'\"]+)['\"]", entry)
                ov_m = re.search(r"ov\s*:\s*['\"]([^'\"]+)['\"]", entry)
                if img_m and ov_m:
                    img = img_m.group(1).replace('assets/', '')
                    key = ov_m.group(1)
                    if key not in out:
                        out[key] = img
        elif in_page:
            cur.append(ch)
    return out

BOOKS = ['ocean', 'airplane', 'bigbang', 'seed', 'rocket', 'penguin', 'hsr', 'station', 'capsule', 'steamtrain', 'bus', 'schoolbus']

def render_book(book):
    overlays = parse_overlays(os.path.join(ROOT, 'books', book, 'overlays.js'))
    by_key = {b['key']: b for b in overlays}
    key_map = map_keys(book)
    total = 0
    for key, img_name in key_map.items():
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
            rx = int(p['px'])
            ry = int(p['py'])
            R = 24
            # outer crosshair
            draw.ellipse([rx-R, ry-R, rx+R, ry+R], outline=(255,0,0), width=6)
            draw.line([rx-R-15, ry, rx-R-3, ry], fill=(255,0,0), width=4)
            draw.line([rx+R+3, ry, rx+R+15, ry], fill=(255,0,0), width=4)
            draw.line([rx, ry-R-15, rx, ry-R-3], fill=(255,0,0), width=4)
            draw.line([rx, ry+R+3, rx, ry+R+15], fill=(255,0,0), width=4)
            label = f"{p['name']}/{p['nameZh']} at px({p['px']},{p['py']})"
            draw.text((rx+30, ry-30), label, fill=(255,255,0), stroke_width=2, stroke_fill=(0,0,0))
            total += 1
        out = os.path.join(OUT, f"{book}_{key}_{img_name}")
        img.save(out)
        print(f"  {out}  ({len(block['parts'])} hotspots)")
    print(f"  === {book} total: {total} hotspots\n")

for book in BOOKS:
    print(f"=== {book} ===")
    render_book(book)
print("All previews saved to:", OUT)
