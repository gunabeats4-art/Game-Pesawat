/**
 * Jet Customization & Hangar Upgrade Manager for Sky Raider: Elang Tempur
 * Tactical Meta-Progression Layer allowing players to spend accumulated XP to upgrade jet components:
 * 1. Engine & Thrusters (Speed, Afterburner Capacity & Recharge Rate)
 * 2. Armor & Aegis Shield Matrix (Max Hull HP & Shield Capacity)
 * 3. Weapons Systems (Starting Cannon Level, Damage Output, Extra Bombs)
 */

import { careerManager } from './career';

export type UpgradeComponentType = 'engine' | 'armor' | 'weapons';

export interface ComponentUpgradeSpec {
  type: UpgradeComponentType;
  name: string;
  codename: string;
  description: string;
  iconName: string;
  color: string;
}

export const UPGRADE_SPECS: Record<UpgradeComponentType, ComponentUpgradeSpec> = {
  engine: {
    type: 'engine',
    name: 'Engine & Afterburner',
    codename: 'ION-TURBO STACK',
    description: 'Increases flight top speed, afterburner boost capacity, and recharge speed.',
    iconName: 'zap',
    color: '#38bdf8', // Cyan
  },
  armor: {
    type: 'armor',
    name: 'Armored Hull & Aegis Shield',
    codename: 'TITANIUM AEGIS MATRIX',
    description: 'Reinforces fuselage structural integrity and boosts defensive shield max capacity.',
    iconName: 'shield',
    color: '#10b981', // Emerald
  },
  weapons: {
    type: 'weapons',
    name: 'Targeting & Ordnance Array',
    codename: 'PLASMA CANNON VULCAN',
    description: 'Upgrades baseline cannon level, increases projectile damage output, and adds bomb storage.',
    iconName: 'crosshair',
    color: '#f59e0b', // Amber
  },
};

export const UPGRADE_LEVEL_COSTS = [0, 500, 1200, 2500, 5000]; // Cost to reach level 2, 3, 4, 5

export interface UpgradeBonuses {
  speedPercentBonus: number;
  boostCapPercentBonus: number;
  boostRechargeMultiplier: number;
  hpBonus: number;
  shieldBonus: number;
  baseWeaponLevelBonus: number;
  damageMultiplierBonus: number;
  extraBombBonus: number;
}

const STORAGE_KEY = 'jet_upgrades_v1';

export class UpgradeManager {
  private levels: Record<UpgradeComponentType, number> = {
    engine: 1,
    armor: 1,
    weapons: 1,
  };

  constructor() {
    this.levels = this.load();
  }

  public load(): Record<UpgradeComponentType, number> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.engine === 'number') {
          return {
            engine: Math.max(1, Math.min(5, parsed.engine || 1)),
            armor: Math.max(1, Math.min(5, parsed.armor || 1)),
            weapons: Math.max(1, Math.min(5, parsed.weapons || 1)),
          };
        }
      }
    } catch {
      // Safe fallback
    }
    return { engine: 1, armor: 1, weapons: 1 };
  }

  public save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.levels));
    } catch {
      // Ignore error
    }
  }

  public getLevels(): Record<UpgradeComponentType, number> {
    return { ...this.levels };
  }

  public getUpgradeCost(type: UpgradeComponentType): number | null {
    const currentLvl = this.levels[type];
    if (currentLvl >= 5) return null; // Max level reached
    return UPGRADE_LEVEL_COSTS[currentLvl]; // Cost for next level
  }

  public canUpgrade(type: UpgradeComponentType, currentXp: number): boolean {
    const cost = this.getUpgradeCost(type);
    if (cost === null) return false;
    return currentXp >= cost;
  }

  public upgradeComponent(type: UpgradeComponentType): { success: boolean; newLevel: number; costPaid: number } {
    const currentLvl = this.levels[type];
    if (currentLvl >= 5) return { success: false, newLevel: currentLvl, costPaid: 0 };

    const cost = UPGRADE_LEVEL_COSTS[currentLvl];
    const currentXp = careerManager.getData().xp;

    if (currentXp < cost) {
      return { success: false, newLevel: currentLvl, costPaid: 0 };
    }

    // Spend XP from career pool
    careerManager.addXP(-cost);

    // Increment level
    this.levels[type] += 1;
    this.save();

    return { success: true, newLevel: this.levels[type], costPaid: cost };
  }

  public resetUpgrades(): { refundedXp: number } {
    let totalRefund = 0;

    // Calculate total XP spent
    (['engine', 'armor', 'weapons'] as UpgradeComponentType[]).forEach((type) => {
      const lvl = this.levels[type];
      for (let i = 1; i < lvl; i++) {
        totalRefund += UPGRADE_LEVEL_COSTS[i];
      }
      this.levels[type] = 1;
    });

    if (totalRefund > 0) {
      careerManager.addXP(totalRefund);
    }

    this.save();
    return { refundedXp: totalRefund };
  }

  public calculatePowerRating(): number {
    const basePower = 1000;
    const enginePower = (this.levels.engine - 1) * 250;
    const armorPower = (this.levels.armor - 1) * 250;
    const weaponsPower = (this.levels.weapons - 1) * 300;
    return basePower + enginePower + armorPower + weaponsPower;
  }

  public getCalculatedBonuses(): UpgradeBonuses {
    const engLvl = this.levels.engine;
    const armLvl = this.levels.armor;
    const wepLvl = this.levels.weapons;

    // Engine Bonuses
    const speedPercentBonus = (engLvl - 1) * 0.05; // 0%, 5%, 10%, 15%, 25%
    const boostCapPercentBonus = (engLvl - 1) * 0.15; // 0%, 15%, 30%, 45%, 60%
    const boostRechargeMultiplier = 1 + (engLvl - 1) * 0.25; // 1.0x to 2.0x

    // Armor Bonuses
    const hpBonus = (armLvl - 1) * 25; // 0, 25, 50, 75, 105
    const shieldBonus = (armLvl - 1) * 18; // 0, 18, 36, 54, 75

    // Weapons Bonuses
    let baseWeaponLevelBonus = 0;
    if (wepLvl >= 5) baseWeaponLevelBonus = 2;
    else if (wepLvl >= 3) baseWeaponLevelBonus = 1;

    const damageMultiplierBonus = (wepLvl - 1) * 0.12; // 0%, 12%, 24%, 36%, 50%
    const extraBombBonus = wepLvl >= 4 ? 1 : 0;

    return {
      speedPercentBonus,
      boostCapPercentBonus,
      boostRechargeMultiplier,
      hpBonus,
      shieldBonus,
      baseWeaponLevelBonus,
      damageMultiplierBonus,
      extraBombBonus,
    };
  }
}

export const upgradeManager = new UpgradeManager();
