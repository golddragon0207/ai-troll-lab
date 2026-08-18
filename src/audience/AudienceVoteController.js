import { CHAT_PROXY_URL } from './platformConfig.js';

const VOTE_OPTIONS = [
  { command: '!회복', effect: 'heal', label: '멘탈 +15', tone: 'help' },
  { command: '!과열', effect: 'overheat', label: 'AI 과열 +40', tone: 'help' },
  { command: '!워프', effect: 'warp', label: '골인 큐브 워프', tone: 'troll' },
  { command: '!충격', effect: 'shock', label: '멘탈 -10', tone: 'troll' }
];

const PLATFORM_LABELS = {
  soop: 'SOOP',
  chzzk: '치지직',
  test: 'TEST'
};

export class AudienceVoteController {
  constructor(engine, hud, { roundDuration = 20 } = {}) {
    this.engine = engine;
    this.hud = hud;
    this.roundDuration = roundDuration;
    this.remaining = roundDuration;
    this.active = false;
    this.voters = new Map();
    this.votes = new Map(VOTE_OPTIONS.map(({ effect }) => [effect, 0]));
    this.timerId = null;
    this.relay = null;
    this.reconnectId = null;

    this.statusEl = document.getElementById('audience-status');
    this.timerEl = document.getElementById('vote-timer');
    this.totalEl = document.getElementById('vote-total');
    this.optionEls = new Map(
      [...document.querySelectorAll('[data-vote-option]')]
        .map((element) => [element.dataset.voteOption, element])
    );
    this.testForm = document.getElementById('audience-test-form');
    this.testPlatform = document.getElementById('audience-test-platform');
    this.testInput = document.getElementById('audience-test-input');

    this.onAudienceChat = (event) => this.receiveMessage(event.detail);
    window.addEventListener('audience-chat', this.onAudienceChat);
    this.testForm?.addEventListener('submit', (event) => this.submitTestVote(event));

    this.connectRelayFromQuery();
    this.render();
  }

  start() {
    this.active = true;
    this.resetRound();
    if (!this.timerId) {
      this.timerId = window.setInterval(() => this.tick(), 1000);
    }
    this.setStatus(
      this.relay?.readyState === WebSocket.OPEN
        ? 'SOOP·치지직 릴레이 연결됨'
        : CHAT_PROXY_URL
          ? 'SOOP·치지직 프록시 준비됨 · 테스트 모드'
          : '로컬 테스트 모드'
    );
  }

  stop() {
    this.active = false;
    this.setStatus('게임 시작 대기 중');
    this.render();
  }

  destroy() {
    window.removeEventListener('audience-chat', this.onAudienceChat);
    if (this.timerId) window.clearInterval(this.timerId);
    if (this.reconnectId) window.clearTimeout(this.reconnectId);
    this.relay?.close();
  }

  tick() {
    if (!this.active || !this.engine.isRunning) {
      if (this.active && !this.engine.isRunning) this.stop();
      return;
    }

    this.remaining -= 1;
    if (this.remaining <= 0) this.finishRound();
    this.render();
  }

  receiveMessage(detail = {}) {
    const message = String(detail.message || '').trim().slice(0, 160);
    if (!message) return false;

    const platform = String(detail.platform || 'test').toLowerCase();
    const userName = String(detail.userName || '익명 시청자').slice(0, 30);
    const userId = String(detail.userId || userName).slice(0, 80);
    const option = this.findOption(message);

    this.hud.addChatMessage(message, option ? 'highlight' : '', {
      name: userName,
      badge: `badge-${platform}`,
      badgeLabel: PLATFORM_LABELS[platform] || platform.toUpperCase()
    });

    if (!this.active || !this.engine.isRunning || !option) return false;

    const voterKey = `${platform}:${userId}`;
    const previousEffect = this.voters.get(voterKey);
    if (previousEffect === option.effect) return false;

    if (previousEffect) {
      this.votes.set(previousEffect, Math.max(0, this.votes.get(previousEffect) - 1));
    }

    this.voters.set(voterKey, option.effect);
    this.votes.set(option.effect, this.votes.get(option.effect) + 1);
    this.render();
    return true;
  }

  findOption(message) {
    const normalized = message.replace(/\s+/g, ' ');
    return VOTE_OPTIONS.find(({ command }) => (
      new RegExp(`(^|\\s)${command}(?=\\s|$)`, 'i').test(normalized)
    ));
  }

  finishRound() {
    const highest = Math.max(...this.votes.values());
    if (highest > 0) {
      const winners = VOTE_OPTIONS.filter(({ effect }) => this.votes.get(effect) === highest);
      const winner = winners[Math.floor(Math.random() * winners.length)];
      this.engine.applyAudienceEffect(winner.effect);
      this.hud.addChatMessage(
        `투표 종료: ${winner.command} (${highest}표) 효과 발동!`,
        winner.tone === 'help' ? 'highlight' : 'laugh',
        { name: '시청자 투표봇', badge: 'badge-system', badgeLabel: 'VOTE' }
      );
    } else {
      this.hud.addChatMessage('이번 라운드는 투표가 없어 넘어갑니다.', '', {
        name: '시청자 투표봇', badge: 'badge-system', badgeLabel: 'VOTE'
      });
    }
    this.resetRound();
  }

  resetRound() {
    this.remaining = this.roundDuration;
    this.voters.clear();
    this.votes.forEach((_, effect) => this.votes.set(effect, 0));
    this.render();
  }

  render() {
    const total = [...this.votes.values()].reduce((sum, count) => sum + count, 0);
    if (this.timerEl) this.timerEl.textContent = `${this.remaining}s`;
    if (this.totalEl) this.totalEl.textContent = `${total}명 참여`;

    VOTE_OPTIONS.forEach(({ effect }) => {
      const optionEl = this.optionEls.get(effect);
      if (!optionEl) return;
      const count = this.votes.get(effect);
      const percentage = total ? Math.round((count / total) * 100) : 0;
      optionEl.querySelector('.vote-count').textContent = `${count}`;
      optionEl.querySelector('.vote-fill').style.width = `${percentage}%`;
      optionEl.setAttribute('aria-label', `${effect} ${count}표, ${percentage}%`);
    });
  }

  submitTestVote(event) {
    event.preventDefault();
    const message = this.testInput?.value.trim();
    if (!message) return;
    const id = Math.random().toString(36).slice(2, 9);
    this.receiveMessage({
      platform: this.testPlatform?.value || 'test',
      userId: `local-${id}`,
      userName: `테스트시청자_${id.slice(0, 3)}`,
      message
    });
    this.testInput.value = '';
    this.testInput.focus();
  }

  setStatus(text) {
    if (this.statusEl) this.statusEl.textContent = text;
  }

  connectRelayFromQuery() {
    const relayUrl = new URLSearchParams(window.location.search).get('chatRelay');
    if (!relayUrl || !/^wss?:\/\//i.test(relayUrl)) return;

    try {
      this.relay = new WebSocket(relayUrl);
      this.setStatus('채팅 릴레이 연결 중…');
      this.relay.addEventListener('open', () => this.setStatus('SOOP·치지직 릴레이 연결됨'));
      this.relay.addEventListener('message', (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.receiveMessage(payload);
        } catch {
          // Malformed relay messages are ignored so one bad payload cannot stop voting.
        }
      });
      this.relay.addEventListener('close', () => {
        this.relay = null;
        this.setStatus('릴레이 끊김 · 로컬 테스트 가능');
      });
      this.relay.addEventListener('error', () => this.setStatus('릴레이 연결 실패 · 로컬 테스트 모드'));
    } catch {
      this.setStatus('잘못된 릴레이 주소 · 로컬 테스트 모드');
    }
  }
}
