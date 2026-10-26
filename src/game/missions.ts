import { DailyMission, MissionObjectiveType, MissionRewardType, SpecialContract } from './types';

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
    title: 'Sapu Udara Intersepsi',
    codename: 'OPERASI LANGIT DINGIN',
    description: 'Tembak jatuh 30 pesawat musuh dalam pertempuran.',
    type: 'kill_enemies',
    target: 30,
    rewardType: 'score_multiplier',
    rewardLabel: '+50% Pengali Skor',
    rewardValue: 0.5,
    rewardIcon: 'award',
  },
  {
    id: 'm_combo_8',
    title: 'Keahlian Presisi',
    codename: 'SERANGAN CEPAT',
    description: 'Capai kombo tempur x8 tanpa terputus.',
    type: 'reach_combo',
    target: 8,
    rewardType: 'shield_overcharge',
    rewardLabel: 'Perisai Ekstra (+50 Perisai Maks)',
    rewardValue: 50,
    rewardIcon: 'shield',
  },
  {
    id: 'm_boss_1',
    title: 'Penjelajah Kapal Induk',
    codename: 'PEMBASMI TITAN',
    description: 'Hancurkan 1 Kapal Induk Utama musuh.',
    type: 'kill_bosses',
    target: 1,
    rewardType: 'hyper_cannons',
    rewardLabel: 'Bonus Senjata (+1 Level Meriam)',
    rewardValue: 1,
    rewardIcon: 'zap',
  },
  {
    id: 'm_bombs_2',
    title: 'Persenjataan Berat',
    codename: 'ZONA LEDAKAN',
    description: 'Gunakan 2 Bom Taktis Overdrive saat pertempuran.',
    type: 'use_bombs',
    target: 2,
    rewardType: 'instant_bomb',
    rewardLabel: '+1 Bom Taktis Overdrive',
    rewardValue: 1,
    rewardIcon: 'bomb',
  },
  {
    id: 'm_sector_3',
    title: 'Penetrasi Sektor',
    codename: 'TEROBOSAN SEKTOR',
    description: 'Capai dan amankan wilayah udara Sektor 3.',
    type: 'reach_sector',
    target: 3,
    rewardType: 'score_multiplier',
    rewardLabel: '+50% Pengali Skor',
    rewardValue: 0.5,
    rewardIcon: 'award',
  },
  {
    id: 'm_powerups_5',
    title: 'Logistik Lapangan',
    codename: 'PASOKAN UDARA',
    description: 'Ambil 5 item power-up di medan tempur.',
    type: 'collect_powerups',
    target: 5,
    rewardType: 'score_multiplier',
    rewardLabel: '+25% Pengali Skor',
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

export const SPECIAL_CONTRACTS: SpecialContract[] = [
  {
    id: 'c_no_bombs',
    title: 'Tanpa Bom',
    description: 'Selesaikan misi tanpa menggunakan Bom Taktis.',
    bonusXp: 200,
    type: 'no_bombs',
  },
  {
    id: 'c_no_damage',
    title: 'Sempurna',
    description: 'Selesaikan misi tanpa menerima kerusakan apapun.',
    bonusXp: 500,
    type: 'no_damage',
  },
];

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
