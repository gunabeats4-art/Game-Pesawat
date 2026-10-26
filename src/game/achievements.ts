import { GameStats } from './types';
import { PilotProfile } from './pilot';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementCategory = 'combat' | 'accuracy' | 'tactical' | 'career';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  iconName: 'crosshair' | 'target' | 'shield' | 'zap' | 'bomb' | 'award' | 'flame' | 'crown' | 'trophy';
  maxProgress: number;
  progressUnit: string;
}

export interface AchievementStatus extends Achievement {
  unlocked: boolean;
  unlockedAt?: string;
  currentProgress: number;
  progressPercent: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_ace_pilot',
    title: 'First Ace Pilot',
    description: 'Neutralize 500 hostile aircraft across your combat career',
    category: 'combat',
    tier: 'platinum',
    iconName: 'crown',
    maxProgress: 500,
    progressUnit: 'kills',
  },
  {
    id: 'precision_striker',
    title: 'Precision Striker',
    description: 'Achieve 100% combat accuracy in a completed sortie (min 20 shots)',
    category: 'accuracy',
    tier: 'gold',
    iconName: 'crosshair',
    maxProgress: 100,
    progressUnit: '%',
  },
  {
    id: 'century_ace',
    title: 'Century Ace',
    description: 'Neutralize 100 hostile aircraft across your combat career',
    category: 'combat',
    tier: 'gold',
    iconName: 'target',
    maxProgress: 100,
    progressUnit: 'kills',
  },
  {
    id: 'first_blood',
    title: 'First Blood',
    description: 'Neutralize your first hostile bandit in airspace',
    category: 'combat',
    tier: 'bronze',
    iconName: 'crosshair',
    maxProgress: 1,
    progressUnit: 'kill',
  },
  {
    id: 'titan_slayer',
    title: 'Dreadnought Slayer',
    description: 'Obliterate 5 Capital Flagship Dreadnoughts',
    category: 'combat',
    tier: 'silver',
    iconName: 'shield',
    maxProgress: 5,
    progressUnit: 'bosses',
  },
  {
    id: 'untouchable',
    title: 'Untouchable Phantom',
    description: 'Survive and complete any sortie with 100% hull integrity remaining',
    category: 'tactical',
    tier: 'gold',
    iconName: 'zap',
    maxProgress: 100,
    progressUnit: '% hull',
  },
  {
    id: 'combo_master',
    title: 'Combo Maestro',
    description: 'Achieve a 20x or higher kill streak in a single battle',
    category: 'combat',
    tier: 'silver',
    iconName: 'flame',
    maxProgress: 20,
    progressUnit: 'combo',
  },
  {
    id: 'master_bombardier',
    title: 'Tactical Bombardier',
    description: 'Deploy 15 Tactical Overdrive EMP bombs',
    category: 'tactical',
    tier: 'bronze',
    iconName: 'bomb',
    maxProgress: 15,
    progressUnit: 'bombs',
  },
  {
    id: 'combat_veteran',
    title: 'Combat Veteran',
    description: 'Complete 10 operational combat sorties',
    category: 'career',
    tier: 'bronze',
    iconName: 'award',
    maxProgress: 10,
    progressUnit: 'sorties',
  },
  {
    id: 'high_roller',
    title: 'Airspace Legend',
    description: 'Score 100,000 or more points in a single combat sortie',
    category: 'career',
    tier: 'platinum',
    iconName: 'trophy',
    maxProgress: 100000,
    progressUnit: 'pts',
  },
];

export interface StoredAchievementData {
  unlocked: boolean;
  unlockedAt?: string;
  highestRecordedProgress?: number;
}

export class AchievementManager {
  /**
   * Calculate status and progress for all achievements against the pilot profile and current sortie
   */
  public getAchievementStatuses(profile: PilotProfile): AchievementStatus[] {
    const stored = profile.achievements || {};

    return ACHIEVEMENTS.map((ach) => {
      const achRecord = stored[ach.id];
      const isAlreadyUnlocked = Boolean(achRecord?.unlocked);
      let currentProgress = achRecord?.highestRecordedProgress || 0;

      switch (ach.id) {
        case 'first_ace_pilot':
          currentProgress = Math.min(ach.maxProgress, profile.enemiesDefeated);
          break;
        case 'century_ace':
          currentProgress = Math.min(ach.maxProgress, profile.enemiesDefeated);
          break;
        case 'first_blood':
          currentProgress = Math.min(ach.maxProgress, profile.enemiesDefeated);
          break;
        case 'titan_slayer':
          currentProgress = Math.min(ach.maxProgress, profile.bossesDefeated);
          break;
        case 'master_bombardier':
          currentProgress = Math.min(ach.maxProgress, profile.bombsDeployed);
          break;
        case 'combat_veteran':
          currentProgress = Math.min(ach.maxProgress, profile.missionsFlown);
          break;
        case 'high_roller':
          currentProgress = Math.min(ach.maxProgress, profile.highestScore);
          break;
        case 'precision_striker':
          // If already unlocked, stays 100. Otherwise uses highest recorded single-mission accuracy
          currentProgress = isAlreadyUnlocked ? 100 : (achRecord?.highestRecordedProgress || 0);
          break;
        case 'untouchable':
          currentProgress = isAlreadyUnlocked ? 100 : (achRecord?.highestRecordedProgress || 0);
          break;
        case 'combo_master':
          currentProgress = isAlreadyUnlocked ? 20 : Math.min(ach.maxProgress, achRecord?.highestRecordedProgress || 0);
          break;
      }

      const unlocked = isAlreadyUnlocked || currentProgress >= ach.maxProgress;
      const progressPercent = Math.min(100, Math.round((currentProgress / ach.maxProgress) * 100));

      return {
        ...ach,
        unlocked,
        unlockedAt: achRecord?.unlockedAt,
        currentProgress,
        progressPercent,
      };
    });
  }

  /**
   * Evaluate all achievements at the end of a sortie, update profile records,
   * and return any newly unlocked achievements.
   */
  public evaluateSortie(
    profile: PilotProfile,
    stats: GameStats,
    _isVictory: boolean
  ): {
    newlyUnlocked: AchievementStatus[];
    updatedAchievements: Record<string, StoredAchievementData>;
  } {
    const achievementsRecord: Record<string, StoredAchievementData> = { ...(profile.achievements || {}) };
    const newlyUnlocked: AchievementStatus[] = [];
    const today = new Date().toISOString().slice(0, 10);

    const checkAndAward = (
      id: string,
      currentValue: number,
      condition: boolean
    ) => {
      const ach = ACHIEVEMENTS.find((a) => a.id === id);
      if (!ach) return;

      const prev = achievementsRecord[id] || { unlocked: false, highestRecordedProgress: 0 };
      const newHigh = Math.max(prev.highestRecordedProgress || 0, Math.min(ach.maxProgress, currentValue));
      const willUnlock = prev.unlocked || condition || newHigh >= ach.maxProgress;

      achievementsRecord[id] = {
        unlocked: willUnlock,
        unlockedAt: willUnlock ? (prev.unlockedAt || today) : undefined,
        highestRecordedProgress: newHigh,
      };

      if (willUnlock && !prev.unlocked) {
        newlyUnlocked.push({
          ...ach,
          unlocked: true,
          unlockedAt: today,
          currentProgress: newHigh,
          progressPercent: 100,
        });
      }
    };

    // Calculate sortie specific metrics
    const sortieAccuracy =
      stats.shotsFired >= 20 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;
    const isUntouchable = stats.hp >= stats.maxHp;

    // 1. First Ace Pilot (500 enemies destroyed)
    checkAndAward('first_ace_pilot', profile.enemiesDefeated, profile.enemiesDefeated >= 500);

    // 2. Precision Striker (100% mission accuracy with min 20 shots)
    checkAndAward(
      'precision_striker',
      sortieAccuracy,
      sortieAccuracy === 100 && stats.shotsFired >= 20
    );

    // 3. Century Ace (100 enemies)
    checkAndAward('century_ace', profile.enemiesDefeated, profile.enemiesDefeated >= 100);

    // 4. First Blood (1 enemy)
    checkAndAward('first_blood', profile.enemiesDefeated, profile.enemiesDefeated >= 1);

    // 5. Dreadnought Slayer (5 flagships)
    checkAndAward('titan_slayer', profile.bossesDefeated, profile.bossesDefeated >= 5);

    // 6. Untouchable Phantom (100% HP remaining at end of battle)
    checkAndAward('untouchable', isUntouchable ? 100 : 0, isUntouchable && stats.wave >= 2);

    // 7. Combo Maestro (20x combo streak)
    checkAndAward('combo_master', stats.maxCombo, stats.maxCombo >= 20);

    // 8. Tactical Bombardier (15 bombs)
    checkAndAward('master_bombardier', profile.bombsDeployed, profile.bombsDeployed >= 15);

    // 9. Combat Veteran (10 sorties)
    checkAndAward('combat_veteran', profile.missionsFlown, profile.missionsFlown >= 10);

    // 10. Airspace Legend (100,000 points in single mission)
    checkAndAward('high_roller', stats.score, stats.score >= 100000);

    return {
      newlyUnlocked,
      updatedAchievements: achievementsRecord,
    };
  }
}

export const achievementManager = new AchievementManager();
