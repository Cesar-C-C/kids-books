"""Encode generated cloud illustrations as web assets; preserve all PNG masters."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'books' / 'cloud' / 'assets'
for source in sorted(root.glob('*.png')):
    target = source.with_suffix('.webp')
    with Image.open(source) as image:
        image.convert('RGB').save(target, 'WEBP', quality=90, method=6)
    with Image.open(target) as result:
        result.verify()
    print(f'{target.name}: {target.stat().st_size:,} bytes')
with Image.open(root / '00-cover.webp') as image:
    image.thumbnail((480, 480), Image.Resampling.LANCZOS)
    image.save(root / '00-cover_card480.webp', 'WEBP', quality=78, method=6)
