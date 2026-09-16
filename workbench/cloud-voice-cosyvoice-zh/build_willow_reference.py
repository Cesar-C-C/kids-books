"""Combine same-speaker AISHELL-3 clips into one adequate prompt."""

import json
from pathlib import Path

import numpy as np
import soundfile as sf


root = Path(__file__).resolve().parent
parts = json.loads((root / "willow-parts.json").read_text(encoding="utf-8"))
audio = []
sample_rate = None
for part in parts:
    samples, current_rate = sf.read(root / "references" / "willow-parts" / part["file"])
    if sample_rate is None:
        sample_rate = current_rate
    if current_rate != sample_rate:
        raise RuntimeError("Willow prompt parts use different sample rates")
    audio.extend([samples, np.zeros(round(sample_rate * 0.14))])

combined = np.concatenate(audio)
target = root / "references" / "mandarin-selected" / "willow__SSB0534_combined.wav"
sf.write(target, combined, sample_rate, subtype="PCM_16")

sources_path = root / "selected-reference-sources.json"
sources = json.loads(sources_path.read_text(encoding="utf-8"))
willow = sources["cast"]["willow"]
willow["reference"] = "references/mandarin-selected/" + target.name
willow["transcript"] = "，".join(part["transcript"] for part in parts) + "。"
willow["source_paths"] = [
    "test/wav/SSB0534/" + part["file"] for part in parts
]
willow["bytes"] = target.stat().st_size
sources_path.write_text(json.dumps(sources, ensure_ascii=False, indent=2), encoding="utf-8")
print(target)
