export const CHAT_PROXY_URL = 'https://ai-troll-lab-chat-proxy.skkim867.workers.dev';
export const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

export const PLATFORM_CONFIG = Object.freeze({
  soop: Object.freeze({
    label: 'SOOP',
    proxyUrl: CHAT_PROXY_URL
  }),
  chzzk: Object.freeze({
    label: '치지직',
    proxyUrl: CHAT_PROXY_URL
  }),
  youtube: Object.freeze({
    label: 'YouTube',
    proxyUrl: '',
    apiKey: YOUTUBE_API_KEY
  })
});
