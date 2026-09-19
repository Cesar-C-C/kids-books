const assert=require('node:assert/strict');
const model=require('../books/moon/moon-model.js');
function inside(poly,x,y){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
let compared=0;
// Independent 3D visible-sphere normal dot sunlight direction, not an area formula.
// Camera faces the near hemisphere (z>0); north is up. At first quarter Sun is screen-right.
for(const deg of [0,30,60,90,120,150,180,210,240,270,300,330]){
 const a=deg*Math.PI/180,sun=[Math.sin(a),0,-Math.cos(a)];
 const poly=[...model.path(deg,1,0,0).matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)].map(m=>[+m[1],+m[2]]);
 for(let ix=-45;ix<=45;ix++)for(let iy=-45;iy<=45;iy++){
  const x=ix/50,y=iy/50;if(x*x+y*y>.96)continue;
  const z=Math.sqrt(1-x*x-y*y),lit=x*sun[0]+z*sun[2];if(Math.abs(lit)<.025)continue;
  assert.equal(inside(poly,x,y),lit>0,`orientation angle=${deg} x=${x} y=${y}`);compared++;
 }
}
console.log(`PASS ${compared} independently projected light/shadow samples, waxing/waning direction and cardinal phases`);
