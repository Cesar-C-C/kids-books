import unittest

from tools.cloud_voice_plan import resolve_reference, select_jobs


class CloudVoicePlanTests(unittest.TestCase):
    def test_select_jobs_keeps_only_requested_language(self):
        jobs = [
            {"id": "page_00_zh_00", "lang": "zh"},
            {"id": "page_00_en_00", "lang": "en"},
            {"id": "fact_00_zh", "lang": "zh"},
        ]

        self.assertEqual(
            ["page_00_zh_00", "fact_00_zh"],
            [job["id"] for job in select_jobs(jobs, "zh")],
        )

    def test_resolve_reference_prefers_language_specific_voice(self):
        source = {
            "reference": "legacy.wav",
            "references": {"zh": "mandarin.wav", "en": "english.wav"},
        }

        self.assertEqual("mandarin.wav", resolve_reference(source, "zh"))
        self.assertEqual("english.wav", resolve_reference(source, "en"))

    def test_resolve_reference_falls_back_to_legacy_voice(self):
        self.assertEqual(
            "legacy.wav", resolve_reference({"reference": "legacy.wav"}, "zh")
        )


if __name__ == "__main__":
    unittest.main()
