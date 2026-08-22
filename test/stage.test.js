import test from 'node:test';
import assert from 'node:assert/strict';
import { Stage } from '../src/game/Stage.js';

test('all ten stages have a spawn, goal, floor and playable platforms', () => {
  const stage = new Stage();
  for (let number = 1; number <= 10; number += 1) {
    stage.loadStage(number);
    assert.equal(stage.currentStageNum, number);
    assert.ok(stage.platforms.length >= 6, `stage ${number} platform count`);
    assert.ok(stage.platforms.some((platform) => platform.y === 570), `stage ${number} floor`);
    assert.ok(stage.spawnPoint.x >= 0 && stage.spawnPoint.x < 960, `stage ${number} spawn x`);
    assert.ok(stage.goalCube.x >= 0 && stage.goalCube.x + stage.goalCube.width <= 960, `stage ${number} goal x`);
    assert.ok(stage.goalCube.y >= 0 && stage.goalCube.y + stage.goalCube.height <= 600, `stage ${number} goal y`);
    assert.equal(stage.dataCores.length, 3, `stage ${number} core count`);
    assert.ok(stage.dataCores.every((core) => core.x >= 0 && core.x < 960), `stage ${number} core bounds`);
    assert.equal(stage.goalCube.locked, true, `stage ${number} starts locked`);
  }
});
test('goal relocation always lands above a non-spring platform', () => {
  const stage = new Stage();
  stage.loadStage(3);
  for (let index = 0; index < 50; index += 1) {
    stage.relocateGoalCube(stage.goalCube);
    assert.ok(stage.platforms.some((platform) => (
      platform.type !== 'spring'
      && stage.goalCube.y === platform.y - stage.goalCube.height - 10
      && stage.goalCube.x >= platform.x - stage.goalCube.width / 2
      && stage.goalCube.x <= platform.x + platform.width
    )));
  }
});

test('stage three final core is within a normal jump from the moving platform', () => {
  const stage = new Stage();
  stage.loadStage(3);
  const moving = stage.platforms.find((platform) => platform.type === 'moving');
  const finalCore = stage.dataCores.reduce((highest, core) => core.y < highest.y ? core : highest);
  assert.ok(moving.y - finalCore.platform.y <= 110);
});

test('stages without a final spring keep the final core within a normal jump', () => {
  const stage = new Stage();
  for (const number of [4, 8]) {
    stage.loadStage(number);
    const finalCore = stage.dataCores.at(-1);
    const exitPlatform = stage.platforms.at(-1);
    assert.equal(finalCore.platform, exitPlatform, `stage ${number} final core is on the exit ledge`);
    const approachPlatform = stage.platforms.at(-2);
    assert.ok(
      approachPlatform.y - finalCore.platform.y <= 100,
      `stage ${number} exit ledge is within a normal jump rise`
    );
  }
});
