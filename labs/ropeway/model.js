(function(root){
  'use strict';
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)), mix=(a,b,t)=>a+(b-a)*t;
  const LINE_SPEED=1.8, STATION_SPEED=.36, RADIUS=2.5, ROPE_RADIUS=1.4;
  function linePoint(u,returning=false){
    const x=returning?mix(7,-7,u):mix(-7,7,u), anchors=[-7,-4,4,7], heights=[4,5.15,6.85,8];
    let k=0;while(k<2&&x>anchors[k+1])k++;
    const q=(x-anchors[k])/(anchors[k+1]-anchors[k]);
    const y=mix(heights[k],heights[k+1],q)-.23*Math.sin(Math.PI*q);
    return [x,y,returning?1.4:-1.4];
  }
  // Table-driven paths keep station grip actions, support and speed in one model.
  function stationPoint(segment,u,s=1){
    let x,z;
    if(segment==='support'){x=mix(7,8,u);z=-1.4;}
    if(segment==='detach'){x=mix(8,8.5,u);z=-1.4;}
    if(segment==='decelerate'){x=mix(8.5,10,u);z=mix(-1.4,-2.5,(1-Math.cos(Math.PI*u))/2);}
    if(segment==='board'){x=10+RADIUS*Math.sin(Math.PI*u);z=-RADIUS*Math.cos(Math.PI*u);}
    if(segment==='accelerate'){x=mix(10,8.5,u);z=mix(2.5,1.4,(1-Math.cos(Math.PI*u))/2);}
    if(segment==='couple'){x=mix(8.5,8,u);z=1.4;}
    if(segment==='check'){x=mix(8,7,u);z=1.4;}
    return [s*x,s===1?8:4,s*z];
  }
  const phases=[];
  function add(id,length,v0,v1,point,extra={}){
    const samples=[0];let previous=point(0);length=0;
    for(let i=1;i<=200;i++){const p=point(i/200);length+=Math.hypot(...p.map((v,k)=>v-previous[k]));samples.push(length);previous=p;}
    const arcPoint=q=>{const d=clamp(q)*length;let k=1;while(k<200&&samples[k]<d)k++;return point((k-1+(d-samples[k-1])/(samples[k]-samples[k-1]||1))/200);};
    const duration=length/((v0+v1)/2);
    const start=phases.length?phases.at(-1).end:0;
    phases.push({id,duration,start,end:start+duration,v0,v1,point:arcPoint,...extra});
  }
  let lineLength=0,prev=linePoint(0);
  for(let i=1;i<=200;i++){const p=linePoint(i/200);lineLength+=Math.hypot(...p.map((x,k)=>x-prev[k]));prev=p;}
  for(const s of [1,-1]){
    add('line',lineLength,LINE_SPEED,LINE_SPEED,u=>linePoint(u,s===-1),{station:s,rail:false});
    for(const [id,len,v0,v1] of [['support',1,1.8,1.8],['detach',.5,1.8,1.8],['decelerate',Math.hypot(1.5,1.1),1.8,.36],['board',Math.PI*RADIUS,.36,.36],['accelerate',Math.hypot(1.5,1.1),.36,1.8],['couple',.5,1.8,1.8],['check',1,1.8,1.8]]){
      add(id,len,v0,v1,u=>stationPoint(id,u,s),{station:s,rail:true});
    }
  }
  const PERIOD=phases.at(-1).end;
  // Constant time-acceleration gives v² linear in travelled path distance.
  // Conveyor tires at each fixed station location match this local speed.
  function stationSpeed(id,pathFraction){
    const p=phases.find(p=>p.id===id&&p.station===1);
    if(!p||!p.rail)throw Error('Unknown station phase: '+id);
    return Math.sqrt(p.v0*p.v0+(p.v1*p.v1-p.v0*p.v0)*clamp(pathFraction));
  }
  function carrierAt(time){
    const t=((time%PERIOD)+PERIOD)%PERIOD,phase=phases.find(p=>t<p.end)||phases.at(-1);
    const u=clamp((t-phase.start)/phase.duration);
    const q=(phase.v0*u+.5*(phase.v1-phase.v0)*u*u)/((phase.v0+phase.v1)/2);
    const position=phase.point(q),ahead=phase.point(clamp(q+.001)),behind=phase.point(clamp(q-.001));
    let grip=phase.id==='line'||phase.id==='support'||phase.id==='check'?1:0;
    if(phase.id==='detach')grip=1-u;
    if(phase.id==='couple')grip=u;
    return {phase:phase.id,station:phase.station,position,rail:phase.rail,grip,
      checked:phase.id==='check'||phase.id==='line',
      speed:mix(phase.v0,phase.v1,u),heading:Math.atan2(ahead[0]-behind[0],ahead[2]-behind[2]),progress:u};
  }
  function rawRopePoint(u,stretch=0){
    const lower=-10-.3*clamp(stretch);
    const a=20-lower-10, arc=Math.PI*ROPE_RADIUS, total=2*a+2*arc;
    let d=((u%1)+1)%1*total;
    function span(x,z){
      if(x>=-7&&x<=7){const p=linePoint((x+7)/14);return [x,p[1],z];}
      return [x,x<0?4:8,z];
    }
    if(d<a)return span(mix(lower,10,d/a),-ROPE_RADIUS);
    d-=a;if(d<arc){const q=d/ROPE_RADIUS;return [10+ROPE_RADIUS*Math.sin(q),8,-ROPE_RADIUS*Math.cos(q)];}
    d-=arc;if(d<a)return span(mix(10,lower,d/a),ROPE_RADIUS);
    d-=a;const q=d/ROPE_RADIUS;
    return [lower-ROPE_RADIUS*Math.sin(q),4,ROPE_RADIUS*Math.cos(q)];
  }
  const ropeCache=new Map();
  function ropePath(stretch){
    const key=clamp(stretch).toFixed(4);if(ropeCache.has(key))return ropeCache.get(key);
    const samples=[0];let length=0,previous=rawRopePoint(0,stretch);
    for(let i=1;i<=1000;i++){const p=rawRopePoint(i/1000,stretch);length+=Math.hypot(...p.map((v,k)=>v-previous[k]));samples.push(length);previous=p;}
    const path={length,point(u){const d=(((u%1)+1)%1)*length;let lo=1,hi=1000;while(lo<hi){const m=Math.floor((lo+hi)/2);if(samples[m]<d)lo=m+1;else hi=m;}return rawRopePoint((lo-1+(d-samples[lo-1])/(samples[lo]-samples[lo-1]||1))/1000,stretch);}};
    ropeCache.set(key,path);return path;
  }
  function ropePoint(u,stretch=0){return ropePath(stretch).point(u);}
  function ropeLength(stretch=0){return ropePath(stretch).length;}
  function create(){
    const state={time:0,mode:'paused',factor:0,stretch:0,fault:null,stopElapsed:0};
    return {
      state,
      play(){if(state.fault)return false;state.mode='running';state.factor=1;return true;},
      pause(){if(state.mode==='running'||state.mode==='aux-running'){state.mode=state.mode==='aux-running'?'power-stop':'paused';state.factor=0;}},
      reset(){Object.assign(state,{time:0,mode:'paused',factor:0,stretch:0,fault:null,stopElapsed:0});},
      seek(phase){if(state.fault)return false;const p=phases.find(p=>p.id===phase&&p.station===1);if(!p)return false;state.time=p.start+p.duration*.5;return true;},
      fault(kind){if(!['grip','power'].includes(kind)||state.fault)return false;if(kind==='grip')state.time=phases.find(p=>p.id==='check'&&p.station===1).start;state.fault=kind;state.mode='stopping';state.factor=1;state.stopElapsed=0;return true;},
      auxiliary(){if(state.fault!=='power'||state.mode!=='power-stop')return false;state.mode='aux-running';state.factor=.22;return true;},
      tick(dt){
        dt=clamp(dt,0,.1);
        if(state.mode==='stopping'){
          const old=state.factor;state.stopElapsed+=dt;state.factor=clamp(1-state.stopElapsed/.6);
          state.time+=dt*(old+state.factor)/2;
          if(!state.factor)state.mode=state.fault==='grip'?'protective-stop':'power-stop';
        }else if(state.mode==='running'||state.mode==='aux-running')state.time+=dt*state.factor;
        return this.snapshot();
      },
      snapshot(){
        const cars=Array.from({length:8},(_,i)=>carrierAt(state.time+i*PERIOD/8));
        if(state.fault==='grip')cars[0].checked=false;
        return {...state,cars,brakes:state.mode==='stopping'||state.mode==='protective-stop'||state.mode==='power-stop',
          auxiliaryAllowed:state.mode==='power-stop'&&state.fault==='power',
          drive:state.mode==='aux-running'?'auxiliary':state.factor?'main':'none'};
      }
    };
  }
  root.RopewayModel=Object.freeze({create,carrierAt,ropePoint,ropeLength,stationPoint,stationSpeed,linePoint,phases,PERIOD,LINE_SPEED,STATION_SPEED,ROPE_RADIUS,RADIUS});
})(typeof window==='undefined'?globalThis:window);
