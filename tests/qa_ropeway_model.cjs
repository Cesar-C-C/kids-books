'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(process.env.ROPEWAY_ROOT||path.join(__dirname,'..'));
const ctx={};vm.createContext(ctx);
for(const f of ['model.js','content.js'])vm.runInContext(fs.readFileSync(path.join(root,'labs/ropeway',f),'utf8'),ctx);
const M=ctx.RopewayModel,distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
for(const id of ['decelerate','board','accelerate']){
  const p=M.phases.find(p=>p.id===id&&p.station===1);
  assert.equal(M.stationSpeed(id,0),p.v0);assert.ok(Math.abs(M.stationSpeed(id,1)-p.v1)<1e-8);
  for(let q=.1;q<=1;q+=.1){
    const a=M.stationSpeed(id,q-.1),b=M.stationSpeed(id,q);
    assert.ok(id==='decelerate'?b<a:id==='accelerate'?b>a:Math.abs(b-a)<1e-8,'station tire speed gradient: '+id);
  }
}
for(let i=0;i<M.phases.length;i++){const p=M.phases[i],n=M.phases[(i+1)%M.phases.length];assert.ok(distance(p.point(1),n.point(0))<1e-8,p.id+' endpoint');assert.ok(p.duration>0);}
for(let t=0;t<M.PERIOD;t+=.025){
 const c=M.carrierAt(t);assert.ok(c.position.every(Number.isFinite));assert.ok(Number.isFinite(c.heading));
 if(c.grip<.999)assert.equal(c.rail,true,'rail supports released carrier');
 if(['couple','check','detach','support'].includes(c.phase))assert.ok(Math.abs(c.speed-M.LINE_SPEED)<1e-8,'rope-speed match before clamping');
 if(c.phase==='line')assert.equal(c.grip,1);if(c.phase==='board')assert.equal(c.grip,0);
}
let minGap=Infinity;
for(let t=0;t<M.PERIOD;t+=.07){const cars=Array.from({length:8},(_,i)=>M.carrierAt(t+i*M.PERIOD/8));for(let i=0;i<8;i++)for(let j=i+1;j<8;j++)minGap=Math.min(minGap,distance(cars[i].position,cars[j].position));}
assert.ok(minGap>1.3,'carrier envelope clearance: '+minGap);
for(const stretch of [0,.5,1]){assert.ok(distance(M.ropePoint(0,stretch),M.ropePoint(1,stretch))<1e-8);for(let i=0;i<1000;i++)assert.ok(M.ropePoint(i/1000,stretch).every(Number.isFinite));}
assert.ok(Math.abs(M.ropePoint(0,1)[0]-M.ropePoint(0,0)[0]+.3)<1e-8);
assert.ok(Math.abs(M.ropeLength(1)-M.ropeLength(0)-.6)<.01,'two straight spans compensate the illustrated displacement');
const m=M.create();assert.equal(m.state.mode,'paused');m.play();for(let i=0;i<5;i++)m.tick(.1);assert.ok(m.state.time>0);m.pause();const pause=m.state.time;m.tick(.1);assert.equal(m.state.time,pause);
m.fault('grip');for(let i=0;i<10;i++)m.tick(.1);let snap=m.snapshot();
assert.equal(snap.mode,'protective-stop');assert.equal(snap.factor,0);assert.equal(snap.brakes,true);assert.equal(snap.cars[0].phase,'check');assert.equal(snap.cars[0].checked,false);
assert.equal(m.play(),false);assert.equal(m.auxiliary(),false);const stopped=m.state.time;m.tick(.1);assert.equal(m.state.time,stopped);
m.reset();m.fault('power');for(let i=0;i<10;i++)m.tick(.1);assert.equal(m.state.mode,'power-stop');assert.equal(m.auxiliary(),true);snap=m.tick(.1);assert.equal(snap.drive,'auxiliary');assert.equal(snap.brakes,false);assert.equal(snap.factor,.22);
const auxiliaryTime=m.state.time;m.pause();snap=m.tick(.1);assert.equal(snap.time,auxiliaryTime);assert.equal(snap.mode,'power-stop');assert.equal(snap.fault,'power');assert.equal(snap.brakes,true);assert.equal(snap.auxiliaryAllowed,true);assert.equal(m.play(),false);
assert.equal(m.auxiliary(),true);snap=m.tick(.1);assert.ok(snap.time>auxiliaryTime);assert.equal(snap.factor,.22);assert.equal(snap.fault,'power');
assert.equal(ctx.ROPEWAY_CONTENT.length,16);assert.equal(new Set(ctx.ROPEWAY_CONTENT.map(c=>c.id)).size,16);
for(const c of ctx.ROPEWAY_CONTENT){assert.match(c.id,/^[a-z]+$/);for(const l of ['zh','en']){assert.ok(c.title[l]);assert.ok(c.text[l]);}for(const s of c.sources)assert.ok(ctx.ROPEWAY_SOURCES[s-1]);}
for(const f of ['scene.js','app.js','audio.js'])new vm.Script(fs.readFileSync(path.join(root,'labs/ropeway',f),'utf8'));
const html=fs.readFileSync(path.join(root,'labs/ropeway/index.html'),'utf8');
for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^https?:/.test(m[1]))continue;assert.ok(fs.existsSync(path.resolve(root,'labs/ropeway',m[1].split('?')[0])),m[1]);}
console.log(JSON.stringify({status:'PASS',period:M.PERIOD,minCarrierCenterGap:minGap,carBodyEnvelope:1.3,phases:M.phases.length,narrationIds:16,limits:'Illustrative kinematics, not certified clearance or real braking simulation'},null,2));
