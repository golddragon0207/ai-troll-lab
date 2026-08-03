import { Player } from './Player.js';
import { AIBully } from './AIBully.js';
import { Stage } from './Stage.js';
import { ParticleSystem } from './Particle.js';

export class Engine {
  constructor(canvas, hud, audio) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hud = hud;
    this.audio = audio;

    this.particles = new ParticleSystem();
    this.player = new Player(80, 480, audio, this.particles);
    this.ai = new AIBully(hud, audio, this.particles);
    this.stage = new Stage();

    this.isRunning = false;
    this.isPaused = false;
    this.animationId = null;

    // Mental HP & Stats
    this.mentalHpMax = 100;
    this.mentalHp = 100;
    this.successfulDashesCount = 0;
    this.aiOverheatCount = 0;

    // Screen Shake & Camera FX
    this.shakeDuration = 0;
    this.shakeMagnitude = 0;

    // Event Listeners
    this.setupInputs();
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      if (!this.isRunning) return;
      this.player.handleKeyDown(e.code);
    });

    window.addEventListener('keyup', (e) => {
      if (!this.isRunning) return;
      this.player.handleKeyUp(e.code);
    });

    // Bribe Button Listener
    const bribeBtn = document.getElementById('bribe-btn');
    if (bribeBtn) {
      bribeBtn.addEventListener('click', () => {
        if (this.isRunning) this.ai.bribeAI();
      });
    }
  }

  start() {
    this.stage.loadStage(1);
    this.player.reset(this.stage.spawnPoint.x, this.stage.spawnPoint.y);
    this.ai.reset();

    this.mentalHp = this.mentalHpMax;
    this.successfulDashesCount = 0;
    this.aiOverheatCount = 0;

    this.hud.updateMentalHP(this.mentalHp, this.mentalHpMax);
    this.hud.updateStageDisplay(1, this.stage.totalStages);
    this.hud.setAIDialogue("어서와라! 과연 내 텔레포트 억까를 0.5초 피지컬 대시로 피할 수 있을까?");

    this.isRunning = true;
    this.isPaused = false;
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  triggerScreenShake(duration = 10, magnitude = 6) {
    this.shakeDuration = duration;
    this.shakeMagnitude = magnitude;
  }

  takeMentalDamage(amount = 20, reason = "HAZARD") {
    this.mentalHp -= amount;
    this.hud.updateMentalHP(this.mentalHp, this.mentalHpMax);
    this.audio.playExplosion();
    this.triggerScreenShake(12, 8);

    const fxOverlay = document.getElementById('fx-overlay');
    if (fxOverlay) {
      fxOverlay.classList.add('danger-flash');
      setTimeout(() => fxOverlay.classList.remove('danger-flash'), 300);
    }

    if (this.mentalHp <= 0) {
      this.gameOver();
    }
  }

  nextStage() {
    this.audio.playClear();
    this.particles.emit(this.canvas.width / 2, this.canvas.height / 2, '#00ff88', 50, 10, 4, 60);

    if (this.stage.currentStageNum < this.stage.totalStages) {
      const nextNum = this.stage.currentStageNum + 1;
      this.stage.loadStage(nextNum);
      this.player.reset(this.stage.spawnPoint.x, this.stage.spawnPoint.y);
      this.hud.updateStageDisplay(nextNum, this.stage.totalStages);
      this.hud.setAIDialogue(`Stage ${nextNum} 도착! 난이도가 더 매워진다 🤖`);
      this.hud.addChatMessage(`Stage ${nextNum} 클리어 폼 미쳤다 💥`, 'highlight');
    } else {
      this.gameWin();
    }
  }

  gameWin() {
    this.stop();
    const resultOverlay = document.getElementById('result-overlay');
    const resultTitle = document.getElementById('result-title');
    const resultDesc = document.getElementById('result-desc');

    resultTitle.textContent = "AI BULLY DEFEATED! 🏆";
    resultTitle.style.color = "#00ff88";
    resultDesc.textContent = "피지컬 대시와 패링으로 AI 억까를 완벽하게 파괴했습니다! 스트리머의 위대한 승리!";

    this.updateResultStats();
    resultOverlay.classList.remove('hidden');
  }

  gameOver() {
    this.stop();
    const resultOverlay = document.getElementById('result-overlay');
    const resultTitle = document.getElementById('result-title');
    const resultDesc = document.getElementById('result-desc');

    resultTitle.textContent = "MENTAL BROKEN! 💥";
    resultTitle.style.color = "#ff2a5f";
    resultDesc.textContent = "AI의 억까에 멘탈이 완전 파괴되었습니다. 방송 종료의 위기!";

    this.updateResultStats();
    resultOverlay.classList.remove('hidden');
  }

  updateResultStats() {
    document.getElementById('stat-stage').textContent = `Stage ${this.stage.currentStageNum}`;
    document.getElementById('stat-dashes').textContent = `${this.player.dashCooldown > 0 ? 3 : 5}회`;
    document.getElementById('stat-cooldowns').textContent = `${this.ai.isOverheated ? 2 : 1}회`;
  }

  loop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();

    this.animationId = requestAnimationFrame(() => this.loop());
  }

  update() {
    // Update Stage Platform Movements
    this.stage.update();

    // Update Player Movement & Physics
    this.player.update(this.stage.platforms, this.ai.gravityDir);

    // Update AI Logic & 0.5s Telegraphing Check
    this.ai.update(this.player, this.stage.goalCube, this.stage);

    // Update Particles
    this.particles.update();

    // HUD Cooldown Bars Update
    const dashPct = Math.min(100, Math.floor(((this.player.maxDashCooldown - this.player.dashCooldown) / this.player.maxDashCooldown) * 100));
    this.hud.updateDashCooldown(dashPct, this.player.dashCooldown <= 0);

    // Collision Check: Player vs Hazards
    for (let h of this.stage.hazards) {
      if (this.player.collidesWith(h)) {
        if (!this.player.isDashing && !this.player.isParrying) {
          this.player.reset(this.stage.spawnPoint.x, this.stage.spawnPoint.y);
          this.takeMentalDamage(20, "HAZARD");
        }
      }
    }

    // Collision Check: Player vs Goal Cube
    if (this.player.collidesWith(this.stage.goalCube)) {
      this.nextStage();
    }
  }

  draw() {
    // Clear Canvas with Dark Theme
    this.ctx.save();
    this.ctx.fillStyle = '#05070c';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Camera Shake Offset
    if (this.shakeDuration > 0) {
      this.shakeDuration--;
      const dx = (Math.random() - 0.5) * this.shakeMagnitude;
      const dy = (Math.random() - 0.5) * this.shakeMagnitude;
      this.ctx.translate(dx, dy);
    }

    // Draw Stage (Platforms, Hazards, Goal Cube)
    this.stage.draw(this.ctx);

    // Draw Player
    this.player.draw(this.ctx);

    // Draw Particles
    this.particles.draw(this.ctx);

    this.ctx.restore();
  }
}
