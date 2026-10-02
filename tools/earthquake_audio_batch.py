"""Hash-bound Fun-CosyVoice3 batch generation for the frozen earthquake set."""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
import unicodedata
from pathlib import Path

RUNTIME = Path(r"C:\ProgramData\FunCosyVoice3")
SITE = RUNTIME / ".venv" / "Lib" / "site-packages"
MODEL = RUNTIME / "models" / "Fun-CosyVoice3-0.5B"
RATE = 24000
OWNERS = {
    "book": ("books/earthquake/story.json", "books/earthquake/audio-manifest.json", "books/earthquake"),
    "lab": ("labs/earthquake/content.json", "labs/earthquake/audio-manifest.json", "labs/earthquake"),
}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def encode_powershell_command(command: str) -> str:
    """Encode PowerShell source using the UTF-16LE payload required by -EncodedCommand."""
    return base64.b64encode(command.encode("utf-16le")).decode("ascii")


def next_attempt_directory(work: Path, max_attempts: int = 5) -> Path:
    for attempt_number in range(1, max_attempts + 1):
        attempt = work / f"batch-attempt-{attempt_number}"
        if not attempt.exists():
            return attempt
    raise ValueError("More than five failed attempts are archived; inspect them before retrying")


def native_sha256_files(paths: list[Path]) -> dict[str, str]:
    """Re-hash current files with Windows' native hasher; no cached digest is trusted."""
    literals = ",".join("'" + str(path).replace("'", "''") + "'" for path in paths)
    command = (
        f"$paths=@({literals}); "
        "Import-Module Microsoft.PowerShell.Utility -ErrorAction Stop; "
        "Get-FileHash -LiteralPath $paths -Algorithm SHA256 | "
        "Select-Object @{Name='name';Expression={Split-Path -Leaf $_.Path}},Hash | "
        "ConvertTo-Json -Compress"
    )
    result = subprocess.run(
        ["powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive", "-EncodedCommand", encode_powershell_command(command)],
        check=False, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=600,
    )
    if result.returncode != 0:
        raise ValueError("Windows native hasher failed: " + result.stderr.strip())
    parsed = json.loads(result.stdout)
    if isinstance(parsed, dict):
        parsed = [parsed]
    hashes = {item["name"]: item["Hash"].lower() for item in parsed}
    if len(hashes) != len(paths) or set(hashes) != {path.name for path in paths}:
        raise ValueError("Windows native hasher returned an incomplete file set")
    return hashes


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def validate_authority(approval, stage, manifest_set_sha256):
    """Check scope and content binding; this function never grants approval."""
    import re

    if approval.get("frozen") is not True:
        raise ValueError("Content freeze required")
    if approval.get("topicId") != "earthquake":
        raise ValueError("Wrong approval topic")
    if not re.fullmatch(r"[a-f0-9]{64}", manifest_set_sha256 or ""):
        raise ValueError("Invalid manifest hash")
    if approval.get("manifestSetSha256") != manifest_set_sha256:
        raise ValueError("Manifest hash changed")
    if stage not in ("sample", "batch"):
        raise ValueError("Unknown generation stage")
    if approval.get(stage + "Authorized") is not True:
        raise ValueError(stage + " authorization required")
    if not isinstance(approval.get("evidence"), str) or not approval["evidence"].strip():
        raise ValueError("User authorization evidence required")
    if stage == "batch":
        accepted = approval.get("acceptedSamples")
        if not isinstance(accepted, list) or not accepted:
            raise ValueError("New sample acceptance required")
        for sample in accepted:
            if not isinstance(sample, dict) or not sample.get("key"):
                raise ValueError("Invalid accepted sample")
            for field in ("fileSha256", "utteranceSha256", "profileSha256"):
                if not re.fullmatch(r"[a-f0-9]{64}", sample.get(field, "")):
                    raise ValueError("Invalid sample hash: " + field)


def normalized_source_hash(path: Path) -> str:
    text = unicodedata.normalize("NFC", path.read_text(encoding="utf-8")).replace("\r\n", "\n")
    return sha256_text(text)


def read_inputs(root: Path):
    work = root / "workbench" / "earthquake-audio-v1"
    freeze = load_json(work / "freeze.json")
    profile = load_json(work / "voice-profile.json")
    approval_path = work / "user-approval.json"
    approval = load_json(approval_path)
    validation = load_json(work / "audition-validation.json")
    if validation.get("userAcceptance") != "accepted-for-batch-generation":
        raise ValueError("The audition set has not been accepted")
    if validation.get("userAcceptanceEvidence") != approval.get("evidence", "").split(": ")[-1]:
        # Approval evidence contains a short source prefix; bind its exact user quote separately below.
        if "试听通过，开始批量生成" not in approval.get("evidence", ""):
            raise ValueError("Sample acceptance evidence does not match the audition record")

    manifests = {}
    entries = []
    source_hashes = {}
    for owner, (source_rel, manifest_rel, _base) in OWNERS.items():
        source_path, manifest_path = root / source_rel, root / manifest_rel
        source_hash = normalized_source_hash(source_path)
        frozen_source = freeze["sources"][owner]
        if frozen_source.get("ownerConfirmed") is not True or frozen_source.get("sourceSha256") != source_hash:
            raise ValueError(f"{owner} frozen source changed")
        manifest = load_json(manifest_path)
        if manifest.get("owner") != owner or manifest.get("sourceSha256") != source_hash:
            raise ValueError(f"{owner} manifest is stale")
        if manifest.get("contentVersion") != frozen_source.get("contentVersion"):
            raise ValueError(f"{owner} content version changed")
        for entry in manifest.get("entries", []):
            if entry.get("owner") != owner or entry.get("status") not in ("pending", "ready"):
                raise ValueError(f"Invalid {owner} manifest entry: {entry.get('key')}")
            entries.append(entry)
        manifests[owner] = manifest
        source_hashes[owner] = source_hash

    keys = [entry["key"] for entry in entries]
    if len(keys) != len(set(keys)):
        raise ValueError("Duplicate entry key across manifests")
    pairs = [[entry["key"], entry["utteranceSha256"]] for entry in entries]
    manifest_set_sha256 = sha256_text(json.dumps(pairs, ensure_ascii=False, separators=(",", ":")))
    validate_authority(approval, "batch", manifest_set_sha256)
    profile_sha = sha256_file(work / "voice-profile.json")
    if any(sample.get("profileSha256") != profile_sha for sample in approval["acceptedSamples"]):
        raise ValueError("Accepted sample voice profile changed")
    if approval.get("publicationAuthorized") is not False:
        raise ValueError("This batch approval does not authorize publication")

    sample_by_key = {row["key"]: row for row in validation.get("entries", [])}
    accepted_by_key = {row["key"]: row for row in approval["acceptedSamples"]}
    if set(accepted_by_key) != set(sample_by_key):
        raise ValueError("Approval must bind the full audition set")
    entry_by_key = {entry["key"]: entry for entry in entries}
    for key, accepted in accepted_by_key.items():
        sample = sample_by_key[key]
        if key not in entry_by_key or accepted.get("utteranceSha256") != entry_by_key[key]["utteranceSha256"]:
            raise ValueError(f"Accepted sample utterance changed: {key}")
        sample_file = work / sample["composite"]
        if sha256_file(sample_file) != accepted.get("fileSha256") or accepted["fileSha256"] != sample.get("compositeSha256"):
            raise ValueError(f"Accepted sample file changed: {key}")
    return work, freeze, profile, approval, manifests, entries, source_hashes, manifest_set_sha256, profile_sha, sample_by_key


def contained_output(root: Path, entry: dict) -> Path:
    owner = entry["owner"]
    base = (root / OWNERS[owner][2]).resolve()
    relative = Path(entry["output"])
    if relative.is_absolute() or ".." in relative.parts or relative.parts[:1] != ("audio",):
        raise ValueError(f"Unsafe output path: {entry['output']}")
    output = (base / relative).resolve()
    if not output.is_relative_to(base):
        raise ValueError(f"Output escaped owner directory: {entry['output']}")
    return output


def signature_for(lock_hash: str, entry: dict, index: int, role: str, reference_hash: str) -> str:
    payload = {
        "lockSha256": lock_hash,
        "key": entry["key"],
        "index": index,
        "role": role,
        "sourceText": entry["segments"][index]["sourceText"],
        "spokenText": entry["segments"][index]["spokenText"],
        "referenceSha256": reference_hash,
    }
    return sha256_text(json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")))


def atomic_copy(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(destination.name + ".tmp")
    shutil.copyfile(source, temporary)
    os.replace(temporary, destination)


def valid_audio(path: Path, sf, np, *, is_mp3: bool = False):
    audio, sample_rate = sf.read(str(path), dtype="float32", always_2d=True)
    if sample_rate != RATE or audio.shape[1] != 1 or audio.shape[0] == 0:
        raise ValueError(f"Wrong audio shape/rate: {path}")
    if not np.isfinite(audio).all():
        raise ValueError(f"Non-finite audio: {path}")
    rms = float(np.sqrt(np.mean(np.square(audio.astype(np.float64)))))
    peak = float(np.max(np.abs(audio)))
    if rms <= 0.001 or peak >= (1.0 if is_mp3 else 0.95):
        raise ValueError(f"Silent or clipped audio: {path}")
    return {
        "sampleRate": int(sample_rate), "channels": int(audio.shape[1]),
        "frames": int(audio.shape[0]), "seconds": round(len(audio) / sample_rate, 4),
        "rms": rms, "peak": peak, "bytes": path.stat().st_size,
        "sha256": sha256_file(path),
    }


def make_generation_lock(root, work, profile, approval, source_hashes, manifest_set_sha256, profile_sha):
    model_files = [MODEL / name for name in (
        "cosyvoice3.yaml", "llm.pt", "flow.pt", "hift.pt", "campplus.onnx", "speech_tokenizer_v3.onnx"
    )]
    runtime_files = [RUNTIME / "CosyVoice" / "cosyvoice" / "cli" / name for name in ("cosyvoice.py", "frontend.py", "model.py")]
    for path in model_files + runtime_files:
        if not path.is_file():
            raise ValueError(f"Missing locked runtime input: {path}")
    runtime_hashes = native_sha256_files(model_files + runtime_files)
    references = {}
    for role, languages in profile["references"].items():
        references[role] = {}
        for lang, ref in languages.items():
            path = Path(ref["path"])
            if not path.is_file() or sha256_file(path) != ref["sha256"]:
                raise ValueError(f"Reference changed or missing: {path}")
            references[role][lang] = {"path": str(path), "sha256": ref["sha256"], "transcript": ref["transcript"]}
    return {
        "schemaVersion": 1,
        "topicId": "earthquake",
        "manifestSetSha256": manifest_set_sha256,
        "sourceSha256": source_hashes,
        "profileSha256": profile_sha,
        "approvalSha256": sha256_file(work / "user-approval.json"),
        "acceptedSamples": approval["acceptedSamples"],
        "generatorSha256": sha256_file(Path(__file__)),
        "modelHashes": {path.name: runtime_hashes[path.name] for path in model_files},
        "runtimeCodeHashes": {path.name: runtime_hashes[path.name] for path in runtime_files},
        "references": references,
        "inferenceMode": profile["inferenceMode"],
        "precision": "CUDA FP32",
        "sampleRate": RATE,
        "channels": 1,
        "speed": profile["speed"],
        "textFrontend": profile["textFrontend"],
        "sampleAccepted": True,
        "batchAuthorized": True,
        "publicationAuthorized": False,
    }


def generate_batch(root: Path) -> dict:
    (work, freeze, profile, approval, manifests, entries, source_hashes,
     manifest_set_sha256, profile_sha, sample_by_key) = read_inputs(root)
    print("BATCH_PHASE runtime-hash:start", flush=True)
    lock = make_generation_lock(root, work, profile, approval, source_hashes, manifest_set_sha256, profile_sha)
    print("BATCH_PHASE runtime-hash:done", flush=True)
    lock_path = work / "generation-lock.json"
    if lock_path.exists():
        if load_json(lock_path) != lock:
            report_before = work / "batch-validation.json"
            if report_before.exists() or any(contained_output(root, entry).exists() for entry in entries):
                raise ValueError("Generation inputs changed after batch outputs exist; refusing continuation")
            attempt = next_attempt_directory(work)
            attempt.mkdir(parents=True)
            os.replace(lock_path, attempt / "generation-lock.json")
            for stale in (work / "batch-clips", work / "delivery-temp"):
                if stale.exists():
                    os.replace(stale, attempt / stale.name)
            print(f"ARCHIVED_UNVERIFIED_ATTEMPT {attempt}", flush=True)
    if not lock_path.exists():
        save_json(lock_path, lock)
    lock_hash = sha256_file(lock_path)

    work_audio = work / "batch-clips"
    delivery = work / "delivery-temp"
    report_path = work / "batch-validation.json"
    work_audio.mkdir(parents=True, exist_ok=True)
    delivery.mkdir(parents=True, exist_ok=True)
    if report_path.exists():
        previous = load_json(report_path)
        if previous.get("generationLockSha256") != lock_hash:
            raise ValueError("Batch report belongs to a different lock")
        results = {item["key"]: item for item in previous.get("entries", [])}
    else:
        results = {}

    os.environ.setdefault("HF_HOME", str(work / ".runtime-cache" / "huggingface"))
    os.environ.setdefault("MODELSCOPE_CACHE", str(work / ".runtime-cache" / "modelscope"))
    os.environ.setdefault("MPLCONFIGDIR", str(work / ".runtime-cache" / "matplotlib"))
    os.environ.setdefault("NUMBA_CACHE_DIR", str(work / ".runtime-cache" / "numba"))
    os.environ.update(WETEXT_MODEL_DIR=str(RUNTIME / "models" / "wetext"), HF_HUB_OFFLINE="1", TRANSFORMERS_OFFLINE="1", OMP_NUM_THREADS="4")
    for key in ("HF_HOME", "MODELSCOPE_CACHE", "MPLCONFIGDIR", "NUMBA_CACHE_DIR"):
        Path(os.environ[key]).mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("PYTHONUTF8", "1")
    sys.dont_write_bytecode = True
    sys.path[:0] = [str(SITE), str(RUNTIME / "CosyVoice"), str(RUNTIME / "CosyVoice" / "third_party" / "Matcha-TTS")]
    dll_handles = []
    for directory in (RUNTIME / ".venv" / "Library" / "bin", SITE / "torch" / "lib"):
        if directory.exists() and hasattr(os, "add_dll_directory"):
            dll_handles.append(os.add_dll_directory(str(directory)))
    print("BATCH_PHASE runtime-import:start", flush=True)
    import numpy as np
    import soundfile as sf
    import torch
    from cosyvoice.cli.cosyvoice import AutoModel
    torch.set_num_threads(4)
    if not torch.cuda.is_available():
        raise ValueError("CUDA is unavailable; refusing CPU or alternate-engine fallback")
    print("BATCH_PHASE runtime-import:done CUDA=available", flush=True)
    model = None
    accepted = {item["key"]: item for item in approval["acceptedSamples"]}
    audition_by_key = {item["key"]: item for item in load_json(work / "audition-validation.json")["entries"]}
    total = len(entries)

    for number, entry in enumerate(entries, 1):
        key = entry["key"]
        output = contained_output(root, entry)
        previous = results.get(key)
        if previous:
            if previous.get("status") != "verified-ready" or not output.is_file() or sha256_file(output) != previous.get("fileSha256"):
                raise ValueError(f"Existing progress/output mismatch: {key}")
            print(f"RESUME {number}/{total} {key}", flush=True)
            continue
        if output.exists():
            raise ValueError(f"Refusing to overwrite untracked audio: {output}")

        if key in accepted:
            audition = audition_by_key[key]
            source_wav = work / audition["composite"]
            accepted_sample = accepted[key]
            if sha256_file(source_wav) != accepted_sample["fileSha256"]:
                raise ValueError(f"Accepted audition WAV changed: {key}")
            wav_path = work_audio / (entry["id"] + ".wav")
            if wav_path.exists() and sha256_file(wav_path) != accepted_sample["fileSha256"]:
                raise ValueError(f"Cached audition WAV changed: {key}")
            if not wav_path.exists():
                atomic_copy(source_wav, wav_path)
            roles = [segment["role"] for segment in entry["segments"]]
            segment_log = [{"role": segment["role"], "sourceText": segment["sourceText"], "spokenText": segment["spokenText"], "reusedAcceptedSample": True} for segment in entry["segments"]]
            print(f"REUSE_ACCEPTED_SAMPLE {key}", flush=True)
        else:
            wav_path = work_audio / (entry["id"] + ".wav")
            segment_audio = []
            segment_log = []
            roles = []
            for index, segment in enumerate(entry["segments"]):
                role, lang = segment["role"], entry["lang"]
                if role not in profile["references"]:
                    raise ValueError(f"Unknown audio role {role} in {key}")
                reference = profile["references"][role][lang]
                reference_path = Path(reference["path"])
                signature = signature_for(lock_hash, entry, index, role, reference["sha256"])
                segment_path = work_audio / f"{entry['id']}-{index:02d}-{role}.wav"
                metadata_path = segment_path.with_suffix(".json")
                if segment_path.exists() or metadata_path.exists():
                    if not (segment_path.exists() and metadata_path.exists()):
                        raise ValueError(f"Incomplete cached segment pair for {key} / {index}")
                    metadata = load_json(metadata_path)
                    if metadata.get("signature") != signature or metadata.get("sha256") != sha256_file(segment_path):
                        raise ValueError(f"Cached segment no longer matches lock: {key} / {index}")
                    audio, rate = sf.read(str(segment_path), dtype="float32")
                    if rate != RATE or audio.ndim != 1 or not np.isfinite(audio).all():
                        raise ValueError(f"Invalid cached segment: {segment_path}")
                    gen_seconds = metadata["generationSeconds"]
                    seed = metadata["seed"]
                else:
                    if model is None:
                        print("BATCH_PHASE model-load:start", flush=True)
                        model = AutoModel(model_dir=str(MODEL), fp16=False)
                        print("BATCH_PHASE model-load:done", flush=True)
                    seed_source = f"{manifest_set_sha256}|{key}|{index}|{role}|{segment['spokenText']}"
                    seed = int.from_bytes(hashlib.sha256(seed_source.encode("utf-8")).digest()[:4], "big") % 2_000_000_000
                    torch.manual_seed(seed)
                    torch.cuda.manual_seed_all(seed)
                    direction = profile["directions"][role]
                    if entry["itemId"] == "result-arrival":
                        direction += " P 和 S 是英文字母缩写，分别按字母名 pee 和 ess 清楚读出。"
                    instruction = "You are a helpful assistant. " + direction + "<|endofprompt|>"
                    print(f"BATCH_PHASE synth:start {key} {index + 1}/{len(entry['segments'])} {role}", flush=True)
                    started = time.perf_counter()
                    generated = [result["tts_speech"].cpu() for result in model.inference_instruct2(
                        segment["spokenText"], instruction, str(reference_path), stream=False,
                        speed=profile["speed"], text_frontend=profile["textFrontend"]
                    )]
                    gen_seconds = time.perf_counter() - started
                    if not generated:
                        raise ValueError(f"No synthesis output for {key} / {index}")
                    audio = torch.cat(generated, dim=1).squeeze().numpy()
                    if audio.ndim != 1 or not np.isfinite(audio).all():
                        raise ValueError(f"Invalid synthesized samples for {key} / {index}")
                    rms_before = float(np.sqrt(np.mean(audio.astype(np.float64) ** 2)))
                    peak_before = float(np.max(np.abs(audio)))
                    if rms_before <= 0.001:
                        raise ValueError(f"Silent synthesis for {key} / {index}")
                    gain = min(0.095 / rms_before, 0.94 / max(peak_before, 0.001))
                    audio = audio * gain
                    sf.write(str(segment_path), audio, RATE, subtype="PCM_16")
                    segment_info = valid_audio(segment_path, sf, np)
                    save_json(metadata_path, {"signature": signature, "sha256": segment_info["sha256"], "seed": seed, "generationSeconds": round(gen_seconds, 2), "gain": gain})
                    audio, rate = sf.read(str(segment_path), dtype="float32")
                    if rate != RATE or audio.ndim != 1:
                        raise ValueError(f"Persisted segment has wrong format: {segment_path}")
                segment_audio.append(audio)
                roles.append(role)
                segment_log.append({
                    "role": role, "sourceText": segment["sourceText"], "spokenText": segment["spokenText"],
                    "referenceSha256": reference["sha256"], "seed": seed,
                    "file": str(segment_path.relative_to(work)).replace("\\", "/"),
                    "fileSha256": sha256_file(segment_path), "generationSeconds": round(gen_seconds, 2),
                })
                print(f"SEGMENT {number}/{total} {key} {index + 1}/{len(entry['segments'])} {role}", flush=True)
            if wav_path.exists():
                sidecar = load_json(wav_path.with_suffix(".json")) if wav_path.with_suffix(".json").exists() else {}
                if sidecar.get("lockSha256") != lock_hash or sidecar.get("wavSha256") != sha256_file(wav_path):
                    raise ValueError(f"Cached composite WAV does not match lock: {key}")
            else:
                silence = np.zeros(round(RATE * 0.18), dtype=np.float32)
                complete = np.concatenate([np.zeros(round(RATE * 0.1), dtype=np.float32), *[item for part in segment_audio for item in (part, silence)]])
                sf.write(str(wav_path), complete, RATE, subtype="PCM_16")
                wav_meta = valid_audio(wav_path, sf, np)
                save_json(wav_path.with_suffix(".json"), {"lockSha256": lock_hash, "wavSha256": wav_meta["sha256"]})

        wav_meta = valid_audio(wav_path, sf, np)
        mp3_path = delivery / entry["owner"] / f"{entry['id']}.mp3"
        mp3_path.parent.mkdir(parents=True, exist_ok=True)
        wav_data, wav_rate = sf.read(str(wav_path), dtype="float32")
        if wav_rate != RATE or wav_data.ndim != 1:
            raise ValueError(f"Composite WAV has wrong format: {key}")
        sf.write(str(mp3_path), wav_data, wav_rate, format="MP3", subtype="MPEG_LAYER_III")
        mp3_meta = valid_audio(mp3_path, sf, np, is_mp3=True)
        if abs(mp3_meta["seconds"] - wav_meta["seconds"]) > 0.08:
            raise ValueError(f"MP3 duration differs from source WAV: {key}")
        decoded_info = sf.info(str(mp3_path))
        if decoded_info.format != "MP3" or decoded_info.subtype != "MPEG_LAYER_III":
            raise ValueError(f"MP3 codec verification failed: {key}")

        output.parent.mkdir(parents=True, exist_ok=True)
        atomic_copy(mp3_path, output)
        final_meta = valid_audio(output, sf, np, is_mp3=True)
        if final_meta["sha256"] != mp3_meta["sha256"]:
            raise ValueError(f"Copied MP3 hash mismatch: {key}")
        record = {
            "key": key, "status": "verified-ready", "itemId": entry["itemId"], "kind": entry["kind"], "lang": entry["lang"],
            "textSha256": entry["textSha256"], "utteranceSha256": entry["utteranceSha256"], "roles": roles,
            "segments": segment_log, "wav": wav_meta, "mp3": final_meta,
            "output": str(output.relative_to(root)).replace("\\", "/"), "fileSha256": final_meta["sha256"],
            "voiceProfileSha256": profile_sha, "auditionProfileAccepted": True,
        }
        results[key] = record
        ordered_results = [results[e["key"]] for e in entries if e["key"] in results]
        save_json(report_path, {
            "topicId": "earthquake", "generationLockSha256": lock_hash,
            "manifestSetSha256": manifest_set_sha256, "batchAuthorized": True,
            "publicationAuthorized": False, "completed": len(ordered_results), "expected": total,
            "entries": ordered_results,
        })
        print(f"READY {len(results)}/{total} {key} {mp3_meta['seconds']}s {mp3_meta['bytes']}B", flush=True)

    if len(results) != total:
        raise ValueError(f"Incomplete batch: {len(results)} / {total}")
    for owner, manifest in manifests.items():
        for entry in manifest["entries"]:
            record = results[entry["key"]]
            entry["status"] = "ready"
            entry["fileSha256"] = record["fileSha256"]
        save_json(root / OWNERS[owner][1], manifest)
    report = load_json(report_path)
    report["status"] = "ready"
    report["allExpectedEntriesReady"] = True
    report["humanAcceptance"] = "Voice profiles and pronunciation were approved on the exact audition set; every batch output passed per-file source/hash/format/finite/non-silent/duration checks."
    report["publicationAuthorized"] = False
    save_json(report_path, report)
    return {"status": "ready", "entries": total, "sourceHashes": source_hashes, "manifestSetSha256": manifest_set_sha256, "publicationAuthorized": False}


def verify_batch(root: Path) -> dict:
    work = root / "workbench" / "earthquake-audio-v1"
    report = load_json(work / "batch-validation.json")
    lock = load_json(work / "generation-lock.json")
    if report.get("generationLockSha256") != sha256_file(work / "generation-lock.json"):
        raise ValueError("Validation report no longer matches generation lock")
    if report.get("completed") != report.get("expected") or report.get("status") != "ready":
        raise ValueError("Batch is not complete")
    total = 0
    for owner, (_source, manifest_rel, _base) in OWNERS.items():
        manifest = load_json(root / manifest_rel)
        if manifest.get("sourceSha256") != lock["sourceSha256"][owner]:
            raise ValueError(f"Frozen source hash mismatch: {owner}")
        for entry in manifest["entries"]:
            output = contained_output(root, entry)
            record = next((row for row in report["entries"] if row["key"] == entry["key"]), None)
            if entry.get("status") != "ready" or not record or not output.is_file():
                raise ValueError(f"Missing ready output: {entry['key']}")
            actual = sha256_file(output)
            if actual != entry.get("fileSha256") or actual != record.get("fileSha256"):
                raise ValueError(f"File hash mismatch: {entry['key']}")
            total += 1
    return {"status": "verified", "entries": total, "manifestSetSha256": report["manifestSetSha256"], "publicationAuthorized": False}


def prepare(root: Path) -> dict:
    work, _freeze, _profile, _approval, manifests, entries, source_hashes, manifest_set_sha256, _profile_sha, _samples = read_inputs(root)
    return {
        "status": "authorized-to-generate",
        "entries": len(entries),
        "owners": {owner: len(manifest["entries"]) for owner, manifest in manifests.items()},
        "sourceHashes": source_hashes,
        "manifestSetSha256": manifest_set_sha256,
        "sampleAccepted": True,
        "publicationAuthorized": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", choices=("prepare", "batch", "verify"), default="prepare")
    parser.add_argument("--root", default=".")
    args = parser.parse_args()
    root = Path(args.root).resolve()
    try:
        if args.stage == "prepare":
            result = prepare(root)
        elif args.stage == "batch":
            result = generate_batch(root)
        else:
            result = verify_batch(root)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except Exception as error:
        print(f"Earthquake audio {args.stage} blocked: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
