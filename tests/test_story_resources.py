import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from story_resources import discover


class StoryResourcesTests(unittest.TestCase):
    def test_actual_story_without_formal_audio_is_pending(self):
        result = discover(ROOT, 'moon')
        story = json.loads((ROOT / 'books/moon/story.json').read_text(encoding='utf-8'))
        self.assertEqual(result['audioExpected'], 2 * (len(story['scenes']) + len(story['vocab'])))
        self.assertEqual(result['audioExpected'], len(result['audio']) + len(result['missingAudio']))
        self.assertEqual(7, len(result['images']))
        self.assertTrue(all(url.endswith('?v=1') for url in result['audio'] + result['missingAudio']))

    def test_manifest_driven_future_audio_and_empty_files(self):
        # Tiny isolated fixtures test discovery only, not audio decoding or acceptance.
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp) / 'books/example'
            (base / 'images').mkdir(parents=True)
            (base / 'audio').mkdir()
            story = {'bookId': 'example', 'scenes': [{'id': 'first', 'image': 'cover', 'zh': '月', 'en': 'Moon'}], 'vocab': []}
            entries = [{'id': 'scene-first-' + lang, 'text': story['scenes'][0][lang], 'output': 'audio/scene-first-' + lang + '.mp3'} for lang in ('zh', 'en')]
            (base / 'story.json').write_text(json.dumps(story), encoding='utf-8')
            (base / 'audio-manifest.json').write_text(json.dumps({'bookId': 'example', 'entries': entries}), encoding='utf-8')
            (base / 'example-experience.js').write_text('const AUDIO_VER=7;', encoding='utf-8')
            (base / 'images/cover.webp').write_bytes(b'fixture')
            self.assertEqual(2, len(discover(temp, 'example')['missingAudio']))
            (base / entries[0]['output']).write_bytes(b'fixture')
            (base / entries[1]['output']).write_bytes(b'')
            result = discover(temp, 'example')
            self.assertEqual(['books/example/audio/scene-first-zh.mp3?v=7'], result['audio'])
            self.assertEqual(1, len(result['missingAudio']))
            (base / entries[1]['output']).write_bytes(b'fixture')
            self.assertEqual([], discover(temp, 'example')['missingAudio'])
            entries.pop()
            (base / 'audio-manifest.json').write_text(json.dumps({'bookId': 'example', 'entries': entries}), encoding='utf-8')
            with self.assertRaises(ValueError):
                discover(temp, 'example')


if __name__ == '__main__':
    unittest.main()
