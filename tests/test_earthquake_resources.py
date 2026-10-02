"""Earthquake's candidate audio inventory must not make an unfinished book look ready."""
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from story_resources import discover
import gen_pwa_assets
import qa_offline_manifest


def sha(value):
    return hashlib.sha256(value.encode('utf-8')).hexdigest()


class EarthquakeResourceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.base = Path(self.tmp.name) / 'books' / 'earthquake'
        (self.base / 'images').mkdir(parents=True)
        (self.base / 'images' / 'opening.webp').write_bytes(b'WEBP fixture')
        self.story = {
            'bookId': 'earthquake', 'scriptVersion': 'earthquake-story-v1', 'frozen': False,
            'scenes': [{'id': 'opening', 'image': 'opening', 'zh': '岩岩来了', 'en': 'Yan-Yan arrived', 'narrationNeeded': True}],
            'vocab': [{'id': 'fault', 'zh': '断层', 'en': 'fault', 'narrationNeeded': True}],
            'interactions': [
                {'id': 'guess', 'kind': 'prompt', 'conceptId': 'fault', 'zh': '先猜猜', 'en': 'Take a guess', 'narrationNeeded': True},
                {'id': 'hint', 'kind': 'result', 'conceptId': 'slip', 'zh': '纹路错开了', 'en': 'The lines are offset', 'narrationNeeded': True},
                {'id': 'button', 'kind': 'prompt', 'conceptId': 'slip', 'zh': '再试', 'en': 'Try again', 'narrationNeeded': False},
            ],
        }
        self.write_story()
        self.write_art()

    def write_story(self):
        (self.base / 'story.json').write_text(json.dumps(self.story, ensure_ascii=False), encoding='utf-8')

    def write_art(self):
        (self.base / 'art-manifest.json').write_text(json.dumps({'entries': [
            {'id': 'opening', 'path': 'images/opening.webp', 'reviewed': True}
        ]}), encoding='utf-8')

    def manifest(self):
        raw = (self.base / 'story.json').read_text(encoding='utf-8')
        entries = []
        for kind, item in [('scene', self.story['scenes'][0]), ('vocab', self.story['vocab'][0]),
                           ('prompt', self.story['interactions'][0]), ('result', self.story['interactions'][1])]:
            for lang in ('zh', 'en'):
                key = f'{kind}-{item["id"]}-{lang}'
                entries.append({'id': key, 'key': 'book:' + key, 'owner': 'book', 'kind': kind,
                                'itemId': item['id'], 'lang': lang, 'text': item[lang],
                                'textSha256': sha(item[lang]), 'contentVersion': self.story['scriptVersion'],
                                'output': 'audio/' + key + '.mp3', 'status': 'pending', 'fileSha256': None})
        return {'schemaVersion': 2, 'topicId': 'earthquake', 'owner': 'book', 'bookId': 'earthquake',
                'contentVersion': self.story['scriptVersion'], 'scriptVersion': self.story['scriptVersion'],
                'sourceSha256': sha(raw), 'scriptSha256': sha(raw), 'entries': entries}

    def write_manifest(self, manifest):
        (self.base / 'audio-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False), encoding='utf-8')

    def test_unfrozen_candidate_without_manifest_lists_all_typed_audio_as_missing(self):
        result = discover(self.tmp.name, 'earthquake')
        self.assertEqual(result['audioExpected'], 8)
        self.assertEqual(result['audio'], [])
        self.assertEqual(len(result['missingAudio']), 8)
        self.assertIn('books/earthquake/audio/prompt-guess-zh.mp3?v=earthquake-story-v1', result['missingAudio'])
        self.assertIn('books/earthquake/audio/result-hint-en.mp3?v=earthquake-story-v1', result['missingAudio'])
        self.assertEqual(result['images'], ['books/earthquake/images/opening.webp'])
        self.assertEqual(result['data'], ['books/earthquake/story.json', 'books/earthquake/art-manifest.json'])

    def test_frozen_story_waiting_for_audio_manifest_remains_visual_candidate(self):
        self.story['frozen'] = True
        self.write_story()
        result = discover(self.tmp.name, 'earthquake')
        self.assertEqual(result['audio'], [])
        self.assertEqual(len(result['missingAudio']), 8)

    def test_art_manifest_must_be_cached_and_match_runtime_scene(self):
        (self.base / 'art-manifest.json').unlink()
        with self.assertRaisesRegex(ValueError, 'art manifest'):
            discover(self.tmp.name, 'earthquake')
        self.write_art()
        (self.base / 'art-manifest.json').write_text(json.dumps({'entries': [
            {'id': 'opening', 'path': 'images/other.webp', 'reviewed': True}
        ]}), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'art manifest'):
            discover(self.tmp.name, 'earthquake')

    def test_manifest_with_pending_entries_is_still_incomplete(self):
        self.write_manifest(self.manifest())
        result = discover(self.tmp.name, 'earthquake')
        self.assertEqual(len(result['missingAudio']), 8)
        self.assertIn('books/earthquake/audio-manifest.json', result['data'])

    def test_manifest_text_hash_mismatch_cannot_reuse_old_recording(self):
        manifest = self.manifest()
        manifest['entries'][0]['textSha256'] = '0' * 64
        self.write_manifest(manifest)
        with self.assertRaisesRegex(ValueError, 'text hash'):
            discover(self.tmp.name, 'earthquake')

    def test_manifest_missing_language_cannot_look_complete(self):
        manifest = self.manifest()
        manifest['entries'].pop()
        self.write_manifest(manifest)
        with self.assertRaisesRegex(ValueError, 'cover'):
            discover(self.tmp.name, 'earthquake')

    def test_duplicate_id_and_missing_language_are_rejected(self):
        self.story['interactions'].append(dict(self.story['interactions'][0]))
        self.write_story()
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            discover(self.tmp.name, 'earthquake')
        self.story['interactions'].pop()
        del self.story['interactions'][0]['en']
        self.write_story()
        with self.assertRaisesRegex(ValueError, 'en'):
            discover(self.tmp.name, 'earthquake')

    def test_non_narrated_item_must_not_have_formal_audio(self):
        self.write_manifest(self.manifest())
        (self.base / 'audio').mkdir()
        (self.base / 'audio' / 'prompt-button-zh.mp3').write_bytes(b'not audio')
        with self.assertRaisesRegex(ValueError, 'Non-narrated'):
            discover(self.tmp.name, 'earthquake')

    def test_lab_inventory_caches_versioned_core_but_not_on_demand_mp3(self):
        lab = Path(self.tmp.name) / 'labs' / 'earthquake'
        (lab / 'v3').mkdir(parents=True)
        (lab / 'audio').mkdir()
        (lab.parent / 'shared').mkdir()
        (lab.parent / 'shared' / 'nav.js').write_text('console.log("shared")', encoding='utf-8')
        (lab / 'index.html').write_text('<script src="v3/app.js?v=7"></script><script src="../shared/nav.js?v=3"></script><link href="v3/earthquake.css?v=2" rel="stylesheet">', encoding='utf-8')
        (lab / 'v3' / 'app.js').write_text('console.log("core")', encoding='utf-8')
        (lab / 'v3' / 'earthquake.css').write_text('body{}', encoding='utf-8')
        (lab / 'content.json').write_text('{}', encoding='utf-8')
        (lab / 'audio' / 'knowledge-intro-zh.mp3').write_bytes(b'audio fixture')
        (lab / 'audio' / 'source.wav').write_bytes(b'source fixture')
        self.assertTrue(hasattr(gen_pwa_assets, 'earthquake_lab_inventory'))
        inventory = gen_pwa_assets.earthquake_lab_inventory(self.tmp.name)
        self.assertIn('labs/earthquake/index.html', inventory['files'])
        self.assertIn('labs/earthquake/v3/app.js?v=7', inventory['files'])
        self.assertIn('labs/earthquake/v3/earthquake.css?v=2', inventory['files'])
        self.assertIn('labs/shared/nav.js?v=3', inventory['files'])
        self.assertIn('labs/earthquake/content.json', inventory['files'])
        self.assertNotIn('labs/earthquake/audio/knowledge-intro-zh.mp3', inventory['files'])
        self.assertEqual(inventory['onDemandAudio'], ['labs/earthquake/audio/knowledge-intro-zh.mp3'])
        self.assertNotIn('labs/earthquake/audio/source.wav', inventory['onDemandAudio'])

    def test_offline_audit_rejects_missing_core_and_precached_lab_audio(self):
        self.assertTrue(hasattr(qa_offline_manifest, 'earthquake_lab_problems'))
        manifest = {'shell': ['labs/earthquake/index.html', 'labs/earthquake/v3/app.js?v=7'],
                    'labs': {'earthquake': {'files': ['labs/earthquake/index.html',
                                                      'labs/earthquake/v3/app.js?v=7'],
                                            'onDemandAudio': ['labs/earthquake/audio/intro.mp3']}}}
        self.assertEqual(qa_offline_manifest.earthquake_lab_problems(manifest), [])
        manifest['shell'].remove('labs/earthquake/v3/app.js?v=7')
        self.assertTrue(any('core' in item for item in qa_offline_manifest.earthquake_lab_problems(manifest)))
        manifest['shell'].append('labs/earthquake/audio/intro.mp3')
        self.assertTrue(any('on-demand' in item for item in qa_offline_manifest.earthquake_lab_problems(manifest)))


if __name__ == '__main__':
    unittest.main()
