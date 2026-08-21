import test from 'node:test';
import assert from 'node:assert/strict';
import { ParticleSystem } from '../src/game/Particle.js';

test('particle system enforces its configured capacity', () => {
  const particles = new ParticleSystem(5);
  particles.emit(0, 0, '#fff', 4);
  particles.emit(0, 0, '#fff', 4);

  assert.equal(particles.particles.length, 5);
});

test('particle system compacts expired particles in one update pass', () => {
  const particles = new ParticleSystem();
  particles.emit(0, 0, '#fff', 3, 1, 1, 1);
  particles.update(1 / 60);

  assert.equal(particles.particles.length, 0);
});
