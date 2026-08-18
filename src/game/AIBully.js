export class AIBully {
  constructor(hud, audioEngine, particleSystem, events = {}) {
    this.hud = hud;
    this.audio = audioEngine;
    this.particles = particleSystem;
    this.events = events;

    // AI Heat & Overheat Cooldown
    this.heat = 0; // 0 to 100
    this.maxHeat = 100;
    this.isOverheated = false;
    this.overheatTimer = 0;
    this.maxOverheatDuration = 3;

    // Teleportation Pre-telegraphing (0.5s Warning Glow)
    this.isTelegraphing = false;
    this.telegraphTimer = 0;
    this.telegraphDuration = 0.5;
    this.attackRadius = 125;
    this.currentStage = 1;
    this.warningSoundTimer = 0;
    this.targetCube = null;

    // AI Gravity & Environmental Traps
    this.gravityDir = 1; // 1 = Normal, -1 = Inverted
    this.gravityTimer = 0;

    // Taunts Pool
    this.tauntsTeleport = [
      "어딜 골인 지점에 손을 대? 텔레포트 ㅋ",
      "방금 건 좀 아까웠지? 골인 큐브 워프!",
      "손끝도 못 대죠? ㅋㅋㅋ 텔레포트!",
      "0.5초 안에 피해보시든가 ㅋ"
    ];

    this.tauntsDodged = [
      "아니 0.5초 피지컬 대시로 피한다고???",
      "치사하게 대시로 낚아채네 😡",
      "패링각 실화냐?! 억까 반사됨 💥",
      "피지컬 지리네... 치사하다"
    ];

    this.tauntsOverheat = [
      "크윽... AI 뇌절 과열됐다! (3초 쿨타임)",
      "시스템 과열 중... 3초간 억까 휴업!",
      "쿨타임 돌았다... 지금 깨봐라 😡"
    ];
  }

  reset() {
    this.heat = 0;
    this.isOverheated = false;
    this.overheatTimer = 0;
    this.isTelegraphing = false;
    this.telegraphTimer = 0;
    this.warningSoundTimer = 0;
    this.gravityDir = 1;
    this.gravityTimer = 0;
    this.hud.updateAIHeat(0, false);
  }

  setDifficulty(stageNum = 1) {
    this.currentStage = Math.max(1, Number(stageNum) || 1);
    const stageOffset = this.currentStage - 1;

    // 초반에는 패턴을 읽을 시간을 주고, 후반으로 갈수록 반응 창과 휴식 시간을 줄인다.
    this.telegraphDuration = Math.max(0.28, 0.52 - stageOffset * 0.025);
    this.attackRadius = Math.min(165, 125 + stageOffset * 4);
    this.maxOverheatDuration = Math.max(2, 3 - stageOffset * 0.1);
  }

  update(dt, player, goalCube, stage) {
    // Overheat Cooldown countdown
    if (this.isOverheated) {
      this.overheatTimer = Math.max(0, this.overheatTimer - dt);
      if (this.overheatTimer < 1e-6) this.overheatTimer = 0;
      this.hud.updateAIHeat(100, true);
      if (this.overheatTimer <= 0) {
        this.isOverheated = false;
        this.heat = 0;
        this.hud.updateAIHeat(0, false);
        this.hud.setAIDialogue("충전 완료! 다시 억까 모드 가동 🤖");
      }
      return; // No attacks during overheat!
    }

    // Handle Active Telegraphing (0.5s pre-warning window)
    if (this.isTelegraphing) {
      this.telegraphTimer = Math.max(0, this.telegraphTimer - dt);
      if (this.telegraphTimer < 1e-6) this.telegraphTimer = 0;
      this.warningSoundTimer -= dt;
      this.hud.updateAIHeat(this.heat, false);

      // Emit warning sparks on goal cube
      if (goalCube) {
        this.particles.emit(
          goalCube.x + goalCube.width / 2,
          goalCube.y + goalCube.height / 2,
          '#ff2a5f', 3, 5, 2, 10
        );
        if (this.warningSoundTimer <= 0) {
          this.audio.playTeleportWarning();
          this.warningSoundTimer = 0.1;
        }
      }

      // Check if Player DODGED via SHIFT Dash OR PARRIED via Spacebar
      if (player.isDashing || player.isParrying) {
        // Player successfully DODGED or PARRIED!
        this.isTelegraphing = false;
        this.heat += 40; // Penalty to AI heat!
        const defenseType = player.isParrying ? 'parry' : 'dash';
        this.events.onDefense?.(defenseType);
        const taunt = this.tauntsDodged[Math.floor(Math.random() * this.tauntsDodged.length)];
        this.hud.setAIDialogue(taunt);
        this.hud.triggerDodgeChat();

        if (player.isParrying) {
          this.audio.playParry();
          this.particles.emitParryShockwave(player.x, player.y);
          this.hud.spawnFakePopup("PARRY SUCCESS!", "억까 반사 성공! AI 멘탈 타격!");
        }

        this.checkOverheat();
        return;
      }

      // If 0.5s telegraphing window expires and player DID NOT dodge/parry ➔ Execute Teleport!
      if (this.telegraphTimer <= 0) {
        this.executeTeleport(goalCube, stage);
      }
      return;
    }

    // Distance check to initiate Teleport Attack when player approaches Goal Cube
    if (goalCube && !this.isTelegraphing && !this.isOverheated) {
      const dist = Math.hypot(
        (player.x + player.width / 2) - (goalCube.x + goalCube.width / 2),
        (player.y + player.height / 2) - (goalCube.y + goalCube.height / 2)
      );

      if (dist < this.attackRadius) {
        // Trigger a stage-scaled pre-telegraphing warning glow.
        this.isTelegraphing = true;
        this.telegraphTimer = this.telegraphDuration;
        this.warningSoundTimer = 0;
        this.hud.setAIDialogue(`⚠️ ${this.telegraphDuration.toFixed(2)}초 후 텔레포트! SHIFT/SPACE로 반격해라!`);
      }
    }
  }

  executeTeleport(goalCube, stage) {
    this.isTelegraphing = false;
    this.heat += 30;

    // Relocate Goal Cube to new valid location in stage
    stage.relocateGoalCube(goalCube);
    this.audio.playTeleportWarp();

    // Particle FX
    this.particles.emitSparks(goalCube.x + goalCube.width / 2, goalCube.y + goalCube.height / 2);

    const taunt = this.tauntsTeleport[Math.floor(Math.random() * this.tauntsTeleport.length)];
    this.hud.setAIDialogue(taunt);
    this.hud.triggerTeleportChat();
    this.events.onTeleport?.(this.currentStage);

    // Random chance to spawn fake error popup
    if (Math.random() < 0.4) {
      this.hud.spawnFakePopup("SYSTEM ERROR", "스트리머 멘탈이 30% 감소했습니다.");
    }

    this.checkOverheat();
  }

  checkOverheat() {
    this.heat = Math.min(this.maxHeat, this.heat);
    this.hud.updateAIHeat(this.heat, false);
    if (this.heat >= this.maxHeat && !this.isOverheated) {
      this.isOverheated = true;
      this.overheatTimer = this.maxOverheatDuration;
      this.events.onOverheat?.();
      const taunt = this.tauntsOverheat[Math.floor(Math.random() * this.tauntsOverheat.length)];
      this.hud.setAIDialogue(taunt);
      this.hud.spawnFakePopup("OVERHEAT DETECTED!", "AI가 3초간 과열에 빠졌습니다! 지금 골인하세요!");
      this.audio.playExplosion();
    }
  }

  addHeat(amount, dialogue = '') {
    if (this.isOverheated) return false;
    this.heat += amount;
    if (dialogue) this.hud.setAIDialogue(dialogue);
    this.checkOverheat();
    return true;
  }

  bribeAI() {
    if (this.isOverheated) return;
    this.addHeat(35, "도게자를 올리는군 ㅋ 뇌물 수수 후 잠시 감시를 느슨하게 해주지");
    this.hud.addChatMessage("스트리머가 AI한테 도게자를 박습니다 ㅋㅋㅋㅋ", "highlight");
  }
}
