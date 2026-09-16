import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
sys.path.insert(0, str(ROOT))

import qa_pwa
import gen_pwa_assets


class PwaFingerprintTests(unittest.TestCase):
    def test_manifest_fingerprint_uses_the_canonical_asset_hash(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            (root / "app.js").write_bytes(b"const value = 1;\r\n")

            old_qa_repo = qa_pwa.REPO
            try:
                qa_pwa.REPO = str(root)
                version = qa_pwa.expected_asset_version(
                    {"shell": ["app.js"], "books": {}}
                )
                self.assertEqual(12, len(version))
            finally:
                qa_pwa.REPO = old_qa_repo

    def test_text_fingerprint_is_independent_of_checkout_line_endings(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            (root / "lf.js").write_bytes(b"const value = 1;\n")
            (root / "crlf.js").write_bytes(b"const value = 1;\r\n")

            old_generator_repo = gen_pwa_assets.REPO
            old_qa_repo = qa_pwa.REPO
            try:
                gen_pwa_assets.REPO = str(root)
                qa_pwa.REPO = str(root)
                self.assertEqual(
                    gen_pwa_assets.sha256_of("lf.js"),
                    gen_pwa_assets.sha256_of("crlf.js"),
                )
                self.assertEqual(
                    qa_pwa.content_sha256("lf.js"),
                    qa_pwa.content_sha256("crlf.js"),
                )
            finally:
                gen_pwa_assets.REPO = old_generator_repo
                qa_pwa.REPO = old_qa_repo

    def test_binary_fingerprint_preserves_raw_bytes(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            (root / "lf.bin").write_bytes(b"binary\ncontent")
            (root / "crlf.bin").write_bytes(b"binary\r\ncontent")

            old_generator_repo = gen_pwa_assets.REPO
            old_qa_repo = qa_pwa.REPO
            try:
                gen_pwa_assets.REPO = str(root)
                qa_pwa.REPO = str(root)
                self.assertNotEqual(
                    gen_pwa_assets.sha256_of("lf.bin"),
                    gen_pwa_assets.sha256_of("crlf.bin"),
                )
                self.assertNotEqual(
                    qa_pwa.content_sha256("lf.bin"),
                    qa_pwa.content_sha256("crlf.bin"),
                )
            finally:
                gen_pwa_assets.REPO = old_generator_repo
                qa_pwa.REPO = old_qa_repo


if __name__ == "__main__":
    unittest.main()
