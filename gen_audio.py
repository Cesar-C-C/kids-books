import asyncio, json, os, sys
import edge_tts

# ---------------------------------------------------------------------------
# SSML pass-through for onomatopoeia / tricky pronunciation.
# This edge_tts build has no public `ssml` argument and always wraps `text`
# in <speak> + escapes < > & on input. To let a manifest entry supply raw SSML
# (e.g. an IPA <phoneme>), we monkeypatch the module-level mkssml: when the
# synthesised text equals the SENTINEL, we return the entry's own SSML verbatim
# (it must carry the FULL voice name — see bus/_manifest.json page_06_en).
# ---------------------------------------------------------------------------
import edge_tts.communicate as _ec
_SSML_OVERRIDE = None
_SENTINEL = "__SSML_OVERRIDE__"
_mkssml_orig = _ec.mkssml
def _mkssml(tc, escaped_text):
    if _SSML_OVERRIDE is not None and isinstance(escaped_text, str) \
       and escaped_text.strip() == _SENTINEL:
        return _SSML_OVERRIDE
    return _mkssml_orig(tc, escaped_text)
_ec.mkssml = _mkssml

# Full service voice names (edge_tts short names are expanded internally, but
# raw SSML must use the long form or the request is rejected).
VOICE_EN_FULL = "Microsoft Server Speech Text to Speech Voice (en-US, AriaNeural)"
VOICE_ZH_FULL = "Microsoft Server Speech Text to Speech Voice (zh-CN, XiaoxiaoNeural)"

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
        lang = e['lang']
        voice = voice_zh if lang == 'zh' else voice_en
        ssml = e.get('ssml')
        try:
            if ssml:
                # Raw SSML must declare the full voice name itself.
                global _SSML_OVERRIDE
                _SSML_OVERRIDE = ssml
                communicate = edge_tts.Communicate(_SENTINEL, voice)
            else:
                communicate = edge_tts.Communicate(e['text'], voice)
            await communicate.save(out_file)
            _SSML_OVERRIDE = None
            print(f"OK {e['id']}")
        except Exception as ex:
            _SSML_OVERRIDE = None
            print(f"FAIL {e['id']}: {ex}")

asyncio.run(main())
