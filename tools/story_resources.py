"""Resources for scene-based story.json readers (no legacy PAGES dependency)."""
import json
import re
import hashlib
import unicodedata
from pathlib import Path


def discover(repo, book_id):
    base = Path(repo) / 'books' / book_id
    if not (base / 'story.json').is_file():
        return None
    if book_id == 'earthquake':
        return discover_earthquake(base)
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


def discover_earthquake(base):
    """Inventory the typed candidate without mistaking unrecorded audio for a download."""
    raw = (base / 'story.json').read_text(encoding='utf-8')
    story = json.loads(raw)
    if story.get('bookId') != 'earthquake':
        raise ValueError('Story bookId mismatch: earthquake')
    version = story.get('scriptVersion')
    if not isinstance(version, str) or not re.fullmatch(r'[\w-]+', version):
        raise ValueError('Invalid earthquake scriptVersion')

    expected = {}
    non_narrated = []
    seen = set()
    for group in ('scenes', 'vocab', 'interactions'):
        items = story.get(group)
        if not isinstance(items, list):
            raise ValueError('Missing earthquake ' + group)
        for item in items:
            kind = item.get('kind') if group == 'interactions' else {'scenes': 'scene', 'vocab': 'vocab'}[group]
            if group == 'interactions' and kind not in ('prompt', 'result'):
                raise ValueError('Invalid interaction kind')
            item_id = item.get('id')
            if not isinstance(item_id, str) or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', item_id):
                raise ValueError('Invalid earthquake item id')
            identity = (kind, item_id)
            if identity in seen:
                raise ValueError('Duplicate earthquake item: ' + kind + '-' + item_id)
            seen.add(identity)
            if not isinstance(item.get('narrationNeeded'), bool):
                raise ValueError('Missing narrationNeeded: ' + item_id)
            for lang in ('zh', 'en'):
                text = item.get(lang)
                if not isinstance(text, str) or not text.strip():
                    raise ValueError('Missing earthquake ' + lang + ': ' + item_id)
                key = f'{kind}-{item_id}-{lang}'
                if item['narrationNeeded']:
                    expected[key] = unicodedata.normalize('NFC', text).replace('\r\n', '\n')
                else:
                    non_narrated.append(key)

    for key in non_narrated:
        if (base / 'audio' / (key + '.mp3')).exists():
            raise ValueError('Non-narrated item has formal audio: ' + key)

    manifest_path = base / 'audio-manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.is_file() else None
    entries = {}
    if manifest is not None:
        if (manifest.get('schemaVersion') != 2 or manifest.get('bookId') != 'earthquake'
                or manifest.get('owner') != 'book' or manifest.get('scriptVersion') != version
                or manifest.get('contentVersion') != version):
            raise ValueError('Earthquake audio manifest version/owner mismatch')
        source_hash = hashlib.sha256(unicodedata.normalize('NFC', raw).replace('\r\n', '\n').encode()).hexdigest()
        if manifest.get('sourceSha256') != source_hash or manifest.get('scriptSha256') != source_hash:
            raise ValueError('Earthquake audio manifest source hash mismatch')
        listed = manifest.get('entries')
        if not isinstance(listed, list) or len(listed) != len(expected):
            raise ValueError('Audio manifest does not cover earthquake bilingual story')
        for entry in listed:
            key = entry.get('id')
            if key in entries or key not in expected:
                raise ValueError('Audio manifest does not cover earthquake bilingual story')
            kind, item_id, lang = entry.get('kind'), entry.get('itemId'), entry.get('lang')
            if (key != f'{kind}-{item_id}-{lang}' or entry.get('key') != 'book:' + key
                    or entry.get('owner') != 'book' or entry.get('contentVersion') != version
                    or entry.get('output') != 'audio/' + key + '.mp3'):
                raise ValueError('Earthquake audio manifest key/output mismatch: ' + str(key))
            if entry.get('text') != expected[key] or entry.get('textSha256') != hashlib.sha256(expected[key].encode()).hexdigest():
                raise ValueError('Earthquake audio manifest text hash mismatch: ' + key)
            entries[key] = entry
        if set(entries) != set(expected):
            raise ValueError('Audio manifest does not cover earthquake bilingual story')

    art_path = base / 'art-manifest.json'
    if not art_path.is_file():
        raise ValueError('Missing earthquake art manifest')
    art = json.loads(art_path.read_text(encoding='utf-8'))
    approved_art = {item.get('id'): item for item in art.get('entries', []) if item.get('reviewed') is True}
    images = set()
    for item in story['scenes']:
        name = item['image']
        rel = 'images/' + name + '.webp'
        if approved_art.get(name, {}).get('path') != rel:
            raise ValueError('Earthquake art manifest does not match scene: ' + name)
        images.add(rel)
    sources = []
    entry_page = base / 'index.html'
    if entry_page.is_file():
        for script in re.findall(r'<script\b[^>]*\bsrc=["\x27]([^"\x27]+)', entry_page.read_text(encoding='utf-8'), re.I):
            target = (base / script.split('?')[0]).resolve()
            if target.is_relative_to(base.resolve()) and target.is_file():
                sources.append(target.read_text(encoding='utf-8'))
    for source in sources:
        images.update(re.findall(r'''["'](images/[^"']+\.webp)["']''', source))
    for image in images:
        if not re.fullmatch(r'images/[\w-]+\.webp', image) or not (base / image).is_file():
            raise ValueError('Missing/invalid story image: ' + image)

    present, missing = [], []
    for key in expected:
        rel = 'audio/' + key + '.mp3'
        url = 'books/earthquake/' + rel + '?v=' + version
        record = entries.get(key)
        if record and record.get('status') == 'ready':
            path = base / rel
            if not path.is_file() or path.stat().st_size == 0:
                raise ValueError('Missing/empty earthquake audio: ' + rel)
            if hashlib.sha256(path.read_bytes()).hexdigest() != record.get('fileSha256'):
                raise ValueError('Earthquake audio file hash mismatch: ' + rel)
            present.append(url)
        else:
            missing.append(url)
    prefix = 'books/earthquake/'
    data = [prefix + 'story.json', prefix + 'art-manifest.json']
    if manifest is not None:
        data.append(prefix + 'audio-manifest.json')
    return {
        'cover': 'images/' + story['scenes'][0]['image'] + '.webp',
        'images': [prefix + image for image in sorted(images)],
        'sfx': [],
        'data': data,
        'audio': present,
        'audioExpected': len(expected),
        'audioVersion': version,
        'missingAudio': missing,
    }
