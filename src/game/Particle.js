export class Particle {
  constructor(x, y, color, vx, vy, size, life, shape = 'circle') {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.shape = shape;
  }

  update(dt) {
    const frameFactor = dt * 60;
    this.x += this.vx * frameFactor;
    this.y += this.vy * frameFactor;
    this.life -= frameFactor;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;

    if (this.shape === 'square') {
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class ParticleSystem {
  constructor(maxParticles = 240) {
    this.particles = [];
    this.maxParticles = maxParticles;
  }

  emit(x, y, color, count = 10, speed = 4, size = 3, life = 30, shape = 'circle') {
    const particleCount = Math.min(count, this.maxParticles);
    const overflow = this.particles.length + particleCount - this.maxParticles;
    if (overflow > 0) this.particles.splice(0, overflow);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 0.8 + 0.2) * speed;
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      this.particles.push(new Particle(x, y, color, vx, vy, size, life, shape));
    }
  }

  emitSparks(x, y, count = 15) {
    this.emit(x, y, '#ff2a5f', count, 6, 2, 20, 'circle');
    this.emit(x, y, '#00f0ff', count, 6, 2, 20, 'square');
  }

  emitParryShockwave(x, y) {
    this.emit(x, y, '#00ff88', 30, 8, 4, 35, 'square');
    this.emit(x, y, '#ffffff', 20, 10, 2, 25, 'circle');
  }

  update(dt) {
    let writeIndex = 0;
    for (let readIndex = 0; readIndex < this.particles.length; readIndex++) {
      const particle = this.particles[readIndex];
      particle.update(dt);
      if (particle.life > 0) {
        this.particles[writeIndex++] = particle;
      }
    }
    this.particles.length = writeIndex;
  }

  draw(ctx) {
    for (const particle of this.particles) particle.draw(ctx);
  }

  clear() {
    this.particles.length = 0;
  }
}
