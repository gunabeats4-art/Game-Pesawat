/**
 * Core type definitions for Sky Raider: Elang Tempur
 */

export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';

export type PlaneId = 'garuda' | 'valkyrie' | 'titan';

export interface PlaneConfig {
  id: PlaneId;
  name: string;
  codename: string;
  tagline: string;
  speed: number;
  firepower: number;
  maxHp: number;
  maxShield: number;
  maxBombs: number;
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  description: string;
  specialWeaponName: string;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isPlayer: boolean;
  color: string;
  glowColor: string;
  type: 'plasma' | 'laser' | 'vulcan' | 'enemy_orb' | 'enemy_laser' | 'missile';
  angle?: number;
}

export interface Missile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetId: number | null;
  damage: number;
  speed: number;
  turnRate: number;
  lifetime: number;
  color: string;
}

export type EnemyType = 'drone' | 'scout' | 'gunship' | 'bomber' | 'cruiser' | 'boss';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  width: number;
  height: number;
  shootCooldown: number;
  shootTimer: number;
  scoreValue: number;
  hitFlashTimer: number;
  telegraphTimer: number; // For laser/charge windup
  telegraphMax: number;
  angle: number;
  behaviorTimer: number;
  phase?: number;
  name?: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
  type: 'spark' | 'smoke' | 'fire' | 'ring' | 'debris';
  rotation: number;
  vRot: number;
}

export type PowerupType = 'power' | 'shield' | 'bomb' | 'star';

export interface Powerup {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: PowerupType;
  bobPhase: number;
  value: number;
  radius: number;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
  size: number;
}

export type MissionObjectiveType =
  | 'kill_enemies'
  | 'kill_bosses'
  | 'reach_combo'
  | 'use_bombs'
  | 'reach_sector'
  | 'collect_powerups';

export type MissionRewardType =
  | 'score_multiplier' // Permanent score multiplier boost (e.g. +50%)
  | 'instant_bomb'     // Instant tactical overdrive bomb
  | 'shield_overcharge' // Shield capacity booster
  | 'hyper_cannons';   // Weapon level supercharge

export interface DailyMission {
  id: string;
  title: string;
  codename: string;
  description: string;
  type: MissionObjectiveType;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  rewardType: MissionRewardType;
  rewardLabel: string;
  rewardValue: number;
  rewardIcon: string;
}

export interface ActiveBuff {
  id: string;
  name: string;
  description: string;
  scoreMultiplierBonus: number; // e.g. 0.5 for +50%
}

export interface GameStats {
  score: number;
  highScore: number;
  scoreMultiplier: number; // Combined combo and mission multiplier
  missionBonusMultiplier: number; // Active bonus from completed daily missions
  wave: number;
  sectorName: string;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  weaponLevel: number;
  bombs: number;
  maxBombs: number;
  boostGauge: number;
  isBoosting: boolean;
  enemiesKilled: number;
  bossesDefeated: number;
  shotsFired: number;
  shotsHit: number;
  currentCombo: number;
  comboTimer: number;
  maxCombo: number;
  bombsUsed: number;
  powerupsCollected: number;
  bossHp: number | null;
  bossMaxHp: number | null;
  bossName: string | null;
  activeMissions: DailyMission[];
}

