const STAGE_BALANCE = Object.freeze({
  telegraphStart: 0.44,
  telegraphStep: 0.022,
  telegraphMin: 0.22,
  radiusStart: 145,
  radiusStep: 5,
  radiusMax: 190,
  overheatStart: 2.5,
  overheatStep: 0.09,
  overheatMin: 1.6,
  damageMultiplier: 1.15
});

export function getStageBalance(stageNum = 1) {
  const stage = Math.min(10, Math.max(1, Number(stageNum) || 1));
  const offset = stage - 1;

  return {
    telegraphDuration: Math.max(STAGE_BALANCE.telegraphMin, STAGE_BALANCE.telegraphStart - offset * STAGE_BALANCE.telegraphStep),
    attackRadius: Math.min(STAGE_BALANCE.radiusMax, STAGE_BALANCE.radiusStart + offset * STAGE_BALANCE.radiusStep),
    overheatDuration: Math.max(STAGE_BALANCE.overheatMin, STAGE_BALANCE.overheatStart - offset * STAGE_BALANCE.overheatStep),
    damageMultiplier: STAGE_BALANCE.damageMultiplier
  };
}

export function calculateScore({
  stage = 1,
  dashes = 0,
  overheats = 0,
  result = 'gameover',
  playTimeSec = 1,
  bonusScore = 0
} = {}) {
  const cleared = result === 'clear';
  const clearBonus = cleared ? 50000 : 0;
  const speedBonus = cleared ? Math.max(0, 20000 - playTimeSec * 30) : 0;
  const baseScore = stage * 10000 + dashes * 800 + overheats * 1200 + clearBonus + speedBonus
    + Math.max(0, Number(bonusScore) || 0);
  return Math.min(999999, Math.max(0, Math.round(baseScore)));
}
