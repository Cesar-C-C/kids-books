(function(root){
 'use strict';
 const phases=['water','detergent','rub','rinse'];
 const next=phase=>phases[Math.min(3,Math.max(0,phases.indexOf(phase))+1)];
 const molecule=(angle,radius=45)=>({head:{x:Math.cos(angle)*(radius+17),y:Math.sin(angle)*(radius+17)},tail:{x:Math.cos(angle)*(radius-8),y:Math.sin(angle)*(radius-8)}});
 const state=(phase,foam=0)=>({phase,foam,hasDetergent:phases.indexOf(phase)>=1,dispersed:phases.indexOf(phase)>=2,rinse:phase==='rinse',equalWater:true,equalOil:true,equalAgitation:true});
 const api={phases,next,molecule,state};if(typeof module!=='undefined')module.exports=api;else root.SoapModel=api;
})(typeof window==='undefined'?globalThis:window);
