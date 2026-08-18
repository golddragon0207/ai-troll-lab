export class BroadcastHUD {
  constructor(audioEngine) {
    this.audio = audioEngine;
    
    // UI Elements
    this.mentalHpBar = document.getElementById('mental-hp-bar');
    this.mentalHpVal = document.getElementById('mental-hp-val');
    this.dashCooldownBar = document.getElementById('dash-cooldown-bar');
    this.dashStatusVal = document.getElementById('dash-status-val');
    this.aiHeatBar = document.getElementById('ai-heat-bar');
    this.aiHeatVal = document.getElementById('ai-heat-val');
    this.aiDialogue = document.getElementById('ai-dialogue-banner');
    this.streamerFace = document.getElementById('streamer-face');
    this.streamerState = document.getElementById('streamer-state');
    this.chatMessages = document.getElementById('chat-messages');
    this.popupLayer = document.getElementById('popup-layer');
    this.stageNumEl = document.getElementById('current-stage-num');

    // Chat presets & viewer pools
    this.viewerNames = [
      { name: "트수123", badge: "badge-fan" },
      { name: "도파민중독자", badge: "badge-sub" },
      { name: "치즈러버", badge: "badge-vip" },
      { name: "매니저_김트", badge: "badge-mod" },
      { name: "억까전문가", badge: "badge-sub" },
      { name: "피지컬킹", badge: "badge-fan" },
      { name: "유튜브클립퍼", badge: "badge-vip" }
    ];

    this.chatPoolNormal = [
      "AI 폼 미쳤다 ㅋㅋㅋ",
      "오늘 10단계까지 깰 수 있나요?",
      "피지컬 대시 각 봐라",
      "이번 스테이지 깰 수 있냐 ㅋㅋㅋ",
      "AI 억까 ㅋㅋㅋ 실화냐",
      "ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ",
      "억까 0.5초 피지컬 대시 드가자!",
      "구독자 30만 기념 억까 쇼 🍿",
      "AI 지존이시네요 ㅋㅋㅋ"
    ];

    this.chatPoolTeleport = [
      "텔레포트 뭔데 ㅋㅋㅋㅋㅋㅋㅋ",
      "골인 직전에 텔레포트 ㅋㅋㅋ",
      "스트리머 표정 봐라 ㅋㅋㅋㅋ",
      "아니 0.5초 전에 텔레포트 실화?",
      "ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ 억울해 뒤짐",
      "AI가 대놓고 팩폭하네 ㅋㅋㅋ"
    ];

    this.chatPoolDodged = [
      "와 0.5초 대시로 피한 거 지렸다 💥",
      "피지컬 실화냐 ㄷㄷㄷㄷ",
      "오 대시 각 폼 미쳤네",
      "AI 쿨타임 터졌다 드가자!",
      "갓겜 모먼트 떴다 ㅋㅋㅋ"
    ];

    this.startChatTicker();
  }

  updateMentalHP(current, max) {
    const pct = Math.max(0, Math.min(100, Math.floor((current / max) * 100)));
    this.mentalHpBar.style.width = `${pct}%`;
    this.mentalHpVal.textContent = `${pct}%`;

    if (pct < 30) {
      this.streamerFace.textContent = '🤯';
      this.streamerState.textContent = '멘탈 붕괴 직전!';
    } else if (pct < 60) {
      this.streamerFace.textContent = '😡';
      this.streamerState.textContent = '억까에 화가 남';
    } else {
      this.streamerFace.textContent = '😎';
      this.streamerState.textContent = '멘탈 충전 완료';
    }
  }

  updateDashCooldown(pct, ready) {
    this.dashCooldownBar.style.width = `${pct}%`;
    this.dashStatusVal.textContent = ready ? 'READY' : `${Math.ceil(pct)}%`;
  }

  updateAIHeat(pct, isOverheated) {
    this.aiHeatBar.style.width = `${pct}%`;
    this.aiHeatVal.textContent = isOverheated ? 'OVERHEAT! (3s)' : `${Math.floor(pct)}%`;
  }

  updateStageDisplay(stageNum, totalStages = 10) {
    const formatStage = stageNum < 10 ? `0${stageNum}` : `${stageNum}`;
    this.stageNumEl.textContent = `${formatStage} / ${totalStages}`;
  }

  setAIDialogue(msg) {
    this.aiDialogue.textContent = `"${msg}"`;
    this.audio.playAIVoice();
  }

  addChatMessage(text, highlightType = '', viewerOverride = null) {
    const viewer = viewerOverride || this.viewerNames[Math.floor(Math.random() * this.viewerNames.length)];
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-item';

    let textClass = 'chat-text';
    if (highlightType === 'laugh') textClass += ' laugh';
    if (highlightType === 'highlight') textClass += ' highlight';

    const badgeEl = document.createElement('span');
    badgeEl.className = `chat-badge ${viewer.badge || 'badge-fan'}`;
    badgeEl.textContent = viewer.badgeLabel || (viewer.badge || 'badge-fan').replace('badge-', '').toUpperCase();

    const userEl = document.createElement('span');
    userEl.className = 'chat-username';
    userEl.textContent = `${viewer.name || '익명 시청자'}:`;

    const textEl = document.createElement('span');
    textEl.className = textClass;
    textEl.textContent = String(text);

    msgEl.append(badgeEl, userEl, textEl);

    this.chatMessages.appendChild(msgEl);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    if (this.chatMessages.children.length > 25) {
      this.chatMessages.removeChild(this.chatMessages.firstChild);
    }
  }

  triggerTeleportChat() {
    const text = this.chatPoolTeleport[Math.floor(Math.random() * this.chatPoolTeleport.length)];
    this.addChatMessage(text, 'laugh');
    this.streamerFace.textContent = '😱';
  }

  triggerDodgeChat() {
    const text = this.chatPoolDodged[Math.floor(Math.random() * this.chatPoolDodged.length)];
    this.addChatMessage(text, 'highlight');
  }

  startChatTicker() {
    setInterval(() => {
      const text = this.chatPoolNormal[Math.floor(Math.random() * this.chatPoolNormal.length)];
      this.addChatMessage(text);
    }, 2800);
  }

  spawnFakePopup(title = "AI Warning System", text = "방금 억까 실패로 AI가 빡쳤습니다.") {
    const popup = document.createElement('div');
    popup.className = 'fake-popup';
    const posX = Math.floor(Math.random() * 500) + 100;
    const posY = Math.floor(Math.random() * 300) + 50;
    popup.style.left = `${posX}px`;
    popup.style.top = `${posY}px`;

    popup.innerHTML = `
      <div class="fake-popup-title">
        <span>⚠️ ${title}</span>
        <span style="cursor:pointer;" class="close-popup">X</span>
      </div>
      <div class="fake-popup-body">
        <p>${text}</p>
        <button class="fake-popup-btn close-popup">확인 (닫기)</button>
      </div>
    `;

    const closeBtns = popup.querySelectorAll('.close-popup');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        popup.remove();
      });
    });

    this.popupLayer.appendChild(popup);

    setTimeout(() => {
      if (popup.parentNode) popup.remove();
    }, 5000);
  }

  clearPopups() {
    this.popupLayer.innerHTML = '';
  }
}
