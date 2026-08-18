import { CHAT_PROXY_URL } from './platformConfig.js';

const PLATFORM_LABELS = {
  soop: 'SOOP',
  chzzk: '치지직'
};

export class PlatformChatConnector {
  constructor({ onMessage = () => {}, onStatus = () => {} } = {}) {
    this.onMessage = onMessage;
    this.onStatus = onStatus;
    this.channels = new Map();
  }

  parseStreamTarget(platform, input) {
    const value = String(input || '').trim();
    if (!value) return '';

    try {
      if (platform === 'chzzk') {
        return value.match(/[0-9a-f]{32}/i)?.[0] || value;
      }

      if (platform === 'soop' && /sooplive|afreeca/i.test(value)) {
        const url = new URL(value.startsWith('http') ? value : `https://${value}`);
        return url.pathname.split('/').filter(Boolean)[0] || '';
      }

    } catch {
      return '';
    }

    return value;
  }

  async connect(platform, input) {
    if (!PLATFORM_LABELS[platform]) return false;
    const targetId = this.parseStreamTarget(platform, input);
    if (!targetId) {
      this.setStatus(platform, 'error', '방송 주소 또는 채널 ID를 확인해주세요.');
      return false;
    }

    this.disconnect(platform, false);
    const channel = {
      platform,
      targetId,
      active: true,
      ws: null,
      timer: null,
      connectedAt: Date.now(),
      skipFirstChatBatch: true
    };
    this.channels.set(platform, channel);
    this.setStatus(platform, 'connecting', '채팅 서버에 연결 중…');

    try {
      if (platform === 'soop') await this.connectSoop(channel);
      if (platform === 'chzzk') await this.connectChzzk(channel);
      return true;
    } catch (error) {
      if (channel.active) this.setStatus(platform, 'error', error.message || '연결에 실패했습니다.');
      return false;
    }
  }

  disconnect(platform, notify = true) {
    const channel = this.channels.get(platform);
    if (!channel) return;
    channel.active = false;
    if (channel.timer) window.clearTimeout(channel.timer);
    if (channel.ws) {
      channel.ws.onclose = null;
      channel.ws.close();
    }
    this.channels.delete(platform);
    if (notify) this.setStatus(platform, 'idle', '연결 안 됨');
  }

  disconnectAll() {
    [...this.channels.keys()].forEach((platform) => this.disconnect(platform));
  }

  setStatus(platform, status, message) {
    this.onStatus({ platform, status, message });
  }

  emitMessage(platform, userId, userName, message) {
    const text = String(message || '').trim();
    if (!text) return;
    this.onMessage({
      platform,
      userId: String(userId || userName || 'anonymous'),
      userName: String(userName || `${PLATFORM_LABELS[platform]} 시청자`),
      message: text
    });
  }

  proxyUrl(targetUrl) {
    return `${CHAT_PROXY_URL}/?url=${encodeURIComponent(targetUrl)}`;
  }

  async connectChzzk(channel) {
    const statusTarget = `https://api.chzzk.naver.com/polling/v2/channels/${encodeURIComponent(channel.targetId)}/live-status`;
    const statusResponse = await fetch(this.proxyUrl(statusTarget));
    if (!statusResponse.ok) throw new Error(`라이브 상태 조회 실패 (HTTP ${statusResponse.status})`);
    const statusData = await statusResponse.json();
    const live = statusData?.content;
    if (!live) throw new Error('치지직 채널 정보를 찾을 수 없습니다.');
    if (live.status && live.status !== 'OPEN') throw new Error('현재 방송 중인 치지직 채널이 아닙니다.');
    if (!live.chatChannelId) throw new Error('치지직 채팅방 ID를 찾을 수 없습니다.');

    const chatChannelId = live.chatChannelId;
    const tokenTarget = `https://comm-api.game.naver.com/nng_main/v1/chats/access-token?channelId=${encodeURIComponent(chatChannelId)}&chatType=STREAMING`;
    const tokenResponse = await fetch(this.proxyUrl(tokenTarget));
    if (!tokenResponse.ok) throw new Error(`접근 토큰 조회 실패 (HTTP ${tokenResponse.status})`);
    const tokenData = await tokenResponse.json();
    if (tokenData?.code === 42601) throw new Error('성인 인증 방송은 익명 채팅 연동이 불가능합니다.');
    const accessToken = tokenData?.content?.accessToken;
    if (!accessToken) throw new Error('치지직 접근 토큰을 받지 못했습니다.');

    const serverId = Math.abs([...chatChannelId].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 9 + 1;
    const socket = new WebSocket(`wss://kr-ss${serverId}.chat.naver.com/chat`);
    channel.ws = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({
        cid: chatChannelId,
        svcid: 'game',
        ver: '2',
        cmd: 100,
        tid: 1,
        bdy: { accTkn: accessToken, auth: 'READ', devType: 2001, uid: null }
      }));
    };

    socket.onmessage = (event) => {
      let packet;
      try { packet = JSON.parse(event.data); } catch { return; }

      if (packet.cmd === 10100) {
        channel.skipFirstChatBatch = true;
        this.setStatus('chzzk', 'connected', '실시간 채팅 연결됨');
        const ping = () => {
          if (!channel.active || socket.readyState !== WebSocket.OPEN) return;
          socket.send(JSON.stringify({ cmd: 0, ver: '2' }));
          channel.timer = window.setTimeout(ping, 20000);
        };
        channel.timer = window.setTimeout(ping, 20000);
        return;
      }

      if (packet.cmd === 0) {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ cmd: 10000, ver: '2' }));
        return;
      }

      if (packet.cmd !== 93101) return;
      const chats = Array.isArray(packet.bdy) ? packet.bdy : (packet.bdy?.messageList || []);
      if (channel.skipFirstChatBatch) {
        channel.skipFirstChatBatch = false;
        return;
      }

      chats.forEach((chat) => {
        if ((chat.msgTypeCode || chat.messageTypeCode) !== 1) return;
        let profile = {};
        try { profile = JSON.parse(chat.profile || '{}'); } catch { /* empty profile */ }
        this.emitMessage('chzzk', chat.uid || profile.userIdHash || profile.nickname, profile.nickname, chat.msg || chat.content);
      });
    };

    socket.onerror = () => this.setStatus('chzzk', 'error', '치지직 WebSocket 오류');
    socket.onclose = () => {
      if (channel.active) this.setStatus('chzzk', 'disconnected', '연결 종료됨 · 다시 연결해주세요.');
    };
  }

  async connectSoop(channel) {
    const bjId = channel.targetId.trim().toLowerCase();
    const requestBody = `bid=${encodeURIComponent(bjId)}&type=live&player_type=html5&mode=landing&from_api=0&pwd=&stream_type=common&quality=HD`;
    let info = null;
    let lastError = '';

    for (const host of ['live.sooplive.co.kr', 'live.sooplive.com']) {
      try {
        const target = `https://${host}/afreeca/player_live_api.php?bjid=${encodeURIComponent(bjId)}`;
        const response = await fetch(this.proxyUrl(target), {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: requestBody
        });
        if (!response.ok) {
          lastError = `HTTP ${response.status}`;
          continue;
        }
        info = await response.json();
        break;
      } catch (error) {
        lastError = error.message;
      }
    }

    if (!info) throw new Error(`SOOP 방송 정보 조회 실패 (${lastError})`);
    const details = info.CHANNEL || {};
    if (details.RESULT !== undefined && Number(details.RESULT) !== 1) {
      throw new Error('현재 방송 중이 아니거나 입장할 수 없는 방송입니다.');
    }

    const chatNumber = details.CHATNO || details.BNO;
    const chatDomain = String(details.CHDOMAIN || '').toLowerCase();
    const chatPort = Number.parseInt(details.CHPT, 10);
    if (!chatNumber || !chatDomain || !chatPort) throw new Error('SOOP 채팅 서버 정보가 불완전합니다.');

    const socket = new WebSocket(`wss://${chatDomain}:${chatPort + 1}/Websocket/${bjId}`, ['chat']);
    socket.binaryType = 'arraybuffer';
    channel.ws = socket;

    socket.onopen = () => socket.send(this.soopPacket(1, `${this.SOOP_SEPARATOR.repeat(3)}16${this.SOOP_SEPARATOR}`));
    socket.onmessage = (event) => {
      const text = this.decodeSoopPacket(event.data);
      if (!text) return;
      const service = this.soopServiceCode(text);

      if (service === 1) {
        socket.send(this.soopPacket(2, `${this.SOOP_SEPARATOR}${chatNumber}${this.SOOP_SEPARATOR.repeat(5)}`));
        this.setStatus('soop', 'connected', '실시간 채팅 연결됨');
        const ping = () => {
          if (!channel.active || socket.readyState !== WebSocket.OPEN) return;
          socket.send(this.soopPacket(0, this.SOOP_SEPARATOR));
          channel.timer = window.setTimeout(ping, 60000);
        };
        channel.timer = window.setTimeout(ping, 60000);
      } else if (service === 5) {
        const chat = this.parseSoopChat(text);
        this.emitMessage('soop', chat.nickname, chat.nickname, chat.message);
      }
    };

    socket.onerror = () => this.setStatus('soop', 'error', 'SOOP WebSocket 오류');
    socket.onclose = () => {
      if (channel.active) this.setStatus('soop', 'disconnected', '연결 종료됨 · 다시 연결해주세요.');
    };
  }

  get SOOP_ESCAPE() { return '\x1b\t'; }
  get SOOP_SEPARATOR() { return '\x0c'; }

  soopPacket(service, body = '') {
    const length = new TextEncoder().encode(body).length;
    return this.SOOP_ESCAPE
      + String(service).padStart(4, '0')
      + String(length).padStart(6, '0')
      + '00'
      + body;
  }

  decodeSoopPacket(data) {
    if (typeof data === 'string') return data;
    if (data instanceof ArrayBuffer) return new TextDecoder('utf-8').decode(new Uint8Array(data));
    return '';
  }

  soopServiceCode(text) {
    const value = text.slice(this.SOOP_ESCAPE.length, this.SOOP_ESCAPE.length + 4);
    const service = Number.parseInt(value, 10);
    return Number.isNaN(service) ? -1 : service;
  }

  parseSoopChat(text) {
    const headerLength = this.SOOP_ESCAPE.length + 4 + 6 + 2;
    const parts = text.slice(headerLength).split(this.SOOP_SEPARATOR);
    const message = String(parts[1] || '').trim();
    const nickname = [parts[6], parts[7], parts[5], parts[2]]
      .map((value) => String(value || '').trim())
      .find((value) => value && value !== message) || 'SOOP시청자';
    return { nickname, message };
  }
}
