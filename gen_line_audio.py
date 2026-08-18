#!/usr/bin/env python3
# gen_line_audio.py — generate per-hotspot "line" MP3s for bubble-mode books.
#
# Reads each book's books/<book>/overlays.js, finds every partSVG({...}) that
# carries a `lineKey`, and produces two MP3s per hotspot:
#     books/<book>/audio/line_<lineKey>_en.mp3   (text = line)
#     books/<book>/audio/line_<lineKey>_zh.mp3   (text = lineZh)
# reader.js plays these (name mp3 then line mp3) when a bubble hotspot is tapped.
#
# Usage:  python gen_line_audio.py [book ...]   (default: all 11 books)
#         add --force to regenerate existing files.
import asyncio, json, os, re, sys
import edge_tts

ROOT = os.path.dirname(os.path.abspath(__file__))
ALL_BOOKS = ['ocean','airplane','bigbang','seed','rocket','penguin','hsr',
             'station','capsule','steamtrain','bus']
AUDIO_DIR = 'audio'          # matches BOOK.audioDir
VOICE_EN = "en-US-AriaNeural"
VOICE_ZH = "zh-CN-XiaoxiaoNeural"

def extract_parts(src):
    # Match flat object literals (no nested braces) that carry a lineKey.
    # Handles both inline `partSVG({...})` and array-style `parts=[{...}]`.
    out = []
    for m in re.finditer(r'\{[^{}]*\}', src):
        body = m.group(0)
        if 'lineKey' not in body:
            continue
        def g(k):
            mm = re.search(rf"{k}\s*:\s*['\"]([^'\"]*)['\"]", body)
            return mm.group(1) if mm else None
        lk = g('lineKey')
        if not lk:
            continue
        out.append((lk, g('line') or '', g('lineZh') or ''))
    return out

async def synth(entries):
    force = '--force' in sys.argv
    for e in entries:
        out_file, text, lang = e['out'], e['text'], e['lang']
        if os.path.exists(out_file) and os.path.getsize(out_file) > 0 and not force:
            print(f"SKIP {os.path.relpath(out_file, ROOT)}")
            continue
        voice = VOICE_ZH if lang == 'zh' else VOICE_EN
        last = None
        for attempt in range(3):
            try:
                await edge_tts.Communicate(text, voice).save(out_file)
                print(f"OK   {os.path.relpath(out_file, ROOT)}")
                break
            except Exception as ex:
                last = ex
                await asyncio.sleep(1.5 * (attempt + 1))
        else:
            print(f"FAIL {os.path.relpath(out_file, ROOT)}: {last}")

async def main():
    books = [a for a in sys.argv[1:] if not a.startswith('--')] or ALL_BOOKS
    entries = []
    for b in books:
        ov = os.path.join(ROOT, 'books', b, 'overlays.js')
        if not os.path.exists(ov):
            print(f"-- skip {b}: no overlays.js")
            continue
        parts = extract_parts(open(ov, encoding='utf-8').read())
        out_dir = os.path.join(ROOT, 'books', b, AUDIO_DIR)
        os.makedirs(out_dir, exist_ok=True)
        for lk, line, lineZh in parts:
            entries.append({'out': os.path.join(out_dir, f'line_{lk}_en.mp3'), 'text': line, 'lang': 'en'})
            entries.append({'out': os.path.join(out_dir, f'line_{lk}_zh.mp3'), 'text': lineZh, 'lang': 'zh'})
        print(f"-- {b}: {len(parts)} hotspots -> {len(parts)*2} line mp3s")
    print(f"TOTAL line mp3s: {len(entries)}")
    await synth(entries)

if __name__ == '__main__':
    asyncio.run(main())
