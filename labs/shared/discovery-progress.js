/* Small, namespaced learning journal shared by future discovery labs. */
window.DiscoveryProgress = {
  create(storage, key, allowed) {
    const defaults = () => ({version:1,found:[],operated:[],explained:[],view:{part:allowed.parts[0],open:0,flow:'both'}});
    let state=defaults(), persistent=true;
    const kinds={found:allowed.parts,operated:allowed.actions,explained:allowed.tasks};
    function cleanView(view={}) {
      return {part:allowed.parts.includes(view.part)?view.part:allowed.parts[0],open:Number.isFinite(view.open)?Math.max(0,Math.min(1,view.open)):0,flow:['both','bypass','core','off'].includes(view.flow)?view.flow:'both'};
    }
    try {
      const saved=JSON.parse(storage.getItem(key)||'null');
      if(saved&&typeof saved==='object'){
        for(const kind of Object.keys(kinds))state[kind]=Array.isArray(saved[kind])?[...new Set(saved[kind].filter(id=>kinds[kind].includes(id)))]:[];
        state.view=cleanView(saved.view&&typeof saved.view==='object'?saved.view:{});
      }
    } catch { persistent=false; }
    function save(){try{storage.setItem(key,JSON.stringify(state));persistent=true;}catch{persistent=false;}}
    return {
      get persistent(){return persistent;},
      read:()=>JSON.parse(JSON.stringify(state)),
      mark(kind,id){if(kinds[kind]?.includes(id)&&!state[kind].includes(id)){state[kind].push(id);save();}},
      saveView(view){state.view=cleanView(view);save();},
      reset(){state=defaults();save();}
    };
  }
};
