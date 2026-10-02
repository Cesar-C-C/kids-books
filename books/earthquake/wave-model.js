(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.EarthquakeWave=api;})(typeof window==='object'?window:globalThis,()=>{
 'use strict';
 const slots=Object.freeze({left:-1,center:0,right:1}),points=Object.freeze({near:{x:0,y:-.5},far:{x:.75,y:-.5}});
 function validSlot(x){if(!Object.hasOwn(slots,x))throw new RangeError('Unknown flag slot');}
 function createWave({a='center',b='left'}={}){validSlot(a);validSlot(b);if(a===b)throw new RangeError('Flags need different slots');return {phase:'ready',time:0,flags:{a,b},arrivalTimes:{a:Math.hypot(slots[a],1),b:Math.hypot(slots[b],1)},arrived:{a:false,b:false},selectedPoint:'near',particleOffset:{x:0,y:0}};}
 function offset(s){const p=points[s.selectedPoint],distance=Math.hypot(p.x,p.y+1),age=s.time-distance;
  if(age<=0||age>=.8)return {x:0,y:0};
  const u=age/.8,amplitude=.03*Math.sin(Math.PI*u)**2*Math.sin(4*Math.PI*u);return {x:amplitude*p.x/distance,y:amplitude*(p.y+1)/distance};}
 function stepWave(s,dt){if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid dt');if(s.phase!=='running')return {...s};const time=Math.min(s.time+Math.min(dt,.1),Math.sqrt(2)+.8),n={...s,time,arrived:{a:time+1e-10>=s.arrivalTimes.a,b:time+1e-10>=s.arrivalTimes.b}};if(time>=Math.sqrt(2)+.8)n.phase='done';n.particleOffset=offset(n);return n;}
 function placeFlag(s,flag,slot){if(!['a','b'].includes(flag))throw new RangeError('Unknown flag');validSlot(slot);if(s.phase!=='ready')return {...s};return {...createWave({...s.flags,[flag]:slot}),selectedPoint:s.selectedPoint};}
 function selectPoint(s,id){if(!Object.hasOwn(points,id))throw new RangeError('Unknown point');const n={...s,selectedPoint:id};return {...n,particleOffset:offset(n)};}
 function setWaveMode(s,phase){if(!({ready:['running'],running:['paused','done'],paused:['running'],done:[]}[s.phase]||[]).includes(phase))throw new RangeError('Invalid wave transition');return {...s,phase};}
 return {slots,points,createWave,stepWave,placeFlag,selectPoint,setWaveMode};
});
