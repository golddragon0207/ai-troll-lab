import test from 'node:test';
import assert from 'node:assert/strict';
import { AIAttackDirector } from '../src/game/AIAttackDirector.js';

test('AI attacks alternate between wave and strike', () => {
  const director = new AIAttackDirector();
  director.reset(7, 'challenge');
  const player = { x: 400 };

  director.spawn(player);
  director.spawn(player);
  director.spawn(player);
  director.spawn(player);

  assert.deepEqual(director.attacks.map((attack) => attack.type), [
    'wave', 'strike', 'wave', 'strike'
  ]);
});

test('attack defense reports dash and parry separately', () => {
  const director = new AIAttackDirector();
  const defendedWith = [];
  const player = {
    x: 0,
    y: 520,
    width: 24,
    height: 32,
    isDashing: true,
    isParrying: false,
    collidesWith: () => true
  };

  director.attacks = [{
    type: 'wave', phase: 'active', age: 0,
    x: 0, y: 520, width: 70, height: 28, vx: 0
  }];
  director.update(1 / 60, player, { onDefend: (type) => defendedWith.push(type) });
  player.isDashing = false;
  player.isParrying = true;
  director.attacks = [{
    type: 'wave', phase: 'active', age: 0,
    x: 0, y: 520, width: 70, height: 28, vx: 0
  }];
  director.update(1 / 60, player, { onDefend: (type) => defendedWith.push(type) });

  assert.deepEqual(defendedWith, ['dash', 'parry']);
});
