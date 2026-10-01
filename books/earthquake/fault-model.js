(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.EarthquakeFault=api;})(typeof window==='object'?window:globalThis,()=>{
 'use strict';
 // Dimensionless teaching slider: compression loads an elastic spring against
 // static friction. Once it slips, lower dynamic friction permits rebound.
 // The driver stops at the first event; it is NOT triggered by releasing input.
 const FAULT_PROFILE=Object.freeze({spring:4,staticFriction:.6,dynamicFriction:.24,damping:2,mass:1,driveSpeed:.06,step:1/240});
 function createFault(){return {phase:'initial',time:0,driverDisplacement:0,elasticStrain:0,slipOffset:0,velocity:0,paused:false,eventCount:0};}
 function pauseFault(s,paused){return {...s,paused:!!paused};}
 function stepFault(state,{drive,dt}){
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('dt must be finite and nonnegative');
  let s={...state};if(s.paused||s.phase==='settled'||dt===0)return s;
  let remaining=Math.min(dt,.1);const p=FAULT_PROFILE;
  while(remaining>1e-12){const h=Math.min(remaining,p.step);remaining-=h;s.time+=h;
   if(s.eventCount===0){if(drive)s.driverDisplacement+=p.driveSpeed*h;s.elasticStrain=s.driverDisplacement-s.slipOffset;if(s.driverDisplacement>0)s.phase='locked';
    if(p.spring*s.elasticStrain>=p.staticFriction-1e-12){s.phase='slipping';s.eventCount=1;}
   }
   if(s.phase==='slipping'){
    const force=p.spring*(s.driverDisplacement-s.slipOffset)-p.dynamicFriction-p.damping*s.velocity;
    const next=s.velocity+force/p.mass*h;
    if(next<=0&&s.slipOffset>0){s.velocity=0;s.phase='settled';}
    else {s.velocity=Math.max(0,next);s.slipOffset+=s.velocity*h;}
    s.elasticStrain=s.driverDisplacement-s.slipOffset;
   }
  }return s;
 }
 return {FAULT_PROFILE,createFault,resetFault:createFault,pauseFault,stepFault};
});
