export class Player {
  constructor(x, y, audioEngine, particleSystem) {
    this.audio = audioEngine;
    this.particles = particleSystem;

    // Position & Physics
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 32;

    this.vx = 0;
    this.vy = 0;
    this.speed = 5;
    this.jumpForce = -10.5;
    this.gravity = 0.5;
    this.isGrounded = false;

    // Dash Mechanic (SHIFT)
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashDuration = 12; // ~0.2s burst
    this.dashCooldown = 0;
    this.maxDashCooldown = 60; // 1.0s cooldown
    this.dashSpeedMultiplier = 2.8;

    // Parrying Mechanic (SPACE)
    this.isParrying = false;
    this.parryTimer = 0;
    this.parryDuration = 18; // ~0.3s window
    this.parryCooldown = 0;
    this.maxParryCooldown = 90; // 1.5s cooldown

    // Input States
    this.keys = {
      left: false,
      right: false,
      up: false,
      dash: false,
      parry: false
    };

    // Visuals & Trail
    this.trail = [];
    this.color = '#00f0ff';
  }

  reset(x, y) {
    this.x = x || this.startX;
    this.y = y || this.startY;
    this.vx = 0;
    this.vy = 0;
    this.isDashing = false;
    this.isParrying = false;
    this.dashCooldown = 0;
    this.parryCooldown = 0;
    this.trail = [];
  }

  handleKeyDown(code) {
    if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = true;
    if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = true;
    if (code === 'KeyW' || code === 'ArrowUp' || code === 'Space') {
      if (code === 'Space') {
        this.triggerParry();
      } else {
        this.keys.up = true;
      }
    }
    if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyK') {
      this.triggerDash();
    }
  }

  handleKeyUp(code) {
    if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = false;
    if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;
    if (code === 'KeyW' || code === 'ArrowUp') this.keys.up = false;
  }

  triggerDash() {
    if (this.dashCooldown <= 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashTimer = this.dashDuration;
      this.dashCooldown = this.maxDashCooldown;
      this.audio.playDash();

      // Emit Dash particles
      const dir = this.keys.left ? 1 : -1;
      this.particles.emit(this.x + this.width / 2, this.y + this.height / 2, '#00f0ff', 15, 6 * dir, 3, 20);
    }
  }

  triggerParry() {
    if (this.parryCooldown <= 0 && !this.isParrying) {
      this.isParrying = true;
      this.parryTimer = this.parryDuration;
      this.parryCooldown = this.maxParryCooldown;
      this.audio.playParry();

      this.particles.emitParryShockwave(this.x + this.width / 2, this.y + this.height / 2);
    }
  }

  update(platforms, gravityDir = 1) {
    // Cooldown updates
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.parryCooldown > 0) this.parryCooldown--;

    // Active Dash State
    if (this.isDashing) {
      this.dashTimer--;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }

    // Active Parry State
    if (this.isParrying) {
      this.parryTimer--;
      if (this.parryTimer <= 0) {
        this.isParrying = false;
      }
    }

    // Horizontal Movement
    let moveDir = 0;
    if (this.keys.left) moveDir -= 1;
    if (this.keys.right) moveDir += 1;

    let currentSpeed = this.speed;
    if (this.isDashing) {
      currentSpeed *= this.dashSpeedMultiplier;
      // Force dash direction if stationary
      if (moveDir === 0) moveDir = 1;
    }

    this.vx = moveDir * currentSpeed;

    // Jump Logic
    if (this.keys.up && this.isGrounded && !this.isDashing) {
      this.vy = this.jumpForce * gravityDir;
      this.isGrounded = false;
      this.audio.playJump();
      this.particles.emit(this.x + this.width / 2, this.y + this.height, '#ffffff', 8, 2, 2, 15);
    }

    // Gravity Application
    if (!this.isDashing) {
      this.vy += this.gravity * gravityDir;
    } else {
      this.vy = 0; // Float horizontally while dashing
    }

    // Position updates with Platform Collision
    this.x += this.vx;
    this.resolveHorizontalCollisions(platforms);

    this.y += this.vy;
    this.resolveVerticalCollisions(platforms, gravityDir);

    // Record trail for dash animation
    if (this.isDashing || this.isParrying) {
      this.trail.push({ x: this.x, y: this.y, alpha: 0.8 });
      if (this.trail.length > 5) this.trail.shift();
    } else {
      if (this.trail.length > 0) this.trail.shift();
    }
  }

  resolveHorizontalCollisions(platforms) {
    for (let p of platforms) {
      if (this.collidesWith(p)) {
        if (this.vx > 0) {
          this.x = p.x - this.width;
        } else if (this.vx < 0) {
          this.x = p.x + p.width;
        }
      }
    }
  }

  resolveVerticalCollisions(platforms, gravityDir) {
    this.isGrounded = false;
    for (let p of platforms) {
      if (this.collidesWith(p)) {
        if (gravityDir === 1) { // Normal gravity
          if (this.vy > 0) { // Falling down
            this.y = p.y - this.height;
            this.vy = 0;
            this.isGrounded = true;
          } else if (this.vy < 0) { // Hitting ceiling
            this.y = p.y + p.height;
            this.vy = 0;
          }
        } else { // Inverted gravity
          if (this.vy < 0) { // Floating up to ceiling
            this.y = p.y + p.height;
            this.vy = 0;
            this.isGrounded = true;
          } else if (this.vy > 0) {
            this.y = p.y - this.height;
            this.vy = 0;
          }
        }
      }
    }
  }

  collidesWith(rect) {
    return (
      this.x < rect.x + rect.width &&
      this.x + this.width > rect.x &&
      this.y < rect.y + rect.height &&
      this.y + this.height > rect.y
    );
  }

  draw(ctx) {
    // Draw Dash Trail
    this.trail.forEach((t) => {
      ctx.save();
      ctx.globalAlpha = t.alpha * 0.4;
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(t.x, t.y, this.width, this.height);
      ctx.restore();
    });

    // Draw Parrying Shield Effect
    if (this.isParrying) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 28, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 136, 0.25)';
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#00ff88';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Draw Main Character Box (Neon Cyberpunk Character)
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.isDashing ? '#00f0ff' : '#00ff88';
    ctx.fillStyle = this.isDashing ? '#ffffff' : this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Visor Eye
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x + 4, this.y + 6, 16, 6);
    ctx.fillStyle = '#ff2a5f';
    ctx.fillRect(this.x + (this.vx < 0 ? 4 : 12), this.y + 7, 4, 4);

    ctx.restore();
  }
}
