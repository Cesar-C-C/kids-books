// Export exact displayed text with stable fictional-character casting.
const fs = require('fs');
global.window = {};
require('../books/cloud/book.js');
const roles = [
  [['didi'],['didi']], [['frog','didi'],['frog','didi','didi']],
  [['didi'],['didi']], [['dust'],['dust','dust']],
  ...[4,5].map(()=>[['didi','neighbor','neighbor'],['didi','neighbor','neighbor']]),
  [['didi','didi'],['didi','didi']],
  [['didi','neighbor','neighbor'],['didi','neighbor','neighbor']],
  [['didi'],['didi']], [['willow'],['willow']],
  [['worm','worm'],['worm','worm']], [['willow','didi'],['willow','didi']],
  [['frog','didi','didi'],['frog','didi','didi']],
  [['frog','didi'],['frog','didi']], [['didi','didi'],['didi']], [[],[]],
];
const directions = {
  narrator: '使用温柔、亲切、自然的成年女士声音，像妈妈或女老师给五岁小朋友讲故事；语速稍慢，气息柔和，不要播音腔，不要低沉。',
  didi: '用活泼、好奇、明亮的语气说话，像童话里的小水滴，不要喊叫。',
  frog: '用热情、友好、爽朗的语气说话，像耐心回答问题的青蛙朋友。',
  dust: '用轻巧、俏皮、亲切的语气说话，轻声讲一个小秘密。',
  neighbor: '用清晰、轻快、鼓励的语气说话，像带朋友一起旅行。',
  willow: '用慈爱、温和、从容的语气说话，语速稍慢，像讲故事的长辈。',
  worm: '使用年轻、阳光、憨厚友好的男声，像年轻的大哥哥；语速自然，声音不要老成、不要过度低沉。',
};
const jobs = [];
for(const [i,p] of window.PAGES.entries()) for(const [li,lang] of ['zh','en'].entries()) {
  const id = `page_${String(i).padStart(2,'0')}_${lang}`;
  const text = p[lang], speakers = [...roles[i][li]], pieces = [];
  let pos = 0;
  for(const m of text.matchAll(/“[^”]+”/g)) {
    if(m.index > pos) pieces.push({role:'narrator', text:text.slice(pos,m.index)});
    const role = speakers.shift();
    if(!role) throw Error(`Missing role ${id}`);
    pieces.push({role,text:m[0]}); pos=m.index+m[0].length;
  }
  if(pos<text.length) pieces.push({role:'narrator',text:text.slice(pos)});
  if(speakers.length || pieces.map(p=>p.text).join('')!==text) throw Error(`Text mismatch ${id}`);
  pieces.forEach((p,n)=>jobs.push({...p,id:`${id}_${String(n).padStart(2,'0')}`,track:id,lang,kind:'page',spokenText:p.text.replace(/[“”]/g,'')}));
  const fact=p[lang==='zh'?'factZh':'factEn'];
  const factId=`fact_${String(i).padStart(2,'0')}_${lang}`;
  jobs.push({id:factId,track:factId,lang,kind:'fact',role:'narrator',text:fact,spokenText:fact});
}
for(const p of window.PAGES) for(const w of p.glossary||[]) for(const lang of ['zh','en']) {
  const id=`word_${w.en.toLowerCase().replaceAll(' ','_')}_${lang}`;
  jobs.push({id,track:id,lang,kind:'word',role:'narrator',text:w[lang],spokenText:w[lang]});
}
if(new Set(jobs.map(j=>j.id)).size!==jobs.length || new Set(jobs.map(j=>j.track)).size!==80) throw Error('Duplicate/missing jobs');
const data={provider:'local Fun-CosyVoice3-0.5B',precision:'fp32',directions,jobs};
if(process.argv[2]) fs.writeFileSync(process.argv[2],JSON.stringify(data,null,2)+'\n');
else process.stdout.write(JSON.stringify(data,null,2));
