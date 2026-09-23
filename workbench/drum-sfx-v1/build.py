"""Reproducible processed-recording SFX; no synthesized drum or TTS."""
import sys, json, hashlib, faulthandler, os
faulthandler.dump_traceback_later(40)
from pathlib import Path
os.environ['NUMBA_CACHE_DIR'] = str(Path(__file__).resolve().parent / '.numba-cache')
Path(os.environ['NUMBA_CACHE_DIR']).mkdir(exist_ok=True)
sys.path.insert(0, r'C:\ProgramData\FunCosyVoice3\.venv\Lib\site-packages')
import numpy as np
import soundfile as sf
import librosa
from scipy.signal import lfilter
HERE = Path(__file__).resolve().parent
OUT = HERE.parents[1] / 'books/sound/sfx'
OUT.mkdir(parents=True, exist_ok=True)
SR = 48000
def kw(x):
    # BS.1770 K-weighting coefficients for 48 kHz, mono; ungated whole-window energy.
    y = lfilter([1.53512485958697,-2.69169618940638,1.19839281085285], [1,-1.69065929318241,0.73248077421585], x)
    y = lfilter([1,-2,1], [1,-1.99004745483398,0.99007225036621], y)
    return np.mean(y*y)
def db(x): return float(20*np.log10(max(float(x),1e-12)))
raw, sr = sf.read(HERE/'raw/Darbuka_1_hit_vl2_rr1.wav')
print('Read source', flush=True)
low = librosa.resample(raw.mean(axis=1), orig_sr=sr, target_sr=SR)
print('Resampled', flush=True)
# Keep full recorded duration, do not stretch/loop the decay to satisfy UI timings.
high = librosa.effects.pitch_shift(low, sr=SR, n_steps=5)
print('Pitch shifted', flush=True)
n = len(low)
high = librosa.util.fix_length(high, size=n)
for x in (low, high):
    x[:48] *= np.linspace(0,1,48)
    x[-960:] *= np.linspace(1,0,960)
high *= np.sqrt(kw(low)/kw(high))
gain = 10**(-6/20)/max(np.max(np.abs(low)),np.max(np.abs(high)))
low *= gain; high *= gain
rows=[]
for name,x in [('drum-low',low),('drum-high',high)]:
    dest=OUT/(name+'.wav');sf.write(dest,x,SR,subtype='PCM_16')
    y,rate=sf.read(dest)
    spectrum=np.abs(np.fft.rfft(y[:int(.25*SR)]*np.hanning(int(.25*SR))))
    freqs=np.fft.rfftfreq(int(.25*SR),1/SR)
    bands=(freqs>=60)&(freqs<=2000)
    row=dict(file=str(dest.relative_to(HERE.parents[1])),sha256=hashlib.sha256(dest.read_bytes()).hexdigest(),frames=len(y),sample_rate=rate,channels=1,duration_s=len(y)/rate,peak_dbfs=db(np.max(np.abs(y))),rms_dbfs=db(np.sqrt(np.mean(y*y))),k_weighted_energy_db=10*np.log10(kw(y)),dominant_peak_first_250ms_hz=float(freqs[bands][np.argmax(spectrum[bands])]),finite=bool(np.all(np.isfinite(y))),clipped_samples=int(np.sum(np.abs(y)>=1)),rms_100ms_dbfs=[round(db(np.sqrt(np.mean(y[i:i+4800]**2))),2) for i in range(0,len(y),4800)])
    assert row['finite'] and row['clipped_samples']==0
    rows.append(row)
assert abs(rows[0]['k_weighted_energy_db']-rows[1]['k_weighted_energy_db'])<.05
report=dict(source='Darbuka_1_hit_vl2_rr1.wav',pitch_shift_semitones=5,method='librosa time-preserving phase-vocoder pitch shift; full-window ungated K-weighted energy match; shared peak ceiling -6 dBFS',metrics=rows,runtime_gains=dict(soft=.4,loud=.85,normal=.85),gain_pair_difference_db=db(.85/.4),limitations=['K weighting is a perceptual proxy, not human equal-loudness acceptance.','Time-preserving shift may alter transient timbre.','Recorded tail is NOT guaranteed audible for one second on every device.','dBFS is not acoustic SPL or a hearing-safety measurement.'])
(HERE/'report.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps(report,indent=2))
faulthandler.cancel_dump_traceback_later()
