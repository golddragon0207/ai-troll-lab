import { Engine } from './game/Engine.js';
import { BroadcastHUD } from './ui/BroadcastHUD.js';
import { AudioEngine } from './ui/AudioEngine.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const audioEngine = new AudioEngine();
  const hud = new BroadcastHUD(audioEngine);
  const engine = new Engine(canvas, hud, audioEngine);

  // Buttons
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const startOverlay = document.getElementById('start-overlay');
  const resultOverlay = document.getElementById('result-overlay');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const camToggleBtn = document.getElementById('cam-toggle-btn');
  const webcamVideo = document.getElementById('webcam-video');
  const avatarFallback = document.getElementById('avatar-fallback');

  // Start Game
  startBtn.addEventListener('click', () => {
    audioEngine.init();
    startOverlay.classList.add('hidden');
    engine.start();
  });

  // Restart Game
  restartBtn.addEventListener('click', () => {
    resultOverlay.classList.add('hidden');
    engine.start();
  });

  // Sound Toggle
  soundToggleBtn.addEventListener('click', () => {
    audioEngine.enabled = !audioEngine.enabled;
    soundToggleBtn.textContent = audioEngine.enabled ? '🔊' : '🔇';
  });

  // Webcam Toggle
  camToggleBtn.addEventListener('click', async () => {
    if (webcamVideo.classList.contains('hidden')) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        webcamVideo.srcObject = stream;
        webcamVideo.classList.remove('hidden');
        avatarFallback.classList.add('hidden');
        camToggleBtn.textContent = '웹캠 끄기';
      } catch (err) {
        alert('웹캠 접근 권한을 확인해주세요. (카메라 연결 불필요시 가상 캐릭터 아바타가 사용됩니다)');
      }
    } else {
      if (webcamVideo.srcObject) {
        webcamVideo.srcObject.getTracks().forEach(track => track.stop());
      }
      webcamVideo.classList.add('hidden');
      avatarFallback.classList.remove('hidden');
      camToggleBtn.textContent = '웹캠 켜기';
    }
  });
});
