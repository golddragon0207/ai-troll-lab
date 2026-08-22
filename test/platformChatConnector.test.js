import test from 'node:test';
import assert from 'node:assert/strict';
import { PlatformChatConnector } from '../src/audience/PlatformChatConnector.js';

test('ranking connection status reflects active SOOP and 치지직 channels', () => {
  const connector = new PlatformChatConnector();
  assert.equal(connector.getConnectionType(), 'none');

  connector.channels.set('soop', { connected: true });
  assert.equal(connector.getConnectionType(), 'soop');

  connector.channels.set('chzzk', { connected: true });
  assert.equal(connector.getConnectionType(), 'both');

  connector.channels.set('soop', { connected: false });
  assert.equal(connector.getConnectionType(), 'chzzk');
});
