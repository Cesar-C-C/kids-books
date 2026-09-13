/* Geometry traced from the picture-book nose, cover and station illustrations.
   No dimensions are claimed from perspective artwork. Forward is -X, Y up. */
(() => {
 'use strict';
 window.BookTrainExterior={create(T){
  const kit=BookTrainInteriors.create(T),root=new T.Group();root.name='Picture-book train';
  const assemblies=kit.assemblies;assemblies.forEach(a=>root.add(a.group));
  const by=id=>assemblies.find(a=>a.region===id);
  const material=(c,m=0,r=.42)=>new T.MeshStandardMaterial({color:c,metalness:m,roughness:r,side:T.DoubleSide});
  const ivory=material(0xf4f0e4,.18),blue=material(0x157cc1,.3),ink=material(0x102c3c,.4,.21),glass=material(0x214957,.45,.19),silver=material(0x89949a,.7),seam=material(0x77848a,.3),lamp=material(0xfff6c6,.15,.22),reflection=material(0x91b6ca,.4,.24);
  lamp.emissive=new T.Color(0xffefbf);lamp.emissiveIntensity=.55;
  const ghostMat=new T.MeshBasicMaterial({color:0xa8bab8,transparent:true,opacity:.065,depthWrite:false,side:T.DoubleSide});
  function assembly(id,region,center,radius){const group=new T.Group(),exterior=new T.Group(),interior=new T.Group(),ghost=new T.Group();group.add(exterior,interior,ghost);group.name=id;group.userData={assemblyId:id,region};interior.visible=ghost.visible=false;root.add(group);const a={id,region,group,exterior,interior,ghost,center:new T.Vector3(...center),radius,details:{}};assemblies.push(a);return a;}
  function add(a,parent,geo,mat,name,detail){const o=new T.Mesh(geo,mat);o.name=name;o.userData={region:a.region,assemblyId:a.id,...(detail?{detail}:{})};o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function detail(a,id,layer=a.exterior){const g=new T.Group();g.name=id;g.userData={detail:id,region:a.region,assemblyId:a.id};layer.add(g);a.details[id]=g;return g;}
  // Smooth Hermite interpolation preserves the broad, rounded nose in all views.
  const stations=[[-11,-.43,-.53,.035,1],[-10.88,-.05,-.73,.38,1],[-10.58,.15,-.86,.76,1],[-10.05,.31,-.91,.93,.98],[-9.4,.55,-.96,.99,.94],[-8.6,.94,-.96,1.08,.87],[-7.7,1.37,-.96,1.15,.76],[-6.7,1.67,-.96,1.19,.64],[-5.6,1.75,-.96,1.2,.55],[8,1.75,-.96,1.2,.55]];
  function section(x){let k=0;while(k<stations.length-2&&x>stations[k+1][0])k++;const a=stations[k],b=stations[k+1],t=T.MathUtils.clamp((x-a[0])/(b[0]-a[0]),0,1);return [1,2,3,4].map(j=>{if(j===4)return a[j]+(b[j]-a[j])*t;const prev=stations[Math.max(0,k-1)],next=stations[Math.min(stations.length-1,k+2)],m0=k?(b[j]-prev[j])/(b[0]-prev[0]):(b[j]-a[j])/(b[0]-a[0]),m1=k===stations.length-2?0:(next[j]-a[j])/(next[0]-a[0]);return (2*t*t*t-3*t*t+1)*a[j]+(t*t*t-2*t*t+t)*m0*(b[0]-a[0])+(-2*t*t*t+3*t*t)*b[j]+(t*t*t-t*t)*m1*(b[0]-a[0]);});}
  function point(x,theta,offset=0){const [top,bottom,w,upperN]=section(x),n=Math.sin(theta)<0?Math.min(upperN,.52):upperN,c=(top+bottom)/2,h=(top-bottom)/2;return new T.Vector3(x,c+Math.sign(Math.sin(theta))*Math.pow(Math.abs(Math.sin(theta)),n)*(h+offset),Math.sign(Math.cos(theta))*Math.pow(Math.abs(Math.cos(theta)),n)*(w+offset));}
  function flank(x,y,side,offset=.012){const [top,bottom,w,upperN]=section(x),n=y<(top+bottom)/2?Math.min(upperN,.52):upperN,q=T.MathUtils.clamp((y-(top+bottom)/2)/((top-bottom)/2),-.9999,.9999);return new T.Vector3(x,y,side*(w*Math.pow(Math.max(0,1-Math.pow(Math.abs(q),2/n)),n/2)+offset));}
  function geometry(vertices,indices){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;}
  function surface(from,to,ta,tb,nx=120,nt=44,offset=0){const v=[],ix=[];for(let i=0;i<=nx;i++)for(let j=0;j<=nt;j++)v.push(...point(from+(to-from)*i/nx,ta+(tb-ta)*j/nt,offset).toArray());for(let i=0;i<nx;i++)for(let j=0;j<nt;j++){const q=i*(nt+1)+j;ix.push(q,q+nt+1,q+1,q+1,q+nt+1,q+nt+2);}return geometry(v,ix);}
  function line(a,parent,points,mat,r=.009,detailId){return add(a,parent,new T.TubeGeometry(new T.CatmullRomCurve3(points),Math.max(20,points.length*3),r,5,false),mat,'Surface seam',detailId);}
  function patch(a,parent,shape,map,mat,name,detailId){const flat=new T.ShapeGeometry(shape,18),pos=flat.attributes.position,idx=flat.index.array,v=[],ix=[];function tri(p,q,r,depth){if(depth){const pq=p.clone().lerp(q,.5),qr=q.clone().lerp(r,.5),rp=r.clone().lerp(p,.5);tri(p,pq,rp,depth-1);tri(pq,q,qr,depth-1);tri(rp,qr,r,depth-1);tri(pq,qr,rp,depth-1);return;}const start=v.length/3;for(const x of [p,q,r])v.push(...map(x.x,x.y).toArray());ix.push(start,start+1,start+2);}
   for(let i=0;i<idx.length;i+=3)tri(...[0,1,2].map(j=>new T.Vector2(pos.getX(idx[i+j]),pos.getY(idx[i+j]))),2);flat.dispose();return add(a,parent,geometry(v,ix),mat,name,detailId);}
  function rounded(x,y,w,h,r=.055){const s=new T.Shape();s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
  const cab=by('cab'),body=by('body'),roof=by('roof');
  add(cab,cab.exterior,surface(-11,-5.6,0,Math.PI*2,105,72),ivory,'Rounded nose and shoulders');
  add(body,body.exterior,surface(-5.6,8,Math.PI*.78,Math.PI*2.22),ivory,'Continuous lower body');
  add(roof,roof.exterior,surface(-5.6,8,Math.PI*.22,Math.PI*.78),ivory,'Rounded roof');
  for(const a of [cab,body,roof]){const g=a.exterior.children.find(o=>o.isMesh);if(g)add(a,a.ghost,g.geometry.clone(),ghostMat,'Coarse context silhouette');}
  // A skin-conforming canopy, with a narrow blue lower rim, is not a box placed on the roof.
  function canopy(mat,offset,scale=1){const v=[],ix=[],nx=56,ny=34;for(let i=0;i<=nx;i++){const u=i/nx,x=-8.87+2.93*u,spread=.78*Math.pow(Math.sin(Math.PI*u),.38)*scale;for(let j=0;j<=ny;j++)v.push(...point(x,Math.PI/2+(j/ny*2-1)*spread,offset).toArray());}for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const q=i*(ny+1)+j;ix.push(q,q+1,q+ny+1,q+1,q+ny+2,q+ny+1);}return add(cab,cab.exterior,geometry(v,ix),mat,'Wraparound windshield');}
  canopy(blue,.020,1.065);canopy(ink,.033);canopy(glass,.038,.93);
  const frontPane=new T.Shape();frontPane.moveTo(-8.43,1.24);frontPane.quadraticCurveTo(-8.5,1.57,-8.43,1.90);frontPane.lineTo(-6.65,2.17);frontPane.quadraticCurveTo(-6.40,1.57,-6.65,.97);frontPane.closePath();
  patch(cab,cab.exterior,frontPane,(x,t)=>point(x,t,.061),material(0x36576b,.42,.23),'Central forward glazing');
  line(cab,cab.exterior,frontPane.getPoints(22).map(v=>point(v.x,v.y,.073)),silver,.014);
  for(const side of [-1,1]){const sidePane=new T.Shape();sidePane.moveTo(-7.7,1.57+side*.54);sidePane.quadraticCurveTo(-6.7,1.57+side*.65,-6.35,1.57+side*.44);sidePane.quadraticCurveTo(-6.6,1.57+side*.75,-7.15,1.57+side*.72);sidePane.closePath();patch(cab,cab.exterior,sidePane,(x,t)=>point(x,t,.058),material(0x2b576b,.35,.22),'Side windshield glazing');}
  // Front glass divider, soft reflection and two surface-following wipers.
  for(const u of [.19,.81]){const x=-8.87+2.93*u,w=.70*Math.pow(Math.sin(Math.PI*u),.38);line(cab,cab.exterior,Array.from({length:20},(_,j)=>point(x,Math.PI/2-w+2*w*j/19,.049)),silver,.012);}
  for(const sign of [-1,1]){line(cab,cab.exterior,Array.from({length:18},(_,i)=>point(-8.42+i*.071,Math.PI/2+sign*.24,.100)),ink,.020);line(cab,cab.exterior,[point(-8.43,Math.PI/2+sign*.24,.102),point(-8.21,Math.PI/2+sign*.50,.102)],silver,.012);}
  line(cab,cab.exterior,Array.from({length:35},(_,i)=>point(-8.28+i*.035,Math.PI/2-.25,.053)),reflection,.016);
  // The long separate wedge windows below the canopy distinguish the illustration.
  for(const side of [-1,1]){
   const wedge=new T.Shape();wedge.moveTo(-8.46,.16);wedge.quadraticCurveTo(-7.16,.28,-5.93,.27);wedge.quadraticCurveTo(-5.79,.29,-5.83,.41);wedge.lineTo(-5.89,1.08);wedge.quadraticCurveTo(-6,1.19,-6.16,1.08);wedge.quadraticCurveTo(-7.45,.98,-8.46,.16);
   patch(cab,cab.exterior,wedge,(x,y)=>flank(x,y,side,.025),ink,'Tapered side cab window');
   for(let x=-7.9;x<-6;x+=.29){const top=.20+(-8.46-x)*-.38;line(cab,cab.exterior,[flank(x,.24,side,.039),flank(x,Math.min(1,top),side,.039)],glass,.006);}
   const stripe=new T.Shape();stripe.moveTo(-9.45,-.43);stripe.quadraticCurveTo(-7.8,-.10,-5.7,.04);stripe.lineTo(8,.04);stripe.lineTo(8,-.095);stripe.lineTo(-5.7,-.095);stripe.quadraticCurveTo(-7.9,-.20,-9.45,-.43);
   patch(body,body.exterior,stripe,(x,y)=>flank(x,y,side,.024),blue,'Blue belt tapering before nose');
   const headlight=new T.Shape();headlight.moveTo(-9.23,.25);headlight.quadraticCurveTo(-9.12,.54,-8.35,.66);headlight.quadraticCurveTo(-8.22,.66,-8.33,.56);headlight.quadraticCurveTo(-8.79,.25,-9.23,.25);
   patch(cab,cab.exterior,headlight,(x,y)=>flank(x,y,side,.04),silver,'Teardrop headlight housing');
   for(const [x,y,r]of[[-8.52,.55,.075],[-8.73,.46,.096],[-8.94,.36,.055]]){const c=new T.Shape();c.absellipse(x,y,r,r*.65,0,Math.PI*2,false,0);patch(cab,cab.exterior,c,(x,y)=>flank(x,y,side,.056),lamp,'Round lamp in teardrop housing');}
  }
  // Coupler cover seams are fine lines lying on the nose, not raised rings.
  const ring=[];for(let i=0;i<=70;i++){const t=i/70*Math.PI*2;ring.push(point(-10.3+.65*Math.sin(t),t,.012));}line(cab,cab.exterior,ring,seam,.006);
  const windows=assembly('windows','windows',[.8,.65,0],5.7),pane=detail(windows,'windows.pane'),shade=detail(windows,'windows.shade',windows.interior),blinds=[];
  for(const side of [-1,1])for(let i=0;i<12;i++){const x=-4.6+i*.91;
   patch(windows,pane,rounded(x,.27,.78,.77),(x,y)=>flank(x,y,side,.022),ink,'Window surround','windows.pane');
   patch(windows,pane,rounded(x+.032,.30,.716,.71,.035),(x,y)=>flank(x,y,side,.027),glass,'Passenger glazing','windows.pane');
   line(windows,pane,[flank(x+.16,.37,side,.036),flank(x+.26,.92,side,.036)],reflection,.008,'windows.pane');
   const b=add(windows,shade,new T.BoxGeometry(.7,.69,.018),material(0xd7d1bd),'Roller blind','windows.shade');b.position.set(x+.39,.64,side*1.10);blinds.push(b);
  }
  add(windows,windows.ghost,new T.BoxGeometry(11.4,.74,2.4),ghostMat,'Window area silhouette').position.set(.8,.65,0);
  const doors=assembly('doors','doors',[-5.2,.2,0],1.7),leaf=detail(doors,'doors.leaf'),sensor=detail(doors,'doors.sensor',doors.interior),moving=[];
  for(const side of [-1,1])for(const x of [-5.35,6.65]){const group=new T.Group();leaf.add(group);group.userData={region:'doors',assemblyId:'doors',detail:'doors.leaf'};
   const outline=rounded(x,-.74,.48,2,.065);patch(doors,group,outline,(x,y)=>flank(x,y,side,.025),seam,'Door seal','doors.leaf');
   patch(doors,group,rounded(x+.018,-.72,.444,1.96,.057),(x,y)=>flank(x,y,side,.034),ivory,'Flush sliding door','doors.leaf');
   patch(doors,group,rounded(x+.15,.37,.18,.70,.07),(x,y)=>flank(x,y,side,.045),glass,'Tall narrow door glazing','doors.leaf');
   patch(doors,group,rounded(x+.018,-.095,.444,.135,.005),(x,y)=>flank(x,y,side,.045),blue,'Door belt continuity','doors.leaf');
   moving.push(group);const led=add(doors,sensor,new T.BoxGeometry(.045,.035,.016),lamp,'Door sensor','doors.sensor');led.position.copy(flank(x+.42,1.15,side,.046));
  }
  add(doors,doors.ghost,new T.BoxGeometry(.5,2,2.4),ghostMat,'Door pair silhouette').position.set(-5.1,.24,0);
  // Grey skirts leave only the two bogie wells exposed, as in the cover.
  for(const side of [-1,1])for(const [lo,hi,bottom]of[[-6.9,-4.25,-.88],[-4.25,4.15,-1.04],[4.15,6.85,-.88],[6.85,8,-1.04]]){const shape=rounded(lo,bottom,hi-lo,-.57-bottom,.035);patch(body,body.exterior,shape,(x,y)=>new T.Vector3(x,y,side*1.12),silver,'Lower equipment skirt');}
  add(cab,cab.exterior,surface(-10.85,-6.9,Math.PI*1.23,Math.PI*1.77,54,25,.018),silver,'Curved nose belly fairing');
  for(const side of [-1,1])for(let x=-3.7;x<3.9;x+=.85)for(let n=0;n<4;n++)line(body,body.exterior,[new T.Vector3(x+n*.055,-.64,side*1.13),new T.Vector3(x+n*.055,-.98,side*1.13)],ink,.007);
  // Connected coaches recede behind the leading carriage, matching the cover.
  for(const start of [8.35,25.1]){const tail=start===25.1,a=assembly('coach-'+start,tail?'cab':'body',tail?[start+14.8,.4,0]:[start+8,.3,0],tail?1.8:8.5);
   if(tail){
    // The rear driving car reuses the complete leading-car surfaces, turned 180°.
    // This preserves the same rounded nose, glazing, lights and continuous belt.
    const shell=new T.Group();shell.name='Reverse driving car';shell.rotation.y=Math.PI;shell.position.x=start+8;
    for(const source of [cab,body,roof,windows,doors])shell.add(source.exterior.clone(true));
    shell.traverse(o=>{o.userData={region:'cab',assemblyId:a.id};});a.exterior.add(shell);
    const deck=cab.interior.clone(true);deck.name='Rear driving desk';deck.visible=true;deck.rotation.y=Math.PI;deck.position.x=start+8;
    deck.traverse(o=>{o.userData={...o.userData,region:'cab',assemblyId:a.id};});a.interior.add(deck);
    for(const id of Object.keys(cab.details)){const d=deck.getObjectByName(id);if(d)a.details[id]=d;}
    a.rearDrivingCar=true;a.noseDirection=1;
   }else{const shell=surface(-5.6,8,0,Math.PI*2,40,32);shell.scale(16.4/13.6,1,1);shell.translate(start+5.6*16.4/13.6,0,0);add(a,a.exterior,shell,ivory,'Following coach body');add(a,a.ghost,shell.clone(),ghostMat,'Following coach silhouette');
   for(const side of [-1,1]){const strip=add(a,a.exterior,new T.BoxGeometry(16.3,.135,.014),blue,'Continuous blue belt');strip.position.set(start+8.2,-.03,side*1.203);for(let i=0;i<17;i++){const w=add(a,a.exterior,new T.BoxGeometry(.74,.76,.02),glass,'Following coach window');w.position.set(start+.95+i*.88,.64,side*1.20);}}
   }const bellows=add(a,a.exterior,new T.BoxGeometry(.30,2.40,2.12),ink,'Flexible gangway');bellows.position.set(start-.175,.38,0);
  }
  const seatDeck=add(by('seats'),by('seats').exterior,new T.BoxGeometry(11.7,.055,2.16),material(0xa0aeb3),'Cabin floor beneath seats');seatDeck.position.set(.85,-.37,0);
  const original=kit.update;return {root,assemblies,counts:{meshes:0},update(state){original(state);const n=state.mechanism&&state.region==='doors'?state.level||0:0;moving.forEach(g=>{g.position.x=n*.52;g.position.z=Math.sign(g.children[0]?.geometry.attributes.position.getZ(0)||1)*n*.06;});const k=state.mechanism&&state.region==='windows'?state.level||0:0;blinds.forEach(b=>{b.scale.y=.03+.97*k;b.position.y=.985-.345*k;});},reference:{nose:[-11,-5.6],bodyWidth:2.4,leadLength:19,images:['01_cover_c_r2.webp','03_nose_c_r2.webp']},section,point,flank};
 }};
})();
