import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateScore,
  getDifficultyBalance,
  normalizeDifficulty
} from '../src/game/gameBalance.js';

test('unknown difficulty falls back to challenge', () => {
  assert.equal(normalizeDifficulty('unknown'), 'challenge');
});

test('later stages shorten warning time and expand attack radius', () => {
  const first = getDifficultyBalance(1, 'challenge');
  const last = getDifficultyBalance(10, 'challenge');
  assert.ok(last.telegraphDuration < first.telegraphDuration);
  assert.ok(last.attackRadius > first.attackRadius);
  assert.ok(last.overheatDuration < first.overheatDuration);
});

test('nightmare is harder and awards a larger score', () => {
  const challenge = getDifficultyBalance(5, 'challenge');
  const nightmare = getDifficultyBalance(5, 'nightmare');
  assert.ok(nightmare.telegraphDuration < challenge.telegraphDuration);
  assert.ok(nightmare.damageMultiplier > challenge.damageMultiplier);

  const run = { stage: 10, dashes: 5, overheats: 2, result: 'clear', playTimeSec: 120 };
  assert.ok(
    calculateScore({ ...run, difficulty: 'nightmare' })
      > calculateScore({ ...run, difficulty: 'challenge' })
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
