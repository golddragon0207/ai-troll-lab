import { Player } from './Player.js';
import { AIBully } from './AIBully.js';
import { Stage } from './Stage.js';
import { ParticleSystem } from './Particle.js';
import { calculateScore, getDifficultyBalance, normalizeDifficulty } from './gameBalance.js';
import { RunProgression, UPGRADE_POOL } from './RunProgression.js';
import { AIAttackDirector } from './AIAttackDirector.js';

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
    this.progression = new RunProgression();
    this.attackDirector = new AIAttackDirector();
    this.ai = new AIBully(hud, audio, this.particles, {
      onDefense: (type) => {
        this.handleDefense(type);
      },
      onOverheat: () => {
        this.aiOverheatCount++;
      },
      onTeleport: (stageNum) => {
        const missDamage = Math.min(30, 12 + (stageNum - 1) * 2);
        const balance = getDifficultyBalance(stageNum, this.difficulty);
        this.takeMentalDamage(Math.round(missDamage * balance.damageMultiplier), 'AI_TELEPORT');
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
    this.difficulty = 'challenge';
    this.pendingNextStage = null;
    this.lockMessageCooldown = 0;

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
      if (!this.isRunning || this.isPaused) return;
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
    this.progression.reset();
    this.progression.beginStage(1, this.stage.dataCores.length);
    this.stage.setGoalLocked(true);
    this.attackDirector.reset(1, this.difficulty);
    this.resetPlayerBuild();
    this.ai.setDifficulty(1, this.difficulty);
    this.player.reset(this.stage.spawnPoint.x, this.stage.spawnPoint.y);
    this.ai.reset();
    this.particles.clear();
    this.hud.clearPopups();

    this.mentalHpMax = 100;
    this.mentalHp = this.mentalHpMax;
    this.successfulDashesCount = 0;
    this.aiOverheatCount = 0;
    this.runStartedAt = performance.now();
    this.pendingNextStage = null;
    this.lockMessageCooldown = 0;

    this.hud.updateMentalHP(this.mentalHp, this.mentalHpMax);
    this.hud.updateStageDisplay(1, this.stage.totalStages);
    this.hud.setAIDialogue("데이터 코어 3개를 전부 훔쳐야 출구가 열린다. 어디 한번 해봐라!");

    this.isRunning = true;
    this.isPaused = false;
    this.lastTimestamp = null;
    this.accumulator = 0;
    this.animationId = requestAnimationFrame(this.boundLoop);
  }

  setDifficulty(value) {
    this.difficulty = normalizeDifficulty(value);
  }

  resetPlayerBuild() {
    this.player.maxDashCooldown = 1;
    this.player.parryDuration = 0.3;
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
    const lostCombo = this.progression.breakCombo();
    this.hud.updateMentalHP(this.mentalHp, this.mentalHpMax);
    this.audio.playExplosion();
    this.triggerScreenShake(0.2, 8);
    if (lostCombo >= 3) this.hud.addChatMessage(`${lostCombo} COMBO 증발! AI가 신났다 ㅋㅋ`, 'laugh');

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
      this.mentalHp = Math.min(this.mentalHpMax, this.mentalHp + 10);
      this.hud.updateMentalHP(this.mentalHp, this.mentalHpMax);
      this.hud.setAIDialogue('시청자들이 스트리머 멘탈을 복구했다고? 편파 판정이다!');
      this.particles.emit(this.player.x, this.player.y, '#00ff88', 24, 5, 3, 35);
      this.audio.playClear();
      return true;
    }

    if (effect === 'overheat') {
      return this.ai.addHeat(20, '채팅 화력 때문에 회로가 뜨겁다… 시청자들 그만해!');
    }

    if (effect === 'warp') {
      const remainingCores = this.stage.dataCores.filter((core) => !core.collected);
      if (remainingCores.length) {
        const core = remainingCores[Math.floor(Math.random() * remainingCores.length)];
        const target = this.stage.platforms[1 + Math.floor(Math.random() * Math.max(1, this.stage.platforms.length - 1))];
        core.platform = target;
        core.offsetX = Math.max(8, target.width / 2 - core.width / 2);
      } else {
        this.stage.relocateGoalCube(this.stage.goalCube);
      }
      this.hud.setAIDialogue('시청자 혼돈 발동! 남은 코어 위치가 뒤섞인다!');
      this.particles.emitSparks(
        this.stage.goalCube.x + this.stage.goalCube.width / 2,
        this.stage.goalCube.y + this.stage.goalCube.height / 2
      );
      this.audio.playTeleportWarp();
      return true;
    }

    if (effect === 'shock') {
      this.hud.setAIDialogue('시청자 충격파! 콤보가 끊기고 멘탈 -5 ㅋㅋㅋ');
      this.takeMentalDamage(5, 'AUDIENCE');
      return true;
    }

    return false;
  }

  nextStage() {
    this.audio.playClear();
    this.particles.emit(this.logicalWidth / 2, this.logicalHeight / 2, '#00ff88', 50, 10, 4, 60);

    if (this.stage.currentStageNum < this.stage.totalStages) {
      if ([3, 6, 9].includes(this.stage.currentStageNum)) {
        this.pendingNextStage = this.stage.currentStageNum + 1;
        this.isPaused = true;
        this.player.clearInputs();
        const offset = this.stage.currentStageNum / 3 - 1;
        const choices = Array.from({ length: 3 }, (_, index) => UPGRADE_POOL[(offset + index) % UPGRADE_POOL.length]);
        window.dispatchEvent(new CustomEvent('upgrade-request', { detail: { choices } }));
        return;
      }
      this.loadNextStage(this.stage.currentStageNum + 1);
    } else {
      this.gameWin();
    }
  }

  loadNextStage(nextNum) {
    this.stage.loadStage(nextNum);
    this.progression.beginStage(nextNum, this.stage.dataCores.length);
    this.stage.setGoalLocked(!this.progression.goalUnlocked);
    this.attackDirector.reset(nextNum, this.difficulty);
    this.ai.setDifficulty(nextNum, this.difficulty);
    this.player.reset(this.stage.spawnPoint.x, this.stage.spawnPoint.y);
    this.hud.updateStageDisplay(nextNum, this.stage.totalStages);
    this.hud.setAIDialogue(this.progression.bossShieldMax
      ? `BOSS STAGE! 코어를 모으고 패링으로 보호막 ${this.progression.bossShieldMax}칸을 깨라!`
      : `Stage ${nextNum}! 코어 3개, 콤보는 끊기지 않게!`);
    this.hud.addChatMessage(`Stage ${nextNum} 진입! 코어런 드가자 💥`, 'highlight');
  }

  chooseUpgrade(id) {
    if (!this.isPaused || !this.pendingNextStage) return false;
    if (!this.progression.applyUpgrade(id, this.player, this)) return false;
    this.hud.updateMentalHP(this.mentalHp, this.mentalHpMax);
    const upgrade = UPGRADE_POOL.find((item) => item.id === id);
    this.hud.addChatMessage(`${upgrade?.name || '강화'} 장착! 빌드 완성 중 🔥`, 'highlight');
    const nextNum = this.pendingNextStage;
    this.pendingNextStage = null;
    this.isPaused = false;
    this.loadNextStage(nextNum);
    window.dispatchEvent(new CustomEvent('upgrade-selected', { detail: { id } }));
    return true;
  }

  handleDefense(type) {
    this.successfulDashesCount++;
    const result = this.progression.defend();
    this.stage.setGoalLocked(!this.progression.goalUnlocked);
    if (result.shieldBroken) {
      this.triggerScreenShake(0.15, 5);
      this.hud.setAIDialogue(result.bossDefeated
        ? '보호막 파괴?! 코어만 모으면 출구가 열린다!'
        : `보스 보호막 ${this.progression.bossShield}/${this.progression.bossShieldMax}!`);
    }
    if (type !== 'dash') this.hud.triggerDodgeChat();
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
    const score = calculateScore({
      stage,
      dashes: this.successfulDashesCount,
      overheats: this.aiOverheatCount,
      result,
      playTimeSec,
      difficulty: this.difficulty,
      bonusScore: this.progression.bonusScore
    });

    document.getElementById('stat-stage').textContent = `Stage ${stage}`;
    document.getElementById('stat-dashes').textContent = `${this.successfulDashesCount}회`;
    document.getElementById('stat-cooldowns').textContent = `${this.aiOverheatCount}회`;
    document.getElementById('stat-score').textContent = score.toLocaleString('ko-KR');
    document.getElementById('stat-playtime').textContent = playTimeStr;
    const comboStat = document.getElementById('stat-combo');
    if (comboStat) comboStat.textContent = `${this.progression.bestCombo} COMBO`;

    return {
      score,
      stage,
      dashes: this.successfulDashesCount,
      overheats: this.aiOverheatCount,
      result,
      playTimeSec,
      playTimeStr,
      difficulty: this.difficulty
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
    if (this.isPaused) return;
    this.lockMessageCooldown = Math.max(0, this.lockMessageCooldown - dt);
    this.progression.update(dt);

    // Update Stage Platform Movements
    this.stage.update(dt);

    // Update Player Movement & Physics
    this.player.update(dt, this.stage.platforms, this.ai.gravityDir);

    // Update AI Logic & 0.5s Telegraphing Check
    this.ai.update(dt, this.player, this.stage.goalCube, this.stage);

    if (!this.ai.isOverheated) {
      this.attackDirector.update(dt, this.player, {
        onDefend: (type) => {
          this.handleDefense(type);
          this.audio.playParry();
          this.particles.emitParryShockwave(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        },
        onHit: (type) => {
          const balance = getDifficultyBalance(this.stage.currentStageNum, this.difficulty);
          this.player.reset(this.stage.spawnPoint.x, this.stage.spawnPoint.y);
          this.takeMentalDamage(Math.round(12 * balance.damageMultiplier), `AI_${type.toUpperCase()}`);
        }
      });
    }

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

    for (const core of this.stage.dataCores) {
      if (core.collected) continue;
      const padding = this.progression.corePickupPadding;
      const pickupBox = {
        x: core.x - padding,
        y: core.y - padding,
        width: core.width + padding * 2,
        height: core.height + padding * 2
      };
      if (!this.player.collidesWith(pickupBox)) continue;
      core.collected = true;
      const earned = this.progression.collectCore();
      this.stage.setGoalLocked(!this.progression.goalUnlocked);
      this.particles.emit(core.x, core.y, '#ffcf33', 22, 6, 3, 28);
      this.audio.playClear();
      this.hud.addChatMessage(
        `DATA CORE ${this.progression.coresCollected}/${this.progression.coresTotal} · +${earned} · ${this.progression.combo} COMBO`,
        'highlight',
        { name: 'RUN SYSTEM', badge: 'badge-system', badgeLabel: 'CORE' }
      );
    }

    // Collision Check: Player vs Goal Cube
    // AI 경고 중에는 목표를 먼저 밟아도 클리어되지 않는다.
    // 경고 타이밍에 대시/패링으로 반격하거나 AI가 과열된 뒤에만 확보할 수 있다.
    if (this.player.collidesWith(this.stage.goalCube) && !this.ai.isTelegraphing) {
      if (this.progression.goalUnlocked) {
        this.nextStage();
      } else if (this.lockMessageCooldown <= 0) {
        const coreText = `${this.progression.coresCollected}/${this.progression.coresTotal}`;
        const shieldText = this.progression.bossShield > 0 ? ` · 보호막 ${this.progression.bossShield}` : '';
        this.hud.setAIDialogue(`출구 잠김! 코어 ${coreText}${shieldText}`);
        this.lockMessageCooldown = 1.5;
      }
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

    // Draw fair, telegraphed AI attack patterns.
    this.attackDirector.draw(this.ctx);

    // Draw Player
    this.player.draw(this.ctx);

    // Draw Particles
    this.particles.draw(this.ctx);

    this.ctx.restore();
    this.drawRunHUD();
  }

  drawRunHUD() {
    const ctx = this.ctx;
    const p = this.progression;
    ctx.save();
    ctx.fillStyle = 'rgba(5, 7, 12, 0.82)';
    ctx.strokeStyle = p.goalUnlocked ? '#00ff88' : '#ffcf33';
    ctx.lineWidth = 2;
    ctx.fillRect(18, 18, 260, p.bossShieldMax ? 82 : 62);
    ctx.strokeRect(18, 18, 260, p.bossShieldMax ? 82 : 62);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#ffcf33';
    ctx.fillText(`◆ DATA CORE  ${p.coresCollected} / ${p.coresTotal}`, 32, 43);
    ctx.textAlign = 'right';
    ctx.fillStyle = p.goalUnlocked ? '#00ff88' : '#ff2a5f';
    ctx.fillText(p.goalUnlocked ? 'OPEN' : 'LOCKED', 264, 43);
    ctx.textAlign = 'left';
    ctx.fillStyle = p.combo >= 3 ? '#ff2a5f' : '#ffffff';
    ctx.fillText(`${p.combo || 0} COMBO  ×${p.multiplier.toFixed(2)}`, 32, 67);
    if (p.bossShieldMax) {
      ctx.fillStyle = '#bd00ff';
      ctx.fillText(`BOSS SHIELD  ${'■'.repeat(p.bossShield)}${'□'.repeat(p.bossShieldMax - p.bossShield)}`, 32, 91);
    }
    ctx.restore();
  }
}
