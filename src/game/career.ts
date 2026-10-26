/**
 * CareerManager & Career Progression System for Sky Raider: Elang Tempur
 * Manages XP, Ranks, Lifetime Statistics, Streak Tracking, and persistence in localStorage under "pilotCareer".
 */

export interface CareerStats {
  missionsFlown: number;
  enemiesDefeated: number;
  flagshipsSunk: number;
  bombsDeployed: number;
  careerScore: number;
  highestSector: number;
  shotsFired: number;
  shotsHit: number;
  recordScore: number;
}

export interface CareerData {
  pilotName: string;
  xp: number;
  level: number;
  stats: CareerStats;
  avatarId?: string;
  isNewRecord?: boolean;
  missionStreak?: number;
  lastActiveDate?: string;
}

export interface CareerRank {
  level: number;
  title: string;
  insignia: string;
  minXp: number;
  tierColor: 'gold' | 'cyan' | 'purple';
}

export const CAREER_RANKS: CareerRank[] = [
  { level: 1, title: 'Flight Cadet', insignia: '✦', minXp: 0, tierColor: 'gold' },
  { level: 2, title: 'Pilot Officer', insignia: '★', minXp: 1200, tierColor: 'gold' },
  { level: 3, title: 'Flying Officer', insignia: '★★', minXp: 3000, tierColor: 'gold' },
  { level: 4, title: 'Flight Lieutenant', insignia: '★★★', minXp: 6000, tierColor: 'cyan' },
  { level: 5, title: 'Squadron Leader', insignia: '◆ ★★★', minXp: 10000, tierColor: 'cyan' },
  { level: 6, title: 'Wing Commander', insignia: '◆◆ ★★★', minXp: 16000, tierColor: 'cyan' },
  { level: 7, title: 'Group Captain', insignia: '✪ ✦✦✦', minXp: 24000, tierColor: 'purple' },
  { level: 8, title: 'Air Commodore', insignia: '✪✪ ✦✦✦', minXp: 35000, tierColor: 'purple' },
  { level: 9, title: 'Air Vice Marshal', insignia: '👑 ✪✪', minXp: 50000, tierColor: 'purple' },
  { level: 10, title: 'Air Marshal', insignia: '👑 ✪✪✪', minXp: 75000, tierColor: 'purple' },
];

export interface XpBreakdown {
  regularKillsXp: number;
  regularKillsCount: number;
  eliteKillsXp: number;
  eliteKillsCount: number;
  flagshipXp: number;
  flagshipsCount: number;
  accuracyBonusXp: number;
  accuracyPercent: number;
  sectorXp: number;
  highestSector: number;
  flawlessBonusXp: number;
  isVictory: boolean;
  baseXp: number;
  streakDays: number;
  streakMultiplier: number;
  streakBonusXp: number;
  totalXp: number;
}

const STORAGE_KEY = 'pilotCareer';

export class CareerManager {
  private data: CareerData;

  constructor() {
    this.data = this.load();
  }

  public load(): CareerData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.xp === 'number') {
          return {
            pilotName: parsed.pilotName || 'FALCON-1',
            xp: Math.max(0, parsed.xp || 0),
            level: Math.max(1, parsed.level || 1),
            avatarId: parsed.avatarId || 'falcon',
            missionStreak: Math.max(0, parsed.missionStreak || 0),
            lastActiveDate: parsed.lastActiveDate || '',
            stats: {
              missionsFlown: Math.max(0, parsed.stats?.missionsFlown || 0),
              enemiesDefeated: Math.max(0, parsed.stats?.enemiesDefeated || 0),
              flagshipsSunk: Math.max(0, parsed.stats?.flagshipsSunk || 0),
              bombsDeployed: Math.max(0, parsed.stats?.bombsDeployed || 0),
              careerScore: Math.max(0, parsed.stats?.careerScore || 0),
              highestSector: Math.max(1, parsed.stats?.highestSector || 1),
              shotsFired: Math.max(0, parsed.stats?.shotsFired || 0),
              shotsHit: Math.max(0, parsed.stats?.shotsHit || 0),
              recordScore: Math.max(0, parsed.stats?.recordScore || 0),
            },
          };
        }
      }
    } catch {
      // Safe fallback on error or corrupt storage
    }

    return this.getDefaultData();
  }

  private getDefaultData(): CareerData {
    return {
      pilotName: 'FALCON-1',
      xp: 0,
      level: 1,
      avatarId: 'falcon',
      missionStreak: 0,
      lastActiveDate: '',
      stats: {
        missionsFlown: 0,
        enemiesDefeated: 0,
        flagshipsSunk: 0,
        bombsDeployed: 0,
        careerScore: 0,
        highestSector: 1,
        shotsFired: 0,
        shotsHit: 0,
        recordScore: 0,
      },
    };
  }

  public save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Ignore storage error
    }
  }

  public reset(): CareerData {
    this.data = this.getDefaultData();
    this.save();
    return this.data;
  }

  public getData(): CareerData {
    return this.data;
  }

  public updatePilotName(name: string) {
    const trimmed = name.trim().toUpperCase().slice(0, 14);
    if (trimmed) {
      this.data.pilotName = trimmed;
      this.save();
    }
  }

  public updateAvatar(avatarId: string) {
    this.data.avatarId = avatarId;
    this.save();
  }

  public getRank(xp: number = this.data.xp): CareerRank {
    let current = CAREER_RANKS[0];
    for (let i = 0; i < CAREER_RANKS.length; i++) {
      if (xp >= CAREER_RANKS[i].minXp) {
        current = CAREER_RANKS[i];
      } else {
        break;
      }
    }
    return current;
  }

  public getNextRank(xp: number = this.data.xp): CareerRank | null {
    const current = this.getRank(xp);
    const nextIndex = CAREER_RANKS.findIndex((r) => r.level === current.level) + 1;
    return CAREER_RANKS[nextIndex] || null;
  }

  public getProgress(): {
    currentRank: CareerRank;
    nextRank: CareerRank | null;
    currentXp: number;
    xpForNext: number;
    xpRemaining: number;
    progressPercent: number;
    isMaxRank: boolean;
  } {
    const currentXp = this.data.xp;
    const currentRank = this.getRank(currentXp);
    const nextRank = this.getNextRank(currentXp);

    if (!nextRank) {
      return {
        currentRank,
        nextRank: null,
        currentXp,
        xpForNext: currentRank.minXp,
        xpRemaining: 0,
        progressPercent: 100,
        isMaxRank: true,
      };
    }

    const range = nextRank.minXp - currentRank.minXp;
    const progress = currentXp - currentRank.minXp;
    const xpRemaining = Math.max(0, nextRank.minXp - currentXp);
    const progressPercent = Math.min(100, Math.max(0, Math.round((progress / range) * 100)));

    return {
      currentRank,
      nextRank,
      currentXp,
      xpForNext: nextRank.minXp,
      xpRemaining,
      progressPercent,
      isMaxRank: false,
    };
  }

  public addXP(amount: number): { oldRank: CareerRank; newRank: CareerRank; didRankUp: boolean } {
    const oldRank = this.getRank(this.data.xp);
    this.data.xp += amount;
    const newRank = this.getRank(this.data.xp);
    this.data.level = newRank.level;
    const didRankUp = newRank.level > oldRank.level;
    this.save();
    return { oldRank, newRank, didRankUp };
  }

  public getStreakInfo(): { streakDays: number; streakMultiplier: number } {
    const today = new Date().toISOString().slice(0, 10);
    let streakDays = this.data.missionStreak || 0;
    const lastDate = this.data.lastActiveDate || '';

    if (lastDate) {
      const lastTime = new Date(lastDate).getTime();
      const todayTime = new Date(today).getTime();
      const diffDays = Math.round((todayTime - lastTime) / (1000 * 3600 * 24));
      if (diffDays > 1) {
        // Reset streak if more than 1 day missed
        streakDays = 0;
      }
    }

    const streakMultiplier = 1 + Math.min(0.5, Math.max(0, streakDays - 1) * 0.10);
    return { streakDays, streakMultiplier };
  }

  private updateMissionStreak(): { streakDays: number; streakMultiplier: number } {
    const today = new Date().toISOString().slice(0, 10);
    let streakDays = this.data.missionStreak || 0;
    const lastDate = this.data.lastActiveDate || '';

    if (lastDate === today) {
      // Completed mission on same day, streak maintained
      if (streakDays < 1) streakDays = 1;
    } else if (lastDate) {
      const lastTime = new Date(lastDate).getTime();
      const todayTime = new Date(today).getTime();
      const diffDays = Math.round((todayTime - lastTime) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        // Consecutive active day!
        streakDays = Math.max(1, streakDays + 1);
      } else {
        // Streak broken, start fresh 1-day streak
        streakDays = 1;
      }
    } else {
      // First recorded active day
      streakDays = 1;
    }

    this.data.missionStreak = streakDays;
    this.data.lastActiveDate = today;

    // Streak Multiplier: +10% per streak day (up to max +50% / 1.5x)
    const streakMultiplier = 1 + Math.min(0.5, Math.max(0, streakDays - 1) * 0.10);

    return { streakDays, streakMultiplier };
  }

  /**
   * Calculates XP breakdown and records mission statistics:
   * - Regular enemy killed: +10 XP
   * - Elite enemy: +25 XP
   * - Flagship: +150 XP
   * - Accuracy bonus: >=70% (+50 XP), >=90% (+100 XP)
   * - Sector cleared: +100 XP x sector number
   * - Flawless mission: +75 XP
   * - Streak Multiplier Bonus: +10% per consecutive day streak
   */
  public recordMission(sortieData: {
    score: number;
    wave: number;
    regularKills: number;
    eliteKills: number;
    flagshipsSunk: number;
    bombsUsed: number;
    shotsFired: number;
    shotsHit: number;
    isVictory: boolean;
  }): {
    xpBreakdown: XpBreakdown;
    oldRank: CareerRank;
    newRank: CareerRank;
    didRankUp: boolean;
    isNewRecord: boolean;
  } {
    const {
      score,
      wave,
      regularKills,
      eliteKills,
      flagshipsSunk,
      bombsUsed,
      shotsFired,
      shotsHit,
      isVictory,
    } = sortieData;

    // Consecutive mission streak tracking
    const { streakDays, streakMultiplier } = this.updateMissionStreak();

    // Calculate Base XP items
    const regularKillsXp = regularKills * 10;
    const eliteKillsXp = eliteKills * 25;
    const flagshipXp = flagshipsSunk * 150;

    const accuracyPercent = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0;
    let accuracyBonusXp = 0;
    if (accuracyPercent >= 90) {
      accuracyBonusXp = 100;
    } else if (accuracyPercent >= 70) {
      accuracyBonusXp = 50;
    }

    const sectorXp = wave * 100;
    const flawlessBonusXp = isVictory ? 75 : 0;

    const baseXp =
      regularKillsXp +
      eliteKillsXp +
      flagshipXp +
      accuracyBonusXp +
      sectorXp +
      flawlessBonusXp;

    const streakBonusXp = Math.round(baseXp * (streakMultiplier - 1));
    const totalXp = baseXp + streakBonusXp;

    const oldRank = this.getRank(this.data.xp);

    // Update accumulative lifetime statistics
    this.data.stats.missionsFlown += 1;
    this.data.stats.enemiesDefeated += regularKills + eliteKills;
    this.data.stats.flagshipsSunk += flagshipsSunk;
    this.data.stats.bombsDeployed += bombsUsed;
    this.data.stats.careerScore += score;
    this.data.stats.highestSector = Math.max(this.data.stats.highestSector, wave);
    this.data.stats.shotsFired += shotsFired;
    this.data.stats.shotsHit += shotsHit;

    let isNewRecord = false;
    if (score > this.data.stats.recordScore) {
      this.data.stats.recordScore = score;
      isNewRecord = true;
    }
    this.data.isNewRecord = isNewRecord;

    // Add total XP
    const { newRank, didRankUp } = this.addXP(totalXp);

    const xpBreakdown: XpBreakdown = {
      regularKillsXp,
      regularKillsCount: regularKills,
      eliteKillsXp,
      eliteKillsCount: eliteKills,
      flagshipXp,
      flagshipsCount: flagshipsSunk,
      accuracyBonusXp,
      accuracyPercent,
      sectorXp,
      highestSector: wave,
      flawlessBonusXp,
      isVictory,
      baseXp,
      streakDays,
      streakMultiplier,
      streakBonusXp,
      totalXp,
    };

    return {
      xpBreakdown,
      oldRank,
      newRank,
      didRankUp,
      isNewRecord,
    };
  }
}

export const careerManager = new CareerManager();
