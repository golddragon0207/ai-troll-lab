export const UPGRADE_POOL = Object.freeze([
  Object.freeze({ id: 'turbo-dash', icon: '⚡', name: '터보 대시', description: '대시 재사용 시간 25% 감소' }),
  Object.freeze({ id: 'wide-parry', icon: '🛡️', name: '와이드 패링', description: '패링 판정 시간 +0.12초' }),
  Object.freeze({ id: 'mental-armor', icon: '🧠', name: '멘탈 아머', description: '최대 멘탈 +25, 즉시 회복' }),
  Object.freeze({ id: 'combo-drive', icon: '🔥', name: '콤보 드라이브', description: '콤보 유지 시간 +1.5초' }),
  Object.freeze({ id: 'core-magnet', icon: '🧲', name: '코어 매그넷', description: '코어 획득 범위 +20px' })
]);

export class RunProgression {
  constructor() {
    this.reset();
  }

  reset() {
    this.stage = 1;
    this.coresCollected = 0;
    this.coresTotal = 3;
    this.combo = 0;
    this.bestCombo = 0;
    this.comboTimer = 0;
    this.comboWindow = 5;
    this.bonusScore = 0;
    this.totalCores = 0;
    this.bossShield = 0;
    this.bossShieldMax = 0;
    this.corePickupPadding = 6;
    this.upgrades = [];
  }

  beginStage(stage, coreCount = 3) {
    this.stage = stage;
    this.coresCollected = 0;
    this.coresTotal = coreCount;
    this.comboTimer = this.combo > 0 ? this.comboWindow : 0;
    this.bossShieldMax = stage === 10 ? 4 : stage === 5 ? 2 : 0;
    this.bossShield = this.bossShieldMax;
  }

  update(dt) {
    if (this.combo <= 0) return false;
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer > 0) return false;
    this.combo = 0;
    return true;
  }

  addCombo(basePoints = 0) {
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.comboTimer = this.comboWindow;
    const earned = Math.round(basePoints * this.multiplier);
    this.bonusScore += earned;
    return earned;
  }

  collectCore() {
    this.coresCollected += 1;
    this.totalCores += 1;
    return this.addCombo(450 + this.stage * 50);
  }

  defend() {
    const earned = this.addCombo(300 + this.stage * 40);
    const shieldBroken = this.bossShield > 0;
    if (shieldBroken) this.bossShield -= 1;
    return { earned, shieldBroken, bossDefeated: shieldBroken && this.bossShield === 0 };
  }

  breakCombo() {
    const lost = this.combo;
    this.combo = 0;
    this.comboTimer = 0;
    return lost;
  }

  get multiplier() {
    return 1 + Math.min(2.5, Math.max(0, this.combo - 1) * 0.25);
  }

  get goalUnlocked() {
    return this.coresCollected >= this.coresTotal && this.bossShield <= 0;
  }

  applyUpgrade(id, player, engine) {
    if (!UPGRADE_POOL.some((upgrade) => upgrade.id === id)) return false;
    this.upgrades.push(id);
    if (id === 'turbo-dash') player.maxDashCooldown = Math.max(0.45, player.maxDashCooldown * 0.75);
    if (id === 'wide-parry') player.parryDuration = Math.min(0.7, player.parryDuration + 0.12);
    if (id === 'mental-armor') {
      engine.mentalHpMax += 25;
      engine.mentalHp = Math.min(engine.mentalHpMax, engine.mentalHp + 35);
    }
    if (id === 'combo-drive') this.comboWindow += 1.5;
    if (id === 'core-magnet') this.corePickupPadding += 20;
    return true;
  }
}
