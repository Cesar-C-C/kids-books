import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

test('activates a worker that was already waiting and reloads offline status', async () => {
  const source = await readFile(new URL('../shared/pwa.js', import.meta.url), 'utf8');
  const listeners = new Map();
  const messages = { old: [], waiting: [], current: [] };

  class FakeMessageChannel {
    constructor() {
      this.port1 = { onmessage: null };
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
    register() { return Promise.resolve(registration); },
  };
  const waitingWorker = {
    postMessage(message) {
      messages.waiting.push(message);
      if (message.type !== 'KB_SKIP_WAITING') return;
      registration.waiting = null;
      registration.active = currentWorker;
      serviceWorker.controller = currentWorker;
      queueMicrotask(() => listeners.get('controllerchange')?.());
    },
  };
  const registration = {
    active: oldWorker,
    waiting: waitingWorker,
    installing: null,
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
    window: {},
  };
  vm.runInNewContext(source, context, { filename: 'shared/pwa.js' });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(messages.waiting.length, 1);
  assert.equal(messages.waiting[0].type, 'KB_SKIP_WAITING');
  assert.ok(messages.current.some((message) => message.type === 'KB_STATUS'));
});
