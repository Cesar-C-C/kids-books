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
    # Read the scripts actually used by this entry, without imposing a reader name.
    entry = base / 'index.html'
    if entry.is_file():
        scripts = re.findall(r'<script\b[^>]*\bsrc=[\"\x27]([^\"\x27]+)', entry.read_text(encoding='utf-8'), re.I)
        sources = []
        for script in scripts:
            target = (base / script.split('?')[0]).resolve()
            if target.is_relative_to(base.resolve()) and target.is_file():
                sources.append(target.read_text(encoding='utf-8'))
    else:
        # Preserve the minimal discovery fixture contract.
        sources = [(base / (book_id + '-experience.js')).read_text(encoding='utf-8')]
    versions = [v for source in sources for v in re.findall(r'const\s+AUDIO_VER\s*=\s*(\d+)', source)]
    if len(versions) != 1:
        raise ValueError('Expected one AUDIO_VER in entry scripts: ' + book_id)
    version = versions[0]
    image_maps = [json.loads(value) for source in sources for value in
                  re.findall(r'const\s+SCENE_IMAGES\s*=\s*(\{[^;]*?\})\s*;', source)]
    if len(image_maps) > 1:
        raise ValueError('Ambiguous scene image mapping: ' + book_id)
    overrides = image_maps[0] if image_maps else {}
    if not isinstance(overrides, dict) or not set(overrides).issubset({s['id'] for s in story['scenes']}):
        raise ValueError('Unknown scene image override: ' + book_id)
    images = {f'images/{overrides.get(s["id"], s["image"])}.webp' for s in story['scenes']}
    # Book-local interaction scripts may use images outside the frozen story.
    # Follow only scripts loaded by this entry, not unused drafts on disk. Keep
    # these literal URLs under the same existence/path checks as scene images.
    for source in sources:
        images.update(re.findall(r'''["'](images/[^"']+\.webp)["']''', source))
    images = sorted(images)
    sfx = sorted({p for source in sources for p in
                  re.findall(r'''["'](sfx/[^"']+\.wav)["']''', source)})
    for resource in sfx:
        if (not re.fullmatch(r'sfx/[\w-]+\.wav', resource)
                or not (base / resource).is_file() or (base / resource).stat().st_size == 0):
            raise ValueError('Missing/invalid interaction sound: ' + resource)
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
        'cover': f'images/{overrides.get(story["scenes"][0]["id"], story["scenes"][0]["image"])}.webp',
        'images': [prefix + p for p in images],
        'sfx': [prefix + p for p in sfx],
        'data': [prefix + p for p in ('story.json', 'audio-manifest.json')],
        'audio': [prefix + p + '?v=' + version for p in present],
        'audioExpected': len(audio),
        'audioVersion': version,
        'missingAudio': [prefix + p + '?v=' + version for p in missing],
    }
