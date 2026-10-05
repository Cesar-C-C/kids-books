"""Content-specific teaching marks. No automatic one-card-per-beat layout.

The bilingual transcript remains in the subtitle band. Marks are authored only
where a name, direction, relation, state or answer adds visual information.
"""
from pathlib import Path
import json, math
import numpy as np

INK='&H00353C18'; SLATE='&H00746942'; PAPER='&H00E4F1F6'
GREEN='&H006C7830'; ORANGE='&H002853AD'

def smooth(a,b,t):
    q=max(0,min(1,(t-a)/(b-a)));return q*q*(3-2*q)

def station(t):
    s12=16.24108333333332;s13=14.62070833333334
    if t<9.8:x=-9+.5*t
    elif t<s12:
        u=t-9.8;x=-4.1+.5*u+.5*(-.28/(s12-9.8))*u*u
    else:
        x12=-4.1+.36*(s12-9.8)
        if t<s12+s13:x=x12+.22*(t-s12)
        else:
            u=t-s12-s13;acc=.28/4.885;x0=x12+.22*s13
            x=x0+.22*u+.5*acc*u*u if u<4.885 else x0+.22*4.885+.5*acc*4.885**2+.5*(u-4.885)
    def lane(x):return .75*smooth(-5,-2.5,x)*(1-smooth(.1,1.8,x))
    y=lane(x);yaw=math.atan2(lane(x+.005)-lane(x-.005),.01)
    op=smooth(5.445,7.3,t)*(1-smooth(s12+s13+4.885,s12+s13+7.98,t))
    if t<s12:
        c=smooth(1.5,3.5,t)*(1-smooth(8.3,11.3,t));target=(x,y,2.65+1.57*c);offset=(-4.3+2.5*c,8-3*c,3.8-2.8*c);scale=10.3-6.3*c
    elif t<s12+s13:target=(x+.2,y,2.65);offset=(-5.5,9,3.8);scale=10.3
    else:
        u=t-s12-s13;c=smooth(3,4.6,u)*(1-smooth(8.6,10.4,u));target=(x,y,2.7+1.52*c);offset=(3.7-2*c,8-3*c,3.8-2.8*c);scale=10.3-6.3*c
    return (x,y,yaw,op),target,offset,scale

def build(g):
    B=g['B'];T=g['T'];font=g['font'];at=g['at'];rows=[];boxes=[];marks=[]
    scenes={s['id']:s for s in T['scenes']}
    ends={s['id']:T['scenes'][i+1]['start'] if i+1<len(T['scenes']) else T['duration'] for i,s in enumerate(T['scenes'])}
    def time(sid,j=0):return scenes[sid]['beats'][j]['start']
    def event(a,b,txt,style='EN',layer=2):
        if b>a:rows.append(f'Dialogue: {layer},{at(a)},{at(b)},{style},,0,0,0,,{txt}')
    def text(a,b,txt,x,y,size=42,cn=True,color=INK,center=False,fade=True,outline=3,bold=False,role='annotation'):
        w=font(size,cn).getlength(txt);left=x-w/2 if center else x
        assert 30<=left and left+w<=1890 and 30<=y and y+size*1.36<=1068,(txt,left,y,w)
        event(a,b,f'{{\\an7\\pos({left:.2f},{y:.2f})\\fs{size}\\c{color}\\bord{outline}\\3c{PAPER}\\shad0\\b{int(bold)}'+('\\fad(150,180)' if fade else '')+'}'+txt,'ZH' if cn else 'EN')
        boxes.append({'text':txt,'start':a,'end':b,'bounds':[round(left,2),round(y,2),round(left+w,2),round(y+size*1.36,2)],'role':role})
    def pair(a,b,zh,en,x,y,size=42,center=False,color=INK,role='annotation'):
        text(a,b,zh,x,y,size,True,color,center,bold=True,role=role)
        text(a,b,en,x,y+size*1.27,28,False,SLATE,center,role=role)
    def poly(a,b,pts,color=GREEN,alpha='00',layer=1,fade=False):
        path='m '+' '.join(f'{v:.2f}' for v in pts[0])+' l '+' '.join(f'{v:.2f}' for p in pts[1:] for v in p)
        event(a,b,f'{{\\an7\\pos(0,0)\\p1\\bord0\\shad0\\c{color}\\alpha&H{alpha}&'+('\\fad(150,180)' if fade else '')+'}'+path,layer=layer)
    def rect(a,b,x,y,w,h,color=PAPER,alpha='12',layer=0):poly(a,b,[(x,y),(x+w,y),(x+w,y+h),(x,y+h)],color,alpha,layer)
    def segment(a,b,p,q,color=GREEN,width=3):
        p=np.asarray(p,float);q=np.asarray(q,float);d=q-p;n=np.array([-d[1],d[0]])/max(1,np.linalg.norm(d))*width/2
        poly(a,b,[p+n,q+n,q-n,p-n],color)
    def arrow(a,b,p,q,color=GREEN,width=5,head=17):
        p=np.asarray(p,float);q=np.asarray(q,float);d=q-p;d/=max(1,np.linalg.norm(d));n=np.array([-d[1],d[0]])
        segment(a,b,p,q-d*head*.65,color,width);poly(a,b,[q,q-d*head+n*head*.5,q-d*head-n*head*.5],color)
    def ring(a,b,p,r=17,color=ORANGE,width=3):
        outer=[(p[0]+r*math.cos(j*math.tau/32),p[1]+r*math.sin(j*math.tau/32)) for j in range(33)]
        inner=[(p[0]+(r-width)*math.cos(-j*math.tau/32),p[1]+(r-width)*math.sin(-j*math.tau/32)) for j in range(33)]
        def contour(qs):return 'm '+' '.join(f'{v:.2f}' for v in qs[0])+' l '+' '.join(f'{v:.2f}' for q in qs[1:] for v in q)
        event(a,b,f'{{\\an7\\pos(0,0)\\p1\\bord0\\shad0\\c{color}}}'+contour(outer)+' '+contour(inner),layer=1)
    def check(a,b,x,y):
        segment(a,b,(x,y),(x+15,y+16),GREEN,7);segment(a,b,(x+15,y+16),(x+46,y-21),GREEN,7)
    def during(a,b,fn):
        for f in range(math.ceil(a*24),math.floor(b*24)):
            fn(f/24,(f+1)/24,f/24)
    def log(sid,a,b,form,reason,words):marks.append({'scene':sid,'start':a,'end':b,'form':form,'purpose':reason,'words':words})
    def project(target,offset,scale,p):
        offset=np.asarray(offset,float);eye=np.asarray(target,float)+offset;forward=-offset/np.linalg.norm(offset)
        right=np.cross(forward,[0,0,1]);right/=np.linalg.norm(right);up=np.cross(right,forward);q=np.asarray(p,float)-eye
        return np.array([(0.5+np.dot(q,right)/scale)*1920,(.5-np.dot(q,up)/(scale*9/16))*1080])
    def moving_camera(target,offset,scale,u,amount=1):
        a=(u-.5)*.24*amount;c,s=math.cos(a),math.sin(a);x,y,z=offset
        return target,(x*c-y*s,x*s+y*c,z+.20*math.sin(math.pi*u)),scale*(1-.045*math.sin(math.pi*u))
    def camera(sid,t):
        s=scenes[sid];f=max(0,round(t*24)-round(s['start']*24));n=round(ends[sid]*24)-round(s['start']*24);u=min(1,f/max(1,n-1))
        if sid in ['s12','s13','s14']:
            q,target,offset,scale=station(s['start']-scenes['s12']['start']+f/24);return target,offset,scale
        if sid=='s05':return moving_camera(((-.75+1.5*u)*.55,0,2.75),(-5.4,8,3.3),10.5,u)
        if sid=='s09':return moving_camera((0,0,4.24),(-1.25,5,.85),3.30,u,1.6)
        if sid=='s10':return moving_camera((1.7,0,2.6),(-7,12,3.4),14.3,u)
        if sid=='s16':return moving_camera((0,0,2.7),(-1.8,12,3.2),15.8,u,.7)
        if sid=='s17':return moving_camera((0,.5,1.5),(-6,10,5.6),13.6,u)
        if sid in ['s21','s22']:return moving_camera((4,.8,2.65),(5.5,9,3.1),11.4,u,.8)
        if sid=='s32':return moving_camera((.5,.5,2.7),(-4.7,10,1.5),9.6,u)
        if sid=='s02':return (0,0,3),(0,4,27),39.5
        if sid=='s03':return (-11.7,0,3),(-10,15,9),19.7
        if sid in ['s06','s19']:
            u=(f%144)/143;return (0,0,2.4),(-2.6+1.1*math.sin(u*math.tau),8.5,3.7),8.7
        if sid=='s14m':
            tt=u*30
            if tt<3:x=-8.4+.85*tt
            elif tt<9:
                dt=tt-3;x=-5.85+.85*dt+.5*((.22-.85)/6)*dt*dt
            elif tt<18:x=-2.64+.22*(tt-9)
            elif tt<25.2:
                dt=tt-18;x=-.66+.22*dt+.5*((.85-.22)/7.2)*dt*dt
            else:x=3.192+.85*(tt-25.2)
            y=smooth(-6,-3.3,x)*(1-smooth(.5,2.5,x));c=smooth(.10,.23,u)*(1-smooth(.79,.95,u))
            return (x*c,y*c,2.8),(-10+5*c,16-6*c,8-4*c),25-12*c
        if sid=='s08':return (0,0,3.65),(-4,7,3.7),9.1
        if sid=='s07':
            c=smooth(.35,.55,u)*(1-smooth(.89,1,u));return (13.3*c,0,2.8),(-18+25*c,22-12*c,12-7*c),40-28*c
        if sid in ['s23','s28']:return (-.40,0,2.25),(-6.5,8.5,5),9.4
        if sid=='s24':return (0,.38,2.06),(-3.5,6,2.4),4.9
        if sid=='s26':return (1,0,2.6),(-7,11,4.8),12.5
        raise ValueError(sid)
    def p(sid,t,world):return project(*camera(sid,t),world)
    def local(sid,t,point):
        s=scenes[sid];f=max(0,round(t*24)-round(s['start']*24));n=round(ends[sid]*24)-round(s['start']*24);u=min(1,f/max(1,n-1))
        if sid=='s05':return np.asarray(point)+[-.75+1.5*u,0,0]
        if sid in ['s12','s13','s14']:
            (x,y,yaw,op),_,_,_=station(s['start']-scenes['s12']['start']+f/24)
            xx,yy,z=point;return (x+xx*math.cos(yaw)-yy*math.sin(yaw),y+xx*math.sin(yaw)+yy*math.cos(yaw),z)
        return point
    def callout(sid,a,b,zh,en,x,y,point,relative=False,color=ORANGE,size=42):
        pair(a,b,zh,en,x,y,size,role='component')
        def draw(ta,tb,t):
            world=point(t) if callable(point) else (local(sid,t,point) if relative else point);q=p(sid,t,world)
            w=max(font(size,True).getlength(zh),font(28).getlength(en));edge=(x+w+12 if q[0]>x+w else x-12,y+35)
            if 30<q[0]<1890 and 40<q[1]<900:
                # The endpoint marks the component; a thin elbow avoids a long card.
                elbow=(edge[0]+(28 if q[0]>edge[0] else -28),edge[1]);segment(ta,tb,edge,elbow,color,2);segment(ta,tb,elbow,q,color,2);ring(ta,tb,q,12,color,2)
        during(a,b,draw)

    # The transcript is preserved verbatim. Subtitle presentation remains stable.
    for sid,s in scenes.items():
        for j,beat in enumerate(s['beats']):
            a=beat['start'];b=s['beats'][j+1]['start'] if j+1<len(s['beats']) else ends[sid]
            rect(a,b,40,925,1840,144)
            text(a,b,beat['en'],960,938,37,False,center=True,fade=False,outline=0,role='subtitle')
            text(a,b,beat['zh'],960,992,43,True,center=True,fade=False,outline=0,role='subtitle')
    pair(.8,4.8,'索道小探险','A cable-car adventure',960,65,60,True,role='title')
    # Opening route: arrows sit on the two straight sections, in the actual directions.
    a=time('s02',1);b=time('s02',2)+.4
    for zh,en,world0,world1,ly in [('去程','Outward',(-5,-3,4.08),(5,-3,4.08),310),('回程','Return',(5,3,4.08),(-5,3,4.08),718)]:
        q0=p('s02',a,world0);q1=p('s02',a,world1);arrow(a,b,q0,q1,GREEN,6,20);pair(a,b,zh,en,960,ly,38,True)
    log('s02',a,b,'direction arrows','Distinguish opposite movements on the same loop',['去程','回程'])
    a=time('s03',0)+.2;b=time('s03',1)
    callout('s03',a,b,'电动机','Motor',1620,690,(-12,0,1.62));log('s03',a,b,'component leader','Find the motor in the station',['电动机'])
    a=time('s03',1)+.1;b=time('s03',2)
    callout('s03',a,b,'驱动轮','Drive wheel',90,200,(-12,2.6,4.08));log('s03',a,b,'component leader','Identify the large wheel that contacts the rope',['驱动轮'])
    # Two jobs need two directions, not another sentence describing the same cabin.
    a=time('s05',1)+.15;b=ends['s05']-.25
    pair(a,b,'承载','Support',1390,540,44);pair(a,b,'牵引','Pull',630,105,44)
    def roles(ta,tb,t):
        q0=p('s05',t,local('s05',t,(-1.1,0,4.08)));q1=p('s05',t,local('s05',t,(1.1,0,4.08)))
        arrow(ta,tb,q0+[0,-68],q1+[0,-68],ORANGE,6,20)
        q=p('s05',t,local('s05',t,(0,0,1.7)));arrow(ta,tb,q+[265,-15],q+[265,-190],GREEN,6,20)
    during(a,b,roles);log('s05',a,b,'paired task arrows','Separate support from travel visually',['承载','牵引'])
    a=time('s06',0)+.2;b=time('s06',1)
    x=2.6;sa=x*1.7;spread=.34+.48*smooth(.6,2.7,x);wire=(x,spread*math.cos(sa),2.35+spread*math.sin(sa)+.095)
    callout('s06',a,b,'钢丝','Wire',1240,130,wire);log('s06',a,b,'component leader','Identify one fine wire rather than repeat the twisting sentence',['钢丝'])
    a=time('s06',1)+.2;b=time('s06',2)
    callout('s06',a,b,'绳芯','Core',250,700,(1.3,0,2.35));log('s06',a,b,'component leader','Locate the contrasting yellow core',['绳芯'])
    a=time('s07',0)+.15;b=time('s07',1)
    pair(a,b,'垂度','Sag',1030,600,42)
    def sag(ta,tb,t):
        u=(round(t*24)-round(scenes['s07']['start']*24))/(round(ends['s07']*24)-round(scenes['s07']['start']*24)-1)
        world=(-4.575,3,4.08-(.30+.13*math.sin(u*math.tau)));q=p('s07',t,world)
        segment(ta,tb,(1030,645),q,ORANGE,2);ring(ta,tb,q,13,ORANGE,2)
    during(a,b,sag);log('s07',a,b,'local name','Locate the sag between supports',['垂度'])
    a=time('s08',0)+.3;b=time('s08',1)+.1
    callout('s08',a,b,'托索轮','Sheave',90,620,(-.36,0,3.808));log('s08',a,b,'component leader','Find a sheave among the different wheels',['托索轮'])
    a=time('s09',0)+.2;b=time('s09',1)
    callout('s09',a,b,'抱索器','Grip',110,240,(0,.19,4.08));log('s09',a,b,'component leader','Name the connection to the rope',['抱索器'])
    a=time('s09',1)+.2;b=time('s09',2)
    callout('s09',a,b,'弹簧','Spring',1460,175,(.24,-.24,4.38));log('s09',a,b,'component leader','Point to a spring, rather than the whole clamp',['弹簧'])
    pair(scenes['s09']['start']+.3,scenes['s09']['start']+3.6,'内部示意','Inside view',1670,60,28,True,role='context')
    # A sequential highlight follows the support chain. It is a path, not a force vector.
    a=time('s10',1);b=ends['s10']-.3
    pair(a,a+2.0,'吊厢','Cabin',1390,660,36);pair(a+2,a+3.8,'吊杆','Hanger',1390,420,36)
    pair(a+3.8,time('s10',2)+.8,'抱索器','Grip',1390,200,36)
    pair(time('s10',2)+.8,b,'支架 → 地面','Tower → ground',140,655,36)
    stages=[((0,0,1.7),(0,0,3.35)),((0,0,3.35),(0,0,4.08)),((0,0,4.08),(4.2,0,4.08)),((4.2,0,4.08),(4.2,-1.35,.3))]
    def loadpath(ta,tb,t):
        bounds=[a,a+2,a+3.8,time('s10',2)+.8,b];j=next(k for k in range(4) if bounds[k]<=t<bounds[k+1]);u=(t-bounds[j])/(bounds[j+1]-bounds[j]);w0,w1=stages[j];q0=p('s10',t,w0);q1=p('s10',t,w1)
        segment(ta,tb,q0,q0+(q1-q0)*u,ORANGE,5);ring(ta,tb,q0+(q1-q0)*u,13,ORANGE,3)
    during(a,b,loadpath);log('s10',a,b,'sequential path highlight','Trace the connected support path without a prose flow card',['吊厢','吊杆','抱索器','支架 → 地面'])
    pair(scenes['s10']['start']+.2,scenes['s10']['start']+3.6,'亮点是传递路线的标记','Dots mark the load path',1460,55,28,True,role='context')
    # No overlay in the station puzzle: the child observes the moving grip.
    a=scenes['s12']['start']+5.25;b=scenes['s12']['start']+7.45
    callout('s12',a,b,'① 轨道接住','Rails support',1410,660,(.31,.62,3.95),True, size=40)
    log('s12',a,b,'timed contact','Rail support exists before the grip can open',['① 轨道接住'])
    a=scenes['s12']['start']+7.45;b=scenes['s12']['start']+11.2
    callout('s12',a,b,'② 抱索器松开','Grip opens',1380,650,(0,.505,4.08),True,size=40)
    log('s12',a,b,'timed contact','Name the open grip after support has transferred',['② 抱索器松开'])
    a=time('s13',1)+.15;b=ends['s13']-.25
    def speeds(ta,tb,t):
        f=round(t*24)-round(scenes['s13']['start']*24);x=station(scenes['s13']['start']-scenes['s12']['start']+f/24)[0][0]
        # The rope stays at WORLD Y=0 while the carrier follows the lateral station rail.
        # A carrier-relative Y=0 would falsely put the rope arrow over the opening guide.
        q=p('s13',t,(x-3,0,4.08));direction=p('s13',t,(x-2,0,4.08))-q;direction/=np.linalg.norm(direction)
        arrow(ta,tb,q,q+direction*210,ORANGE,5,17)
        q=p('s13',t,local('s13',t,(0,0,1.7)));direction=p('s13',t,local('s13',t,(1,0,1.7)))-q;direction/=np.linalg.norm(direction)
        arrow(ta,tb,q+[340,30],q+[340,30]+direction*80,GREEN,5,17)
    during(a,b,speeds);log('s13',a,b,'relative speed arrows','Contrast the continuing rope with the slow carrier; lengths are schematic',[])
    a=time('s14',1)+.4;b=time('s14',2)+1.3
    callout('s14',a,b,'重新夹紧','Grip closes',85,650,lambda t: local('s14',t,(0,.105+.4*station(t-scenes['s12']['start'])[0][3],4.08)),size=40);log('s14',a,b,'timed contact','Follow the grip closing onto the next rope',['重新夹紧'])
    # Colour the ACTUAL two ropes in the model, where the narration names them.
    a=time('s14m',2)+.2;b=time('s14m',3)-.15
    pair(a,b,'绳环 B','Rope B',200,785,36,True,GREEN);pair(a,b,'绳环 A','Rope A',1700,785,36,True,ORANGE)
    loops=[]
    for side in [-1,1]:
        world=[(side*(2.5+9*j/20),0,4.08) for j in range(20,-1,-1)]
        for j in range(41):
            ang=math.pi/2+(-1 if side<0 else 1)*math.pi*j/40
            world.append((side*2.5+2.2*math.cos(ang),-2.2+2.2*math.sin(ang),4.08))
        world.extend((side*(2.5+9*j/20),-4.4,4.08) for j in range(21));loops.append(world)
    def transfer(ta,tb,t):
        for world,color in zip(loops,[ORANGE,GREEN]):
            qs=[p('s14m',t,w) for w in world]
            for q0,q1 in zip(qs,qs[1:]):
                if all(30<q[0]<1890 and 40<q[1]<900 for q in [q0,q1]):segment(ta,tb,q0,q1,color,4)
    during(a,b,transfer);log('s14m',a,b,'on-model rope highlight','Identify the two independent rope circuits on the actual model; the cabin passes on rails between them',['绳环 A','绳环 B'])
    # Quiz uses the picture positions; answer is revealed by a check, not a repeated card.
    a=time('s15');b=ends['s15']-.2
    pair(a,b,'A 站外线路','On the line',490,120,42,True);pair(a,b,'B 站内轨道','Station rails',1440,120,42,True)
    answer=time('s15',2)+.1;check(answer,b,1230,152)
    segment(answer,b,(1010,807),(1860,807),GREEN,5)
    log('s15',a,b,'picture-based answer','Labels identify the options; a check reveals the supported choice',['A 站外线路','B 站内轨道'])
    a=time('s16',0)+.2;b=time('s16',1)
    callout('s16',a,b,'承载绳','Carrying rope',130,240,(3.2,.87,3.895),size=38)
    callout('s16',a,b,'牵引绳','Pulling rope',630,130,(3.2,.25,4.08),size=38)
    log('s16',a,b,'paired component names','Identify separate support and hauling ropes on the left example',['承载绳','牵引绳'])
    a=time('s16',1)+.15;b=time('s16',2)+.2
    pair(a,b,'往返示例','Back-and-forth example',640,160,38,True);pair(a,b,'循环示例','Circulating example',1370,160,38,True)
    arrow(a,b,(470,310),(790,310),GREEN,5,18);arrow(a,b,(790,310),(470,310),GREEN,5,18)
    arrow(a,b,(1530,310),(1210,310),ORANGE,5,18)
    log('s16',a,b,'side-by-side motion comparison','Distinguish the two illustrative motion patterns without claiming rope count determines them',['往返示例','循环示例'])
    a=time('s17',1)+.3;b=time('s17',2)-.1
    callout('s17',a,b,'检查','Inspection',1170,210,(0,-.8,1.25),size=36)
    callout('s17',a,b,'制动','Brakes',270,215,(3,-.8,1.35),size=36)
    callout('s17',a,b,'传感器','Sensors',880,815,(-1.6,2,1.2),size=36)
    log('s17',a,b,'component names','Identify the otherwise ambiguous miniature safety devices',['检查','制动','传感器'])
    for sid in ['s18','s30']:
        pair(scenes[sid]['start']+.2,scenes[sid]['start']+3.5,'内部示意','Inside view',1660,55,28,True,role='context')
    a=time('s19',1)+.2;b=time('s19',2)-.2
    callout('s19',a,b,'磁检测','Magnetic scan',1400,190,(0,.63,2.35));log('s19',a,b,'component leader','Locate the detector around the rope',['磁检测'])
    a=time('s21',1)+.15;b=time('s21',2)-.1
    callout('s21',a,b,'传感器','Sensor',120,150,(4.67,.9,4.36),size=38)
    callout('s21',a,b,'控制台','Controls',1440,630,(3.3,2.19,1.5),size=38)
    wire=[(4.67,.72,4.3),(4.8,1,3),(4.8,1.9,.6),(3.3,1.9,.9),(3.3,2.19,1.5)]
    def signal(ta,tb,t):
        phase=((t-a)%1.8)/1.8*(len(wire)-1);j=min(len(wire)-2,int(phase));world=np.array(wire[j])+(np.array(wire[j+1])-wire[j])*(phase-j);q=p('s21',t,world)
        rect(ta,tb,q[0]-5,q[1]-5,10,10,GREEN,'00',1)
    during(a,b,signal);log('s21',a,b,'signal path','Follow the wiring from sensor to controls',['传感器','控制台'])
    a=time('s22',0)+.5;b=time('s22',2)-.1
    callout('s22',a,b,'停止','STOP',1450,605,(3.3,2.19,1.5),color=ORANGE,size=46)
    log('s22',a,b,'stop state','Tie the warning to the control system while the faulty cabin stays stopped',['停止'])
    a=time('s23',0)+.3;b=time('s23',1)-.1
    callout('s23',a,b,'工作制动','Service brake',1410,600,(0,.53,1.75),size=38)
    log('s23',a,b,'component leader','Distinguish the disc brake from the rim brake',['工作制动'])
    a=time('s23',1)+.2;b=time('s23',2)-.2
    callout('s23',a,b,'紧急制动','Emergency brake',90,180,(1.71,0,3.6),size=38)
    log('s23',a,b,'component leader','Show the other brake acting on the large wheel',['紧急制动'])
    a=time('s24',0)+.2;b=time('s24',1)-.2
    callout('s24',a,b,'弹簧','Spring',1420,260,(.15,.53,2.45),size=40)
    log('s24',a,b,'component leader','Locate the spring above the pads',['弹簧'])
    a=time('s24',1)+.1;b=scenes['s24']['start']+9.4
    callout('s24',a,b,'间隙','Gap',120,610,(0,.53,1.87),size=40)
    log('s24',a,b,'released-state detail','Locate the visible gap before the spring closes it',['间隙'])
    a=scenes['s24']['start']+12.2;b=ends['s24']-.2
    callout('s24',a,b,'压紧','Applied',120,610,(0,.53,1.79),size=40)
    log('s24',a,b,'applied-state detail','Label contact only after the pad has actually closed',['压紧'])
    a=time('s26',0)+.2;b=time('s26',1)-.15
    callout('s26',a,b,'风速仪','Wind meter',1430,130,(2.2,1.3,5),size=38)
    log('s26',a,b,'component leader','Locate the rotating weather instrument',['风速仪'])
    a=time('s28',1)+.2;b=time('s28',2)-.2
    callout('s28',a,b,'备用驱动','Backup drive',1430,680,(-2.1,-1,1.1),size=38)
    log('s28',a,b,'component leader','Distinguish the blue auxiliary drive from the main motor',['备用驱动'])
    a=time('s33',2)+.1;b=ends['s33']-.2
    check(a,b,1410,450);pair(a,b,'留在厢内','Stay inside',1475,390,44)
    log('s33',a,b,'answer reveal','Emphasize the one passenger action after the child has answered',['留在厢内'])
    a=time('s34',1);b=time('s34',2)
    pair(a,b,'支架','Tower',490,788,34,True);pair(a,b,'轨道、轮胎','Rails and tires',1440,788,34,True)
    log('s34',a,b,'image-aligned comparison','Identify the two live recap views without repeating the summary',['支架','轨道、轮胎'])
    a=scenes['credits']['start']+.5;b=T['duration']-.3
    pair(a,b,'原理示意；乘坐请听从工作人员','Teaching model; follow the operator',960,780,34,True,role='endnote')
    # Pure-math projection must match the same camera used for the existing 3D film.
    checks={}
    for sid in ['s05','s09','s10','s21','s22','s32']:
        pts=json.loads((B/(sid+'-anchors.json')).read_text());errs=[]
        worlds=([(.66,.7,1.8)] if sid=='s32' else ([(4.67,.9,4.36)] if sid in ['s21','s22'] else [(0,0,1.7),(0,0,3.35),(0,0,4.08)]))
        for f in [0,len(pts)//2,len(pts)-1]:
            t=(round(scenes[sid]['start']*24)+f)/24
            for j,w in enumerate(worlds):errs.append(float(np.linalg.norm(p(sid,t,local(sid,t,w))-pts[f][j])))
        assert max(errs)<.025,(sid,errs);checks[sid]=max(errs)
    assert all(q['bounds'][3]<920 for q in boxes if q['role']!='subtitle'), 'Marks enter subtitle band'
    (B/'film.ass').write_text(g['HEAD']+'\n'.join(rows)+'\n',encoding='utf8')
    (B/'annotation-plan.json').write_text(json.dumps(marks,ensure_ascii=False,indent=2),encoding='utf8')
    (B/'layout-qa.json').write_text(json.dumps({'full_frame':[0,0,1920,1080],'dedicated_sidebar':False,'automatic_card_per_beat':False,'chapter_heading_per_scene':False,'subtitle_safe_top':925,'projection_errors_px':checks,'authored_groups':len(marks),'text_boxes':boxes,'no_explanatory_mark_scenes':[sid for sid in scenes if scenes[sid]['beats'] and not any(m['scene']==sid for m in marks) and sid!='s00']},ensure_ascii=False,indent=2),encoding='utf8')
    print('Authored',len(marks),'content-specific mark groups; preserved 104 subtitle pairs.',flush=True)
