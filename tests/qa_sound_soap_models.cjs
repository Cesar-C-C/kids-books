const assert=require('node:assert/strict');
const sound=require('../books/sound/sound-model.js');
const soap=require('../books/soap/soap-model.js');
for(let i=0;i<31;i++)for(let time=0;time<30;time+=.1){const p=sound.particle(i,time);assert(Math.abs(p.x-p.equilibrium)<=7.00001);}
assert.equal(sound.parameters('pitch',0).gain,sound.parameters('pitch',1).gain);
assert.equal(sound.parameters('pitch',0).amplitude,sound.parameters('pitch',1).amplitude);
assert.equal(sound.parameters('loudness',0).frequency,sound.parameters('loudness',1).frequency);
assert(sound.parameters('loudness',1).gain<=.03);
for(const mode of ['pitch','loudness'])for(let value=0;value<=1;value+=.05){const p=sound.parameters(mode,value);for(let time=0;time<7;time+=.1)for(let i=0;i<30;i++){const a=sound.particle(i,time,p.amplitude,p.rate),b=sound.particle(i+1,time+.46,p.amplitude,p.rate);assert(Math.abs((a.x-a.equilibrium)-(b.x-b.equilibrium))<1e-9,'same phase speed');assert(sound.particle(i+1,time,p.amplitude,p.rate).x>a.x,'particles never cross');}}
for(let a=0;a<Math.PI*2;a+=.1){const m=soap.molecule(a);assert(Math.hypot(m.head.x,m.head.y)>45);assert(Math.hypot(m.tail.x,m.tail.y)<45);}
for(const phase of soap.phases){const {foam:a,...left}=soap.state(phase,0),{foam:b,...right}=soap.state(phase,18);assert.deepEqual(left,right);}
assert.equal(soap.next('rinse'),'rinse');
console.log('PASS: local oscillation, independent sound variables, conservative gain, radial molecule orientation, foam independence, phase guard');
