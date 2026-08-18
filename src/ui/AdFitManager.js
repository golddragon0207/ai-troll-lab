const KAKAO_ADFIT = {
  leaderboard: 'DAN-4f2Zy9rvtpYIdFwz',
  donate: 'DAN-7HAZgjuUDNHfPgph',
  feedback: 'DAN-0yaoDJ8fNLA4tD92',
  width: '728',
  height: '90'
};

export function refreshAdfitSlot(containerId, type) {
  const container = document.getElementById(containerId);
  const adUnitId = KAKAO_ADFIT[type];
  if (!container || !adUnitId) return;

  try {
    container.replaceChildren();

    const adArea = document.createElement('ins');
    adArea.className = 'kakao_ad_area';
    adArea.style.display = 'none';
    adArea.setAttribute('data-ad-unit', adUnitId);
    adArea.setAttribute('data-ad-width', KAKAO_ADFIT.width);
    adArea.setAttribute('data-ad-height', KAKAO_ADFIT.height);

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://t1.daumcdn.net/kas/static/ba.min.js';

    container.append(adArea, script);
  } catch (error) {
    console.warn(`[AdFit] ${type} 광고를 불러오지 못했습니다.`, error);
  }
}
