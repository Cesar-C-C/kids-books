"""Read-only project preflight. Never imports bpy, renders, synthesizes, or writes.

Use the retained 82-file bundle to reproduce the film only after new rendering
authority. A template is a plan, not ready narration or a universal shot shell.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import zipfile


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def preflight(template, archive, lock):
    t = json.loads(template.read_text(encoding='utf-8'))
    provenance = json.loads(lock.read_text(encoding='utf-8'))
    frozen = next(x for x in provenance['copies'] if x['path'].endswith('/source.zip'))
    raw = archive.read_bytes()
    assert len(raw) == frozen['bytes'] and digest(raw) == frozen['sha256'], 'Source ZIP changed'
    entries = []
    with zipfile.ZipFile(archive) as z:
        for entry in z.infolist():
            name = PurePosixPath(entry.filename)
            assert not name.is_absolute() and '..' not in name.parts and '\\' not in entry.filename, 'Unsafe ZIP path'
            content = z.read(entry)
            entries.append({'path': entry.filename, 'bytes': len(content), 'sha256': digest(content)})
    assert len(entries) == 82 and len({x['path'] for x in entries}) == 82, 'Source bundle entry count differs'
    names = {x['path'] for x in entries}
    for expected in ['work/ropeway-3d-v5/render_project.py', 'work/ropeway-3d-v5/annotations.py', 'work/ropeway-3d-v5/narration-en.m4a', 'work/ropeway-3d-v5/narration-zh.m4a', 'work/bilingual-player-template.html']:
        assert expected in names, expected
    assert t['schemaVersion'] == 1 and t['fps'] == 24
    assert t['gates']['publication'] is False
    previous = 0
    beats = []
    ids = set()
    for scene in t['scenes']:
        assert scene['id'] not in ids
        ids.add(scene['id'])
        assert scene['start'] >= previous and scene['end'] > scene['start']
        assert scene['nativeFps'] in (8, 24) and scene['mechanism'] and scene['camera']
        for beat in scene['beats']:
            assert scene['start'] <= beat['start'] < beat['end'] <= scene['end']
            assert beat['zh'] and beat['en']
            beats.append(beat)
        for mark in scene['marks']:
            assert len(mark['worldAnchor']) == 3 and mark['purpose']
            assert scene['start'] <= mark['start'] < mark['end'] <= scene['end']
        previous = scene['end']
    ready = all(x['audioSha256'] and len(x['audioSha256']) == 64 for x in beats)
    return {'status': 'PASS_PRECHECK', 'readOnly': True, 'render': 'NOT_RUN', 'speech': 'NOT_RUN',
            'templateNarration': 'READY' if ready else 'NOT_READY', 'templateScenes': len(ids),
            'sourceFiles': entries, 'sourceZipSha256': digest(raw),
            'constraints': ['Windows fonts and explicit FFprobe are required', 'fresh B/scene-frames must precede legacy cache fallback', '8fps interpolation is not native 24fps', 'ASR is not human listening'],
            'authorizedRenderCommandNotExecuted': 'ROPEWAY_FFPROBE=<explicit path>; python work/ropeway-3d-v5/render_project.py --blender <Blender 5.2 path> --ffmpeg <FFmpeg path>'}


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--template', type=Path, required=True)
    p.add_argument('--source-zip', type=Path, required=True)
    p.add_argument('--source-lock', type=Path, required=True)
    args = p.parse_args()
    print(json.dumps(preflight(args.template, args.source_zip, args.source_lock), ensure_ascii=False, indent=2))
