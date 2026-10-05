"""Narration-led 3D actions for views that were stills in v2.
No grip is opened in a line-running view. Every cabin uses the shared asset.
"""
import math
from mathutils import Vector
def install(D):
 g=D['pose'].__globals__; scene=D['scene']; M=D['M']; base=D['pose']
 objects=list(scene.objects); rest={o:(o.location.copy(),o.rotation_euler.copy(),o.scale.copy()) for o in objects}
 def found(prefix):return [o for o in objects if o.name.startswith(prefix)]
 # Attach each arm and hand to one shoulder: gestures preserve the limb connection.
 arms=[]; heads=[]
 for person in found('Adult passenger')+found('Child passenger')+found('Station attendant')+found('Trained rescue team')+found('Rescue team colleague')+found('Trained staff'):
  children=list(person.children)
  for sign in [-1,1]:
   limb=[o for o in children if o.name.startswith(('Sleeve','Hands')) and o.location.x*sign>0]
   if not limb:continue
   z=max(o.location.z for o in limb)+.225
   pivot=D['empty']('Connected shoulder gesture',(.205*sign,0,z),person)
   for o in limb:
    loc=o.location.copy();o.parent=pivot;o.location=loc-pivot.location
   arms.append((person,pivot,sign))
  h=[o for o in children if o.name.startswith(('Friendly head','Hair cap','Eyes','Smile','Safety helmet'))]
  if h:
   loc=next(o.location.copy() for o in h if o.name.startswith('Friendly head'))
   p=D['empty']('Connected head turn',loc,person)
   for o in h:o.parent=p;o.location-=loc
   heads.append((person,p))
 # Add moving marker heads, not changes to the physical load-bearing parts.
 force=[]
 for i in range(3):force.append(D['sphere']('Animated load-path marker',(0,0,2),.075,M['spring']))
 g['GROUPS']['loadtower'].update(force);g['GROUPS']['loadpath'].update(force)
 scan=D['sphere']('Inspection motion marker',(0,-.8,1.25),.070,M['spring']);g['GROUPS']['layers'].add(scan)
 paths=[(0,0,1.7),(0,0,3.35),(0,0,4.08),(4.2,0,4.08),(4.2,-1.35,3.46),(4.2,-1.35,.3)]
 # New child objects must follow group visibility, just like the original characters.
 for person,p,_ in arms:
  for group in g['GROUPS'].values():
   if person in group:group.add(p)
 for person,p in heads:
  for group in g['GROUPS'].values():
   if person in group:group.add(p)
 def camera(target,offset,scale,u,amount=1):
  angle=(u-.5)*.24*amount;c,s=math.cos(angle),math.sin(angle);x,y,z=offset
  D['look'](target,(x*c-y*s,x*s+y*c,z+.20*math.sin(math.pi*u)),scale*(1-.045*math.sin(math.pi*u)))
 def pose(variant,u):
  base(variant,u);t=g.get('SHOT_SECONDS',16)*u
  for _,p,_ in arms:p.rotation_euler=(0,0,0)
  for _,p in heads:p.rotation_euler=(0,0,0)
  if variant=='roles':
   x=-.75+1.5*u;D['carrier'].location.x=x
   D['mapping'].inputs['Location'].default_value[2]=-x/28
   camera((x*.55,0,2.75),(-5.4,8,3.3),10.5,u)
  elif variant=='grip':
   # Observe the closed clamp from two nearby directions; force arrows are composited.
   camera((0,0,4.24),(-1.25,5,.85),3.30,u,1.6)
  elif variant=='loadpath':
   camera((1.7,0,2.6),(-7,12,3.4),14.3,u)
   for i,p in enumerate(force):
    q=(t*.55+i*1.67)%5;j=int(q);p.location=Vector(paths[j]).lerp(Vector(paths[j+1]),q-j)
  elif variant=='station-question':
   D['set_time'](19+u*6)
  elif variant=='types':
   for o in found('Carrier'):
    if o in g['GROUPS']['types'] and o.get('asset_id'):
     x=rest[o][0].x;travel=.65*math.sin(math.tau*u) if x>0 else -.65+1.3*u
     o.location=rest[o][0]+Vector((travel,0,0))
   camera((0,0,2.7),(-1.8,12,3.2),15.8,u,.7)
  elif variant=='layers':
   # The head stays around the rope; a travelling marker shows rope passage.
   scan.location=(-.95+1.9*((t/3)%1),-.8,1.25)
   for o in found('Brake disc example'):o.rotation_euler.z=t*.4
   for o in found('Brake pad example'):o.location.z=1.40-.04*(.5+.5*math.sin(t*.8))
   camera((0,.5,1.5),(-6,10,5.6),13.6,u)
   for person,p,sign in arms:
    if person.name.startswith('Trained staff') and sign>0:p.rotation_euler.x=-.35*(.5+.5*math.sin(t*.9))
  elif variant in ['sensors','circuit']:
   camera((4,.8,2.65),(5.5,9,3.1),11.4,u,.8)
  elif variant=='rescue':
   camera((1,0,2.6),(-7,11,4.8),12.5,u)
   for person,p,sign in arms:
    if person.name.startswith(('Trained rescue','Rescue team')) and sign>0:p.rotation_euler.x=-.48*(.5+.5*math.sin(t*.7))
   for person,p in heads:
    if person.name.startswith(('Trained rescue','Rescue team')):p.rotation_euler.z=.2*math.sin(t*.5)
  elif variant in ['boarding','passengers']:
   camera((.5,.5,2.7),(-4.7,10,1.5),10.5 if variant=='boarding' else 9.6,u)
   for person,p,sign in arms:
    if person.name.startswith('Station attendant') and sign>0:p.rotation_euler.x=-.65*(.5+.5*math.sin(t*.55))
    elif person.name.startswith('Adult passenger') and sign>0:p.rotation_euler.x=-.23*(.5+.5*math.sin(t*.6))
   for person,p in heads:
    if person.name.startswith('Child passenger'):p.rotation_euler.z=.16*math.sin(t*.5)
  return None
 D['pose']=pose
 return D
