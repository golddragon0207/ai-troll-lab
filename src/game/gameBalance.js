export const DIFFICULTY_PROFILES = Object.freeze({
  challenge: Object.freeze({
    label: '방송용 도전',
    telegraphStart: 0.44,
    telegraphStep: 0.022,
    telegraphMin: 0.22,
    radiusStart: 145,
    radiusStep: 5,
    radiusMax: 190,
    overheatStart: 2.5,
    overheatStep: 0.09,
    overheatMin: 1.6,
    damageMultiplier: 1.15,
    scoreMultiplier: 1
  }),
  nightmare: Object.freeze({
    label: '지옥 방송',
    telegraphStart: 0.34,
    telegraphStep: 0.02,
    telegraphMin: 0.16,
    radiusStart: 165,
    radiusStep: 5,
    radiusMax: 210,
    overheatStart: 2,
    overheatStep: 0.09,
    overheatMin: 1.2,
    damageMultiplier: 1.4,
    scoreMultiplier: 1.25
  })
});

export function normalizeDifficulty(value) {
  return Object.hasOwn(DIFFICULTY_PROFILES, value) ? value : 'challenge';
}

export function getDifficultyBalance(stageNum = 1, difficulty = 'challenge') {
  const mode = normalizeDifficulty(difficulty);
  const profile = DIFFICULTY_PROFILES[mode];
  const stage = Math.min(10, Math.max(1, Number(stageNum) || 1));
  const offset = stage - 1;

  return {
    mode,
    label: profile.label,
    telegraphDuration: Math.max(profile.telegraphMin, profile.telegraphStart - offset * profile.telegraphStep),
    attackRadius: Math.min(profile.radiusMax, profile.radiusStart + offset * profile.radiusStep),
    overheatDuration: Math.max(profile.overheatMin, profile.overheatStart - offset * profile.overheatStep),
    damageMultiplier: profile.damageMultiplier,
    scoreMultiplier: profile.scoreMultiplier
  };
}

export function calculateScore({
  stage = 1,
  dashes = 0,
  overheats = 0,
  result = 'gameover',
  playTimeSec = 1,
  difficulty = 'challenge'
} = {}) {
  const cleared = result === 'clear';
  const clearBonus = cleared ? 50000 : 0;
  const speedBonus = cleared ? Math.max(0, 20000 - playTimeSec * 30) : 0;
  const baseScore = stage * 10000 + dashes * 800 + overheats * 1200 + clearBonus + speedBonus;
  const { scoreMultiplier } = getDifficultyBalance(stage, difficulty);
  return Math.min(999999, Math.max(0, Math.round(baseScore * scoreMultiplier)));
}
