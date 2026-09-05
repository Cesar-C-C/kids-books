"""Normalize generated source art to the site's explicitly requested WebP format."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageOps

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('target', type=Path)
parser.add_argument('--prompt', default='')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
target = args.target.resolve()
if not target.is_relative_to(root / 'books') or not target.name.endswith('_r2.webp'):
    raise SystemExit('Target must be a versioned r2 book asset')
with Image.open(args.source) as original:
    source_size = original.size
    normalized = ImageOps.fit(original.convert('RGB'), (1216, 832), Image.Resampling.LANCZOS)
    normalized.save(target, 'WEBP', quality=90, method=6)
record = dict(asset=target.relative_to(root).as_posix(), source=str(args.source),
              sourceSize=source_size, bytes=target.stat().st_size,
              sha256=hashlib.sha256(target.read_bytes()).hexdigest(), prompt=args.prompt,
              review='pending')
journal = root / 'art' / 'generation-journal.jsonl'
with journal.open('a', encoding='utf-8') as output:
    output.write(json.dumps(record, ensure_ascii=False) + '\n')
print(f"{record['asset']}: {record['bytes']} bytes, 1216x832 WebP")
