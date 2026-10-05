"""Portable regeneration from the source bundle; FFmpeg needs minterpolate/libass."""
from pathlib import Path
import argparse,subprocess,os,sys,json
B=Path(__file__).resolve().parent;R=B.parents[1]
p=argparse.ArgumentParser();p.add_argument('--blender',default='blender');p.add_argument('--ffmpeg',default='ffmpeg');p.add_argument('--preview',action='store_true');a=p.parse_args()
os.environ['ROPEWAY_FFMPEG']=a.ffmpeg;os.environ['BLENDER_USER_CONFIG']=str(B/'blender-config');os.environ['TEMP']=str(B/'temp');(B/'temp').mkdir(exist_ok=True);(R/'outputs').mkdir(exist_ok=True)
new={'s05','s09','s10','s11','s16','s17','s18','s21','s22','s29','s30','s31','s32','s33'}
def blender(file,args):subprocess.run([a.blender,'--background','--factory-startup','--gpu-backend','opengl','--threads','4','--python-exit-code','1','--python',str(B/file),'--',*args],check=True,cwd=R)
if a.preview:blender('film_models.py',['--mode','family-preview','--variants','grip,loadpath,types,layers,boarding','--width','1280','--samples','16'])
else:
 t=json.loads((B/'full-timing.json').read_text(encoding='utf8'));old=','.join(s['id'] for s in t['scenes'] if s['id'] not in new|{'s15','s34','credits'})
 blender('render_baseline.py',['--mode','build-only','--scenes',old,'--width','1280','--samples','16'])
 blender('render_animation.py',['--mode','build-only','--width','1280','--samples','8'])
 subprocess.run([sys.executable,str(B/'compose_film.py')],check=True,cwd=R)
