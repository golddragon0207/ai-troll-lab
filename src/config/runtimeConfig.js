const readEnv = (name) => String(import.meta.env[name] || '').trim();

export const DONATION_URL = readEnv('VITE_DONATION_URL');

export const ADFIT_UNITS = Object.freeze({
  leaderboard: readEnv('VITE_ADFIT_LEADERBOARD_UNIT'),
  donate: readEnv('VITE_ADFIT_DONATE_UNIT'),
  feedback: readEnv('VITE_ADFIT_FEEDBACK_UNIT')
});
