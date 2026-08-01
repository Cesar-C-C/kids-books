import asyncio, json, os, sys
import edge_tts

async def main():
    args = sys.argv[1:]
    force = '--force' in args
    manifest_path = next((a for a in args if not a.startswith('--')), '_manifest.json')
    data = json.load(open(manifest_path, encoding='utf-8'))
    entries = data['entries']
    audio_dir_name = data.get('audioDir', 'audio')
    out_dir = os.path.join(os.path.dirname(os.path.abspath(manifest_path)), audio_dir_name)
    os.makedirs(out_dir, exist_ok=True)

    voice_en = "en-US-AriaNeural"
    voice_zh = "zh-CN-XiaoxiaoNeural"

    for e in entries:
        out_file = os.path.join(out_dir, e['id'] + '.mp3')
        if os.path.exists(out_file) and not force:
            print(f"SKIP {e['id']}")
            continue
        text = e['text']
        lang = e['lang']
        voice = voice_zh if lang == 'zh' else voice_en
        try:
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(out_file)
            print(f"OK {e['id']}")
        except Exception as ex:
            print(f"FAIL {e['id']}: {ex}")

asyncio.run(main())
