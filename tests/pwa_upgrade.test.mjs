import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function statusHarness() {
  let source = await readFile(new URL('../shared/pwa.js', import.meta.url), 'utf8');
  source = source.replace('  ready(function () {', '  window.testAPI = { panelState, loadStatus, onRowButton };\n  ready(function () {');
  const timers=new Map(),sent=[],elements={};let timerId=0;
  for(const id of ['obtn-sound','osize-sound','orow-sound','obar-sound'])elements[id]={style:{},classList:{remove(){},toggle(){}}};
  class Channel {constructor(){this.port1={close(){}};this.port2={reply:data=>this.port1.onmessage?.({data})};}}
  const context={console,location:{hostname:'example.test',protocol:'https:',origin:'https://example.test',pathname:'/index.html'},
    document:{currentScript:{src:'https://example.test/shared/pwa.js'},readyState:'loading',addEventListener(){},getElementById:id=>elements[id]||null},window:{},
    navigator:{serviceWorker:{controller:{postMessage:(msg,ports)=>sent.push({msg,port:ports[0]})}}},MessageChannel:Channel,
    setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)};
  vm.runInNewContext(source,context);context.window.testAPI.panelState.books=[{id:'sound'}];
  return {api:context.window.testAPI,timers,sent,elements};
}

test('status timeout offers retry and never downloads an unknown book',async()=>{
  const {api,timers,sent,elements}=await statusHarness();api.loadStatus();
  for(const fn of [...timers.values()])fn();
  assert.equal(elements['obtn-sound'].disabled,false);assert.equal(elements['obtn-sound'].textContent,'重试更新');
  api.onRowButton('sound');assert(sent.every(s=>s.msg.type==='KB_STATUS'));
});

test('late old status cannot overwrite the current catalogue',async()=>{
  const {api,sent,elements}=await statusHarness();api.loadStatus();api.loadStatus();
  sent[1].port.reply({type:'KB_STATUS',books:{sound:{total:45,cached:0,bytes:100}}});
  sent[0].port.reply({type:'KB_STATUS',books:{}});
  assert.equal(api.panelState.sizes.sound.total,45);assert.equal(elements['obtn-sound'].disabled,false);
});

for (const phase of ['waiting', 'installing']) test('activates an already ' + phase + ' worker and reloads status', async () => {
  const source = await readFile(new URL('../shared/pwa.js', import.meta.url), 'utf8');
  const listeners = new Map();
  const messages = { old: [], waiting: [], current: [] };

  class FakeMessageChannel {
    constructor() {
      this.port1 = { onmessage: null, close() {} };
      this.port2 = {
        reply: (data) => this.port1.onmessage?.({ data }),
      };
    }
  }

  const oldWorker = {
    postMessage(message, ports) {
      messages.old.push(message);
      ports?.[0]?.reply({
        type: 'KB_STATUS',
        books: { airplane: { total: 1, cached: 1, bytes: 1 } },
      });
    },
  };
  const currentWorker = {
    postMessage(message, ports) {
      messages.current.push(message);
      ports?.[0]?.reply({
        type: 'KB_STATUS',
        books: {
          airplane: { total: 1, cached: 1, bytes: 1 },
          cloud: { total: 100, cached: 0, bytes: 14553346 },
        },
      });
    },
  };
  const serviceWorker = {
    controller: oldWorker,
    ready: null,
    addEventListener(type, callback) { listeners.set(type, callback); },
    register(url, options) { assert.equal(options.updateViaCache, 'none'); return Promise.resolve(registration); },
  };
  const waitingWorker = {
    state: 'installed',
    addEventListener() {},
    postMessage(message) {
      messages.waiting.push(message);
      if (message.type !== 'KB_SKIP_WAITING') return;
      registration.waiting = null;
      registration.installing = null;
      registration.active = currentWorker;
      serviceWorker.controller = currentWorker;
      queueMicrotask(() => listeners.get('controllerchange')?.());
    },
  };
  const registration = {
    active: oldWorker,
    waiting: phase === 'waiting' ? waitingWorker : null,
    installing: phase === 'installing' ? waitingWorker : null,
    addEventListener() {},
  };
  serviceWorker.ready = Promise.resolve(registration);

  const document = {
    currentScript: { src: 'https://example.test/shared/pwa.js' },
    readyState: 'complete',
    querySelector() { return null; },
    getElementById() { return null; },
    addEventListener() {},
  };
  const context = {
    console,
    document,
    location: {
      hostname: 'example.test',
      origin: 'https://example.test',
      pathname: '/index.html',
      protocol: 'https:',
    },
    MessageChannel: FakeMessageChannel,
    navigator: { serviceWorker },
    queueMicrotask,
    setTimeout,
    clearTimeout,
    window: { addEventListener() {} },
  };
  vm.runInNewContext(source, context, { filename: 'shared/pwa.js' });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(messages.waiting.length, 1);
  assert.equal(messages.waiting[0].type, 'KB_SKIP_WAITING');
  assert.ok(messages.current.some((message) => message.type === 'KB_STATUS'));
});
