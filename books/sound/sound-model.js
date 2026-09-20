(function(root){
 'use strict';
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number(v)||0));
 const parameters=(mode,value)=>({frequency:mode==='pitch'?220+220*clamp(value,0,1):220,gain:mode==='loudness'?.012+.018*clamp(value,0,1):.018,amplitude:mode==='loudness'?4+6*clamp(value,0,1):7,rate:mode==='pitch'?1+clamp(value,0,1):1});
 // k and omega rise together: higher pitch does not travel faster in the same medium.
 const particle=(index,time,amplitude=7,rate=1)=>{const equilibrium=36+index*16;return {equilibrium,x:equilibrium+amplitude*Math.sin((index*.46-time)*rate),y:76};};
 const api={parameters,particle};if(typeof module!=='undefined')module.exports=api;else root.SoundModel=api;
})(typeof window==='undefined'?globalThis:window);
