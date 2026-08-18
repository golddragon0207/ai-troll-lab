# 🤖 AI Troll Lab (AI 장난질 실험실)

> **유튜버 & 스트리머 1인 방송 특화!**  
> 데이터 코어를 수집해 콤보를 잇고, 예고 공격을 대시·패링으로 반격하며 AI 보스를 무너뜨리는 1인용 2D 액션 로그라이트입니다. SOOP·치지직 시청자 투표는 플레이를 대신하지 않고 판에 가벼운 변수를 더합니다.

![AI Troll Lab Game](https://img.shields.org/badge/Game-Live-00f0ff?style=for-the-badge&logo=gamepad)
![License](https://img.shields.org/badge/License-MIT-bd00ff?style=for-the-badge)

🎮 **정식 라이브 웹 게임 주소**: [https://golddragon0207.github.io/ai-troll-lab](https://golddragon0207.github.io/ai-troll-lab)

---

## 🎬 방송용 특화 핵심 포인트 (Streamer Features)

1. **🎥 방송 전용 HUD & 웹캠 연동**
   - 화면 구석에 스트리머 웹캠 배치 프레임 제공 (실제 카메라 연동 및 귀여운 가상 아바타 표정 변화 자동 지원)
2. **🧠 스트리머 멘탈 HP & 억까 파괴 연출**
   - 억까 당할 때마다 멘탈 게이지 감소 + 화면 붉은 흔들림(Screen Shake) 이펙트
3. **💬 SOOP·치지직 실시간 채팅 연동**
   - SOOP·치지직 라이브 채팅을 게임의 시청자 투표로 직접 반영
4. **🔊 무저작권 Web Audio API 사운드**
   - 방송 저작권 걱정 없이 웹 브라우저가 직접 합성하는 레트로 8-bit 효과음 (점프, 대시, 텔레포트, 폭발, AI 비웃음)
5. **🗳️ SOOP · 치지직 공통 시청자 투표**
   - `!회복`, `!과열`, `!워프`, `!충격` 명령을 40초 동안 집계해 최다 득표 효과를 게임에 반영
   - 투표 효과를 약하게 조정해 시청자가 없어도 온전한 난이도와 재미를 유지
   - 플랫폼과 사용자 ID를 조합해 한 라운드 한 표만 허용하며, 명령을 바꾸면 기존 표를 이동
   - 방송 연동 전에도 사이드바의 플랫폼 선택/입력창으로 전체 흐름을 테스트 가능
   - 사이드바의 `실방송 연동`에서 플랫폼별 방송 URL을 등록하고 연결 상태를 확인

6. **🏆 Firebase 커뮤니티 기능**
   - 플레이 결과 점수를 공개 TOP 10 랭킹에 등록
   - 건의사항은 공개하지 않고 개발자만 Firebase Console에서 확인
7. **🔥 2단계 방송 난이도**
   - 기본 `방송용 도전`은 초반부터 기존보다 빠른 AI 반응을 제공
   - `지옥 방송`은 예고 시간·과열 휴식이 더 짧고 피해량이 높으며 점수 1.25배

### 실시간 채팅 연동

SOOP·치지직 CORS 프록시 Worker:

```text
https://ai-troll-lab-chat-proxy.skkim867.workers.dev
```

상태 확인:

```text
https://ai-troll-lab-chat-proxy.skkim867.workers.dev/health
```

SOOP·치지직은 프로젝트 전용 Cloudflare Worker가 CORS가 없는 공개 채팅 API 요청만 중계합니다. 방송 주소는 사용자의 브라우저 저장소에만 저장됩니다. YouTube 연동은 지속적인 API 폴링과 할당량 소모를 피하기 위해 제공하지 않습니다.

Worker 원본은 [`worker/chat-proxy.js`](./worker/chat-proxy.js), 배포 설정은 [`wrangler.toml`](./wrangler.toml)에 보관합니다. 허용 대상 호스트와 GitHub Pages Origin을 제한하며, 요청 본문 크기와 외부 리다이렉트도 차단합니다.

개발 중에는 브라우저 이벤트로도 동일한 입력을 테스트할 수 있습니다.

```js
window.dispatchEvent(new CustomEvent('audience-chat', {
  detail: { platform: 'chzzk', userId: '123', userName: '테스터', message: '!과열' }
}));
```

---

## 🎮 인게임 조작 방법 & 억까 파회 메커니즘

| 키 (Key) | 조작 내용 | 파회 팁 (Tip) |
| :--- | :--- | :--- |
| **`WASD` / `방향키`** | 캐릭터 이동 & 점프 | 지형 기믹(빙판, 트램펄린)을 활용하세요. |
| **`SHIFT`** | **고속 대시** | 충격파를 뚫거나 텔레포트 예고를 반격해 콤보를 연결합니다. |
| **`SPACE`** | **억까 패링 (Parry)** | 낙뢰·충격파를 반사하고 보스 보호막을 파괴합니다. |
| **`🙏 도게자 버튼`** | **AI 뇌물 바치기** | AI에게 도게자를 바쳐 과열(Overheat) 게이지를 올려 쿨타임 유도! |

---

## ⚡ 억까 파회 & 레벨 구조 (10 Stages)

- **데이터 코어 런**: 매 스테이지의 코어 3개를 모두 수집해야 출구가 열립니다.
- **콤보·점수**: 코어 수집과 공격 반격을 5초 안에 연결하면 배율과 보너스 점수가 상승하며, 피격 시 콤보가 끊깁니다.
- **AI 패턴 공격**: 2스테이지부터 점프로 넘는 충격파와 위치를 추적하는 낙뢰가 교대로 등장합니다.
- **로그라이트 강화**: 3·6·9스테이지 뒤에 대시, 패링, 멘탈, 콤보, 코어 자석 중 하나를 선택합니다.
- **보스전**: 5·10스테이지는 코어뿐 아니라 AI 공격을 반격해 보호막 2·4칸을 파괴해야 합니다.
- **스테이지별 붉은 예고**: 골인 큐브에 접근하면 선택 난이도와 스테이지에 따라 0.44~0.16초 예고 스파크 발동 ➔ 후반으로 갈수록 반응 시간이 짧아집니다.
- **목표 잠금**: AI 경고 중에는 큐브를 먼저 밟아도 클리어되지 않으며, `SHIFT` 대시 또는 `SPACE` 패링으로 반격해야 확보할 수 있습니다.
- **실패 페널티**: 텔레포트 경고를 놓치면 스테이지에 따라 멘탈 HP가 12~30 감소합니다.
- **AI 과열 (Bully Overheat)**: AI가 억까 스킬을 연속 시전하면 과열 상태에 빠져 잠시 억까를 멈춥니다. 후반으로 갈수록 휴식 시간이 짧아집니다.
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
- **Community Data**: Firebase Cloud Firestore (서울 리전)

### 3. 파일 구조
```
ai-troll-lab/
├── index.html              # Broadcast Container HTML
├── package.json            # Vite Project Configuration
├── README.md               # Game Manual & Overview
├── implementation_plan.md  # Detailed Architecture Spec
├── firestore.rules         # Ranking/Suggestion Security Rules
├── firebase.json           # Firebase Deploy Configuration
└── src/
    ├── style.css           # Cyberpunk Neon Design System
    ├── main.js             # Entry Point & UI Events
    ├── game/
    │   ├── Engine.js       # 60FPS Game Loop & Physics Collision
    │   ├── Player.js       # Player Physics, Dash & Parrying
    │   ├── AIBully.js      # AI State Machine, 0.5s Telegraphing & Overheat
    │   ├── AIAttackDirector.js # 충격파·추적 낙뢰 패턴과 예고 판정
    │   ├── RunProgression.js   # 코어·콤보·보스 보호막·강화 빌드
    │   ├── Stage.js        # 10 Stages, Hazards & Goal Relocation
    │   └── Particle.js     # Sparks, Explosions & Particle System
    ├── firebase/
    │   ├── firebaseConfig.js       # Firebase Web App Configuration
    │   ├── FirestoreService.js     # Ranking/Suggestion Data Access
    │   └── CommunityController.js  # Community UI Controller
    └── ui/
        ├── BroadcastHUD.js # Webcam, Mental HP, Live Chat Simulator
        └── AudioEngine.js  # Procedural Sound Synth Engine
```

---

## 🛠️ 로컬 개발 및 실행 방법

```bash
# 1. 저장소 클론
git clone https://github.com/golddragon0207/ai-troll-lab.git
cd ai-troll-lab

# 2. 패키지 설치
npm install

# 3. 로컬 키 설정 (.env.local, 커밋 금지)
VITE_FIREBASE_API_KEY=Firebase_Web_API_키
VITE_DONATION_URL=
VITE_ADFIT_LEADERBOARD_UNIT=
VITE_ADFIT_DONATE_UNIT=
VITE_ADFIT_FEEDBACK_UNIT=

# 4. 자동 테스트
npm test

# 5. 개발 서버 실행
npm run dev

# 6. 프로덕션 빌드
npm run build
```

배포 시 Firebase 키는 GitHub Actions Repository Secret의 `FIREBASE_API_KEY`에서 주입합니다. 후원 주소와 애드핏 단위는 GitHub Actions Repository Variables의 `DONATION_URL`, `ADFIT_LEADERBOARD_UNIT`, `ADFIT_DONATE_UNIT`, `ADFIT_FEEDBACK_UNIT`에 등록하면 코드 수정 없이 활성화됩니다.

Firestore 접근 권한은 [firestore.rules](./firestore.rules)에서 랭킹 공개 조회·검증된 신규 등록과 비공개 건의 등록만 허용합니다. 클라이언트 단독 게임 특성상 고의적인 점수 위조를 완전히 차단하는 경쟁형 랭킹은 아니며, 방송 커뮤니티용 캐주얼 랭킹으로 운영합니다.

### Worker 재배포

```bash
npx wrangler login
npx wrangler deploy
```

### 공개 전 운영 확인

- `npm test`와 `npm run build` 성공
- Worker `/health` 응답 확인
- 방송 중인 SOOP·치지직 채널에서 각각 실제 메시지 1회 수신 확인
- 애드핏 매체 승인 후 발급된 광고 단위를 Repository Variables에 등록
- 실제 후원 페이지가 결정되면 `DONATION_URL` 등록

---

© 2026 AI Troll Lab • Streamer Edition
