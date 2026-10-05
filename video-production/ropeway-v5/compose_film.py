"""Full-frame 3D film with beat-timed bilingual in-picture annotations."""
from pathlib import Path
import json,subprocess,os,math,base64,time,ast,shutil
import numpy as np
from PIL import Image,ImageDraw,ImageFont
B=Path(__file__).resolve().parent;R=B.parents[1];OLD=R/'work/ropeway-3d-v2';OUT=R/'outputs'
FF=os.environ.get('ROPEWAY_FFMPEG',str(R/'work/video-tools/node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe'))
FP=os.environ.get('ROPEWAY_FFPROBE',str(R/'work/video-tools/node_modules/@ffprobe-installer/win32-x64/ffprobe.exe'))
T=json.loads((B/'full-timing.json').read_text(encoding='utf8'));FPS=24;N=round(T['duration']*FPS)
NEW={'s05','s09','s10','s11','s16','s17','s18','s21','s22','s29','s30','s31','s32','s33'}
INK='&H00353C18';SLATE='&H00746942';WHITE='&H00E4F1F6';ORANGE='&H002853AD';GREEN='&H00709924'
def run(args):subprocess.run([FF,'-hide_banner','-loglevel','error','-y',*map(str,args)],check=True,cwd=B)
def font(size,cn=False):return ImageFont.truetype('C:/Windows/Fonts/'+('msyh.ttc' if cn else 'segoeui.ttf'),size)
def fit(txt,size,w,cn=False):
 while font(size,cn).getlength(txt)>w and size>24:size-=1
 assert font(size,cn).getlength(txt)<=w,(txt,w)
 return size
PREV=R/'work/ropeway-3d-v4'

def cache_root(sid):
 if (B/'scene-frames'/sid).exists():return B
 if sid in NEW and (PREV/'scene-frames'/sid).exists():return PREV
 return OLD

def source(sid):return cache_root(sid)/'scene-frames'/sid
def ready(sid):
 for _ in range(7200):
  try:q=json.loads((cache_root(sid)/'render-progress.json').read_text())[sid]
  except (FileNotFoundError,KeyError,json.JSONDecodeError):q=None
  if q and q['rendered']==q['total'] and (sid not in NEW or q.get('fps')==8):return q
  time.sleep(1)
 raise TimeoutError(sid)
def raw_image(sid,t):
 q=ready(sid);files=source(sid);count=q['total'];fps=q.get('fps',24);f=min(count-1,int(t*fps)) if sid in NEW or count>144 else int(t*fps)%max(1,count)
 return Image.open(files/f'{f:05d}.png').convert('RGB').resize((1920,1080),Image.Resampling.LANCZOS)
def inputs(sid):
 q=ready(sid);n=q['total']
 if n==1:raise ValueError('A long still may not be used as a teaching shot: '+sid)
 return ([] if sid in NEW else ['-stream_loop','-1'])+['-framerate',str(q.get('fps',24)),'-i',source(sid)/'%05d.png']
def motion_filter(sid):return 'tpad=stop_mode=clone:stop_duration=0.5,minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,' if sid in NEW else ''
def backgrounds():
 if (PREV/'background.mp4').exists() and not (B/'scene-frames').exists():
  shutil.copy2(PREV/'background.mp4',B/'background.mp4');return
 dest=B/'scene-video';dest.mkdir(exist_ok=True);parts=[]
 for i,s in enumerate(T['scenes']):
  sid=s['id'];end=T['scenes'][i+1]['start'] if i+1<len(T['scenes']) else T['duration'];n=round(end*24)-round(s['start']*24);p=dest/(sid+'.mp4');parts.append(p)
  if p.exists():
   try:
    cached=int(subprocess.check_output([FP,'-v','error','-select_streams','v:0','-show_entries','stream=nb_frames','-of','csv=p=0',str(p)],stderr=subprocess.DEVNULL,text=True).strip())
   except (ValueError,subprocess.SubprocessError,OSError):cached=0
   if cached==n:continue
  if sid=='s15':
   # Two live views continue running while the child compares their support paths.
   # Forward/backward comparison views avoid teleporting at a loop boundary.
   fl='[0:v]split[a0][a1];[a1]reverse,setpts=PTS-STARTPTS[ar];[a0][ar]concat=n=2:v=1:a=0,scale=940:529[a];[1:v]split[b0][b1];[b1]reverse,setpts=PTS-STARTPTS[br];[b0][br]concat=n=2:v=1:a=0,scale=940:529[b];[a]pad=1920:1080:20:230:color=0xF6F1E4[c];[c][b]overlay=960:230,setsar=1[out]'
   run(['-i',dest/'s05.mp4','-i',dest/'s13.mp4','-filter_complex',fl,'-map','[out]','-frames:v',n,'-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p',p])
  elif sid=='s34':
   chunks=[]
   for j,key in enumerate(['s05','s13','s17']):
    f0=0 if j==0 else round((s['beats'][j]['start']-s['start'])*24);f1=n if j==2 else round((s['beats'][j+1]['start']-s['start'])*24);target=dest/f'recap-{j}.mp4'
    if j==1:
     run([*inputs('s08'),*inputs('s13'),'-filter_complex','[0:v]scale=940:529[a];[1:v]scale=940:529[b];[a]pad=1920:1080:20:230:color=0xF6F1E4[c];[c][b]overlay=960:230,setsar=1[out]','-map','[out]','-frames:v',f1-f0,'-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p',target])
    else:run([*inputs(key),'-vf',motion_filter(key)+'scale=1920:1080:flags=lanczos,setsar=1','-frames:v',f1-f0,'-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p',target])
    chunks.append(target)
   c=B/'recap.txt';c.write_text(''.join("file '"+x.as_posix()+"'\n" for x in chunks));run(['-f','concat','-safe','0','-i',c,'-c','copy',p])
  else:
   key='s35' if sid=='credits' else sid
   run([*inputs(key),'-vf',motion_filter(key)+'scale=1920:1080:flags=lanczos,setsar=1','-frames:v',n,'-r','24','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p',p])
  print('ENCODED',sid,flush=True)
 c=B/'concat.txt';c.write_text(''.join("file '"+x.as_posix()+"'\n" for x in parts));run(['-f','concat','-safe','0','-i',c,'-c','copy',B/'background.mp4'])
def at(t):
 n=round(t*100);return f'{n//360000}:{n//6000%60:02d}:{n//100%60:02d}.{n%100:02d}'
HEAD='''[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: EN,Segoe UI,37,&H00353C18,&H00353C18,&H00E4F1F6,&H00E4F1F6,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
Style: ZH,Microsoft YaHei,43,&H00353C18,&H00353C18,&H00E4F1F6,&H00E4F1F6,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
def subtitles():
 from annotations import build
 return build(globals())

def player(video):
 h=(R/'work/bilingual-player-template.html').read_text(encoding='utf8');h=h.replace('9 分 29 秒','9 分 58 秒').replace('09:29','09:58').replace('568.708333',str(T['duration'])).replace('<h1>索道小探险</h1>','<h1>索道小探险 · 3D配音修订版</h1>')
 specs=[('s00','出发'),('s02','绳索运行'),('s11','进站与脱挂'),('s14m','中间站'),('s17','安全保障'),('s30','乘坐指引'),('s34','回顾')]
 chapters=[{'id':i,'start':next(s['start'] for s in T['scenes'] if s['id']==sid),'title':title} for i,(sid,title) in enumerate(specs)]
 def data(p,m):return 'data:'+m+';base64,'+base64.b64encode(p.read_bytes()).decode()
 vals={'__VIDEO__':data(video,'video/mp4'),'__ZH_AUDIO__':data(B/'narration-zh.m4a','audio/mp4'),'__POSTER__':data(OUT/'ropeway-3d-v5-cover.jpg','image/jpeg'),'__CHAPTER_DATA__':json.dumps(chapters,ensure_ascii=False),'__CHAPTERS__':''.join(f'<button class="chapter" data-chapter="{c["id"]}" data-start="{c["start"]}">{c["title"]}</button>' for c in chapters)}
 for k,v in vals.items():h=h.replace(k,v)
 (OUT/'ropeway-3d-v5-watch.html').write_text(h,encoding='utf8')
def deliver():
 subtitles();run(['-i',B/'background.mp4','-vf','ass=film.ass','-frames:v',N,'-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p',B/'picture.mp4'])
 run(['-i',B/'picture.mp4','-i',B/'narration-zh.m4a','-i',B/'narration-en.m4a','-map','0:v','-map','1:a','-map','2:a','-c','copy','-metadata:s:a:0','language=zho','-metadata:s:a:0','title=普通话','-metadata:s:a:1','language=eng','-metadata:s:a:1','title=English','-disposition:a:0','default','-disposition:a:1','0','-movflags','+faststart',OUT/'ropeway-3d-v5.mp4'])
 run(['-i',B/'picture.mp4','-i',B/'narration-en.m4a','-map','0:v','-map','1:a','-c','copy','-movflags','+faststart',B/'browser.mp4'])
 run(['-ss',8,'-i',OUT/'ropeway-3d-v5.mp4','-frames:v',1,'-q:v',2,OUT/'ropeway-3d-v5-cover.jpg']);player(B/'browser.mp4')
 def stamp(t):
  n=round(t*1000);return f'{n//3600000:02d}:{n//60000%60:02d}:{n//1000%60:02d},{n%1000:03d}'
 lines=[]
 for i,s in enumerate(T['scenes']):
  end=T['scenes'][i+1]['start'] if i+1<len(T['scenes']) else T['duration']
  for j,b in enumerate(s['beats']):
   until=s['beats'][j+1]['start'] if j+1<len(s['beats']) else end;lines.append(f'{len(lines)+1}\n{stamp(b["start"])} --> {stamp(until)}\n{b["en"]}\n{b["zh"]}\n')
 (OUT/'ropeway-3d-v5-bilingual.srt').write_text('\n'.join(lines),encoding='utf8');shutil.copy2(B/'ropeway-model-library.blend',OUT/'ropeway-3d-v5-models.blend')
if __name__=='__main__':backgrounds();deliver()
