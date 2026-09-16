from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import sys


RUNTIME = Path(r"C:\ProgramData\FunCosyVoice3")
sys.path.insert(0, str(RUNTIME / ".venv" / "Lib" / "site-packages"))
_dll_handles = []
for _dll_dir in (RUNTIME / ".venv" / "Library" / "bin",):
    if _dll_dir.is_dir():
        _dll_handles.append(os.add_dll_directory(str(_dll_dir)))

import numpy as np
import soundfile as sf


ROOT = Path(__file__).resolve().parents[3]
WORK = Path(__file__).resolve().parent
STAGING = WORK / "final"
LIVE = ROOT / "books" / "cloud" / "audio"


def combined_hash(paths: list[Path]) -> str:
    digest = hashlib.sha256()
    for path in paths:
        digest.update(path.name.encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()


manifest = json.loads((WORK / "manifest.json").read_text(encoding="utf-8"))
zh_jobs = [job for job in manifest["jobs"] if job["lang"] == "zh"]
expected = {f'{job["track"]}.mp3' for job in zh_jobs}
staged = sorted(STAGING.glob("*.mp3"))
live_zh = sorted(LIVE.glob("*_zh.mp3"))
live_en = sorted(LIVE.glob("*_en.mp3"))
report = json.loads((WORK / "validation.json").read_text(encoding="utf-8"))

assert len(zh_jobs) == 93, len(zh_jobs)
assert len(expected) == 40, len(expected)
assert {path.name for path in staged} == expected
assert {path.name for path in live_zh} == expected
assert len(live_en) == 40, len(live_en)
assert set(report) == {path.stem for path in staged}

durations = []
for path in staged:
    audio, sample_rate = sf.read(path)
    assert sample_rate == 24000, (path.name, sample_rate)
    assert np.isfinite(audio).all(), path.name
    assert audio.size > 0, path.name
    rms = float(np.sqrt(np.mean(audio * audio)))
    duration = len(audio) / sample_rate
    assert rms >= 0.001, (path.name, rms)
    assert 0.3 <= duration <= 90, (path.name, duration)
    durations.append(duration)

print(json.dumps({
    "zh_jobs": len(zh_jobs),
    "zh_tracks": len(staged),
    "english_tracks": len(live_en),
    "english_sha256": combined_hash(live_en),
    "min_seconds": round(min(durations), 3),
    "max_seconds": round(max(durations), 3),
    "total_seconds": round(sum(durations), 3),
}, ensure_ascii=False))
