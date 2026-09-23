"""Encode reviewed generated originals as book WebP assets, without semantic edits."""
import argparse
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('book', choices=['sound', 'soap'])
parser.add_argument('name')
parser.add_argument('source', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
target = root / 'books' / args.book / 'images' / (args.name + '.webp')
target.parent.mkdir(parents=True, exist_ok=True)
with Image.open(args.source) as im:
    mode = 'RGBA' if 'A' in im.getbands() or 'transparency' in im.info else 'RGB'
    im.convert(mode).save(target, 'WEBP', quality=92, method=6)
    print(f'{target}: {im.size}, {target.stat().st_size} bytes')
