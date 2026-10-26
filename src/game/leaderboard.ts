import { PlaneId } from './types';

export interface LeaderboardEntry {
  id: string;
  callsign: string;
  avatarId: string;
  score: number;
  planeId: PlaneId;
  wave: number;
  accuracy: number;
  date: string;
  isPlayer: boolean;
}

const STORAGE_KEY = 'sky_raider_global_leaderboard_v1';

// Initial curated community ace pilots database
const DEFAULT_COMMUNITY_ENTRIES: LeaderboardEntry[] = [
  {
    id: 'entry_1',
    callsign: 'GARUDA-01',
    avatarId: 'falcon',
    score: 184500,
    planeId: 'garuda',
    wave: 8,
    accuracy: 91,
    date: '2026-10-25',
    isPlayer: false,
  },
  {
    id: 'entry_2',
    callsign: 'GHOST_REAPER',
    avatarId: 'ghost',
    score: 152800,
    planeId: 'valkyrie',
    wave: 7,
    accuracy: 88,
    date: '2026-10-24',
    isPlayer: false,
  },
  {
    id: 'entry_3',
    callsign: 'TITAN_DREAD',
    avatarId: 'titan',
    score: 128400,
    planeId: 'titan',
    wave: 6,
    accuracy: 82,
    date: '2026-10-25',
    isPlayer: false,
  },
  {
    id: 'entry_4',
    callsign: 'VALKYRIE-ACE',
    avatarId: 'valkyrie',
    score: 104200,
    planeId: 'valkyrie',
    wave: 5,
    accuracy: 86,
    date: '2026-10-23',
    isPlayer: false,
  },
  {
    id: 'entry_5',
    callsign: 'NIGHTHAWK',
    avatarId: 'ghost',
    score: 89600,
    planeId: 'garuda',
    wave: 5,
    accuracy: 79,
    date: '2026-10-22',
    isPlayer: false,
  },
  {
    id: 'entry_6',
    callsign: 'INDRA-7',
    avatarId: 'falcon',
    score: 76300,
    planeId: 'garuda',
    wave: 4,
    accuracy: 81,
    date: '2026-10-24',
    isPlayer: false,
  },
  {
    id: 'entry_7',
    callsign: 'IRON_BARON',
    avatarId: 'titan',
    score: 64500,
    planeId: 'titan',
    wave: 4,
    accuracy: 75,
    date: '2026-10-21',
    isPlayer: false,
  },
  {
    id: 'entry_8',
    callsign: 'VIPER_STRIKE',
    avatarId: 'valkyrie',
    score: 52100,
    planeId: 'valkyrie',
    wave: 3,
    accuracy: 84,
    date: '2026-10-20',
    isPlayer: false,
  },
  {
    id: 'entry_9',
    callsign: 'SKY_DOMINATOR',
    avatarId: 'falcon',
    score: 41800,
    planeId: 'garuda',
    wave: 3,
    accuracy: 77,
    date: '2026-10-19',
    isPlayer: false,
  },
  {
    id: 'entry_10',
    callsign: 'SOLO_WING',
    avatarId: 'ghost',
    score: 33200,
    planeId: 'valkyrie',
    wave: 2,
    accuracy: 72,
    date: '2026-10-18',
    isPlayer: false,
  },
];

export class LeaderboardManager {
  private entries: LeaderboardEntry[] = [];

  constructor() {
    this.entries = this.loadEntries();
  }

  public loadEntries(): LeaderboardEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort((a, b) => b.score - a.score);
        }
      }
    } catch {
      // Storage quota or parsing failure fallback
    }

    // Default seed
    const defaultData = [...DEFAULT_COMMUNITY_ENTRIES];
    this.saveEntries(defaultData);
    return defaultData;
  }

  public saveEntries(list: LeaderboardEntry[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Storage quota ignore
    }
  }

  public getTop10(filter: 'all' | PlaneId = 'all'): LeaderboardEntry[] {
    let filtered = [...this.entries];
    if (filter !== 'all') {
      filtered = filtered.filter((e) => e.planeId === filter);
    }
    return filtered.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  /**
   * Checks if a score is high enough to enter top 10
   */
  public isTop10Eligible(score: number, filter: 'all' | PlaneId = 'all'): boolean {
    if (score <= 0) return false;
    const top10 = this.getTop10(filter);
    if (top10.length < 10) return true;
    return score > top10[top10.length - 1].score;
  }

  /**
   * Submits player score into global leaderboard
   */
  public submitScore(entry: Omit<LeaderboardEntry, 'id' | 'isPlayer'>): {
    rank: number;
    isTop10: boolean;
  } {
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      isPlayer: true,
    };

    // Remove older duplicate entries from this player callsign if the new score is higher
    const existingIndex = this.entries.findIndex(
      (e) => e.isPlayer && e.callsign === entry.callsign
    );

    if (existingIndex !== -1) {
      if (entry.score > this.entries[existingIndex].score) {
        this.entries[existingIndex] = newEntry;
      }
    } else {
      this.entries.push(newEntry);
    }

    // Sort descending by score
    this.entries.sort((a, b) => b.score - a.score);

    // Keep top 20 stored to allow filtering by aircraft
    this.entries = this.entries.slice(0, 20);
    this.saveEntries(this.entries);

    // Find rank in all-time
    const rank = this.entries.findIndex((e) => e.id === newEntry.id) + 1;
    return {
      rank,
      isTop10: rank > 0 && rank <= 10,
    };
  }

  public resetToDefaults() {
    this.entries = [...DEFAULT_COMMUNITY_ENTRIES];
    this.saveEntries(this.entries);
    return this.getTop10('all');
  }
}

export const leaderboardManager = new LeaderboardManager();
