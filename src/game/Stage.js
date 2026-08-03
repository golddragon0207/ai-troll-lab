export class Stage {
  constructor() {
    this.currentStageNum = 1;
    this.totalStages = 10; // 10단계로 대폭 확장!

    this.platforms = [];
    this.hazards = [];
    this.goalCube = { x: 800, y: 150, width: 32, height: 32 };
    this.spawnPoint = { x: 60, y: 500 };
  }

  loadStage(stageNum) {
    this.currentStageNum = stageNum;
    this.platforms = [];
    this.hazards = [];

    const W = 960;
    const H = 600;

    // Floor Boundary
    this.platforms.push({ x: 0, y: H - 30, width: W, height: 30, color: '#1a2238', type: 'normal' });

    if (stageNum === 1) {
      // Stage 1: AI의 첫 시련 (입문)
      this.spawnPoint = { x: 80, y: 480 };
      this.goalCube = { x: 840, y: 140, width: 32, height: 32 };
      this.platforms.push({ x: 50, y: 520, width: 160, height: 20, color: '#00f0ff', type: 'normal' });
      this.platforms.push({ x: 260, y: 420, width: 140, height: 20, color: '#00f0ff', type: 'normal' });
      this.platforms.push({ x: 460, y: 320, width: 140, height: 20, color: '#00f0ff', type: 'normal' });
      this.platforms.push({ x: 660, y: 220, width: 140, height: 20, color: '#00f0ff', type: 'normal' });
      this.platforms.push({ x: 810, y: 180, width: 110, height: 20, color: '#bd00ff', type: 'normal' });

    } else if (stageNum === 2) {
      // Stage 2: 얼음 슬라이딩
      this.spawnPoint = { x: 80, y: 480 };
      this.goalCube = { x: 820, y: 120, width: 32, height: 32 };
      this.platforms.push({ x: 50, y: 520, width: 140, height: 20, color: '#00f0ff', type: 'normal' });
      this.platforms.push({ x: 240, y: 440, width: 120, height: 20, color: '#00d3ff', type: 'ice' });
      this.platforms.push({ x: 420, y: 340, width: 140, height: 20, color: '#00f0ff', type: 'moving', vx: 2, minX: 380, maxX: 600 });
      this.platforms.push({ x: 640, y: 240, width: 120, height: 20, color: '#00d3ff', type: 'ice' });
      this.platforms.push({ x: 790, y: 160, width: 110, height: 20, color: '#bd00ff', type: 'normal' });
      this.hazards.push({ x: 400, y: H - 45, width: 160, height: 15, type: 'spikes' });

    } else if (stageNum === 3) {
      // Stage 3: 트램펄린 스프링
      this.spawnPoint = { x: 80, y: 480 };
      this.goalCube = { x: 460, y: 100, width: 32, height: 32 };
      this.platforms.push({ x: 50, y: 520, width: 140, height: 20, color: '#00f0ff', type: 'normal' });
      this.platforms.push({ x: 240, y: 480, width: 80, height: 20, color: '#ffb700', type: 'spring' });
      this.platforms.push({ x: 380, y: 300, width: 180, height: 20, color: '#00f0ff', type: 'moving', vx: 3, minX: 250, maxX: 650 });
      this.platforms.push({ x: 680, y: 480, width: 80, height: 20, color: '#ffb700', type: 'spring' });
      this.platforms.push({ x: 430, y: 140, width: 100, height: 20, color: '#bd00ff', type: 'normal' });
      this.hazards.push({ x: 200, y: H - 45, width: 450, height: 15, type: 'spikes' });

    } else if (stageNum === 4) {
      // Stage 4: 레이저 크로스파이어
      this.spawnPoint = { x: 80, y: 480 };
      this.goalCube = { x: 840, y: 100, width: 32, height: 32 };
      this.platforms.push({ x: 50, y: 520, width: 120, height: 20, color: '#00f0ff', type: 'normal' });
      this.platforms.push({ x: 220, y: 430, width: 120, height: 20, color: '#00f0ff', type: 'normal' });
      this.platforms.push({ x: 400, y: 340, width: 120, height: 20, color: '#00f0ff', type: 'moving', vx: 2.5, minX: 350, maxX: 550 });
      this.platforms.push({ x: 600, y: 250, width: 120, height: 20, color: '#00f0ff', type: 'normal' });
      this.platforms.push({ x: 800, y: 140, width: 110, height: 20, color: '#bd00ff', type: 'normal' });
      this.hazards.push({ x: 300, y: H - 45, width: 400, height: 15, type: 'spikes' });
      this.hazards.push({ x: 500, y: 180, width: 20, height: 120, type: 'laser' });

    } else if (stageNum === 5) {
      // Stage 5: 중간 보스 - 붕괴 발판 존
      this.spawnPoint = { x: 80, y: 480 };
      this.goalCube = { x: 460, y: 80, width: 32, height: 32 };
      this.platforms.push({ x: 50, y: 520, width: 120, height: 20, color: '#00f0ff', type: 'normal' });
      this.platforms.push({ x: 220, y: 440, width: 90, height: 20, color: '#ffb700', type: 'spring' });
      this.platforms.push({ x: 360, y: 340, width: 100, height: 20, color: '#00d3ff', type: 'ice' });
      this.platforms.push({ x: 520, y: 260, width: 100, height: 20, color: '#00f0ff', type: 'moving', vx: 3, minX: 450, maxX: 750 });
      this.platforms.push({ x: 780, y: 200, width: 90, height: 20, color: '#ffb700', type: 'spring' });
      this.platforms.push({ x: 420, y: 120, width: 120, height: 20, color: '#bd00ff', type: 'normal' });
      this.hazards.push({ x: 150, y: H - 45, width: 700, height: 15, type: 'spikes' });

    } else if (stageNum === 6) {
      // Stage 6: 수중 무중력 구역 & 가시 터널
      this.spawnPoint = { x: 60, y: 480 };
      this.goalCube = { x: 850, y: 200, width: 32, height: 32 };
      this.platforms.push({ x: 40, y: 520, width: 100, height: 20, color: '#00f0ff', type: 'normal' });
      this.platforms.push({ x: 200, y: 420, width: 90, height: 20, color: '#00d3ff', type: 'ice' });
      this.platforms.push({ x: 360, y: 320, width: 120, height: 20, color: '#00f0ff', type: 'moving', vx: 3.5, minX: 300, maxX: 600 });
      this.platforms.push({ x: 650, y: 400, width: 80, height: 20, color: '#ffb700', type: 'spring' });
      this.platforms.push({ x: 800, y: 240, width: 100, height: 20, color: '#bd00ff', type: 'normal' });
      this.hazards.push({ x: 150, y: H - 45, width: 680, height: 15, type: 'spikes' });
      this.hazards.push({ x: 300, y: 120, width: 300, height: 20, type: 'laser' });

    } else if (stageNum === 7) {
      // Stage 7: 좁은 발판 점프 & 더블 레이저
      this.spawnPoint = { x: 60, y: 480 };
      this.goalCube = { x: 460, y: 70, width: 32, height: 32 };
      this.platforms.push({ x: 40, y: 520, width: 90, height: 20, color: '#00f0ff', type: 'normal' });
      this.platforms.push({ x: 180, y: 430, width: 60, height: 20, color: '#00d3ff', type: 'ice' });
      this.platforms.push({ x: 300, y: 340, width: 60, height: 20, color: '#00f0ff', type: 'normal' });
      this.platforms.push({ x: 420, y: 250, width: 120, height: 20, color: '#00f0ff', type: 'moving', vx: 4, minX: 350, maxX: 650 });
      this.platforms.push({ x: 720, y: 350, width: 70, height: 20, color: '#ffb700', type: 'spring' });
      this.platforms.push({ x: 430, y: 110, width: 100, height: 20, color: '#bd00ff', type: 'normal' });
      this.hazards.push({ x: 250, y: 180, width: 15, height: 150, type: 'laser' });
      this.hazards.push({ x: 650, y: 180, width: 15, height: 150, type: 'laser' });
      this.hazards.push({ x: 100, y: H - 45, width: 750, height: 15, type: 'spikes' });

    } else if (stageNum === 8) {
      // Stage 8: 텔레포트 트랩 매트릭스
      this.spawnPoint = { x: 60, y: 480 };
      this.goalCube = { x: 850, y: 90, width: 32, height: 32 };
      this.platforms.push({ x: 40, y: 520, width: 100, height: 20, color: '#00f0ff', type: 'normal' });
      this.platforms.push({ x: 220, y: 450, width: 80, height: 20, color: '#ffb700', type: 'spring' });
      this.platforms.push({ x: 380, y: 320, width: 90, height: 20, color: '#00d3ff', type: 'ice' });
      this.platforms.push({ x: 550, y: 240, width: 100, height: 20, color: '#00f0ff', type: 'moving', vx: 3.5, minX: 450, maxX: 750 });
      this.platforms.push({ x: 800, y: 130, width: 100, height: 20, color: '#bd00ff', type: 'normal' });
      this.hazards.push({ x: 100, y: H - 45, width: 780, height: 15, type: 'spikes' });

    } else if (stageNum === 9) {
      // Stage 9: AI의 초고속 지옥 테스트
      this.spawnPoint = { x: 60, y: 480 };
      this.goalCube = { x: 460, y: 60, width: 32, height: 32 };
      this.platforms.push({ x: 40, y: 520, width: 80, height: 20, color: '#00f0ff', type: 'normal' });
      this.platforms.push({ x: 180, y: 420, width: 70, height: 20, color: '#00d3ff', type: 'ice' });
      this.platforms.push({ x: 320, y: 320, width: 80, height: 20, color: '#ffb700', type: 'spring' });
      this.platforms.push({ x: 500, y: 220, width: 90, height: 20, color: '#00f0ff', type: 'moving', vx: 4.5, minX: 400, maxX: 700 });
      this.platforms.push({ x: 760, y: 320, width: 70, height: 20, color: '#ffb700', type: 'spring' });
      this.platforms.push({ x: 420, y: 100, width: 110, height: 20, color: '#bd00ff', type: 'normal' });
      this.hazards.push({ x: 100, y: H - 45, width: 800, height: 15, type: 'spikes' });
      this.hazards.push({ x: 450, y: 160, width: 25, height: 140, type: 'laser' });

    } else if (stageNum === 10) {
      // Stage 10: 최종 결전 - AI 코어 메인프레임 통곡의 성채
      this.spawnPoint = { x: 60, y: 480 };
      this.goalCube = { x: 460, y: 50, width: 32, height: 32 };
      this.platforms.push({ x: 40, y: 520, width: 90, height: 20, color: '#00f0ff', type: 'normal' });
      this.platforms.push({ x: 180, y: 440, width: 70, height: 20, color: '#ffb700', type: 'spring' });
      this.platforms.push({ x: 320, y: 340, width: 80, height: 20, color: '#00d3ff', type: 'ice' });
      this.platforms.push({ x: 480, y: 250, width: 90, height: 20, color: '#00f0ff', type: 'moving', vx: 5, minX: 380, maxX: 750 });
      this.platforms.push({ x: 780, y: 180, width: 70, height: 20, color: '#ffb700', type: 'spring' });
      this.platforms.push({ x: 410, y: 90, width: 120, height: 20, color: '#bd00ff', type: 'normal' });
      this.hazards.push({ x: 100, y: H - 45, width: 800, height: 15, type: 'spikes' });
      this.hazards.push({ x: 300, y: 140, width: 15, height: 160, type: 'laser' });
      this.hazards.push({ x: 600, y: 140, width: 15, height: 160, type: 'laser' });
    }
  }

  update() {
    for (let p of this.platforms) {
      if (p.type === 'moving') {
        p.x += p.vx;
        if (p.x < p.minX || p.x + p.width > p.maxX) {
          p.vx *= -1;
        }
      }
    }
  }

  relocateGoalCube(goalCube) {
    const validPlatforms = this.platforms.filter(p => p.type !== 'spring');
    if (validPlatforms.length > 0) {
      const p = validPlatforms[Math.floor(Math.random() * validPlatforms.length)];
      goalCube.x = p.x + p.width / 2 - goalCube.width / 2;
      goalCube.y = p.y - goalCube.height - 10;
    }
  }

  draw(ctx) {
    for (let p of this.platforms) {
      ctx.save();
      ctx.fillStyle = p.color || '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color || '#00f0ff';
      ctx.fillRect(p.x, p.y, p.width, p.height);

      if (p.type === 'ice') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x, p.y, p.width, 3);
      } else if (p.type === 'spring') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x + p.width / 4, p.y - 4, p.width / 2, 4);
      }
      ctx.restore();
    }

    for (let h of this.hazards) {
      ctx.save();
      if (h.type === 'spikes') {
        ctx.fillStyle = '#ff2a5f';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ff2a5f';
        const count = Math.floor(h.width / 15);
        for (let i = 0; i < count; i++) {
          ctx.beginPath();
          ctx.moveTo(h.x + i * 15, h.y + h.height);
          ctx.lineTo(h.x + i * 15 + 7.5, h.y);
          ctx.lineTo(h.x + i * 15 + 15, h.y + h.height);
          ctx.fill();
        }
      } else if (h.type === 'laser') {
        ctx.fillStyle = 'rgba(255, 42, 95, 0.85)';
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#ff2a5f';
        ctx.fillRect(h.x, h.y, h.width, h.height);
      }
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = '#bd00ff';
    ctx.shadowBlur = 16;
    ctx.shadowColor = '#bd00ff';
    ctx.fillRect(this.goalCube.x, this.goalCube.y, this.goalCube.width, this.goalCube.height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      this.goalCube.x + 8,
      this.goalCube.y + 8,
      this.goalCube.width - 16,
      this.goalCube.height - 16
    );
    ctx.restore();
  }
}
