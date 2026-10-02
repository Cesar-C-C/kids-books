import importlib.util
import base64
import subprocess
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).resolve().parents[1] / 'tools/earthquake_audio_batch.py'

class PreparationTests(unittest.TestCase):
    def setUp(self):
        self.assertTrue(MODULE.exists(), 'real preparation module required')
        spec = importlib.util.spec_from_file_location('earthquake_audio_batch', MODULE)
        self.api = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.api)

    def test_rejects_unfrozen_inputs(self):
        with self.assertRaisesRegex(ValueError, 'freeze'):
            self.api.validate_authority({}, 'sample', 'a' * 64)

    def test_rejects_old_book_approval(self):
        with self.assertRaisesRegex(ValueError, 'topic'):
            self.api.validate_authority({'frozen': True, 'topicId': 'sound'}, 'sample', 'a' * 64)

    def test_rejects_changed_manifest(self):
        with self.assertRaisesRegex(ValueError, 'hash'):
            self.api.validate_authority({'frozen': True, 'topicId': 'earthquake', 'manifestSetSha256': 'b' * 64}, 'sample', 'a' * 64)

    def test_sample_does_not_grant_batch(self):
        approval = dict(frozen=True, topicId='earthquake', manifestSetSha256='a' * 64,
                        sampleAuthorized=True, evidence='user authorized selected samples')
        self.api.validate_authority(approval, 'sample', 'a' * 64)
        with self.assertRaisesRegex(ValueError, 'batch'):
            self.api.validate_authority(approval, 'batch', 'a' * 64)

    def test_requires_new_sample_acceptance_for_batch(self):
        approval = dict(frozen=True, topicId='earthquake', manifestSetSha256='a' * 64,
                        batchAuthorized=True, evidence='user approved batch')
        with self.assertRaisesRegex(ValueError, 'sample'):
            self.api.validate_authority(approval, 'batch', 'a' * 64)

    def test_encoded_powershell_command_preserves_unicode_and_quotes(self):
        command = "$value = 'quote''雪'; Write-Output $value"
        encoded = self.api.encode_powershell_command(command)
        self.assertEqual(base64.b64decode(encoded).decode('utf-16le'), command)
        result = subprocess.run(
            ['powershell.exe', '-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
            check=True, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=20)
        self.assertEqual(result.stdout.strip(), "quote'雪")

    def test_archive_attempt_picker_skips_existing_attempt(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp)
            (work / 'batch-attempt-1').mkdir()
            self.assertEqual(self.api.next_attempt_directory(work), work / 'batch-attempt-2')

if __name__ == '__main__':
    unittest.main()
