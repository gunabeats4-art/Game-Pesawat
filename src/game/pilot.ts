import { GameStats } from './types';
import { StoredAchievementData, achievementManager, AchievementStatus } from './achievements';

export interface PilotAvatar {
  id: string;
  name: string;
  defaultCallsign: string;
  specialty: string;
  image: string;
  accentColor: string;
  bio: string;
}

export const PILOT_AVATARS: PilotAvatar[] = [
  {
    id: 'falcon',
    name: 'Captain Reza "Falcon" Pratama',
    defaultCallsign: 'FALCON-1',
    specialty: 'Air Superiority & Interception',
    image: '/src/assets/images/pilot_avatar_falcon_1793007309857.jpg',
    accentColor: '#38bdf8',
    bio: 'Lead strike flight lead specializing in high-G supersonic dogfighting and multi-target missile engagements.',
  },
  {
    id: 'valkyrie',
    name: 'Commander Maya "Valkyrie" Wardani',
    defaultCallsign: 'VALKYRIE',
    specialty: 'Tactical Recon & Electronic Warfare',
    image: '/src/assets/images/pilot_avatar_valkyrie_1793007310769.jpg',
    accentColor: '#10b981',
    bio: 'Precision tactician known for razor-sharp reflexes and devastating precision laser strikes against hostile air wings.',
  },
  {
    id: 'titan',
    name: 'Colonel Hendra "Ironclad" Baros',
    defaultCallsign: 'IRONCLAD',
    specialty: 'Heavy Siege & Anti-Capital Warfare',
    image: '/src/assets/images/pilot_avatar_titan_1793007311445.jpg',
    accentColor: '#f59e0b',
    bio: 'Decorated heavy bomber commander with decades of flight time, specialized in dismantling armored flagships and coastal fortresses.',
  },
  {
    id: 'ghost',
    name: 'Major Tania "Ghost" Alamsyah',
    defaultCallsign: 'SPECTRE',
    specialty: 'Deep Stealth & Night Interception',
    image: '/src/assets/images/pilot_avatar_ghost_1793007311890.jpg',
    accentColor: '#a855f7',
    bio: 'Black-ops stealth operative skilled in penetrating radar grids unseen and annihilating enemy command squadrons.',
  },
];

export interface RankLevel {
  level: number;
  title: string;
  insignia: string;
  minXp: number;
  perks: string;
}

export const RANKS: RankLevel[] = [
  { level: 1, title: 'Flight Cadet', insignia: '✦', minXp: 0, perks: 'Standard combat clearance' },
  { level: 2, title: 'Second Lieutenant', insignia: '★', minXp: 1200, perks: 'Basic squadron flight lead' },
  { level: 3, title: 'Flight Lieutenant', insignia: '★★', minXp: 3500, perks: 'Advanced ordnance endorsement' },
  { level: 4, title: 'Squadron Leader', insignia: '★★★', minXp: 8000, perks: 'High-G tactical maneuver ace' },
  { level: 5, title: 'Wing Commander', insignia: '◆ ★★★', minXp: 16000, perks: 'Flagship neutralization expert' },
  { level: 6, title: 'Group Captain', insignia: '◆◆ ★★★', minXp: 32000, perks: 'Strategic air defense director' },
  { level: 7, title: 'Air Commodore', insignia: '✪ ✦✦✦', minXp: 65000, perks: 'Supreme strike commander' },
  { level: 8, title: 'Air Chief Marshal', insignia: '👑 ✪✪✪', minXp: 120000, perks: 'Legendary Supreme Ace of the Skies' },
];

export interface CareerMedal {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface PilotProfile {
  callsign: string;
  avatarId: string;
  careerXp: number;
  missionsFlown: number;
  enemiesDefeated: number;
  bossesDefeated: number;
  bombsDeployed: number;
  totalScoreEarned: number;
  highestScore: number;
  highestWave: number;
  totalShotsFired: number;
  totalShotsHit: number;
  medals: Record<string, boolean>;
  achievements?: Record<string, StoredAchievementData>;
}

const STORAGE_KEY = 'sky_raider_pilot_profile_v1';

export function getRankInfo(careerXp: number) {
  let currentRank = RANKS[0];
  let nextRank = RANKS[1] || null;

  for (let i = 0; i < RANKS.length; i++) {
    if (careerXp >= RANKS[i].minXp) {
      currentRank = RANKS[i];
      nextRank = RANKS[i + 1] || null;
    } else {
      break;
    }
  }

  let progressPercent = 100;
  let xpRemaining = 0;

  if (nextRank) {
    const range = nextRank.minXp - currentRank.minXp;
    const progress = careerXp - currentRank.minXp;
    progressPercent = Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
    xpRemaining = nextRank.minXp - careerXp;
  }

  return {
    currentRank,
    nextRank,
    progressPercent,
    xpRemaining,
  };
}

export class PilotManager {
  private profile: PilotProfile;

  constructor() {
    this.profile = this.loadProfile();
  }

  public loadProfile(): PilotProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.callsign === 'string') {
          const profile: PilotProfile = {
            callsign: parsed.callsign || 'FALCON-1',
            avatarId: parsed.avatarId || 'falcon',
            careerXp: parsed.careerXp || 0,
            missionsFlown: parsed.missionsFlown || 0,
            enemiesDefeated: parsed.enemiesDefeated || 0,
            bossesDefeated: parsed.bossesDefeated || 0,
            bombsDeployed: parsed.bombsDeployed || 0,
            totalScoreEarned: parsed.totalScoreEarned || 0,
            highestScore: parsed.highestScore || 0,
            highestWave: parsed.highestWave || 1,
            totalShotsFired: parsed.totalShotsFired || 0,
            totalShotsHit: parsed.totalShotsHit || 0,
            medals: parsed.medals || {},
            achievements: parsed.achievements || {},
          };

          // Synchronize achievements with any previously accumulated stats
          const statuses = achievementManager.getAchievementStatuses(profile);
          statuses.forEach((s) => {
            if (s.unlocked) {
              if (!profile.achievements) profile.achievements = {};
              if (!profile.achievements[s.id]?.unlocked) {
                profile.achievements[s.id] = {
                  unlocked: true,
                  unlockedAt: profile.achievements[s.id]?.unlockedAt || new Date().toISOString().slice(0, 10),
                  highestRecordedProgress: s.currentProgress,
                };
              }
            }
          });

          return profile;
        }
      }
    } catch {
      // Ignore
    }

    return {
      callsign: 'FALCON-1',
      avatarId: 'falcon',
      careerXp: 0,
      missionsFlown: 0,
      enemiesDefeated: 0,
      bossesDefeated: 0,
      bombsDeployed: 0,
      totalScoreEarned: 0,
      highestScore: 0,
      highestWave: 1,
      totalShotsFired: 0,
      totalShotsHit: 0,
      medals: {},
      achievements: {},
    };
  }

  public saveProfile() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    } catch {
      // Ignore
    }
  }

  public getProfile(): PilotProfile {
    return this.profile;
  }

  public getAvatar(): PilotAvatar {
    return PILOT_AVATARS.find((a) => a.id === this.profile.avatarId) || PILOT_AVATARS[0];
  }

  public updateCallsign(newCallsign: string) {
    const trimmed = newCallsign.trim().toUpperCase().slice(0, 14);
    if (trimmed) {
      this.profile.callsign = trimmed;
      this.saveProfile();
    }
  }

  public updateAvatar(avatarId: string) {
    if (PILOT_AVATARS.some((a) => a.id === avatarId)) {
      this.profile.avatarId = avatarId;
      this.saveProfile();
    }
  }

  /**
   * Called when a mission concludes to record stats, achievements, and calculate XP / Rank progression
   */
  public recordSortie(
    stats: GameStats,
    isVictory: boolean
  ): {
    xpGained: number;
    didRankUp: boolean;
    oldRank: RankLevel;
    newRank: RankLevel;
    unlockedMedals: string[];
    unlockedAchievements: AchievementStatus[];
  } {
    const oldRankInfo = getRankInfo(this.profile.careerXp);

    // Calculate XP earned from combat performance:
    // Base score + enemy kills + boss kills + waves survived + victory bonus
    const scoreXp = Math.floor(stats.score / 15);
    const killXp = stats.enemiesKilled * 20;
    const bossXp = stats.bossesDefeated * 350;
    const waveXp = stats.wave * 120;
    const victoryBonus = isVictory ? 1500 : 250;
    const xpGained = scoreXp + killXp + bossXp + waveXp + victoryBonus;

    // Update career numbers
    this.profile.careerXp += xpGained;
    this.profile.missionsFlown += 1;
    this.profile.enemiesDefeated += stats.enemiesKilled;
    this.profile.bossesDefeated += stats.bossesDefeated;
    this.profile.bombsDeployed += stats.bombsUsed || 0;
    this.profile.totalScoreEarned += stats.score;
    this.profile.highestScore = Math.max(this.profile.highestScore, stats.score);
    this.profile.highestWave = Math.max(this.profile.highestWave, stats.wave);
    this.profile.totalShotsFired += stats.shotsFired;
    this.profile.totalShotsHit += stats.shotsHit;

    // Check newly unlocked medals
    const newlyUnlockedMedals: string[] = [];
    const checkMedal = (id: string, condition: boolean, title: string) => {
      if (condition && !this.profile.medals[id]) {
        this.profile.medals[id] = true;
        newlyUnlockedMedals.push(title);
      }
    };

    checkMedal('first_blood', this.profile.enemiesDefeated >= 1, 'First Blood');
    checkMedal('century_ace', this.profile.enemiesDefeated >= 100, 'Century Ace (100 Kills)');
    checkMedal('sky_dominance', this.profile.enemiesDefeated >= 300, 'Sky Dominance (300 Kills)');
    checkMedal('titan_slayer', this.profile.bossesDefeated >= 3, 'Titan Slayer (3 Dreadnoughts)');
    checkMedal('bombardier', this.profile.bombsDeployed >= 10, 'Master Bombardier (10 Bombs)');
    checkMedal('veteran_pilot', this.profile.missionsFlown >= 10, 'Combat Veteran (10 Sorties)');

    // Evaluate Achievements System
    const evalResult = achievementManager.evaluateSortie(this.profile, stats, isVictory);
    this.profile.achievements = evalResult.updatedAchievements;

    const newRankInfo = getRankInfo(this.profile.careerXp);
    const didRankUp = newRankInfo.currentRank.level > oldRankInfo.currentRank.level;

    this.saveProfile();

    return {
      xpGained,
      didRankUp,
      oldRank: oldRankInfo.currentRank,
      newRank: newRankInfo.currentRank,
      unlockedMedals: newlyUnlockedMedals,
      unlockedAchievements: evalResult.newlyUnlocked,
    };
  }

  public getAceRating(): { rating: number; title: string } {
    return calculateAceRating(this.profile);
  }
}

export function calculateAceRating(profile: PilotProfile): { rating: number; title: string } {
  const missions = Math.max(1, profile.missionsFlown);
  const accuracy = profile.totalShotsFired > 0 ? profile.totalShotsHit / profile.totalShotsFired : 0;
  const killEfficiency = Math.min(1.0, profile.enemiesDefeated / (missions * 25));
  const accuracyScore = Math.min(1.0, accuracy * 2.5);
  const bossBonus = Math.min(1.0, profile.bossesDefeated / (missions * 0.4));

  const rawRating = Math.round(killEfficiency * 40 + accuracyScore * 40 + bossBonus * 20);
  const rating = Math.max(15, Math.min(100, rawRating));

  let title = 'Rookie';
  if (rating >= 90) title = 'Grand Ace Supreme';
  else if (rating >= 75) title = 'Elite Ace';
  else if (rating >= 60) title = 'Squadron Leader';
  else if (rating >= 40) title = 'Seasoned Pilot';
  else if (rating >= 25) title = 'Wingman';

  return { rating, title };
}

export const pilotManager = new PilotManager();

