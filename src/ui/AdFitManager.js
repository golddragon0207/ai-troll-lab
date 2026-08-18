import { ADFIT_UNITS } from '../config/runtimeConfig.js';

const SLOT_LABELS = Object.freeze({
  leaderboard: '명예의 전당',
  donate: '후원하기',
  feedback: '건의사항'
});

const ADFIT_SCRIPT_URL = 'https://t1.kakaocdn.net/kas/static/ba.min.js';

function renderPlaceholder(container, type) {
  const placeholder = document.createElement('div');
  placeholder.className = 'adfit-placeholder';

  const badge = document.createElement('span');
  badge.className = 'adfit-placeholder-badge';
  badge.textContent = 'AD';

  const copy = document.createElement('span');
  copy.className = 'adfit-placeholder-copy';

  const title = document.createElement('strong');
  title.textContent = '카카오 애드핏 728 × 90';

  const description = document.createElement('small');
  description.textContent = `${SLOT_LABELS[type] || '커뮤니티'} 팝업 광고 자리 · 광고 단위 발급 후 자동 연결`;

  copy.append(title, description);
  placeholder.append(badge, copy);
  container.replaceChildren(placeholder);
}

export function refreshAdfitSlot(containerId, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const unitId = ADFIT_UNITS[type];
  container.dataset.adSlot = type;

  if (!unitId) {
    renderPlaceholder(container, type);
    return;
  }

  const ad = document.createElement('ins');
  ad.className = 'kakao_ad_area';
  ad.style.display = 'none';
  ad.dataset.adUnit = unitId;
  ad.dataset.adWidth = '728';
  ad.dataset.adHeight = '90';
  ad.setAttribute('aria-label', `${SLOT_LABELS[type] || '커뮤니티'} 광고`);

  const script = document.createElement('script');
  script.async = true;
  script.src = ADFIT_SCRIPT_URL;
  script.onerror = () => renderPlaceholder(container, type);
  container.replaceChildren(ad, script);
}
