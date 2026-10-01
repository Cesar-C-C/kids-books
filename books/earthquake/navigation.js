(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.EarthquakeNavigation=api;})(typeof window==='object'?window:globalThis,()=>{
 function parseBookLocation(search,hash){return {lang:new URLSearchParams(search).get('lang')==='en'?'en':'zh',chapter:['#fault-lab','#wave-lab'].includes(hash)?hash.slice(1):null};}
 function buildLabHref(chapter,lang){const map={'fault-lab':['earthquake-fault','elastic-rebound'],'wave-lab':['earthquake-waves','waves']};if(!Object.hasOwn(map,chapter))throw new RangeError('Unknown chapter');return '../../labs/earthquake/index.html?lang='+(lang==='en'?'en':'zh')+'&from='+map[chapter][0]+'#'+map[chapter][1];}
 function canEnterLab({online,cached}){return online===true||cached===true;}
 return {parseBookLocation,buildLabHref,canEnterLab};
});
