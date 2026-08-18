import { Player } from './Player.js';
import { AIBully } from './AIBully.js';
import { Stage } from './Stage.js';
import { ParticleSystem } from './Particle.js';

export class Engine {
  constructor(canvas, hud, audio) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.logicalWidth = 960;
    this.logicalHeight = 600;
    this.pixelRatio = 1;
    this.layoutScale = 1;
    this.hud = hud;
    this.audio = audio;

    this.particles = new ParticleSystem();
    this.player = new Player(80, 480, audio, this.particles);
    this.ai = new AIBully(hud, audio, this.particles, {
      onDefense: (type) => {
        if (type === 'dash') this.successfulDashesCount++;
      },
      onOverheat: () => {
        this.aiOverheatCount++;
      },
      onTeleport: (stageNum) => {
        const missDamage = Math.min(30, 12 + (stageNum - 1) * 2);
        this.takeMentalDamage(missDamage, 'AI_TELEPORT');
      }
    });
    this.stage = new Stage();

    this.isRunning = false;
    this.isPaused = false;
    this.obsMode = false;
    this.animationId = null;
    this.lastTimestamp = null;
    this.accumulator = 0;
    this.fixedStep = 1 / 60;
    this.maxFrameDelta = 0.1;
    this.boundLoop = (timestamp) => this.loop(timestamp);

    // Mental HP & Stats
    this.mentalHpMax = 100;
    this.mentalHp = 100;
    this.successfulDashesCount = 0;
    this.aiOverheatCount = 0;
    this.runStartedAt = 0;

    // Screen Shake & Camera FX
    this.shakeDuration = 0;
    this.shakeMagnitude = 0;

    // Event Listeners
    this.resizeCanvas();
    this.setupInputs();
  }

  resizeCanvas(layoutScale = this.layoutScale) {
    this.layoutScale = layoutScale;
    const deviceRatio = window.devicePixelRatio || 1;
    const nextRatio = Math.min(3, Math.max(1, deviceRatio * layoutScale));
    const nextWidth = Math.round(this.logicalWidth * nextRatio);
    const nextHeight = Math.round(this.logicalHeight * nextRatio);

    if (this.canvas.width !== nextWidth || this.canvas.height !== nextHeight) {
      this.canvas.width = nextWidth;
      this.canvas.height = nextHeight;
    }

    this.pixelRatio = nextRatio;
    this.ctx.setTransform(nextRatio, 0, 0, nextRatio, 0, 0);
  }

  setupInputs() {
    const gameKeys = new Set([
      'KeyA', 'KeyD', 'KeyW', 'ArrowLeft', 'ArrowRight', 'ArrowUp',
      'Space', 'ShiftLeft', 'ShiftRight', 'KeyK'
    ]);

    window.addEventListener('keydown', (e) => {
      if (!this.isRunning) return;
      if (gameKeys.has(e.code)) e.preventDefault();
      this.player.handleKeyDown(e.code);
    });

    window.addEventListener('keyup', (e) => {
      if (!this.isRunning) return;
      if (gameKeys.has(e.code)) e.preventDefault();
      this.player.handleKeyUp(e.code);
    });

    document.addEventListener('visibilitychange', () => {
      this.lastTimestamp = null;
      this.accumulator = 0;
      this.player.clearInputs();
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
    this.stop();
    this.resizeCanvas();
    this.stage.loadStage(1);
    this.ai.setDifficulty(1);
    this.player.reset(this.stage.spawnPoint.x, this.stage.spawnPoint.y);
    this.ai.reset();
    this.particles.clear();
    this.hud.clearPopups();

    this.mentalHp = this.mentalHpMax;
    this.successfulDashesCount = 0;
    this.aiOverheatCount = 0;
    this.runStartedAt = performance.now();

    this.hud.updateMentalHP(this.mentalHp, this.mentalHpMax);
    this.hud.updateStageDisplay(1, this.stage.totalStages);
    this.hud.setAIDialogue("어서와라! 과연 내 텔레포트 억까를 0.5초 피지컬 대시로 피할 수 있을까?");

    this.isRunning = true;
    this.isPaused = false;
    this.lastTimestamp = null;
    this.accumulator = 0;
    this.animationId = requestAnimationFrame(this.boundLoop);
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.player.clearInputs();
  }

  triggerScreenShake(duration = 0.18, magnitude = 6) {
    this.shakeDuration = duration;
    this.shakeMagnitude = magnitude;
  }

  setObsMode(enabled) {
    this.obsMode = Boolean(enabled);
    if (!this.isRunning) this.draw();
  }

  takeMentalDamage(amount = 20, reason = "HAZARD") {
    this.mentalHp -= amount;
    this.hud.updateMentalHP(this.mentalHp, this.mentalHpMax);
    this.audio.playExplosion();
    this.triggerScreenShake(0.2, 8);

    const fxOverlay = document.getElementById('fx-overlay');
    if (fxOverlay) {
      fxOverlay.classList.add('danger-flash');
      setTimeout(() => fxOverlay.classList.remove('danger-flash'), 300);
    }

    if (this.mentalHp <= 0) {
      this.gameOver();
    }
  }

  applyAudienceEffect(effect) {
    if (!this.isRunning) return false;

    if (effect === 'heal') {
      this.mentalHp = Math.min(this.mentalHpMax, this.mentalHp + 15);
      this.hud.updateMentalHP(this.mentalHp, this.mentalHpMax);
      this.hud.setAIDialogue('시청자들이 스트리머 멘탈을 복구했다고? 편파 판정이다!');
      this.particles.emit(this.player.x, this.player.y, '#00ff88', 24, 5, 3, 35);
      this.audio.playClear();
      return true;
    }

    if (effect === 'overheat') {
      return this.ai.addHeat(40, '채팅 화력 때문에 회로가 뜨겁다… 시청자들 그만해!');
    }

    if (effect === 'warp') {
      this.stage.relocateGoalCube(this.stage.goalCube);
      this.hud.setAIDialogue('시청자 선택으로 골인 큐브 강제 워프! 역시 내 편이군 ㅋ');
      this.particles.emitSparks(
        this.stage.goalCube.x + this.stage.goalCube.width / 2,
        this.stage.goalCube.y + this.stage.goalCube.height / 2
      );
      this.audio.playTeleportWarp();
      return true;
    }

    if (effect === 'shock') {
      this.hud.setAIDialogue('시청자 충격파 적중! 스트리머 멘탈 -10 ㅋㅋㅋ');
      this.takeMentalDamage(10, 'AUDIENCE');
      return true;
    }

    return false;
  }

  nextStage() {
    this.audio.playClear();
    this.particles.emit(this.logicalWidth / 2, this.logicalHeight / 2, '#00ff88', 50, 10, 4, 60);

    if (this.stage.currentStageNum < this.stage.totalStages) {
      const nextNum = this.stage.currentStageNum + 1;
      this.stage.loadStage(nextNum);
      this.ai.setDifficulty(nextNum);
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

    resultTitle.textContent = "AI TROLL DEFEATED! 🏆";
    resultTitle.style.color = "#00ff88";
    resultDesc.textContent = "피지컬 대시와 패링으로 AI 억까를 완벽하게 파괴했습니다! 스트리머의 위대한 승리!";

    const result = this.updateResultStats('clear');
    resultOverlay.classList.remove('hidden');
    window.dispatchEvent(new CustomEvent('game-result', { detail: result }));
  }

  gameOver() {
    this.stop();
    const resultOverlay = document.getElementById('result-overlay');
    const resultTitle = document.getElementById('result-title');
    const resultDesc = document.getElementById('result-desc');

    resultTitle.textContent = "MENTAL BROKEN! 💥";
    resultTitle.style.color = "#ff2a5f";
    resultDesc.textContent = "AI의 억까에 멘탈이 완전 파괴되었습니다. 방송 종료의 위기!";

    const result = this.updateResultStats('gameover');
    resultOverlay.classList.remove('hidden');
    window.dispatchEvent(new CustomEvent('game-result', { detail: result }));
  }

  updateResultStats(result) {
    const stage = this.stage.currentStageNum;
    const playTimeSec = Math.max(1, Math.round((performance.now() - this.runStartedAt) / 1000));
    const minutes = Math.floor(playTimeSec / 60);
    const seconds = String(playTimeSec % 60).padStart(2, '0');
    const playTimeStr = `${minutes}:${seconds}`;
    const clearBonus = result === 'clear' ? 50000 : 0;
    const speedBonus = result === 'clear' ? Math.max(0, 20000 - playTimeSec * 30) : 0;
    const score = Math.min(999999, Math.max(0, Math.round(
      stage * 10000
      + this.successfulDashesCount * 800
      + this.aiOverheatCount * 1200
      + clearBonus
      + speedBonus
    )));

    document.getElementById('stat-stage').textContent = `Stage ${stage}`;
    document.getElementById('stat-dashes').textContent = `${this.successfulDashesCount}회`;
    document.getElementById('stat-cooldowns').textContent = `${this.aiOverheatCount}회`;
    document.getElementById('stat-score').textContent = score.toLocaleString('ko-KR');
    document.getElementById('stat-playtime').textContent = playTimeStr;

    return {
      score,
      stage,
      dashes: this.successfulDashesCount,
      overheats: this.aiOverheatCount,
      result,
      playTimeSec,
      playTimeStr
    };
  }

  loop(timestamp) {
    if (!this.isRunning) return;

    if (this.lastTimestamp === null) this.lastTimestamp = timestamp;
    const frameDelta = Math.min(this.maxFrameDelta, Math.max(0, (timestamp - this.lastTimestamp) / 1000));
    this.lastTimestamp = timestamp;
    this.accumulator += frameDelta;

    let updates = 0;
    while (this.isRunning && this.accumulator >= this.fixedStep && updates < 6) {
      this.update(this.fixedStep);
      this.accumulator -= this.fixedStep;
      updates++;
    }

    if (!this.isRunning) return;
    if (updates === 6) this.accumulator = 0;
    this.draw();

    this.animationId = requestAnimationFrame(this.boundLoop);
  }

  update(dt) {
    if (this.shakeDuration > 0) {
      this.shakeDuration = Math.max(0, this.shakeDuration - dt);
    }

    // Update Stage Platform Movements
    this.stage.update(dt);

    // Update Player Movement & Physics
    this.player.update(dt, this.stage.platforms, this.ai.gravityDir);

    // Update AI Logic & 0.5s Telegraphing Check
    this.ai.update(dt, this.player, this.stage.goalCube, this.stage);

    // Update Particles
    this.particles.update(dt);

    // HUD Cooldown Bars Update
    const dashPct = Math.min(100, Math.floor(((this.player.maxDashCooldown - this.player.dashCooldown) / this.player.maxDashCooldown) * 100));
    this.hud.updateDashCooldown(dashPct, this.player.dashCooldown <= 0);

    // Collision Check: Player vs Hazards
    for (let h of this.stage.hazards) {
      if (this.player.collidesWith(h)) {
        if (!this.player.isDashing && !this.player.isParrying) {
          this.player.reset(this.stage.spawnPoint.x, this.stage.spawnPoint.y);
          this.takeMentalDamage(20, "HAZARD");
          break;
        }
      }
    }

    if (!this.isRunning) return;

    // Collision Check: Player vs Goal Cube
    // AI 경고 중에는 목표를 먼저 밟아도 클리어되지 않는다.
    // 경고 타이밍에 대시/패링으로 반격하거나 AI가 과열된 뒤에만 확보할 수 있다.
    if (this.player.collidesWith(this.stage.goalCube) && !this.ai.isTelegraphing) {
      this.nextStage();
    }
  }

  draw() {
    // Clear Canvas with Dark Theme
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
    if (!this.obsMode) {
      this.ctx.fillStyle = '#05070c';
      this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    }

    // Camera Shake Offset
    if (this.shakeDuration > 0) {
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
