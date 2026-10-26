/**
 * Rank Emblems System for Sky Raider: Elang Tempur
 * Unique, unlockable vector emblems for each of the 10 Military Career Ranks.
 */

export type RankEmblemMotif =
  | 'cadet_wings'
  | 'single_star'
  | 'twin_star'
  | 'triple_star'
  | 'squadron_diamond'
  | 'wing_commander'
  | 'group_captain'
  | 'air_commodore'
  | 'vice_marshal'
  | 'air_marshal';

export interface RankEmblemData {
  level: number;
  id: string;
  rankTitle: string;
  emblemName: string;
  insigniaSymbol: string;
  minXp: number;
  tierColor: 'gold' | 'cyan' | 'purple';
  motif: RankEmblemMotif;
  primaryColor: string;
  secondaryColor: string;
  accentGlow: string;
  description: string;
}

export const RANK_EMBLEMS_LIST: RankEmblemData[] = [
  {
    level: 1,
    id: 'rank_emblem_1',
    rankTitle: 'Flight Cadet',
    emblemName: 'Cadet Flight Wings',
    insigniaSymbol: '✦',
    minXp: 0,
    tierColor: 'gold',
    motif: 'cadet_wings',
    primaryColor: '#f59e0b',
    secondaryColor: '#78350f',
    accentGlow: 'rgba(245, 158, 11, 0.4)',
    description: 'Awarded upon induction into Central Air Command. Represents foundational flight discipline and combat readiness.',
  },
  {
    level: 2,
    id: 'rank_emblem_2',
    rankTitle: 'Pilot Officer',
    emblemName: 'Single Command Star Crest',
    insigniaSymbol: '★',
    minXp: 1200,
    tierColor: 'gold',
    motif: 'single_star',
    primaryColor: '#fbbf24',
    secondaryColor: '#92400e',
    accentGlow: 'rgba(251, 191, 36, 0.45)',
    description: 'Earned upon completing initial combat sorties. Demonstrates flight proficiency in active combat zones.',
  },
  {
    level: 3,
    id: 'rank_emblem_3',
    rankTitle: 'Flying Officer',
    emblemName: 'Twin Star Delta Escutcheon',
    insigniaSymbol: '★★',
    minXp: 3000,
    tierColor: 'gold',
    motif: 'twin_star',
    primaryColor: '#f59e0b',
    secondaryColor: '#b45309',
    accentGlow: 'rgba(245, 158, 11, 0.5)',
    description: 'Conferred to seasoned aviators with proven dogfighting skills and precision gunnery.',
  },
  {
    level: 4,
    id: 'rank_emblem_4',
    rankTitle: 'Flight Lieutenant',
    emblemName: 'Triple Star Striking Shield',
    insigniaSymbol: '★★★',
    minXp: 6000,
    tierColor: 'cyan',
    motif: 'triple_star',
    primaryColor: '#38bdf8',
    secondaryColor: '#0369a1',
    accentGlow: 'rgba(56, 189, 248, 0.5)',
    description: 'Commissioned flight lead officer capable of managing multi-target engagements in high-risk sectors.',
  },
  {
    level: 5,
    id: 'rank_emblem_5',
    rankTitle: 'Squadron Leader',
    emblemName: 'Diamond Squadron Crest',
    insigniaSymbol: '◆ ★★★',
    minXp: 10000,
    tierColor: 'cyan',
    motif: 'squadron_diamond',
    primaryColor: '#06b6d4',
    secondaryColor: '#164e63',
    accentGlow: 'rgba(6, 182, 212, 0.55)',
    description: 'Master combat flight leader authorized to deploy heavy ordinance and direct wingman tactics.',
  },
  {
    level: 6,
    id: 'rank_emblem_6',
    rankTitle: 'Wing Commander',
    emblemName: 'Twin Diamond Air Superiority',
    insigniaSymbol: '◆◆ ★★★',
    minXp: 16000,
    tierColor: 'cyan',
    motif: 'wing_commander',
    primaryColor: '#0284c7',
    secondaryColor: '#0c4a6e',
    accentGlow: 'rgba(2, 132, 199, 0.6)',
    description: 'Awarded for total sector control and neutralization of hostile dreadnought flagships.',
  },
  {
    level: 7,
    id: 'rank_emblem_7',
    rankTitle: 'Group Captain',
    emblemName: 'Aegis Laurel Starburst',
    insigniaSymbol: '✪ ✦✦✦',
    minXp: 24000,
    tierColor: 'purple',
    motif: 'group_captain',
    primaryColor: '#c084fc',
    secondaryColor: '#581c87',
    accentGlow: 'rgba(192, 132, 252, 0.6)',
    description: 'High command officer with elite combat records and multi-sector campaign victories.',
  },
  {
    level: 8,
    id: 'rank_emblem_8',
    rankTitle: 'Air Commodore',
    emblemName: 'Double Aegis Command Star',
    insigniaSymbol: '✪✪ ✦✦✦',
    minXp: 35000,
    tierColor: 'purple',
    motif: 'air_commodore',
    primaryColor: '#a855f7',
    secondaryColor: '#3b0764',
    accentGlow: 'rgba(168, 85, 247, 0.65)',
    description: 'Strategic air commander decorated for exceptional kill counts and flawless survival streaks.',
  },
  {
    level: 9,
    id: 'rank_emblem_9',
    rankTitle: 'Air Vice Marshal',
    emblemName: 'Imperator Crown Escutcheon',
    insigniaSymbol: '👑 ✪✪',
    minXp: 50000,
    tierColor: 'purple',
    motif: 'vice_marshal',
    primaryColor: '#e879f9',
    secondaryColor: '#701a75',
    accentGlow: 'rgba(232, 121, 249, 0.7)',
    description: 'Supreme air strategist whose legendary flight record dominates Central Air Command archives.',
  },
  {
    level: 10,
    id: 'rank_emblem_10',
    rankTitle: 'Air Marshal',
    emblemName: 'Grand Marshal Sovereignty Crown',
    insigniaSymbol: '👑 ✪✪✪',
    minXp: 75000,
    tierColor: 'purple',
    motif: 'air_marshal',
    primaryColor: '#f43f5e',
    secondaryColor: '#881337',
    accentGlow: 'rgba(244, 63, 94, 0.8)',
    description: 'The pinnacle of military aviation excellence. Reserved exclusively for legendary aces.',
  },
];

export interface RankEmblemStatus extends RankEmblemData {
  unlocked: boolean;
  progressPercent: number;
  xpRemaining: number;
  isCurrentRank: boolean;
  isEquipped: boolean;
}

const STORAGE_EQUIPPED_KEY = 'sky_raider_equipped_rank_emblem';

export class RankEmblemManager {
  private equippedId: string = 'rank_emblem_1';

  constructor() {
    this.equippedId = this.loadEquipped();
  }

  private loadEquipped(): string {
    try {
      const stored = localStorage.getItem(STORAGE_EQUIPPED_KEY);
      if (stored) return stored;
    } catch {
      // Safe fallback
    }
    return 'rank_emblem_1';
  }

  public getEquippedId(): string {
    return this.equippedId;
  }

  public equipEmblem(id: string, playerLevel: number): boolean {
    const target = RANK_EMBLEMS_LIST.find((e) => e.id === id);
    if (target && playerLevel >= target.level) {
      this.equippedId = id;
      try {
        localStorage.setItem(STORAGE_EQUIPPED_KEY, id);
      } catch {
        // Ignore error
      }
      return true;
    }
    return false;
  }

  public getStatuses(playerLevel: number, playerXp: number): RankEmblemStatus[] {
    const equippedId = this.getEquippedId();

    return RANK_EMBLEMS_LIST.map((emblem) => {
      const unlocked = playerLevel >= emblem.level;
      const isCurrentRank = playerLevel === emblem.level;
      const xpRemaining = Math.max(0, emblem.minXp - playerXp);
      const progressPercent = unlocked
        ? 100
        : Math.min(99, Math.round((playerXp / emblem.minXp) * 100));

      return {
        ...emblem,
        unlocked,
        progressPercent,
        xpRemaining,
        isCurrentRank,
        isEquipped: emblem.id === equippedId,
      };
    });
  }
}

export const rankEmblemManager = new RankEmblemManager();
