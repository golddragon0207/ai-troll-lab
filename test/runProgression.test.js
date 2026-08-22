import test from 'node:test';
import assert from 'node:assert/strict';
import { RunProgression } from '../src/game/RunProgression.js';

test('three cores unlock a normal stage and build combo score', () => {
  const run = new RunProgression();
  run.beginStage(2, 3);
  assert.equal(run.goalUnlocked, false);
  run.collectCore();
  run.collectCore();
  run.collectCore();
  assert.equal(run.goalUnlocked, true);
  assert.equal(run.combo, 3);
  assert.ok(run.bonusScore > 0);
  assert.equal(run.multiplier, 1.5);
});

test('boss exits require both cores and defensive shield breaks', () => {
  const run = new RunProgression();
  run.beginStage(5, 3);
  run.collectCore();
  run.collectCore();
  run.collectCore();
  assert.equal(run.goalUnlocked, false);
  assert.equal(run.defend().bossDefeated, false);
  assert.equal(run.defend().bossDefeated, true);
  assert.equal(run.goalUnlocked, true);
});

test('every stage can satisfy its exit condition in one complete run', () => {
  const run = new RunProgression();
  for (let stage = 1; stage <= 10; stage += 1) {
    run.beginStage(stage, 3);
    run.collectCore();
    run.collectCore();
    run.collectCore();
    while (run.bossShield > 0) run.defend();
    assert.equal(run.goalUnlocked, true, `stage ${stage} exit unlocks`);
  }
});

test('upgrades alter the current run without exceeding safe limits', () => {
  const run = new RunProgression();
  const player = { maxDashCooldown: 1, parryDuration: 0.3 };
  const engine = { mentalHpMax: 100, mentalHp: 70 };
  assert.equal(run.applyUpgrade('turbo-dash', player, engine), true);
  assert.equal(player.maxDashCooldown, 0.75);
  assert.equal(run.applyUpgrade('mental-armor', player, engine), true);
  assert.equal(engine.mentalHpMax, 125);
  assert.equal(engine.mentalHp, 105);
  assert.equal(run.applyUpgrade('not-real', player, engine), false);
});

test('combo expires after its window and damage breaks it immediately', () => {
  const run = new RunProgression();
  run.collectCore();
  assert.equal(run.update(4.9), false);
  assert.equal(run.update(0.2), true);
  assert.equal(run.combo, 0);
  run.collectCore();
  assert.equal(run.breakCombo(), 1);
  assert.equal(run.combo, 0);
});
