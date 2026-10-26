/**
 * Insignia System for Sky Raider: Elang Tempur
 * Tracks and unlocks unique equipable geometric emblems based on long-term career challenges.
 */

import { PilotProfile } from './pilot';

export type GeometricShape = 'delta' | 'hexagon' | 'starburst' | 'shield' | 'citadel' | 'vortex';

export type InsigniaRequirementType =
  | 'total_kills'
  | 'missions_flown'
  | 'bosses_defeated'
  | 'total_score'
  | 'total_flight_minutes'
  | 'mission_streak';

export interface InsigniaDefinition {
  id: string;
  name: string;
  codename: string;
  description: string;
  geometricShape: GeometricShape;
  colorTheme: {
    primary: string;
    secondary: string;
    glow: string;
  };
  requirementType: InsigniaRequirementType;
  requirementTarget: number;
}

export const INSIGNIA_DEFINITIONS: InsigniaDefinition[] = [
  {
    id: 'delta_prime',
    name: 'Delta Prime Emblem',
    codename: 'DELTA-1',
    description: 'Awarded to aces who have neutralized at least 50 hostile units across all sorties.',
    geometricShape: 'delta',
    colorTheme: { primary: '#38bdf8', secondary: '#0284c7', glow: '#38bdf8' },
    requirementType: 'total_kills',
    requirementTarget: 50,
  },
  {
    id: 'obsidian_hex',
    name: 'Obsidian Hexagon',
    codename: 'HEX-OBSIDIAN',
    description: 'Earned by completing 5 successful combat sorties in the skies.',
    geometricShape: 'hexagon',
    colorTheme: { primary: '#10b981', secondary: '#047857', glow: '#10b981' },
    requirementType: 'missions_flown',
    requirementTarget: 5,
  },
  {
    id: 'solar_starburst',
    name: 'Solar Starburst',
    codename: 'SOLAR-BURST',
    description: 'Conferred upon legendary pilots with over 200 confirmed enemy aircraft takedowns.',
    geometricShape: 'starburst',
    colorTheme: { primary: '#f59e0b', secondary: '#b45309', glow: '#f59e0b' },
    requirementType: 'total_kills',
    requirementTarget: 200,
  },
  {
    id: 'aegis_shield',
    name: 'Aegis Guardian Shield',
    codename: 'AEGIS-SHIELD',
    description: 'Awarded for enduring over 30 simulated flight minutes in intense airspace combat.',
    geometricShape: 'shield',
    colorTheme: { primary: '#67e8f9', secondary: '#0e7490', glow: '#67e8f9' },
    requirementType: 'total_flight_minutes',
    requirementTarget: 30,
  },
  {
    id: 'citadel_bastion',
    name: 'Citadel Bastion',
    codename: 'CITADEL-X',
    description: 'Proof of supreme anti-capital warfare: neutralize 3 Capital Dreadnought flagships.',
    geometricShape: 'citadel',
    colorTheme: { primary: '#ef4444', secondary: '#b91c1c', glow: '#ef4444' },
    requirementType: 'bosses_defeated',
    requirementTarget: 3,
  },
  {
    id: 'vortex_prime',
    name: 'Vortex Prime Matrix',
    codename: 'VORTEX-PRIME',
    description: 'Accumulate a career combat score exceeding 50,000 points.',
    geometricShape: 'vortex',
    colorTheme: { primary: '#a855f7', secondary: '#7e22ce', glow: '#a855f7' },
    requirementType: 'total_score',
    requirementTarget: 50000,
  },
];

export interface InsigniaStatus extends InsigniaDefinition {
  unlocked: boolean;
  currentProgress: number;
  progressPercent: number;
  equipped: boolean;
}

export class InsigniaManager {
  private equippedId: string = 'delta_prime';
  private STORAGE_EQUIPPED_KEY = 'sky_raider_equipped_insignia';

  constructor() {
    this.loadEquipped();
  }

  private loadEquipped() {
    try {
      const stored = localStorage.getItem(this.STORAGE_EQUIPPED_KEY);
      if (stored && INSIGNIA_DEFINITIONS.some((i) => i.id === stored)) {
        this.equippedId = stored;
      }
    } catch {
      // Ignore
    }
  }

  public getEquippedId(): string {
    return this.equippedId;
  }

  public getEquippedInsignia(): InsigniaDefinition {
    return (
      INSIGNIA_DEFINITIONS.find((i) => i.id === this.equippedId) || INSIGNIA_DEFINITIONS[0]
    );
  }

  public equipInsignia(id: string): boolean {
    const def = INSIGNIA_DEFINITIONS.find((i) => i.id === id);
    if (!def) return false;

    const statuses = this.getStatuses(pilotProfileStub());
    const status = statuses.find((s) => s.id === id);
    if (status && status.unlocked) {
      this.equippedId = id;
      try {
        localStorage.setItem(this.STORAGE_EQUIPPED_KEY, id);
      } catch {
        // Ignore
      }
      return true;
    }
    return false;
  }

  public getStatuses(profile: PilotProfile): InsigniaStatus[] {
    const flightMinutes = Math.round(profile.missionsFlown * 3.5 + (profile.careerXp / 1000));

    return INSIGNIA_DEFINITIONS.map((def) => {
      let currentProgress = 0;
      if (def.requirementType === 'total_kills') {
        currentProgress = profile.enemiesDefeated;
      } else if (def.requirementType === 'missions_flown') {
        currentProgress = profile.missionsFlown;
      } else if (def.requirementType === 'bosses_defeated') {
        currentProgress = profile.bossesDefeated;
      } else if (def.requirementType === 'total_score') {
        currentProgress = profile.totalScoreEarned;
      } else if (def.requirementType === 'total_flight_minutes') {
        currentProgress = flightMinutes;
      } else if (def.requirementType === 'mission_streak') {
        currentProgress = Math.min(def.requirementTarget, profile.missionsFlown);
      }

      const unlocked = currentProgress >= def.requirementTarget;
      const progressPercent = Math.min(
        100,
        Math.max(0, Math.round((currentProgress / def.requirementTarget) * 100))
      );
      const equipped = def.id === this.equippedId;

      return {
        ...def,
        unlocked,
        currentProgress: Math.min(def.requirementTarget, currentProgress),
        progressPercent,
        equipped,
      };
    });
  }
}

function pilotProfileStub(): PilotProfile {
  try {
    const raw = localStorage.getItem('sky_raider_pilot_profile_v1');
    if (raw) return JSON.parse(raw);
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
  };
}

export const insigniaManager = new InsigniaManager();
