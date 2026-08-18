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
