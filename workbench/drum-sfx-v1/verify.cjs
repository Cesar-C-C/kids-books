const fs=require('node:fs'),path=require('node:path');
const pw=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/Cesar/Documents/ChatGPT/儿童绘本开发/.worktrees/first-batch-books/.qa-deps/node_modules/playwright');
(async()=>{
 const browser=await pw.chromium.launch({channel:'chrome',headless:true});
 try {
 const page=await browser.newPage();
 const results=[];
 for(const name of ['drum-low','drum-high']){
 const bytes=fs.readFileSync(path.resolve(__dirname,'../../books/sound/sfx',name+'.wav'));
 const decoded=await page.evaluate(async b64=>{
 const ctx=new OfflineAudioContext(1,48000*2,48000);
 const b=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const a=await ctx.decodeAudioData(b.buffer);
 const src=ctx.createBufferSource();src.buffer=a;src.connect(ctx.destination);src.start();const rendered=await ctx.startRendering();
 return {duration:a.duration,sampleRate:a.sampleRate,channels:a.numberOfChannels,frames:a.length,finite:rendered.getChannelData(0).every(Number.isFinite),nonSilent:rendered.getChannelData(0).some(x=>Math.abs(x)>.001)};
 },bytes.toString('base64'));
 if(!decoded.finite||!decoded.nonSilent||decoded.channels!==1)throw Error('Invalid '+name);
 results.push({name,...decoded});
 }
 if(results[0].frames!==results[1].frames)throw Error('Different windows');
 fs.writeFileSync(path.join(__dirname,'browser-decode.json'),JSON.stringify({scope:'Chrome headless WebAudio decode and offline render only; not human hearing acceptance or integrated page QA',results},null,2));
 console.log(JSON.stringify(results,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
