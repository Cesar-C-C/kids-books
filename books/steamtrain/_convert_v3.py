#!/usr/bin/env python3
"""
Rename generated PNGs to fixed names, then compress to WebP q90 with _v3 suffix
(busts jsDelivr CDN cache). Saves to assets/_v3/ first, then we move into assets/.
"""
import os
from pathlib import Path
from PIL import Image

SRC = Path("_newimg3")
DST = Path("assets")

# (source-filename-keyword, target fixed name without extension)
mapping = [
    ("Page_03_firebox_cutaway_illust_2026-08-04T14-19-16", "03_firebox"),    # no-text version
    ("Page_04_boiler_cutaway_illustr_2026-08-04T14-18-11", "04_boiler"),
    ("Page_05_steam_dome_close_up_cu_2026-08-04T14-18-11", "05_steamdome"),
    ("Page_06_piston_and_cylinder_cu_2026-08-04T14-20-08", "06_piston"),
    ("Page_07_connecting_rod_mechani_2026-08-04T14-20-07", "07_rod"),
    ("Page_08_driving_wheel_on_rail__2026-08-04T14-20-07", "08_wheels"),
    ("Page_09_whistle_close_up_scene_2026-08-04T14-22-07", "09_whistle"),   # whistle-prominent version
    ("Page_10_chimney_front_scene_il_2026-08-04T14-21-20", "10_chimney"),
    ("Page_11_tender_cutaway_illustr_2026-08-04T14-21-20", "11_tender"),
    ("Page_12_journey_scene_illustra_2026-08-04T14-24-28", "12_journey"),
    ("Page_13_vocabulary_recap_poste_2026-08-04T14-24-56", "13_vocab"),
]

DST.mkdir(exist_ok=True)
total_in = total_out = 0
for src_key, target in mapping:
    src = next(SRC.glob(src_key + ".png"), None)
    if not src:
        print(f"MISSING: {src_key}")
        continue
    img = Image.open(src).convert("RGB")
    if (img.size[0], img.size[1]) != (1216, 832):
        print(f"WARNING: {target} size = {img.size}")
    dst_path = DST / f"{target}_v3.webp"
    img.save(dst_path, "WEBP", quality=90, method=6)
    total_in += os.path.getsize(src)
    total_out += os.path.getsize(dst_path)
    print(f"{target}: {img.size} -> {dst_path.name}  ({os.path.getsize(dst_path)//1024}KB)")

print(f"\nSummary: {total_in//1024}KB PNG -> {total_out//1024}KB WebP  ({(1-total_out/total_in)*100:.1f}% reduction)")