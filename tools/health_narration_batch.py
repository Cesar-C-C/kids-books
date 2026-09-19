"""Reproduce shared runtime zero-shot synthesis and verify selective adoption."""
import os, sys, json, hashlib, runpy
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'workbench/health-narration-update'
RT = Path(os.environ.get('FUN_COSYVOICE_RUNTIME', r'C:\ProgramData\FunCosyVoice3'))
SP = RT / '.venv/Lib/site-packages'
sys.path[:0] = [str(SP), str(RT/'CosyVoice'), str(RT/'CosyVoice/third_party/Matcha-TTS')]
handles = [os.add_dll_directory(str(p)) for p in [RT/'.venv/Library/bin', SP/'torch/lib'] if p.exists()]
for key, val in {'WETEXT_MODEL_DIR':RT/'models/wetext', 'HF_HOME':WORK/'cache/hf', 'MPLCONFIGDIR':WORK/'cache/mpl', 'NUMBA_CACHE_DIR':WORK/'cache/numba'}.items():
    Path(val).mkdir(parents=True,exist_ok=True)
    os.environ[key] = str(val)
os.environ['HF_HUB_OFFLINE'] = '1'
import numpy as np
import soundfile as sf
import torch
torch.set_num_threads(4)
shared = runpy.run_path(str(RT/'synthesize.py'))
jobs = json.loads((WORK/'jobs.json').read_text(encoding='utf-8'))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def validate(p):
    a,sr = sf.read(p, always_2d=True)
    rms = float(np.sqrt(np.mean(a*a)))
    assert sr == 24000 and a.shape[1] == 1 and np.isfinite(a).all() and rms > .001, str(p)
    seconds = len(a)/sr
    assert .5 < seconds < 90, (p,seconds)
    return dict(seconds=seconds,rms=rms,sample_rate=sr,bytes=p.stat().st_size,sha256=sha(p))
baseline = WORK/'before.json'
if not baseline.exists():
    baseline.write_text(json.dumps({str(p.relative_to(ROOT)):sha(p) for b in ['myopia','cavities'] for p in (ROOT/'books'/b/'audio').glob('*.mp3')},indent=2))
report = {}
model = None
for i,j in enumerate(jobs):
    d = WORK/j['book']; d.mkdir(exist_ok=True)
    wav,mp3 = d/(j['id']+'.wav'), d/(j['id']+'.mp3')
    sig = hashlib.sha256(j['text'].encode()).hexdigest()
    stamp = d/(j['id']+'.sha256')
    if not (wav.exists() and stamp.exists() and stamp.read_text()==sig):
        if model is None: model = shared['AutoModel'](model_dir=str(RT/'models/Fun-CosyVoice3-0.5B'),fp16=False)
        torch.manual_seed(1900+i)
        parts = []
        for chunk in shared['split_text'](j['text']):
            parts.extend(x['tts_speech'].cpu() for x in model.inference_zero_shot(chunk,shared['DEFAULT_PROMPT_TEXT'],str(shared['DEFAULT_PROMPT_WAV']),stream=False))
        a = torch.cat(parts,dim=1).squeeze().numpy()
        assert np.isfinite(a).all()
        sf.write(wav,a,24000,subtype='PCM_16')
        stamp.write_text(sig)
    validate(wav)
    a,sr = sf.read(wav)
    sf.write(mp3,a,sr,format='MP3',subtype='MPEG_LAYER_III')
    report[j['book']+'/'+j['id']] = dict(text=j['text'],text_sha256=sig,**validate(mp3))
    print(f'VALIDATED {i+1}/16 {j["book"]}/{j["id"]}',flush=True)
(WORK/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
assert len(report)==16
print('ALL_16_READY',flush=True)
