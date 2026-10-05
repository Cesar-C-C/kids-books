"""8fps rendered 3D poses; motion-compensated 24fps finishing.
Unchanged v2 running mechanisms retain their original native 24fps frames.
"""
import sys,runpy,json,time,math
from pathlib import Path
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
B=Path(__file__).resolve().parent;sys.path.insert(0,str(B))
D=runpy.run_path(str(B/'film_models.py'));from motion import install
D=install(D);T=json.loads((B/'full-timing.json').read_text(encoding='utf8'))
scene=D['scene'];cam=D['cam'];g=D['look'].__globals__;FPS=8
VAR={'s00':'landscape','s02':'loop','s03':'drive','s05':'roles','s06':'rope','s07':'tension','s08':'tower','s09':'grip','s10':'loadpath','s11':'station-question','s14m':'intermediate','s16':'types','s17':'layers','s18':'boarding','s19':'inspection','s20':'brakes','s21':'sensors','s22':'circuit','s23':'brakes','s24':'spring-brake','s25':'stop','s26':'wind','s28':'backup','s29':'rescue','s30':'boarding','s31':'passengers','s32':'passengers','s33':'passengers','s35':'landscape'}
NEW={'s05','s09','s10','s11','s16','s17','s18','s21','s22','s29','s30','s31','s32','s33'}
P=B/'render-progress.json';progress=json.loads(P.read_text()) if P.exists() else {}
only=D['option']('--scenes',','.join(NEW)).split(',');limit=int(D['option']('--limit','0'))
objects=list(scene.objects)
def key(o):return tuple(o.location)+tuple(o.rotation_euler)+tuple(o.scale)+(o.hide_render,)
def clear():
 for o in objects:
  if o.animation_data:o.animation_data_clear()
 if cam.data.animation_data:cam.data.animation_data_clear()
 if D['mapping'].id_data.animation_data:D['mapping'].id_data.animation_data_clear()
def anchor(sid):
 if sid in ['s05','s09','s10']:return [D['carrier'].location+Vector((0,0,z)) for z in [1.7,3.35,4.08]]+ [Vector((4.2,-1.35,3.46))]
 if sid in ['s18','s30','s31','s32','s33']:return [Vector((.66,.7,1.8)),Vector((.38,-.1,2.1)),Vector((2.2,1.9,1.8))]
 if sid in ['s21','s22']:return [Vector((4.67,.9,4.36)),Vector((3.3,2.19,1.5))]
 if sid=='s16':return [Vector((-3.2,0,4.08)),Vector((3.2,0,3.90))]
 if sid=='s17':return [Vector((x,y,1.4)) for x,y in [(-3,-.8),(0,-.8),(3,-.8),(-1.6,2),(1.6,2)]]
 if sid=='s29':return [Vector((2.65,.9,1.9)),Vector((2.9,1.8,.5))]
 return [D['carrier'].location+Vector((0,0,4.1))]
def store(sid,n,tic,f):
 progress[sid]={'rendered':f,'total':n,'fps':FPS,'native_3d_animation':True,'final_fps':24,'finish':'motion-compensated interpolation','seconds':round(time.time()-tic,1)};P.write_text(json.dumps(progress,indent=2))
for i,s in enumerate(T['scenes']):
 sid=s['id']
 if sid not in only or sid not in NEW:continue
 end=T['scenes'][i+1]['start'];dur=(round(end*24)-round(s['start']*24))/24;n=round(dur*FPS);count=min(n,limit) if limit else n
 dest=B/'scene-frames'/sid;dest.mkdir(parents=True,exist_ok=True);tic=time.time();clear();g['BAKING']=True;g['SHOT_SECONDS']=dur;g['SHOT_OFFSET']=0;D['set_time'].__globals__['BAKING']=True
 for lc in bpy.context.view_layer.layer_collection.children:lc.exclude=False
 def pose(f):D['pose'](VAR[sid],f/max(1,n-1))
 pose(0);initial={o:key(o) for o in objects};animated={cam}
 for u in [.15,.3,.5,.7,.9,1.]:
  pose(round(u*(n-1)));animated.update(o for o in objects if key(o)!=initial[o])
 positions=[];states=[]
 for f in range(count):
  pose(f)
  for o in animated:
   for prop in ['location','rotation_euler','scale','hide_render']:o.keyframe_insert(data_path=prop,frame=f)
  cam.data.keyframe_insert(data_path='ortho_scale',frame=f);D['mapping'].inputs['Location'].keyframe_insert(data_path='default_value',frame=f)
  pts=[]
  for p in anchor(sid):
   q=cam.rotation_euler.to_quaternion().conjugated()@(p-cam.location)
   pts.append([round((.5+q.x/cam.data.ortho_scale)*1920,2),round((.5-q.y/(cam.data.ortho_scale*9/16))*1080,2)])
  positions.append(pts)
  if f in [0,count//2,count-1]:states.append({'frame':f,'camera':list(cam.location),'animated_objects':len(animated)})
 # Reproject the true continuous pose at output FPS for attached leader lines.
 positions=[]
 for f in range(round(dur*24)):
  D['pose'](VAR[sid],f/max(1,round(dur*24)-1));pts=[]
  for p in anchor(sid):
   q=cam.rotation_euler.to_quaternion().conjugated()@(p-cam.location);pts.append([round((.5+q.x/cam.data.ortho_scale)*1920,2),round((.5-q.y/(cam.data.ortho_scale*9/16))*1080,2)])
  positions.append(pts)
 (B/(sid+'-anchors.json')).write_text(json.dumps(positions));(B/(sid+'-motion.json')).write_text(json.dumps(states,indent=2))
 pose(0);scene.frame_set(0);scene.frame_start=0;scene.frame_end=count-1;scene.render.fps=FPS
 for lc in bpy.context.view_layer.layer_collection.children:
  if len(lc.collection.all_objects) and all(o.hide_render for o in lc.collection.all_objects):lc.exclude=True
 if sid=='s09':bpy.ops.wm.save_as_mainfile(filepath=str(B/'grip-camera-animation.blend'))
 missing=next((f for f in range(count) if not (dest/f'{f:05d}.png').exists()),count)
 if missing<count:
  scene.frame_start=missing;scene.render.filepath=str(dest/'#####')
  def report(sc,*args):
   f=sc.frame_current
   if f%24==0 or f==count-1:store(sid,count,tic,f+1)
  bpy.app.handlers.render_post.append(report)
  try:bpy.ops.render.render(animation=True)
  finally:bpy.app.handlers.render_post.remove(report)
 store(sid,count,tic,count);print('FINISHED',sid,count,'animated',len(animated),flush=True)
for lc in bpy.context.view_layer.layer_collection.children:lc.exclude=False
clear();g['BAKING']=False
if D['option']('--skip-library-save','0')!='1':
 D['pose']('landscape',.25);bpy.ops.wm.save_as_mainfile(filepath=str(B/'ropeway-model-library.blend'))
