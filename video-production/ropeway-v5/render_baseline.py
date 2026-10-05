"""Bake final-time transforms, then retain EEVEE's scene between animation frames."""
import sys,runpy,json,time,math
from pathlib import Path
import bpy
B=Path(__file__).resolve().parent;sys.path.insert(0,str(B));D=runpy.run_path(str(B/'film_models.py'))
T=json.loads((B/'full-timing.json').read_text(encoding='utf8'));FPS=24;scene=D['scene'];cam=D['cam'];G=D['pose'].__globals__
VAR={'s00':'landscape','s02':'loop','s03':'drive','s05':'roles','s06':'rope','s07':'tension','s08':'tower','s09':'grip','s10':'loadpath','s11':'station-question','s14m':'intermediate','s15':'quiz-grip','s16':'types','s17':'layers','s18':'boarding','s19':'inspection','s20':'brakes','s21':'sensors','s22':'circuit','s23':'brakes','s24':'spring-brake','s25':'stop','s26':'wind','s28':'backup','s29':'rescue','s30':'boarding','s31':'passengers','s32':'passengers','s33':'passengers','s34':'recap','s35':'landscape','credits':'landscape'}
STATIC={'roles','grip','loadpath','station-question','types','layers','boarding','rescue','passengers','sensors'};CYCLIC={'rope','inspection','brakes'}
P=B/'render-progress.json';progress=json.loads(P.read_text()) if P.exists() else {};folder=B/'scene-frames';folder.mkdir(exist_ok=True)
only=D['option']('--scenes',','.join(s['id'] for s in T['scenes'])).split(',');objects=list(scene.objects)
def key(o):return tuple(o.location)+tuple(o.rotation_euler)+tuple(o.scale)+(o.hide_render,)
def clear():
 for o in objects:
  if o.animation_data:o.animation_data_clear()
 if cam.data.animation_data:cam.data.animation_data_clear()
 # Node-tree animation data belongs to the shared steel-rope material.
 node=D['mapping'].id_data
 if node.animation_data:node.animation_data_clear()
def configure(sid,dur,start):
 G['BAKING']=True;G['SHOT_SECONDS']=dur;G['SHOT_OFFSET']=start if sid in ['s00','s02','s03'] else 0
 D['set_time'].__globals__['BAKING']=True
def pose(s,u,f):
 if s['id'] in ['s12','s13','s14']:
  D['pose']('station-question',0);D['set_time'](s['start']-next(x['start'] for x in T['scenes'] if x['id']=='s12')+f/FPS)
 else:D['pose'](VAR[s['id']],u)
def store(sid,count,n,tic,rendered):
 progress[sid]={'rendered':rendered,'total':count,'final_frames':n,'variant':VAR.get(sid),'seconds':round(time.time()-tic,1),'method':'final-time baked animation' if count>1 and sid!='s07' else 'still or deforming teaching view'};P.write_text(json.dumps(progress,indent=2))
for i,s in enumerate(T['scenes']):
 sid=s['id']
 if sid not in only:continue
 end=T['scenes'][i+1]['start'] if i+1<len(T['scenes']) else T['duration'];n=round(end*FPS)-round(s['start']*FPS);dur=n/FPS;v=VAR.get(sid);dest=folder/sid;dest.mkdir(exist_ok=True);tic=time.time()
 count=0 if sid in ['s15','s34','credits'] else (1 if v in STATIC else (144 if v in CYCLIC else n))
 if count==0:store(sid,0,n,tic,0);continue
 configure(sid,dur,s['start']);clear();scene.frame_start=0;scene.frame_end=count-1
 if count==1:
  pose(s,.7,0);bpy.context.view_layer.update();target=dest/'00000.png'
  if not target.exists():scene.render.filepath=str(target);bpy.ops.render.render(write_still=True)
  store(sid,1,n,tic,1);continue
 if sid=='s07':
  # Rope deformation is evaluated directly; all other motion is baked at final FPS.
  for f in range(count):
   target=dest/f'{f:05d}.png'
   if not target.exists():pose(s,f/max(1,count-1),f);bpy.context.view_layer.update();scene.render.filepath=str(target);bpy.ops.render.render(write_still=True)
   if f%24==0 or f==count-1:store(sid,count,n,tic,f+1)
  continue
 pose(s,0,0);initial={o:key(o) for o in objects};animated=set()
 for u in [.2,.45,.72,1.]:
  pose(s,u,round(u*(count-1)))
  animated.update(o for o in objects if key(o)!=initial[o])
 for f in range(count):
  pose(s,f/max(1,count-1),f)
  for o in animated:
   for prop in ['location','rotation_euler','scale','hide_render']:o.keyframe_insert(data_path=prop,frame=f)
  cam.data.keyframe_insert(data_path='ortho_scale',frame=f)
  D['mapping'].inputs['Location'].keyframe_insert(data_path='default_value',frame=f)
 pose(s,0,0);scene.frame_set(0);bpy.context.view_layer.update()
 if sid in ['s00','s12','s14m']:
  bpy.ops.wm.save_as_mainfile(filepath=str(B/(sid+'-animated.blend')))
 missing=next((f for f in range(count) if not (dest/f'{f:05d}.png').exists()),count)
 if missing<count:
  scene.frame_start=missing;scene.render.filepath=str(dest/'#####')
  def report(sc,*args):
   f=sc.frame_current
   if f%24==0 or f==count-1:store(sid,count,n,tic,f+1)
  bpy.app.handlers.render_post.append(report)
  try:bpy.ops.render.render(animation=True)
  finally:bpy.app.handlers.render_post.remove(report)
 store(sid,count,n,tic,count);print('FINISHED_SHOT',sid,count,round(time.time()-tic,1),'animated objects',len(animated),flush=True)
clear();G['BAKING']=False;D['pose']('landscape',.25);scene.frame_start=0;scene.frame_end=round(T['duration']*FPS)-1
bpy.ops.wm.save_as_mainfile(filepath=str(B/'ropeway-model-library.blend'));(B/'render-done.json').write_text(json.dumps(progress,indent=2))
