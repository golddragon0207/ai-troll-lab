import { Engine } from './game/Engine.js';
import { BroadcastHUD } from './ui/BroadcastHUD.js';
import { AudioEngine } from './ui/AudioEngine.js';
import { refreshAdfitSlot } from './ui/AdFitManager.js';
import { AudienceVoteController } from './audience/AudienceVoteController.js';
import { PlatformChatConnector } from './audience/PlatformChatConnector.js';
import { FirestoreService } from './firebase/FirestoreService.js';
import { CommunityController } from './firebase/CommunityController.js';
import { DONATION_URL } from './config/runtimeConfig.js';

document.addEventListener('DOMContentLoaded', () => {
  const DESIGN_WIDTH = 1280;
  const DESIGN_HEIGHT = 720;
  const canvas = document.getElementById('game-canvas');
  const audioEngine = new AudioEngine();
  const hud = new BroadcastHUD(audioEngine);
  const engine = new Engine(canvas, hud, audioEngine);
  const community = new CommunityController(new FirestoreService());
  const audienceVoting = new AudienceVoteController(engine, hud);
  const platformChat = new PlatformChatConnector({
    onMessage: (detail) => window.dispatchEvent(new CustomEvent('audience-chat', { detail })),
    onStatus: ({ platform, status, message }) => {
      const row = document.querySelector(`[data-platform-row="${platform}"]`);
      const statusEl = document.querySelector(`[data-platform-status="${platform}"]`);
      if (row) row.dataset.status = status;
      if (statusEl) statusEl.textContent = message;
      if (status === 'connected') audienceVoting.setStatus(`${platform.toUpperCase()} 실방송 채팅 연결됨`);
    }
  });

  // Buttons
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const startOverlay = document.getElementById('start-overlay');
  const resultOverlay = document.getElementById('result-overlay');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const soundToggleIcon = document.getElementById('sound-toggle-icon');
  const soundToggleLabel = document.getElementById('sound-toggle-label');
  const obsToggleBtn = document.getElementById('obs-toggle-btn');
  const obsToggleLabel = document.getElementById('obs-toggle-label');
  const camToggleBtn = document.getElementById('cam-toggle-btn');
  const webcamVideo = document.getElementById('webcam-video');
  const avatarFallback = document.getElementById('avatar-fallback');
  const streamerState = document.getElementById('streamer-state');
  const supportOverlay = document.getElementById('support-overlay');
  const supportCloseBtn = document.getElementById('support-close-btn');
  const supportKicker = document.getElementById('support-kicker');
  const supportTitle = document.getElementById('support-title');
  const supportDescription = document.getElementById('support-description');
  const supportAction = document.getElementById('support-action');
  const supportButtons = document.querySelectorAll('[data-support]');
  const chatConnectOverlay = document.getElementById('chat-connect-overlay');
  const chatConnectOpenBtn = document.getElementById('chat-connect-open-btn');
  const homeChatConnectBtn = document.getElementById('home-chat-connect-btn');
  const chatConnectCloseBtn = document.getElementById('chat-connect-close-btn');
  const upgradeOverlay = document.getElementById('upgrade-overlay');
  const upgradeChoices = document.getElementById('upgrade-choices');
  let lastSupportButton = null;

  const readLocalSetting = (key) => {
    try { return localStorage.getItem(key) || ''; } catch { return ''; }
  };

  const saveLocalSetting = (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* storage may be unavailable */ }
  };

  // 후원 URL이 정해지면 donate.url 값만 교체하면 됩니다.
  const supportContents = {
    leaderboard: {
      kicker: 'HALL OF FAME',
      title: '명예의 전당',
      description: 'AI Troll Lab 도전자들의 실시간 TOP 10 기록입니다.',
      actionLabel: '',
      url: ''
    },
    feedback: {
      kicker: 'COMMUNITY',
      title: '건의사항',
      description: '버그 제보, 난이도 조정, 새로운 억까 기믹을 개발자에게 바로 보내주세요.',
      actionLabel: '',
      url: ''
    },
    donate: {
      kicker: 'SUPPORT',
      title: '후원하기',
      description: DONATION_URL
        ? 'AI Troll Lab의 새로운 스테이지와 방송용 기능 개발을 응원해 주세요.'
        : '후원 페이지 주소가 등록되면 이곳에서 바로 연결됩니다.',
      actionLabel: '후원 페이지 열기',
      url: DONATION_URL
    }
  };

  const closeSupportOverlay = () => {
    supportOverlay.classList.add('hidden');
    lastSupportButton?.focus();
  };

  const openSupportOverlay = async (type, trigger) => {
    const content = supportContents[type];
    if (!content) return;

    lastSupportButton = trigger;
    supportKicker.textContent = content.kicker;
    supportTitle.textContent = content.title;
    supportDescription.textContent = content.description;
    supportAction.textContent = content.actionLabel;
    supportAction.classList.toggle('hidden', !content.url);

    if (content.url) {
      supportAction.href = content.url;
    } else {
      supportAction.removeAttribute('href');
    }

    engine.player.clearInputs();
    supportOverlay.classList.remove('hidden');
    refreshAdfitSlot('ad-container-community', type);
    await community.render(type);
    supportCloseBtn.focus();
  };

  const updateLayoutScale = () => {
    const viewportWidth = window.visualViewport?.width || window.innerWidth;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const scale = Math.max(0.1, Math.min(
      viewportWidth / DESIGN_WIDTH,
      viewportHeight / DESIGN_HEIGHT
    ));

    document.documentElement.style.setProperty('--ui-scale', scale.toFixed(4));
    engine.resizeCanvas(scale);
  };

  const stopWebcam = () => {
    const stream = webcamVideo.srcObject;
    if (stream) stream.getTracks().forEach((track) => track.stop());
    webcamVideo.srcObject = null;
    webcamVideo.classList.add('hidden');
    avatarFallback.classList.remove('hidden');
    camToggleBtn.textContent = '웹캠 켜기';
    camToggleBtn.setAttribute('aria-pressed', 'false');
  };

  updateLayoutScale();
  window.addEventListener('resize', updateLayoutScale);
  window.visualViewport?.addEventListener('resize', updateLayoutScale);

  supportButtons.forEach((button) => {
    button.addEventListener('click', () => openSupportOverlay(button.dataset.support, button));
  });

  document.querySelectorAll('[data-platform-input]').forEach((input) => {
    input.value = readLocalSetting(`ai-troll-lab:${input.dataset.platformInput}:stream`);
  });

  let lastChatConnectButton = chatConnectOpenBtn;
  const closeChatConnectOverlay = () => {
    chatConnectOverlay.classList.add('hidden');
    lastChatConnectButton?.focus();
  };

  const openChatConnectOverlay = (trigger) => {
    lastChatConnectButton = trigger;
    chatConnectOverlay.classList.remove('hidden');
    chatConnectCloseBtn.focus();
  };
  chatConnectOpenBtn.addEventListener('click', () => openChatConnectOverlay(chatConnectOpenBtn));
  homeChatConnectBtn.addEventListener('click', () => openChatConnectOverlay(homeChatConnectBtn));
  chatConnectCloseBtn.addEventListener('click', closeChatConnectOverlay);
  chatConnectOverlay.addEventListener('click', (event) => {
    if (event.target === chatConnectOverlay) closeChatConnectOverlay();
  });

  document.querySelectorAll('[data-platform-connect]').forEach((button) => {
    button.addEventListener('click', async () => {
      const platform = button.dataset.platformConnect;
      const input = document.querySelector(`[data-platform-input="${platform}"]`);
      const streamValue = input.value.trim();
      saveLocalSetting(`ai-troll-lab:${platform}:stream`, streamValue);
      button.disabled = true;
      await platformChat.connect(platform, streamValue);
      button.disabled = false;
    });
  });

  document.querySelectorAll('[data-platform-disconnect]').forEach((button) => {
    button.addEventListener('click', () => platformChat.disconnect(button.dataset.platformDisconnect));
  });
  supportCloseBtn.addEventListener('click', closeSupportOverlay);
  supportOverlay.addEventListener('click', (event) => {
    if (event.target === supportOverlay) closeSupportOverlay();
  });
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Escape' && !supportOverlay.classList.contains('hidden')) {
      event.preventDefault();
      closeSupportOverlay();
    } else if (event.code === 'Escape' && !chatConnectOverlay.classList.contains('hidden')) {
      event.preventDefault();
      closeChatConnectOverlay();
    }
  });

  // Start Game
  startBtn.addEventListener('click', () => {
    audioEngine.init();
    startOverlay.classList.add('hidden');
    engine.start();
    community.resetResult();
    audienceVoting.start();
  });

  // Restart Game
  restartBtn.addEventListener('click', () => {
    resultOverlay.classList.add('hidden');
    engine.start();
    community.resetResult();
    audienceVoting.start();
  });

  window.addEventListener('upgrade-request', (event) => {
    upgradeChoices.replaceChildren();
    for (const choice of event.detail.choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'upgrade-option';

      const icon = document.createElement('span');
      icon.className = 'upgrade-icon';
      icon.textContent = choice.icon;
      const name = document.createElement('strong');
      name.textContent = choice.name;
      const description = document.createElement('span');
      description.textContent = choice.description;
      button.append(icon, name, description);
      button.addEventListener('click', () => engine.chooseUpgrade(choice.id));
      upgradeChoices.appendChild(button);
    }
    upgradeOverlay.classList.remove('hidden');
    upgradeChoices.querySelector('button')?.focus();
  });

  window.addEventListener('upgrade-selected', () => {
    upgradeOverlay.classList.add('hidden');
  });

  window.addEventListener('game-result', (event) => {
    community.setResult({
      ...event.detail,
      chatPlatform: platformChat.getConnectionType()
    });
  });

  // Sound Toggle
  soundToggleBtn.addEventListener('click', () => {
    audioEngine.enabled = !audioEngine.enabled;
    soundToggleIcon.textContent = audioEngine.enabled ? '🔊' : '🔇';
    soundToggleLabel.textContent = audioEngine.enabled ? '사운드 ON' : '사운드 OFF';
    soundToggleBtn.classList.toggle('active', audioEngine.enabled);
    soundToggleBtn.setAttribute('aria-pressed', String(audioEngine.enabled));
    soundToggleBtn.title = `사운드: ${audioEngine.enabled ? 'ON' : 'OFF'}`;
    soundToggleBtn.blur();
  });

  obsToggleBtn.addEventListener('click', () => {
    const enabled = document.body.classList.toggle('obs-overlay');
    engine.setObsMode(enabled);
    obsToggleLabel.textContent = enabled ? 'OBS ON' : 'OBS OFF';
    obsToggleBtn.classList.toggle('active', enabled);
    obsToggleBtn.setAttribute('aria-pressed', String(enabled));
    obsToggleBtn.title = `OBS 투명 모드: ${enabled ? 'ON' : 'OFF'}`;
    obsToggleBtn.blur();
  });

  // Webcam Toggle
  camToggleBtn.addEventListener('click', async () => {
    if (webcamVideo.classList.contains('hidden')) {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera API unavailable');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        webcamVideo.srcObject = stream;
        webcamVideo.classList.remove('hidden');
        avatarFallback.classList.add('hidden');
        camToggleBtn.textContent = '웹캠 끄기';
        camToggleBtn.setAttribute('aria-pressed', 'true');
      } catch (err) {
        stopWebcam();
        streamerState.textContent = '카메라 없이 아바타로 플레이 중';
        alert('웹캠 권한을 허용하지 않아도 게임을 플레이할 수 있습니다. 기본 아바타를 사용합니다.');
      }
    } else {
      stopWebcam();
    }
  });

  window.addEventListener('pagehide', () => {
    stopWebcam();
    audienceVoting.destroy();
    platformChat.disconnectAll();
  });
});
