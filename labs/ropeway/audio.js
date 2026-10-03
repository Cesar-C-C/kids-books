(function(){
'use strict';
// Audio owner fills the exact content-bound manifest after reviewed generation.
const manifest=window.ROPEWAY_AUDIO_MANIFEST||{status:'pending',tracks:{}};
const lessons=new Map(window.ROPEWAY_CONTENT.map(c=>[c.id,c]));
function valid(id,lang){
 const track=manifest.tracks[id+'-'+lang],c=lessons.get(id);
 return !!(manifest.status==='ready'&&track&&c&&track.text===c.text[lang]&&/^audio\/[a-z]+-(zh|en)\.mp3(?:\?v=[a-f0-9]+)?$/.test(track.file));
}
let current=null,ticket=0;
function stop(){ticket++;if(current){current.pause();current.currentTime=0;current=null;}}
async function play(id,lang,onStatus){
 stop();const t=ticket,track=manifest.tracks[id+'-'+lang];if(!valid(id,lang)){onStatus('pending');return false;}
 const file=typeof track==='string'?track:track.file;const a=new Audio(file);current=a;
 a.addEventListener('ended',()=>{if(t===ticket){current=null;onStatus('idle');}});
 a.addEventListener('error',()=>{if(t===ticket&&current===a){current=null;onStatus('error');}});
 try{await a.play();if(t!==ticket){a.pause();return false;}onStatus('playing');return true;}catch(e){if(t===ticket){current=null;onStatus('error');}return false;}
}
window.RopewayAudio={manifest,stop,play,has:valid,getState:()=>({src:current?.currentSrc||current?.src||null,currentTime:current?.currentTime||0,duration:Number.isFinite(current?.duration)?current.duration:null,paused:current?current.paused:true})};
})();
