"""Independent corrupt native-film fixtures; no generation of media."""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import qa_pwa


class NativeFilmTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.old = qa_pwa.REPO, qa_pwa.fails, qa_pwa.checks
        qa_pwa.REPO, qa_pwa.fails, qa_pwa.checks = str(self.root), [], 0
        self.prefix = 'animations/fixture/'
        media = {}
        for key, name in [('video', 'browser.mp4'), ('mandarin', 'mandarin.m4a')]:
            raw = ('fixture-' + key).encode()
            self.write(self.prefix+'media/'+name, raw)
            digest = hashlib.sha256(raw).hexdigest()
            media[key] = {'url': 'media/'+name+'?v='+digest[:12], 'bytes': len(raw), 'sha256': digest}
        core = [self.prefix+x for x in ('index.html', 'player.css', 'player.js', 'film.json', 'cover-v5.jpg', 'bilingual-v5.srt')]
        offline = {'mode': 'explicit-standalone-download', 'identity': 'project-adapted-offline-v2', 'file': 'downloads/project-v2.html', 'original': {'identity': 'original-source-v5-unaltered', 'file': 'downloads/original-v5.html'}}
        for item in (offline, offline['original']):
            raw = item['identity'].encode()
            self.write(self.prefix+item['file'], raw)
            item.update(bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest())
        self.write(self.prefix+'index.html', ('<a class="download" href="'+offline['file']+'">Project adapted</a>').encode())
        self.write(self.prefix+'film.json', json.dumps({'media': media, 'offline': offline}).encode())
        self.data = {'shell': core, 'films': {'fixture': {'kind': 'native-bilingual-film', 'core': list(core), 'media': media, 'offlineMode': 'explicit-standalone-download', 'offline': offline}}}

    def write(self, rel, raw):
        p = self.root/rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(raw)

    def tearDown(self):
        qa_pwa.REPO, qa_pwa.fails, qa_pwa.checks = self.old
        self.temp.cleanup()

    def check(self, valid=False):
        qa_pwa.check_films(self.data)
        self.assertEqual(not qa_pwa.fails, valid, str(qa_pwa.fails))

    def test_exact_contract(self):
        self.check(True)

    def test_unknown_query(self):
        self.data['films']['fixture']['media']['video']['url'] += '&x=1'
        self.check()

    def test_changed_media(self):
        self.write(self.prefix+'media/browser.mp4', b'wrong')
        self.check()

    def test_big_media_in_core(self):
        self.data['shell'].append(self.prefix+'media/browser.mp4')
        self.check()

    def test_large_download_in_core(self):
        self.data['shell'].append(self.prefix+'downloads/ropeway-v5.html')
        self.check()

    def test_production_in_core(self):
        self.data['shell'].append('video-production/ropeway-v5/source.zip')
        self.check()

    def test_missing_page(self):
        self.data['shell'].remove(self.prefix+'index.html')
        self.check()

    def test_modified_project_download(self):
        self.write(self.prefix+'downloads/project-v2.html', b'wrong')
        self.check()

    def test_modified_source_archive(self):
        self.write(self.prefix+'downloads/original-v5.html', b'wrong')
        self.check()

    def test_recommended_link_points_to_original(self):
        self.write(self.prefix+'index.html', b'<a class="download" href="downloads/original-v5.html">Wrong</a>')
        self.check()

    def test_ambiguous_identity(self):
        self.data['films']['fixture']['offline']['identity'] = 'source-v5'
        self.check()

    def set_v3(self):
        offline = self.data['films']['fixture']['offline']
        offline['identity'] = 'project-adapted-offline-v3'
        offline['file'] = 'downloads/project-v3.html'
        raw = b'project-adapted-offline-v3'
        offline.update(bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest())
        self.write(self.prefix+offline['file'], raw)
        source = json.loads((self.root/(self.prefix+'film.json')).read_text())
        source['offline'] = offline
        self.write(self.prefix+'film.json', json.dumps(source).encode())
        self.write(self.prefix+'index.html', b'<a class="download" href="downloads/project-v3.html">v3</a>')

    def test_v3_exact_contract(self):
        self.set_v3()
        self.check(True)

    def test_v3_modified_download_rejected(self):
        self.set_v3()
        self.write(self.prefix+'downloads/project-v3.html', b'bad')
        self.check()

    def test_v3_recommendation_still_v2_rejected(self):
        self.set_v3()
        self.write(self.prefix+'index.html', b'<a class="download" href="downloads/project-v2.html">stale</a>')
        self.check()


if __name__ == '__main__':
    unittest.main()
