"""
Convert regenerated steamtrain PNGs -> WebP q90 with _v2 suffix, then drop old webps.
Mapping was identified by visual inspection of each surviving / new PNG.
"""
import os
from PIL import Image

BASE = r"C:\Users\Administrator\WorkBuddy\cesar_agent_fold\kids-books\books\steamtrain"
NEWIMG = os.path.join(BASE, "_newimg")
ASSETS = os.path.join(BASE, "assets")

# src PNG (in _newimg) -> dst _v2.webp (in assets)
mapping = {
    "Cheerful_children_s_picture_bo_2026-08-03T15-33-43.png": "01_cover_v2.webp",
    "Page_02_parts_overview_illustr_2026-08-03T15-37-13.png": "02_overview_v2.webp",
    "Cheerful_children_s_picture_bo_2026-08-03T15-35-04.png": "03_firebox_v2.webp",
    "Cheerful_children_s_picture_bo_2026-08-03T15-35-01.png": "04_boiler_v2.webp",
    "Page_05_steam_dome_focal_illus_2026-08-03T15-37-14.png": "05_steamdome_v2.webp",
    "Cheerful_children_s_picture_bo_2026-08-03T15-34-54.png": "10_chimney_v2.webp",
    "Cheerful_children_s_picture_bo_2026-08-03T15-35-05.png": "11_tender_v2.webp",
    "Page_12_journey_illustration___2026-08-03T15-37-13.png": "12_journey_v2.webp",
    "Page_13_vocabulary_recap_illus_2026-08-03T15-37-13.png": "13_vocab_v2.webp",
}

# old webp files to replace (pages that got regenerated)
old_files = [
    "01_cover.webp", "02_overview.webp", "03_firebox.webp", "04_boiler.webp",
    "05_steamdome.webp", "10_chimney.webp", "11_tender.webp", "12_journey.webp", "13_vocab.webp",
]

total = 0
for src_name, dst_name in mapping.items():
    src = os.path.join(NEWIMG, src_name)
    dst = os.path.join(ASSETS, dst_name)
    if not os.path.exists(src):
        print(f"MISSING source: {src_name}")
        continue
    img = Image.open(src).convert("RGB")
    img.save(dst, "WEBP", quality=90, method=6)
    sz = os.path.getsize(dst)
    total += sz
    print(f"  {src_name}  ->  {dst_name}  ({sz} bytes)")

for f in old_files:
    p = os.path.join(ASSETS, f)
    if os.path.exists(p):
        os.remove(p)
        print(f"  removed old {f}")

print(f"\nTotal new webp bytes: {total}")
print(f"Assets now contains:")
for fn in sorted(os.listdir(ASSETS)):
    print(f"  {fn}  ({os.path.getsize(os.path.join(ASSETS, fn))} bytes)")
