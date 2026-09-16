"""Rank native-Mandarin prompt candidates against the current English cast."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal
from scipy.optimize import linear_sum_assignment


ROOT = Path(__file__).resolve().parent
ENGLISH = ROOT / "references" / "english-full"
MANDARIN = ROOT / "references" / "mandarin-candidates"

CROPS = {
    "narrator": (2.04, 7.34),
    "didi": (0.0, 6.78),
    "frog": (1.01, 9.44),
    "dust": (2.87, 8.89),
    "neighbor": (0.0, 12.0),
    "willow": (0.0, 9.02),
    "worm": (1.83, 13.83),
}

ROLE_RULES = {
    "narrator": ("female", {"B", "C", "D"}),
    "didi": ("female", {"A", "B"}),
    "frog": ("male", {"B", "C"}),
    "dust": ("female", {"A", "B"}),
    "neighbor": ("female", {"B", "C"}),
    "willow": ("female", {"C", "D"}),
    "worm": ("male", {"C", "D"}),
}


def load_audio(path: Path, crop: tuple[float, float] | None = None):
    audio, sr = sf.read(path, always_2d=False)
    if audio.ndim > 1:
        audio = np.mean(audio, axis=1)
    if crop:
        audio = audio[round(crop[0] * sr) : round(crop[1] * sr)]
    if sr != 16000:
        audio = signal.resample_poly(audio, 16000, sr)
        sr = 16000
    audio = audio.astype(np.float32)
    audio -= np.mean(audio)
    active = np.flatnonzero(np.abs(audio) >= max(np.max(np.abs(audio)) * 0.018, 1e-5))
    if active.size:
        pad = round(0.08 * sr)
        audio = audio[max(0, active[0] - pad) : min(len(audio), active[-1] + pad)]
    return audio, sr


def hz_to_mel(hz):
    return 2595.0 * np.log10(1.0 + hz / 700.0)


def mel_to_hz(mel):
    return 700.0 * (10.0 ** (mel / 2595.0) - 1.0)


def mel_filterbank(sr, nfft, bands=24):
    edges = mel_to_hz(np.linspace(hz_to_mel(80), hz_to_mel(7600), bands + 2))
    freqs = np.fft.rfftfreq(nfft, 1.0 / sr)
    filters = np.zeros((bands, len(freqs)))
    for index in range(bands):
        left, center, right = edges[index : index + 3]
        filters[index] = np.maximum(
            0.0,
            np.minimum((freqs - left) / (center - left), (right - freqs) / (right - center)),
        )
    return filters


def median_pitch(audio, sr):
    frame_length, hop = round(0.04 * sr), round(0.02 * sr)
    low_lag, high_lag = round(sr / 450), round(sr / 70)
    values = []
    for start in range(0, max(1, len(audio) - frame_length), hop):
        frame = audio[start : start + frame_length]
        if len(frame) < frame_length or np.sqrt(np.mean(frame * frame)) < 0.006:
            continue
        frame = (frame - np.mean(frame)) * np.hanning(frame_length)
        correlation = signal.fftconvolve(frame, frame[::-1], mode="full")[frame_length - 1 :]
        lag = low_lag + int(np.argmax(correlation[low_lag : high_lag + 1]))
        if correlation[lag] > 0.18 * correlation[0]:
            values.append(sr / lag)
    return float(np.median(values)) if values else 140.0


def features(audio: np.ndarray, sr: int):
    nfft = 512
    _, _, spectrum = signal.stft(audio, fs=sr, nperseg=400, noverlap=240, nfft=nfft, boundary=None)
    power = np.abs(spectrum) ** 2
    bands = np.log(np.maximum(mel_filterbank(sr, nfft) @ power, 1e-10))
    return np.concatenate([[np.log(median_pitch(audio, sr))], np.mean(bands, axis=1), np.std(bands, axis=1)])


sources = json.loads((ROOT / "candidate-sources.json").read_text(encoding="utf-8"))
records = []
for source in sources:
    audio, sr = load_audio(MANDARIN / f"{source['speaker']}.wav")
    records.append({**source, "duration": round(len(audio) / sr, 3), "features": features(audio, sr)})

targets = {}
for role, crop in CROPS.items():
    audio, sr = load_audio(ENGLISH / f"{role}.wav", crop)
    targets[role] = {"duration": round(len(audio) / sr, 3), "features": features(audio, sr)}

all_vectors = np.stack([r["features"] for r in records] + [v["features"] for v in targets.values()])
scale = np.std(all_vectors, axis=0)
scale[scale < 1e-6] = 1.0

roles = list(CROPS)
cost = np.full((len(roles), len(records)), 1e6)
ranked = {}
for role_index, role in enumerate(roles):
    gender, ages = ROLE_RULES[role]
    target = targets[role]["features"]
    scored = []
    for candidate_index, record in enumerate(records):
        if record["gender"] != gender or record["age"] not in ages:
            continue
        delta = (record["features"] - target) / scale
        score = float(np.sqrt(np.mean(delta * delta)))
        if record["duration"] < 2.5:
            score += (2.5 - record["duration"]) * 0.15
        cost[role_index, candidate_index] = score
        scored.append((score, record))
    ranked[role] = [
        {"speaker": r["speaker"], "score": round(s, 4), "age": r["age"], "gender": r["gender"], "accent": r["accent"], "duration": r["duration"], "transcript": r["transcript"]}
        for s, r in sorted(scored, key=lambda item: item[0])[:5]
    ]

row_indices, column_indices = linear_sum_assignment(cost)
selection = {
    roles[row]: {
        "speaker": records[column]["speaker"],
        "score": round(float(cost[row, column]), 4),
        "age": records[column]["age"],
        "gender": records[column]["gender"],
        "accent": records[column]["accent"],
        "duration": records[column]["duration"],
        "transcript": records[column]["transcript"],
    }
    for row, column in zip(row_indices, column_indices)
}

output = {
    "method": "gender-and-role constrained acoustic ranking using pitch, spectral and MFCC statistics",
    "english_crops": CROPS,
    "selection": selection,
    "top_five_per_role": ranked,
}
(ROOT / "candidate-analysis.json").write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(selection, ensure_ascii=False, indent=2))
