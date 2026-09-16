"""Resumable offline multi-character generation. Writes staging, never the live book.

Use the existing CosyVoice venv. --runtime points to its installation and --work
to a writable directory containing manifest.json and reference-sources.json.
"""
import argparse
import hashlib
import json
import os
import sys
import time
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('--runtime', required=True, type=Path)
p.add_argument('--work', required=True, type=Path)
p.add_argument('--limit', type=int, default=0)
p.add_argument('--language', choices=['all', 'zh', 'en'], default='all')
args = p.parse_args()
root, work = args.runtime.resolve(), args.work.resolve()
cache = work / 'cache'
for name in ['numba', 'matplotlib', 'huggingface', 'modelscope']:
    (cache / name).mkdir(parents=True, exist_ok=True)
os.environ.update(WETEXT_MODEL_DIR=str(root / 'models' / 'wetext'),
                  HF_HUB_OFFLINE='1', HF_HOME=str(cache / 'huggingface'),
                  MODELSCOPE_CACHE=str(cache / 'modelscope'),
                  MPLCONFIGDIR=str(cache / 'matplotlib'), NUMBA_CACHE_DIR=str(cache / 'numba'),
                  XDG_CACHE_HOME=str(cache), OMP_NUM_THREADS='4')
sys.dont_write_bytecode = True
sys.path[:0] = [str(root / 'CosyVoice'), str(root / 'CosyVoice' / 'third_party' / 'Matcha-TTS')]
import numpy as np
import soundfile as sf
import torch
torch.set_num_threads(4)
from cosyvoice.cli.cosyvoice import AutoModel
from cloud_voice_plan import resolve_reference, select_jobs

manifest = json.loads((work / 'manifest.json').read_text(encoding='utf-8'))
sources = json.loads((work / 'reference-sources.json').read_text(encoding='utf-8'))
jobs = select_jobs(manifest['jobs'], args.language)
if not jobs:
    raise RuntimeError('No jobs selected for language: ' + args.language)
clips = work / 'clips'
clips.mkdir(exist_ok=True)
progress_file = work / 'progress.json'
progress = json.loads(progress_file.read_text(encoding='utf-8')) if progress_file.exists() else {}
model = None
count = 0

def save_progress():
    tmp = progress_file.with_suffix('.tmp')
    tmp.write_text(json.dumps(progress, ensure_ascii=False, indent=2), encoding='utf-8')
    tmp.replace(progress_file)

for i, job in enumerate(jobs):
    ref = resolve_reference(sources['cast'][job['role']], job['lang'])
    if not ref:
        raise RuntimeError('Missing reference for %s/%s' % (job['role'], job['lang']))
    direction = manifest['directions'][job['role']]
    instruction = 'You are a helpful assistant. ' + direction + '<|endofprompt|>'
    signature = hashlib.sha256((json.dumps(job, sort_keys=True, ensure_ascii=False) + instruction).encode() + Path(ref).read_bytes()).hexdigest()
    target = clips / (job['id'] + '.wav')
    if progress.get(job['id'], {}).get('sha256') == signature and target.exists():
        continue
    if model is None:
        print('Loading verified local model, CUDA FP32', flush=True)
        model = AutoModel(model_dir=str(root / 'models' / 'Fun-CosyVoice3-0.5B'), fp16=False)
        print('MODEL_READY', flush=True)
    started = time.time()
    torch.manual_seed(7100 + i)
    chunks = [v['tts_speech'].cpu() for v in model.inference_instruct2(job['spokenText'], instruction, ref, stream=False)]
    if not chunks:
        raise RuntimeError('Empty model output: ' + job['id'])
    data = torch.cat(chunks, dim=1).squeeze().numpy()
    rms = float(np.sqrt(np.mean(data ** 2)))
    if not np.isfinite(data).all() or rms < 0.001:
        raise RuntimeError('Invalid or silent output: ' + job['id'])
    duration = len(data) / model.sample_rate
    if duration > max(18, len(job['spokenText']) * (1.1 if job['lang'] == 'zh' else .45)):
        raise RuntimeError('Suspect excessive duration: ' + job['id'])
    peak = float(np.abs(data).max())
    if peak > .95:
        data = data * (.95 / peak)
    temp = target.with_suffix('.tmp.wav')
    sf.write(temp, data, model.sample_rate, subtype='PCM_16')
    temp.replace(target)
    progress[job['id']] = {'sha256': signature, 'seconds': round(duration, 3), 'generation_seconds': round(time.time()-started, 2), 'role': job['role'], 'rms': rms, 'peak_before_normalization': peak}
    save_progress()
    count += 1
    print(json.dumps({'completed': len(progress), 'total': len(manifest['jobs']), 'id': job['id'], **progress[job['id']]}, ensure_ascii=False), flush=True)
    if args.limit and count >= args.limit:
        break

if all(j['id'] in progress and (clips / (j['id'] + '.wav')).exists() for j in jobs):
    tracks = {}
    for j in jobs:
        tracks.setdefault(j['track'], []).append(j)
    final = work / 'final'
    final.mkdir(exist_ok=True)
    report = {}
    for name, segments in tracks.items():
        parts = []
        for j in segments:
            a, sr = sf.read(clips / (j['id'] + '.wav'))
            rms = np.sqrt(np.mean(a*a))
            a = a * min(.095 / max(rms, .001), .94 / max(np.abs(a).max(), .001))
            parts.extend([a, np.zeros(round(sr*.18))])
        a = np.concatenate([np.zeros(round(sr*.10)), *parts])
        dest = final / (name+'.mp3')
        sf.write(dest, a, sr, format='MP3', subtype='MPEG_LAYER_III')
        decoded, decoded_sr = sf.read(dest)
        assert np.isfinite(decoded).all() and decoded_sr == sr
        report[name] = {'seconds':len(decoded)/sr, 'bytes':dest.stat().st_size, 'segments':len(segments)}
    expected_tracks = len({j['track'] for j in jobs})
    assert len(report) == expected_tracks
    (work / 'validation.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print('ALL_%d_TRACKS_READY_IN_STAGING' % expected_tracks, flush=True)
