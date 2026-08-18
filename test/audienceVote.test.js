import test from 'node:test';
import assert from 'node:assert/strict';
import { findVoteOption } from '../src/audience/AudienceVoteController.js';

test('viewer commands are recognized as complete tokens', () => {
  assert.equal(findVoteOption('!회복')?.effect, 'heal');
  assert.equal(findVoteOption('제발 !과열 가자')?.effect, 'overheat');
  assert.equal(findVoteOption('!워프 지금')?.effect, 'warp');
  assert.equal(findVoteOption('!충격')?.effect, 'shock');
  assert.equal(findVoteOption('!회복해줘'), undefined);
  assert.equal(findVoteOption('일반 채팅'), undefined);
});
