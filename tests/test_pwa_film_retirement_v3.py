"""Film-only discovery and exact retirement corrupt fixtures; no media generation."""
import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import qa_pwa
from tools.animation_resources import inventory


class RetirementTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.old = qa_pwa.REPO, qa_pwa.fails, qa_pwa.checks
        qa_pwa.REPO, qa_pwa.fails, qa_pwa.checks = str(self.root), [], 0
        self.table = json.loads((ROOT/'animations/retired.json').read_text(encoding='utf-8'))
        self.data = {'shell': ['animations/retired.json'], 'retiredAnimations': copy.deepcopy(self.table['packages']), 'animations': {}, 'books': {}, 'labs': {}}
        self.write('animations/retired.json', self.table)

    def write(self, p, obj):
        target = self.root/p
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(obj), encoding='utf-8')

    def tearDown(self):
        qa_pwa.REPO, qa_pwa.fails, qa_pwa.checks = self.old
        self.temp.cleanup()

    def check(self, valid=False):
        qa_pwa.check_retired_animations(self.data)
        self.assertEqual(not qa_pwa.fails, valid, str(qa_pwa.fails))

    def test_exact37_valid(self):
        self.assertEqual(len(self.table['packages']['ropeway-station']['paths']), 37)
        self.check(True)

    def test_source_binding(self):
        self.data['retiredAnimations'] = {}
        self.check()

    def test_book_path_even_if_source_consistent(self):
        self.data['retiredAnimations']['ropeway-station']['paths'].append('books/ropeway/audio/foo.mp3')
        self.write('animations/retired.json', {'schemaVersion': 1, 'packages': self.data['retiredAnimations']})
        self.check()

    def test_escape_path(self):
        self.data['retiredAnimations']['ropeway-station']['paths'].append('animations/../books/ropeway/index.html')
        self.write('animations/retired.json', {'schemaVersion': 1, 'packages': self.data['retiredAnimations']})
        self.check()

    def test_missing_fingerprint(self):
        self.data['shell'] = []
        self.check()

    def test_recached_audio_query(self):
        self.data['books']['bad'] = {'files': ['animations/ropeway-station/audio/ropeway-station-board-zh.mp3?v=123456789012']}
        self.check()

    def test_deleted_file_still_exists(self):
        self.write('animations/ropeway-station/index.html', {})
        self.check()

    def test_retired_link(self):
        (self.root/'animations/index.html').write_text('<a href="ropeway-station/index.html">old</a>', encoding='utf-8')
        self.check()

    def test_no_animations_legacy(self):
        self.check(True)
        (self.root/'animations/retired.json').unlink()
        self.data = {'shell': [], 'books': {}}
        qa_pwa.fails = []
        self.check(True)

    def test_film_only_discovery_without_remotion(self):
        self.write('animations/fixture/film.json', {'kind': 'native-bilingual-film', 'id': 'fixture', 'core': ['index.html', 'player.js'], 'media': {}, 'offline': {'mode': 'explicit-standalone-download'}})
        discovered = inventory(str(self.root))
        self.assertEqual(discovered['packages'], {})
        self.assertEqual(list(discovered['films']), ['fixture'])
        self.assertIn('animations/index.html', discovered['core'])
        self.assertIn('animations/fixture/player.js', discovered['core'])
        self.assertEqual(discovered['retired'], self.table['packages'])
        self.assertNotIn('animations/build-manifest.json', discovered['core'])

    def test_orphan_short_generator_rejected(self):
        self.write('animations/old/timeline.json', {'status': 'draft'})
        with self.assertRaises(ValueError):
            inventory(str(self.root))

    def test_absent_directory_generator(self):
        with tempfile.TemporaryDirectory() as clean:
            self.assertEqual(inventory(clean), {'core': [], 'packages': {}, 'films': {}, 'retired': {}})


if __name__ == '__main__':
    unittest.main(verbosity=2)
