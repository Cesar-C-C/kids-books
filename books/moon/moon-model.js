(function(root){
  'use strict';
  const norm = a => ((Number(a)%360)+360)%360;
  function state(angle) {
    const a=norm(angle), r=a*Math.PI/180;
    return {angle:a, fraction:(1-Math.cos(r))/2,x:200+130*Math.cos(r),y:165-130*Math.sin(r),index:Math.floor((a+22.5)/45)%8};
  }
  function path(angle, radius=80, cx=100, cy=100) {
    const a=norm(angle), cos=Math.cos(a*Math.PI/180), right=a<=180;
    const points=[];
    for(let i=0;i<=80;i++) {const y=-1+i/40, w=Math.sqrt(Math.max(0,1-y*y));points.push([cx+(right?w:-w)*radius,cy+y*radius]);}
    for(let i=80;i>=0;i--) {const y=-1+i/40,w=Math.sqrt(Math.max(0,1-y*y));points.push([cx+(right?cos*w:-cos*w)*radius,cy+y*radius]);}
    return points.map((p,i)=>(i?'L':'M')+p.map(v=>v.toFixed(3)).join(',')).join(' ')+' Z';
  }
  const api={state,path}; root.MoonModel=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
