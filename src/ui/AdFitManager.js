const SLOT_LABELS = Object.freeze({
  leaderboard: '명예의 전당',
  donate: '후원하기',
  feedback: '건의사항'
});

// 애드핏 광고 단위를 발급받기 전까지 실제 광고 요청 없이 자리만 표시한다.
// 추후 data-ad-unit을 연결할 때도 호출부와 컨테이너는 그대로 사용할 수 있다.
export function refreshAdfitSlot(containerId, type) {
  const container = document.getElementById(containerId);
  if (!container) return;

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
  description.textContent = `${SLOT_LABELS[type] || '커뮤니티'} 팝업 광고 자리 · 광고 단위 발급 후 연결`;

  copy.append(title, description);
  placeholder.append(badge, copy);
  container.dataset.adSlot = type;
  container.replaceChildren(placeholder);
}
