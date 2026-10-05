"""Independent fixtures for animation exact keys, raw records and shared budgets."""
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import qa_pwa


class AnimationPwaTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.original = (qa_pwa.REPO, qa_pwa.fails, qa_pwa.warns, qa_pwa.checks)
        qa_pwa.REPO = str(self.root)
        qa_pwa.fails, qa_pwa.warns, qa_pwa.checks = [], [], 0
        self.write("offline.html", b"offline")
        self.write("shared/reader.js", b"const AUDIO_VER = 1;")
        self.write("animations/index.html", b"catalog")
        self.write("animations/animation.css", b"body{color:green}")
        self.write("animations/assets/player-fixture.js", b"const frame = 1;\n")
        self.write_json("animations/build-manifest.json", {
            "status": "built", "outputs": [{"path": "animations/assets/player-fixture.js",
                                                **self.record("animations/assets/player-fixture.js")}],
        })
        self.shared = ["animations/index.html", "animations/animation.css",
                       "animations/assets/player-fixture.js"]
        self.data = {"audioVer": "1", "shell": ["offline.html"], "books": {},
                     "animations": {}}
        self.add_package("fixture")
        self.refresh()

    def tearDown(self):
        qa_pwa.REPO, qa_pwa.fails, qa_pwa.warns, qa_pwa.checks = self.original
        self.temp.cleanup()

    def write(self, name, raw):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(raw)

    def write_json(self, name, data):
        self.write(name, (json.dumps(data, ensure_ascii=False, sort_keys=True) + "\n").encode())

    def record(self, url):
        raw = (self.root / url.split("?")[0]).read_bytes()
        return {"sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw)}

    def add_package(self, name):
        prefix = "animations/%s/" % name
        tracks, languages, audio = {}, {}, []
        for lang in ("zh", "en"):
            identity = name + "-scene-" + lang
            path = prefix + "audio/" + identity + ".mp3"
            self.write(path, ("test-mp3-" + lang).encode())
            record = self.record(path)
            local_url = "audio/%s.mp3?v=%s" % (identity, record["sha256"][:12])
            tracks[identity] = {"file": local_url, "lang": lang, **record}
            languages[lang] = {"status": "ready", "clips": [{"id": identity,
                "audioUrl": local_url, "audioSha256": record["sha256"], "audioBytes": record["bytes"]}]}
            audio.append(prefix + local_url)
        manifest = prefix + "audio-manifest.json"
        self.write_json(manifest, {"trackCount": 2, "tracks": tracks})
        self.write_json(prefix + "timeline.json", {"status": "ready", "languages": languages,
                       "audioManifestSha256": self.record(manifest)["sha256"]})
        self.write(prefix + "index.html", b"player")
        self.write(prefix + "poster.svg", b"<svg/>")
        core = self.shared + [prefix + item for item in ("index.html", "poster.svg", "timeline.json")]
        self.data["shell"] = sorted(set(self.data["shell"] + core))
        files = sorted(core + audio)
        records = {url: self.record(url) for url in files}
        self.data["animations"][name] = {"files": files, "hashes": records,
            "bytes": sum(item["bytes"] for item in records.values()),
            "audioExpected": 2, "audioCount": 2, "complete": True}

    def version(self):
        # Independent fixture computation, not the generator or validator result.
        digest = hashlib.sha256()
        lists = [self.data["shell"]]
        lists += [self.data["books"][name]["files"] for name in sorted(self.data["books"])]
        lists += [self.data["animations"][name]["files"] for name in sorted(self.data.get("animations", {}))]
        for files in lists:
            for url in files:
                raw = (self.root / url.split("?")[0]).read_bytes()
                if Path(url.split("?")[0]).suffix in {".js", ".json", ".html", ".css", ".svg"}:
                    raw = raw.replace(b"\r\n", b"\n")
                digest.update((url + ":" + hashlib.sha256(raw).hexdigest() + ";").encode())
        return digest.hexdigest()[:12]

    def refresh(self):
        self.data["version"] = self.version()
        charged = set(self.data["shell"])
        self.data["total"] = sum(self.record(url)["bytes"] for url in charged)
        self.data["total"] += sum(book["bytes"] for book in self.data["books"].values())
        extras = {url for package in self.data.get("animations", {}).values()
                  for url in package["files"]} - charged
        self.data["total"] += sum(self.record(url)["bytes"] for url in extras)

    def run_assets(self):
        qa_pwa.fails, qa_pwa.warns, qa_pwa.checks = [], [], 0
        self.write("pwa-assets.js", ("self.KB_ASSETS = " + json.dumps(self.data) + ";\n").encode())
        qa_pwa.check_assets()
        return list(qa_pwa.fails)

    def reject(self, token):
        failures = self.run_assets()
        self.assertTrue(failures, "Corrupt inventory passed")
        self.assertIn(token, "\n".join(failures))

    def test_valid_inventory_passes(self):
        self.assertEqual([], self.run_assets())
        self.assertEqual([], qa_pwa.warns)
        self.assertEqual(self.data["version"], qa_pwa.expected_asset_version(self.data))

    def test_same_size_animation_content_changes_fingerprint(self):
        path = "animations/fixture/poster.svg"
        old = qa_pwa.expected_asset_version(self.data)
        self.write(path, b"<SVG/>")
        self.assertNotEqual(old, qa_pwa.expected_asset_version(self.data))
        self.reject("内容指纹已过期")

    def test_same_size_audio_replacement_rejected_even_after_version_refresh(self):
        url = next(url for url in self.data["animations"]["fixture"]["files"] if ".mp3?" in url)
        raw = (self.root / url.split("?")[0]).read_bytes()
        self.write(url.split("?")[0], bytes([raw[0] ^ 1]) + raw[1:])
        self.refresh()
        self.reject("sha256/bytes 不一致")

    def test_missing_audio_disk_rejected(self):
        url = next(url for url in self.data["animations"]["fixture"]["files"] if ".mp3?" in url)
        (self.root / url.split("?")[0]).unlink()
        self.reject("动画资源独立校验失败")

    def test_omitted_audio_key_rejected_with_self_consistent_bad_metadata(self):
        package = self.data["animations"]["fixture"]
        url = next(url for url in package["files"] if ".mp3?" in url)
        package["files"].remove(url)
        del package["hashes"][url]
        package["bytes"] = sum(item["bytes"] for item in package["hashes"].values())
        package["audioCount"] = 1
        package["complete"] = False
        self.refresh()
        self.reject("精确运行时 URL")

    def test_wrong_package_hash_rejected_with_fresh_version(self):
        records = self.data["animations"]["fixture"]["hashes"]
        records[next(iter(records))]["sha256"] = "0" * 64
        self.refresh()
        self.reject("hashes 的 URL/sha256/bytes")

    def test_wrong_record_bytes_rejected(self):
        records = self.data["animations"]["fixture"]["hashes"]
        records[next(iter(records))]["bytes"] += 1
        self.reject("hashes 的 URL/sha256/bytes")

    def test_wrong_version_query_rejected_with_fresh_fingerprint(self):
        package = self.data["animations"]["fixture"]
        old = next(url for url in package["files"] if ".mp3?" in url)
        new = old.split("?")[0] + "?v=" + "0" * 12
        package["files"] = sorted(new if url == old else url for url in package["files"])
        package["hashes"][new] = package["hashes"].pop(old)
        self.refresh()
        self.reject("精确运行时 URL")

    def test_wrong_timeline_version_query_rejected(self):
        name = "animations/fixture/timeline.json"
        timeline = json.loads((self.root / name).read_text())
        timeline["languages"]["zh"]["clips"][0]["audioUrl"] += "&alias=1"
        self.write_json(name, timeline)
        self.refresh()
        self.reject("音频 URL 必须使用精确 hash")

    def test_out_of_scope_path_rejected_without_opening_it(self):
        self.data["animations"]["fixture"]["files"].append("animations/../secret.txt")
        self.reject("非规范或越界")

    def test_unknown_query_does_not_alias_exact_key(self):
        package = self.data["animations"]["fixture"]
        url = next(url for url in package["files"] if ".mp3?" in url)
        package["files"].append(url + "&unknown=1")
        self.reject("非规范或越界")

    def test_duplicate_audio_url_rejected(self):
        package = self.data["animations"]["fixture"]
        package["files"].append(next(url for url in package["files"] if ".mp3?" in url))
        self.refresh()
        self.reject("精确运行时 URL")

    def test_missing_core_in_shell_rejected_even_after_budget_refresh(self):
        self.data["shell"].remove("animations/fixture/index.html")
        self.refresh()
        self.reject("core 未完整进入 shell")

    def test_missing_whole_package_rejected_even_with_new_version(self):
        self.data["animations"] = {}
        self.refresh()
        self.reject("时间轴目录不一致")

    def test_wrong_audio_source_binding_rejected(self):
        self.write_json("animations/fixture/audio-manifest.json", {"trackCount": 0, "tracks": {}})
        self.reject("音频清单 hash 不符")

    def test_omitted_timeline_clip_rejected_against_audio_source(self):
        name = "animations/fixture/timeline.json"
        timeline = json.loads((self.root / name).read_text())
        timeline["languages"]["zh"]["clips"] = []
        self.write_json(name, timeline)
        self.refresh()
        self.reject("时间轴未就绪")

    def test_extra_old_chunk_is_not_current_inventory(self):
        self.write("animations/assets/player-stale.js", b"old output")
        self.assertEqual([], self.run_assets())

    def test_shared_core_and_cross_package_assets_count_only_once(self):
        self.add_package("second")
        self.refresh()
        self.assertEqual([], self.run_assets())
        self.assertEqual(self.data["total"], qa_pwa.expected_asset_total(self.data))
        naive = sum(self.record(url)["bytes"] for url in self.data["shell"])
        naive += sum(package["bytes"] for package in self.data["animations"].values())
        self.assertGreater(naive, self.data["total"])
        self.data["total"] = naive
        self.reject("去重实际体积不符")

    def test_one_byte_wrong_total_is_not_a_tolerated_warning(self):
        self.data["total"] += 1
        self.reject("去重实际体积不符")

    def test_duplicate_shell_core_rejected(self):
        self.data["shell"].append("animations/index.html")
        self.refresh()
        self.reject("shell 清单有重复 URL")

    def test_wrong_package_size_rejected(self):
        self.data["animations"]["fixture"]["bytes"] += 1
        self.reject("动画包 bytes")

    def test_historical_manifest_without_animations_keeps_book_contract(self):
        (self.root / "animations/build-manifest.json").unlink()
        self.data["shell"] = ["offline.html"]
        self.data.pop("animations")
        self.write("books/old/audio/line.mp3", b"old")
        self.data["books"] = {"old": {"files": ["books/old/audio/line.mp3?v=1"], "bytes": 3}}
        self.refresh()
        self.assertEqual([], self.run_assets())
        self.data["books"]["old"]["files"] = ["books/old/audio/line.mp3?v=2"]
        self.refresh()
        self.reject("音频没带 ?v=1")

    def test_manifest_claiming_animation_without_build_fails(self):
        (self.root / "animations/build-manifest.json").unlink()
        self.reject("缺少 animations/build-manifest.json")


if __name__ == "__main__":
    unittest.main(verbosity=2)
