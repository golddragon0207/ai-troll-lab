import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/chat-proxy.js';

test('health endpoint is available without opening the proxy', async () => {
  const response = await worker.fetch(new Request('https://worker.example/health'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: 'ai-troll-lab-chat-proxy' });
});

test('proxy rejects unknown origins and hosts', async () => {
  const noOrigin = await worker.fetch(new Request(
    'https://worker.example/?url=https%3A%2F%2Fapi.chzzk.naver.com%2Ftest'
  ));
  assert.equal(noOrigin.status, 403);

  const badHost = await worker.fetch(new Request(
    'https://worker.example/?url=https%3A%2F%2Fexample.com%2Ftest',
    { headers: { Origin: 'https://golddragon0207.github.io' } }
  ));
  assert.equal(badHost.status, 403);
});
