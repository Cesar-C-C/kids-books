"""Discover only current static animation outputs and exact narration URLs."""
import hashlib
import json
import os


def inventory(repo):
    root = os.path.join(repo, 'animations')
    build_path = os.path.join(root, 'build-manifest.json')
    if not os.path.isdir(root):
        return {'core': [], 'packages': {}, 'films': {}, 'retired': {}}
    build = None
    shared_core = []
    if os.path.isfile(build_path):
        with open(build_path, encoding='utf-8') as source:
            build = json.load(source)
        shared_core = ['animations/index.html', 'animations/animation.css']
        shared_core.extend(output['path'] for output in build['outputs'])
    elif any(os.path.isfile(os.path.join(root, name, 'film.json')) for name in os.listdir(root)):
        shared_core = ['animations/index.html', 'animations/animation.css']
    core = list(shared_core)
    packages = {}
    for name in sorted(os.listdir(root)):
        timeline_path = os.path.join(root, name, 'timeline.json')
        if not os.path.isfile(timeline_path):
            continue
        if build is None:
            raise ValueError('Animation timeline exists without build-manifest.json: ' + name)
        with open(timeline_path, encoding='utf-8') as source:
            timeline = json.load(source)
        local_core = ['animations/%s/%s' % (name, fn) for fn in ('index.html', 'poster.svg', 'timeline.json')]
        core.extend(local_core)
        files = sorted(set(shared_core + local_core))
        audio = []
        if timeline['status'] == 'ready':
            for language in timeline['languages'].values():
                audio.extend('animations/%s/%s' % (name, clip['audioUrl']) for clip in language['clips'])
        files = sorted(set(files + audio))
        hashes = {}
        for rel in files:
            if rel.startswith('../') or os.path.isabs(rel):
                raise ValueError('Out-of-scope animation asset: ' + rel)
            disk = os.path.join(repo, rel.split('?')[0])
            with open(disk, 'rb') as source:
                data = source.read()
            hashes[rel] = {'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}
        packages[name] = {'files': files, 'bytes': sum(item['bytes'] for item in hashes.values()),
                          'hashes': hashes, 'audioExpected': 20, 'audioCount': len(audio),
                          'complete': timeline['status'] == 'ready' and len(audio) == 20}
    # Native films share the small site shell, NOT Remotion's 20-track package.
    # Large media / standalone HTML / source ZIP are explicit downloads only.
    films = {}
    for name in sorted(os.listdir(root)):
        meta = os.path.join(root, name, 'film.json')
        if not os.path.isfile(meta):
            continue
        with open(meta, encoding='utf-8') as source:
            film = json.load(source)
        if film.get('kind') != 'native-bilingual-film' or film.get('id') != name:
            raise ValueError('Unknown native film: ' + name)
        film_core = ['animations/%s/%s' % (name, item) for item in film['core']]
        for rel in film_core:
            if not rel.startswith('animations/' + name + '/') or '..' in rel.split('/'):
                raise ValueError('Out-of-scope film shell: ' + rel)
            if rel.split('.')[-1] not in ('html', 'css', 'js', 'json', 'jpg', 'srt') or '/downloads/' in rel:
                raise ValueError('Large download cannot enter film shell: ' + rel)
        core.extend(film_core)
        films[name] = {'kind': film['kind'], 'core': film_core,
                       'media': film['media'], 'offlineMode': film['offline']['mode'],
                       'offline': film['offline']}
    retired = {}
    retired_path = os.path.join(root, 'retired.json')
    if os.path.isfile(retired_path):
        with open(retired_path, encoding='utf-8') as source:
            retired = json.load(source)['packages']
        core.append('animations/retired.json')
    return {'core': sorted(set(core)), 'packages': packages, 'films': films, 'retired': retired}
