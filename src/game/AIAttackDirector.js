export class AIAttackDirector {
  constructor() {
    this.attacks = [];
    this.reset(1);
  }

  reset(stage = 1) {
    this.stage = stage;
    this.attacks = [];
    this.timer = Math.max(1.9, 4.2 - stage * 0.18);
    this.sequence = 0;
  }

  update(dt, player, { onHit, onDefend } = {}) {
    this.timer -= dt;
    if (this.stage >= 2 && this.timer <= 0) {
      this.spawn(player);
      this.timer = Math.max(1.55, 4.1 - this.stage * 0.17);
    }

    for (const attack of this.attacks) {
      attack.age += dt;
      if (attack.phase === 'warning' && attack.age >= attack.warning) {
        attack.phase = 'active';
        attack.age = 0;
      }

      if (attack.phase !== 'active') continue;
      if (attack.type === 'wave') attack.x += attack.vx * dt;

      const rect = this.getHitbox(attack);
      if (rect && player.collidesWith(rect)) {
        if (player.isParrying || player.isDashing) {
          attack.done = true;
          onDefend?.(player.isParrying ? 'parry' : 'dash');
        } else {
          attack.done = true;
          onHit?.(attack.type);
        }
      }

      if (attack.type === 'wave' && (attack.x < -100 || attack.x > 1060)) attack.done = true;
      if (attack.type === 'strike' && attack.age > 0.32) attack.done = true;
    }

    this.attacks = this.attacks.filter((attack) => !attack.done);
  }

  spawn(player) {
    const useStrike = this.sequence++ % 2 === 1;
    if (useStrike) {
      this.attacks.push({
        type: 'strike', phase: 'warning', age: 0,
        warning: 0.82,
        x: Math.max(20, Math.min(900, player.x - 18)), width: 72
      });
      return;
    }

    const fromLeft = player.x > 480;
    this.attacks.push({
      type: 'wave', phase: 'warning', age: 0,
      warning: 0.68,
      x: fromLeft ? -70 : 990,
      vx: (fromLeft ? 1 : -1) * (300 + this.stage * 16),
      y: 532, width: 70, height: 28
    });
  }

  getHitbox(attack) {
    if (attack.phase !== 'active') return null;
    if (attack.type === 'wave') return attack;
    return { x: attack.x, y: 0, width: attack.width, height: 570 };
  }

  draw(ctx) {
    for (const attack of this.attacks) {
      ctx.save();
      if (attack.type === 'wave') {
        if (attack.phase === 'warning') {
          const sideX = attack.vx > 0 ? 0 : 946;
          ctx.fillStyle = `rgba(255, 42, 95, ${0.3 + Math.sin(attack.age * 24) * 0.2})`;
          ctx.fillRect(sideX, 492, 14, 70);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText('⚠ JUMP', attack.vx > 0 ? 20 : 858, 515);
        } else {
          ctx.fillStyle = '#ff2a5f';
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#ff2a5f';
          ctx.fillRect(attack.x, attack.y, attack.width, attack.height);
          ctx.fillStyle = '#fff';
          ctx.fillRect(attack.x + 12, attack.y + 8, attack.width - 24, 5);
        }
      } else if (attack.phase === 'warning') {
        ctx.fillStyle = `rgba(255, 42, 95, ${0.18 + attack.age * 0.35})`;
        ctx.fillRect(attack.x, 0, attack.width, 570);
        ctx.strokeStyle = '#ff2a5f';
        ctx.lineWidth = 3;
        ctx.strokeRect(attack.x, 0, attack.width, 570);
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#bd00ff';
        ctx.fillRect(attack.x, 0, attack.width, 570);
      }
      ctx.restore();
    }
  }
}
