import { DailyMission, MissionObjectiveType, MissionRewardType } from './types';

const STORAGE_KEY = 'sky_raider_daily_missions_v1';

export interface MissionPoolItem {
  id: string;
  title: string;
  codename: string;
  description: string;
  type: MissionObjectiveType;
  target: number;
  rewardType: MissionRewardType;
  rewardLabel: string;
  rewardValue: number;
  rewardIcon: string;
}

export const MISSION_POOL: MissionPoolItem[] = [
  {
    id: 'm_intercept_30',
    title: 'Interception Sweep',
    codename: 'OPERATION COLD SKY',
    description: 'Shoot down 30 enemy aircraft in combat operations.',
    type: 'kill_enemies',
    target: 30,
    rewardType: 'score_multiplier',
    rewardLabel: '+50% Score Multiplier',
    rewardValue: 0.5,
    rewardIcon: 'award',
  },
  {
    id: 'm_combo_8',
    title: 'Precision Ace',
    codename: 'RAPID STRIKE',
    description: 'Chain together a x8 combat combo without breaking streak.',
    type: 'reach_combo',
    target: 8,
    rewardType: 'shield_overcharge',
    rewardLabel: 'Hyper Shield (+50 Max Shield)',
    rewardValue: 50,
    rewardIcon: 'shield',
  },
  {
    id: 'm_boss_1',
    title: 'Flagship Neutralizer',
    codename: 'TITAN SLAYER',
    description: 'Neutralize 1 Capital Dreadnought flagship.',
    type: 'kill_bosses',
    target: 1,
    rewardType: 'hyper_cannons',
    rewardLabel: 'Weapon Level Supercharge (+1 Cannon LVL)',
    rewardValue: 1,
    rewardIcon: 'zap',
  },
  {
    id: 'm_bombs_2',
    title: 'Heavy Ordnance',
    codename: 'BLAST ZONE',
    description: 'Deploy 2 Tactical Overdrive Bombs during sorties.',
    type: 'use_bombs',
    target: 2,
    rewardType: 'instant_bomb',
    rewardLabel: '+1 Tactical Overdrive Bomb',
    rewardValue: 1,
    rewardIcon: 'bomb',
  },
  {
    id: 'm_sector_3',
    title: 'Deep Penetration',
    codename: 'SECTOR BREAKTHROUGH',
    description: 'Reach and secure Sector 3 airspace.',
    type: 'reach_sector',
    target: 3,
    rewardType: 'score_multiplier',
    rewardLabel: '+50% Score Multiplier',
    rewardValue: 0.5,
    rewardIcon: 'award',
  },
  {
    id: 'm_powerups_5',
    title: 'Field Logistics',
    codename: 'SUPPLY AIRDROP',
    description: 'Salvage 5 battlefield power-up canisters.',
    type: 'collect_powerups',
    target: 5,
    rewardType: 'score_multiplier',
    rewardLabel: '+25% Score Multiplier',
    rewardValue: 0.25,
    rewardIcon: 'award',
  },
];

/**
 * Returns a simple string date in YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Generates deterministic 3 daily missions based on date seed
 */
export function generateDailyMissions(dateStr: string): DailyMission[] {
  // Simple deterministic hash from date
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }

  const pool = [...MISSION_POOL];
  const selected: DailyMission[] = [];

  for (let i = 0; i < 3; i++) {
    const idx = (hash + i * 7) % pool.length;
    const item = pool.splice(idx, 1)[0];
    selected.push({
      ...item,
      progress: 0,
      completed: false,
      claimed: false,
    });
  }

  return selected;
}

export class MissionManager {
  private missions: DailyMission[] = [];
  private currentDate: string = '';

  constructor() {
    this.loadMissions();
  }

  public loadMissions(): DailyMission[] {
    const today = getTodayDateString();
    this.currentDate = today;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === today && Array.isArray(parsed.missions) && parsed.missions.length > 0) {
          this.missions = parsed.missions;
          return this.missions;
        }
      }
    } catch {
      // Ignore parse errors
    }

    // New day or first time: generate today's missions
    this.missions = generateDailyMissions(today);
    this.saveMissions();
    return this.missions;
  }

  public saveMissions() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          date: this.currentDate,
          missions: this.missions,
        })
      );
    } catch {
      // Storage quota or disabled ignore
    }
  }

  public getMissions(): DailyMission[] {
    // Check if day changed
    const today = getTodayDateString();
    if (this.currentDate !== today) {
      this.loadMissions();
    }
    return this.missions;
  }

  /**
   * Updates progress for matching missions and returns any newly completed missions
   */
  public reportProgress(
    type: MissionObjectiveType,
    amount: number,
    mode: 'add' | 'set' = 'add'
  ): DailyMission[] {
    const newlyCompleted: DailyMission[] = [];

    this.missions.forEach((m) => {
      if (m.type === type && !m.completed) {
        if (mode === 'add') {
          m.progress = Math.min(m.target, m.progress + amount);
        } else {
          m.progress = Math.min(m.target, Math.max(m.progress, amount));
        }

        if (m.progress >= m.target) {
          m.completed = true;
          newlyCompleted.push(m);
        }
      }
    });

    if (newlyCompleted.length > 0) {
      this.saveMissions();
    }

    return newlyCompleted;
  }

  /**
   * Calculates the cumulative bonus score multiplier from completed missions
   */
  public getTotalScoreMultiplierBonus(): number {
    let bonus = 0;
    this.missions.forEach((m) => {
      if (m.completed && m.rewardType === 'score_multiplier') {
        bonus += m.rewardValue;
      }
    });
    return bonus;
  }

  /**
   * Checks if shield overcharge is unlocked
   */
  public getShieldOverchargeBonus(): number {
    let bonus = 0;
    this.missions.forEach((m) => {
      if (m.completed && m.rewardType === 'shield_overcharge') {
        bonus += m.rewardValue;
      }
    });
    return bonus;
  }

  /**
   * Checks if extra starting bomb is unlocked
   */
  public getExtraBombBonus(): number {
    let bonus = 0;
    this.missions.forEach((m) => {
      if (m.completed && m.rewardType === 'instant_bomb') {
        bonus += m.rewardValue;
      }
    });
    return bonus;
  }

  /**
   * Checks if starting weapon supercharge is unlocked
   */
  public getWeaponLevelBonus(): number {
    let bonus = 0;
    this.missions.forEach((m) => {
      if (m.completed && m.rewardType === 'hyper_cannons') {
        bonus += m.rewardValue;
      }
    });
    return bonus;
  }

  /**
   * For testing or player refresh: force generate a fresh set
   */
  public refreshDailyMissions(): DailyMission[] {
    const seed = `${this.currentDate}_${Date.now()}`;
    this.missions = generateDailyMissions(seed);
    this.saveMissions();
    return this.missions;
  }
}

export const missionManager = new MissionManager();
