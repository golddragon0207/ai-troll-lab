# 🤖 AI Bully Lab (AI의 킹받는 텔레포트 실험실)

> **유튜버 & 스트리머 1인 방송 특화!**  
> 스트리머를 대놓고 억까하는 킹받는 AI 마스터의 텔레포트와 트랩을 **0.5초 피지컬 대시와 패링**으로 깨부수는 독창적인 2D 아케이드 웹 게임입니다.

![AI Bully Lab Game](https://img.shields.org/badge/Game-Live-00f0ff?style=for-the-badge&logo=gamepad)
![License](https://img.shields.org/badge/License-MIT-bd00ff?style=for-the-badge)

🎮 **정식 라이브 웹 게임 주소**: [https://golddragon0207.github.io/ai-bully-lab](https://golddragon0207.github.io/ai-bully-lab)

---

## 🎬 방송용 특화 핵심 포인트 (Streamer Features)

1. **🎥 방송 전용 HUD & 웹캠 연동**
   - 화면 구석에 스트리머 웹캠 배치 프레임 제공 (실제 카메라 연동 및 귀여운 가상 아바타 표정 변화 자동 지원)
2. **🧠 스트리머 멘탈 HP & 억까 파괴 연출**
   - 억까 당할 때마다 멘탈 게이지 감소 + 화면 붉은 흔들림(Screen Shake) 이펙트
3. **💬 실시간 시청자 챗 시뮬레이터**
   - `ㅋㅋㅋㅋㅋ`, `AI 폼 미쳤다`, `0.5초 피지컬 대시 지렸다`, `멘탈 바사삭` 등 찰진 시청자 반응 팝업
4. **🔊 무저작권 Web Audio API 사운드**
   - 방송 저작권 걱정 없이 웹 브라우저가 직접 합성하는 레트로 8-bit 효과음 (점프, 대시, 텔레포트, 폭발, AI 비웃음)

---

## 🎮 인게임 조작 방법 & 억까 파회 메커니즘

| 키 (Key) | 조작 내용 | 파회 팁 (Tip) |
| :--- | :--- | :--- |
| **`WASD` / `방향키`** | 캐릭터 이동 & 점프 | 지형 기믹(빙판, 트램펄린)을 활용하세요. |
| **`SHIFT`** | **0.5초 피지컬 대시** | ⚠️ AI 텔레포트 예고 스파크 0.5초 전 대시로 큐브 낚아채기! |
| **`SPACE`** | **억까 패링 (Parry)** | AI의 억까 타이밍에 맞춰 반사하고 AI 멘탈 타격! |
| **`🙏 도게자 버튼`** | **AI 뇌물 바치기** | AI에게 도게자를 바쳐 과열(Overheat) 게이지를 올려 쿨타임 유도! |

---

## ⚡ 억까 파회 & 레벨 구조 (10 Stages)

- **0.5초 Pre-Telegraphing 붉은 예고**: 골인 큐브에 손을 댈 때 0.5초 전 예고 스파크 발동 ➔ 100% 무조건 당하는 게 아닌 피지컬 대시로 파회 가능!
- **AI 3초 과열 (Bully Overheat)**: AI가 억까 스킬을 연속 시전하면 과열 상태에 빠져 **3초간 억까 휴업** ➔ 최고 찬스!
- **10개의 세분화된 챌린지 레벨**:
  - `Stage 1~4`: 텔레포트, 빙판, 트램펄린, 레이저 기초 레벨
  - `Stage 5`: 붕괴 발판 존 (중간 보스)
  - `Stage 6~9`: 수중 무중력 구역, 좁은 발판 점프, 더블 레이저 크로스파이어
  - `Stage 10`: **최종 보스 - AI 코어 메인프레임 통곡의 성채**

---

## 📄 기획 및 구현 계획서 (Implementation Plan Summary)

### 1. 프로젝트 개요
유튜버가 방송에서 켰을 때 억지 리액션이 아닌 실제 멘붕과 통쾌함이 터져 나오는 1인 플레이 중심 갓겜 제작.

### 2. 기술 스택 (Tech Stack)
- **Engine & Core**: Pure ES6+ JavaScript (60FPS Canvas 2D Engine)
- **UI & Aesthetics**: HTML5 + Vanilla CSS3 (Cyberpunk Neon Glassmorphism)
- **Audio**: Web Audio API Procedural Synthesizer
- **Tooling & Bundler**: Vite + Node.js (Static Output Deployment)

### 3. 파일 구조
```
ai-bully-lab/
├── index.html              # Broadcast Container HTML
├── package.json            # Vite Project Configuration
├── README.md               # Game Manual & Overview
├── implementation_plan.md  # Detailed Architecture Spec
└── src/
    ├── style.css           # Cyberpunk Neon Design System
    ├── main.js             # Entry Point & UI Events
    ├── game/
    │   ├── Engine.js       # 60FPS Game Loop & Physics Collision
    │   ├── Player.js       # Player Physics, Dash & Parrying
    │   ├── AIBully.js      # AI State Machine, 0.5s Telegraphing & Overheat
    │   ├── Stage.js        # 10 Stages, Hazards & Goal Relocation
    │   └── Particle.js     # Sparks, Explosions & Particle System
    └── ui/
        ├── BroadcastHUD.js # Webcam, Mental HP, Live Chat Simulator
        └── AudioEngine.js  # Procedural Sound Synth Engine
```

---

## 🛠️ 로컬 개발 및 실행 방법

```bash
# 1. 저장소 클론
git clone https://github.com/golddragon0207/ai-bully-lab.git
cd ai-bully-lab

# 2. 패키지 설치
npm install

# 3. 개발 서버 실행
npm run dev

# 4. 프로덕션 빌드
npm run build
```

---

© 2026 AI Bully Lab • Streamer Edition
