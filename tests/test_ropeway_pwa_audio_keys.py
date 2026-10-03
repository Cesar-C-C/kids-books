import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from gen_pwa_assets import ropeway_audio_inventory


class RopewayAudioKeysTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.base = self.root / 'labs' / 'ropeway'
        self.audio = self.base / 'audio'
        self.audio.mkdir(parents=True)

    def write_manifest(self, payload):
        (self.base / 'audio-manifest.js').write_text(
            'window.ROPEWAY_AUDIO_MANIFEST = ' + json.dumps(payload) + ';', encoding='utf-8')

    def fixture(self):
        tracks = {}
        for number in range(16):
            for language in ('zh', 'en'):
                key = 'clue' + str(number) + '-' + language
                raw = key.encode()
                digest = hashlib.sha256(raw).hexdigest()
                (self.audio / (key + '.mp3')).write_bytes(raw)
                tracks[key] = {'file': 'audio/' + key + '.mp3?v=' + digest[:12],
                               'sha256': digest, 'bytes': len(raw)}
        return {'status': 'ready', 'sourceSha256': 'a' * 64, 'tracks': tracks}

    def test_absent_and_empty_pending_manifest_do_not_require_audio(self):
        self.assertEqual(ropeway_audio_inventory(str(self.root)), [])
        (self.base / 'audio-manifest.js').write_text(
            "window.ROPEWAY_AUDIO_MANIFEST={status:'pending',sourceSha256:null,tracks:{}};",
            encoding='utf-8')
        self.assertEqual(ropeway_audio_inventory(str(self.root)), [])

    def test_ready_manifest_keeps_exact_versioned_keys(self):
        payload = self.fixture()
        self.write_manifest(payload)
        keys = ropeway_audio_inventory(str(self.root))
        self.assertEqual(keys, sorted('labs/ropeway/' + t['file'] for t in payload['tracks'].values()))
        self.assertEqual(len(keys), 32)
        self.assertTrue(all('?v=' in key for key in keys))

    def test_unversioned_stale_and_unsafe_urls_are_rejected(self):
        payload = self.fixture()
        track = payload['tracks']['clue0-zh']
        for value in ('audio/clue0-zh.mp3', 'audio/clue0-zh.mp3?v=000000000000',
                      '../audio/clue0-zh.mp3', 'https://example.org/clue0-zh.mp3'):
            with self.subTest(value=value):
                track['file'] = value
                self.write_manifest(payload)
                with self.assertRaises(ValueError):
                    ropeway_audio_inventory(str(self.root))

    def test_mismatched_bytes_and_unlisted_audio_are_rejected(self):
        payload = self.fixture()
        self.write_manifest(payload)
        target = self.audio / 'clue0-zh.mp3'
        original = target.read_bytes()
        target.write_bytes(b'changed')
        with self.assertRaises(ValueError):
            ropeway_audio_inventory(str(self.root))
        target.write_bytes(original)
        (self.audio / 'unlisted.mp3').write_bytes(b'unlisted')
        with self.assertRaises(ValueError):
            ropeway_audio_inventory(str(self.root))

    def test_pending_audio_and_incomplete_pairs_are_rejected(self):
        (self.audio / 'unexpected.mp3').write_bytes(b'unexpected')
        self.write_manifest({'status': 'pending', 'tracks': {}})
        with self.assertRaises(ValueError):
            ropeway_audio_inventory(str(self.root))
        payload = self.fixture()
        del payload['tracks']['clue0-en']
        self.write_manifest(payload)
        with self.assertRaises(ValueError):
            ropeway_audio_inventory(str(self.root))


if __name__ == '__main__':
    unittest.main()
