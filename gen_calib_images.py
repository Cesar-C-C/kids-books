#!/usr/bin/env python3
# gen_calib_images.py — draw numbered red crosshairs on each page image at the
# hotspot px/py coordinates, so GLM vision can judge whether each mark sits on
# the correct part. Reads calib/hotspots.json (from dump_hotspots.js).
# Output: calib/<book>/<ov>.png
import json, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
IMG_W, IMG_H = 1216, 832

def font(size):
    for p in ['C:/Windows/Fonts/msyh.ttc', 'C:/Windows/Fonts/arial.ttf',
              'C:/Windows/Fonts/segoeui.ttf']:
        if os.path.exists(p):
            try: return ImageFont.truetype(p, size)
            except Exception: pass
    return ImageFont.load_default()

def main():
    data = json.load(open(os.path.join(ROOT, 'calib', 'hotspots.json'), encoding='utf-8'))
    done = 0
    for book, info in data.items():
        for pg in info['pages']:
            impath = os.path.join(ROOT, 'books', book, pg['img'])
            if not os.path.exists(impath):
                print(f"-- skip {book}/{pg['ov']}: img missing {pg['img']}")
                continue
            im = Image.open(impath).convert('RGB')
            w, h = im.size
            sx, sy = w / IMG_W, h / IMG_H
            d = ImageDraw.Draw(im)
            f = font(max(18, int(h*0.028)))
            for s in pg['spots']:
                x, y = int(s['px']*sx), int(s['py']*sy)
                # red crosshair
                d.line([(x-22,y),(x+22,y)], fill=(230,40,60), width=4)
                d.line([(x,y-22),(x,y+22)], fill=(230,40,60), width=4)
                d.ellipse([x-24,y-24,x+24,y+24], outline=(230,40,60), width=3)
                # number badge
                label = str(s['n'])
                tw = d.textlength(label, font=f)
                d.rectangle([x+14,y-30,x+14+tw+8,y-30+int(h*0.032)], fill=(230,40,60))
                d.text((x+18,y-30), label, fill=(255,255,255), font=f)
            outdir = os.path.join(ROOT, 'calib', book)
            os.makedirs(outdir, exist_ok=True)
            out = os.path.join(outdir, f"{pg['ov']}.png")
            im.save(out)
            done += 1
    print(f"generated {done} calibration images under calib/<book>/")

if __name__ == '__main__':
    main()
