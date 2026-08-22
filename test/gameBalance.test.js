import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateScore,
  getStageBalance
} from '../src/game/gameBalance.js';

test('later stages shorten warning time and expand attack radius', () => {
  const first = getStageBalance(1);
  const last = getStageBalance(10);
  assert.ok(last.telegraphDuration < first.telegraphDuration);
  assert.ok(last.attackRadius > first.attackRadius);
  assert.ok(last.overheatDuration < first.overheatDuration);
});

test('score has one stable rule regardless of legacy difficulty input', () => {
  const run = { stage: 10, dashes: 5, overheats: 2, result: 'clear', playTimeSec: 120 };
  assert.equal(
    calculateScore({ ...run, difficulty: 'nightmare' }),
    calculateScore({ ...run, difficulty: 'challenge' })
  );
});

test('score is always kept within the Firestore rule range', () => {
  assert.equal(calculateScore({ stage: 0, playTimeSec: 1 }), 0);
  assert.equal(calculateScore({
    stage: 9999,
    dashes: 999999,
    overheats: 999999,
    result: 'clear',
    playTimeSec: 1,
    difficulty: 'nightmare'
  }), 999999);
});

test('core and combo bonus score is included without changing result schema', () => {
  const run = { stage: 3, dashes: 2, result: 'gameover', playTimeSec: 60 };
  assert.equal(
    calculateScore({ ...run, bonusScore: 2500 }),
    calculateScore(run) + 2500
  );
});
