"""Resources for scene-based story.json readers (no legacy PAGES dependency)."""
import json
import re
from pathlib import Path


def discover(repo, book_id):
    base = Path(repo) / 'books' / book_id
    if not (base / 'story.json').is_file():
        return None
    story = json.loads((base / 'story.json').read_text(encoding='utf-8'))
    manifest = json.loads((base / 'audio-manifest.json').read_text(encoding='utf-8'))
    if story['bookId'] != book_id or manifest['bookId'] != book_id:
        raise ValueError('Story/manifest bookId mismatch: ' + book_id)
    expected = {}
    for kind, items in [('scene', story['scenes']), ('vocab', story['vocab'])]:
        for item in items:
            for lang in ('zh', 'en'):
                expected[f'{kind}-{item["id"]}-{lang}'] = item[lang]
    entries = manifest['entries']
    if len(entries) != len(expected) or {e['id']: e['text'] for e in entries} != expected:
        raise ValueError('Audio manifest does not cover the actual bilingual story: ' + book_id)
    source = (base / (book_id + '-experience.js')).read_text(encoding='utf-8')
    version = re.search(r'const\s+AUDIO_VER\s*=\s*(\d+)', source).group(1)
    images = sorted({f'images/{s["image"]}.webp' for s in story['scenes']})
    audio = []
    for e in entries:
        output = e['output']
        if output != 'audio/' + e['id'] + '.mp3':
            raise ValueError('Manifest output differs from runtime contract: ' + output)
        audio.append(output)
    for resource in images:
        if not re.fullmatch(r'images/[\w-]+\.webp', resource) or not (base / resource).is_file():
            raise ValueError('Missing/invalid story image: ' + resource)
    present = [p for p in audio if (base / p).is_file() and (base / p).stat().st_size > 0]
    missing = [p for p in audio if p not in present]
    prefix = f'books/{book_id}/'
    return {
        'cover': f'images/{story["scenes"][0]["image"]}.webp',
        'images': [prefix + p for p in images],
        'data': [prefix + p for p in ('story.json', 'audio-manifest.json')],
        'audio': [prefix + p + '?v=' + version for p in present],
        'audioExpected': len(audio),
        'missingAudio': [prefix + p + '?v=' + version for p in missing],
    }
