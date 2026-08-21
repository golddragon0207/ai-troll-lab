const readEnv = (name, fallback = '') => String(import.meta.env[name] || fallback).trim();

// AdFit 광고 단위 ID는 공개 게재 코드에 포함되는 값이므로 기본 배포값으로 관리한다.
// Repository Variable을 설정하면 운영 중 코드 변경 없이 단위를 교체할 수 있다.
const DEFAULT_ADFIT_UNITS = Object.freeze({
  leaderboard: 'DAN-Isto9uUsYY8KZ8q8',
  donate: 'DAN-ZFgrtbk4sudhOKTm',
  feedback: 'DAN-x4XfvAveyqgH7a61'
});

export const DONATION_URL = readEnv('VITE_DONATION_URL');

export const ADFIT_UNITS = Object.freeze({
  leaderboard: readEnv('VITE_ADFIT_LEADERBOARD_UNIT', DEFAULT_ADFIT_UNITS.leaderboard),
  donate: readEnv('VITE_ADFIT_DONATE_UNIT', DEFAULT_ADFIT_UNITS.donate),
  feedback: readEnv('VITE_ADFIT_FEEDBACK_UNIT', DEFAULT_ADFIT_UNITS.feedback)
});
