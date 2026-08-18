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
  constructor() {
    this.particles = [];
  }

  emit(x, y, color, count = 10, speed = 4, size = 3, life = 30, shape = 'circle') {
    for (let i = 0; i < count; i++) {
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
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (this.particles[i].life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx));
  }

  clear() {
    this.particles = [];
  }
}
