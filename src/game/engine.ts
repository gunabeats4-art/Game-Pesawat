import { soundSystem } from './audio';
import { missionManager } from './missions';
import { drawFighterJet, drawWingman, PLANE_CONFIGS } from './planes';
import { Bullet, CombatLogEntry, DailyMission, Enemy, FloatingText, GameStats, Missile, Particle, PlaneId, Powerup, PowerupType, WeatherEventType, AsteroidHazard } from './types';
import { pilotManager } from './pilot';
import { combatReplayBuffer } from './replay';
import { upgradeManager } from './upgrades';


export interface EngineCallbacks {
  onStatsUpdate: (stats: GameStats) => void;
  onGameOver: (finalStats: GameStats) => void;
  onVictory: (finalStats: GameStats) => void;
  onSectorCleared: (sector: number) => void;
  onMissionCompleted?: (mission: DailyMission) => void;
}

export class SkyRaiderEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;

  // Running state
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Player state
  public planeId: PlaneId = 'garuda';
  private playerX: number = 0;
  private playerY: number = 0;
  private playerTiltX: number = 0;
  private playerHp: number = 100;
  private playerShield: number = 80;
  private playerBombs: number = 3;
  private weaponLevel: number = 1;
  private boostGauge: number = 100;
  private isBoosting: boolean = false;
  private invulnerableTimer: number = 0;
  private shootCooldownTimer: number = 0;
  private missileCooldownTimer: number = 0;

  // Input state
  private heldKeys: Record<string, boolean> = {};
  private pointerPos: { x: number; y: number; active: boolean } = { x: 0, y: 0, active: false };

  // Entities
  private bullets: Bullet[] = [];
  private missiles: Missile[] = [];
  private enemies: Enemy[] = [];
  private particles: Particle[] = [];
  private powerups: Powerup[] = [];
  private floatingTexts: FloatingText[] = [];

  // Parallax Background
  private islands: Array<{ x: number; y: number; width: number; height: number; shape: number[] }> = [];
  private clouds: Array<{ x: number; y: number; size: number; speed: number; alpha: number }> = [];
  private bgOffsetY: number = 0;

  // Waves & Bosses
  private wave: number = 1;
  private waveTimer: number = 0;
  private waveEnemiesSpawned: number = 0;
  private waveEnemiesTotal: number = 12;
  private isBossActive: boolean = false;
  private bossInstance: Enemy | null = null;

  // Game Statistics
  private score: number = 0;
  private highScore: number = 0;
  private enemiesKilled: number = 0;
  private regularEnemiesKilled: number = 0;
  private eliteEnemiesKilled: number = 0;
  private bossesDefeated: number = 0;
  private shotsFired: number = 0;
  private shotsHit: number = 0;
  private currentCombo: number = 0;
  private comboTimer: number = 0;
  private maxCombo: number = 0;
  private bombsUsed: number = 0;
  private powerupsCollected: number = 0;
  private bonusShieldCapacity: number = 0;
  private combatLogs: CombatLogEntry[] = [];
  private difficultyMultiplier: number = 1.0;

  // Game Feel (Camera Shake & Hitstop)
  private trauma: number = 0;
  private hitstopTimer: number = 0;
  private bombEffectTimer: number = 0;
  private bombShockwaveRadius: number = 0;

  private addCombatLog(text: string, type: CombatLogEntry['type']) {
    this.combatLogs.unshift({
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      text,
      type,
    });
    if (this.combatLogs.length > 20) {
      this.combatLogs.pop();
    }
  }

  private activeWeather: WeatherEventType = 'clear';
  private weatherTimer: number = 0;
  private weatherSpawnTimer: number = 30.0;
  private lightningFlashTimer: number = 0;
  private asteroids: AsteroidHazard[] = [];
  private wingmanActive: boolean = true;
  private wingmanX: number = 0;
  private wingmanY: number = 0;
  private wingmanHp: number = 100;
  private wingmanMaxHp: number = 100;
  private wingmanTimer: number = 50.0;
  private wingmanCooldown: number = 0;
  private wingmanShootTimer: number = 0;

  private triggerWeather(type: WeatherEventType) {
    this.activeWeather = type;
    this.weatherTimer = 35.0;
    if (type === 'thunderstorm') {
      this.addCombatLog('ENVIRONMENTAL HAZARD: Severe Thunderstorm active!', 'warning');
    } else if (type === 'asteroid_field') {
      this.addCombatLog('HAZARD WARNING: Asteroid Field trajectory intersecting sector!', 'warning');
    }
  }

  private spawnAsteroid() {
    const w = this.canvas.width;
    const radius = 22 + Math.random() * 28;
    this.asteroids.push({
      x: Math.random() * w,
      y: -60,
      vx: (Math.random() - 0.5) * 40,
      vy: 110 + Math.random() * 80,
      radius,
      hp: Math.round(radius * 1.5),
      maxHp: Math.round(radius * 1.5),
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 3,
    });
  }

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.callbacks = callbacks;

    // Load highscore
    try {
      const stored = localStorage.getItem('sky_raider_highscore');
      if (stored) this.highScore = parseInt(stored, 10) || 0;
    } catch {
      this.highScore = 0;
    }

    this.initBackground();
    this.setupEventListeners();
  }

  private initBackground() {
    const w = this.canvas.width || 600;
    const h = this.canvas.height || 800;

    // Generate procedural island archipelagos
    this.islands = [];
    for (let i = 0; i < 5; i++) {
      const iw = 120 + Math.random() * 160;
      const ih = 90 + Math.random() * 140;
      const points = [];
      const steps = 8;
      for (let s = 0; s < steps; s++) {
        points.push(0.7 + Math.random() * 0.6);
      }
      this.islands.push({
        x: Math.random() * w,
        y: (i / 5) * h * 1.5 - 200,
        width: iw,
        height: ih,
        shape: points,
      });
    }

    // Generate cloud layers
    this.clouds = [];
    for (let i = 0; i < 8; i++) {
      this.clouds.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 90 + Math.random() * 120,
        speed: 40 + Math.random() * 45,
        alpha: 0.15 + Math.random() * 0.25,
      });
    }
  }

  public setPlane(id: PlaneId) {
    this.planeId = id;
    const cfg = PLANE_CONFIGS[id];
    const upg = upgradeManager.getCalculatedBonuses();
    this.bonusShieldCapacity = missionManager.getShieldOverchargeBonus();
    this.playerHp = cfg.maxHp + upg.hpBonus;
    this.playerShield = cfg.maxShield + this.bonusShieldCapacity + upg.shieldBonus;
    this.playerBombs = cfg.maxBombs + missionManager.getExtraBombBonus() + upg.extraBombBonus;
    this.weaponLevel = 1 + missionManager.getWeaponLevelBonus() + upg.baseWeaponLevelBonus;
  }

  public start() {
    const cfg = PLANE_CONFIGS[this.planeId];
    const upg = upgradeManager.getCalculatedBonuses();
    this.bonusShieldCapacity = missionManager.getShieldOverchargeBonus();
    this.playerX = this.canvas.width / 2;
    this.playerY = this.canvas.height * 0.8;
    this.playerHp = cfg.maxHp + upg.hpBonus;
    this.playerShield = cfg.maxShield + this.bonusShieldCapacity + upg.shieldBonus;
    this.playerBombs = cfg.maxBombs + missionManager.getExtraBombBonus() + upg.extraBombBonus;
    this.weaponLevel = 1 + missionManager.getWeaponLevelBonus() + upg.baseWeaponLevelBonus;
    this.boostGauge = 100;
    this.invulnerableTimer = 2.0;

    // Reset loop & entities
    this.bullets = [];
    this.missiles = [];
    this.enemies = [];
    this.particles = [];
    this.powerups = [];
    this.floatingTexts = [];
    this.asteroids = [];
    this.activeWeather = 'clear';
    this.weatherTimer = 0;
    this.weatherSpawnTimer = 30.0;
    this.wingmanActive = true;
    this.wingmanHp = 100;
    this.wingmanMaxHp = 100;
    this.wingmanTimer = 50.0;
    this.wingmanCooldown = 0;
    this.wingmanX = this.playerX - 55;
    this.wingmanY = this.playerY + 22;

    this.wave = 1;
    this.waveTimer = 0;
    this.waveEnemiesSpawned = 0;
    this.waveEnemiesTotal = 14;
    this.isBossActive = false;
    this.bossInstance = null;

    this.score = 0;
    this.enemiesKilled = 0;
    this.regularEnemiesKilled = 0;
    this.eliteEnemiesKilled = 0;
    this.bossesDefeated = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.currentCombo = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;
    this.bombsUsed = 0;
    this.powerupsCollected = 0;
    this.trauma = 0;
    this.hitstopTimer = 0;
    this.bombEffectTimer = 0;

    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    combatReplayBuffer.startRecording();

    const aceInfo = pilotManager.getAceRating();
    this.difficultyMultiplier = 1.0 + (aceInfo.rating / 100) * 0.40;
    this.combatLogs = [];
    this.addCombatLog(`Sortie launched. Callsign active. Ace Rating: ${aceInfo.rating} (${aceInfo.title}).`, 'warning');
    this.addCombatLog('WINGMAN SUPPORT: Falcon-2 escort fighter deployed.', 'powerup');

    this.emitStats();
    this.loop(this.lastTime);
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    if (!this.isRunning) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public destroy() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.removeEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  private removeEventListeners() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.heldKeys[e.code] = true;

    // Tactical Bomb edge-trigger
    if (e.code === 'KeyB' || e.code === 'KeyK') {
      if (this.isRunning && !this.isPaused) {
        this.triggerBomb();
      }
    }

    // Prevent default scroll on game keys
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.heldKeys[e.code] = false;
  };

  private handleBlur = () => {
    this.heldKeys = {};
    this.pointerPos.active = false;
  };

  // Pointer / Touch support for mobile & mouse
  public setPointer(x: number, y: number, active: boolean) {
    this.pointerPos.x = x;
    this.pointerPos.y = y;
    this.pointerPos.active = active;
  }

  private handleCompletedMissions(completed: DailyMission[]) {
    completed.forEach((m) => {
      soundSystem.playMissionComplete();
      this.createFloatingText(
        this.playerX,
        this.playerY - 55,
        `DIRECTIVE COMPLETE: ${m.title}!`,
        '#f59e0b',
        18
      );
      this.createFloatingText(
        this.playerX,
        this.playerY - 30,
        `REWARD: ${m.rewardLabel}`,
        '#38bdf8',
        15
      );

      // Instant battlefield combat power-up deployment
      if (m.rewardType === 'instant_bomb') {
        this.playerBombs++;
        this.createExplosion(this.playerX, this.playerY, 'small', '#f59e0b');
      } else if (m.rewardType === 'shield_overcharge') {
        this.bonusShieldCapacity += 50;
        this.playerShield = PLANE_CONFIGS[this.planeId].maxShield + this.bonusShieldCapacity;
        this.createExplosion(this.playerX, this.playerY, 'small', '#10b981');
      } else if (m.rewardType === 'hyper_cannons') {
        this.weaponLevel = Math.min(5, this.weaponLevel + 1);
        this.createExplosion(this.playerX, this.playerY, 'small', '#38bdf8');
      }

      if (this.callbacks.onMissionCompleted) {
        this.callbacks.onMissionCompleted(m);
      }
    });
  }

  public triggerBomb() {
    if (this.playerBombs <= 0 || this.bombEffectTimer > 0) return;

    this.playerBombs--;
    this.bombsUsed++;
    this.bombEffectTimer = 1.0;
    this.bombShockwaveRadius = 10;
    this.trauma = Math.min(1.0, this.trauma + 0.8);

    soundSystem.playBomb();
    soundSystem.playPilotChatter('bomb_authorized');

    // Damage all enemies on screen and wipe bullets
    this.bullets = this.bullets.filter(b => b.isPlayer);
    this.enemies.forEach(e => {
      e.hp -= 250;
      e.hitFlashTimer = 0.3;
      this.createExplosion(e.x, e.y, 'medium', '#38bdf8');
    });

    this.createFloatingText(this.playerX, this.playerY - 40, 'TACTICAL BOMB OVERDRIVE!', '#38bdf8', 18);

    // Report Bomb Mission
    const completed = missionManager.reportProgress('use_bombs', 1, 'add');
    if (completed.length > 0) {
      this.handleCompletedMissions(completed);
    }

    this.emitStats();
  }

  private loop = (now: number) => {
    if (!this.isRunning) return;

    if (this.isPaused) {
      this.render();
      return;
    }

    const rawDt = (now - this.lastTime) / 1000;
    const dt = Math.min(rawDt, 0.05); // Frame delta time clamp
    this.lastTime = now;

    // Simulation update with hitstop support
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
    } else {
      this.update(dt);
    }

    this.render();
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cfg = PLANE_CONFIGS[this.planeId];

    // Background scrolling
    const bgSpeed = (this.isBoosting ? 260 : 130) * dt;
    this.bgOffsetY += bgSpeed;

    this.clouds.forEach(c => {
      c.y += (c.speed + (this.isBoosting ? 80 : 0)) * dt;
      if (c.y > h + 100) {
        c.y = -100;
        c.x = Math.random() * w;
      }
    });

    this.islands.forEach(isl => {
      isl.y += bgSpeed * 0.6;
      if (isl.y > h + 200) {
        isl.y = -250;
        isl.x = Math.random() * w;
      }
    });

    // Screen Shake Trauma decay
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 1.8);
    }

    // Weather & Environmental Events Management
    if (this.activeWeather !== 'clear') {
      this.weatherTimer -= dt;
      if (this.weatherTimer <= 0) {
        this.activeWeather = 'clear';
        this.addCombatLog('Environmental hazard cleared. Weather returning to normal.', 'warning');
      } else {
        if (this.activeWeather === 'thunderstorm') {
          this.lightningFlashTimer -= dt;
          if (this.lightningFlashTimer <= 0) {
            this.lightningFlashTimer = 5.0 + Math.random() * 6.0;
            this.trauma = Math.min(1.0, this.trauma + 0.6);
            soundSystem.playExplosion('small');
            this.addCombatLog('LIGHTNING STRIKE! Electrostatic surge across shields.', 'warning');
            this.damagePlayer(12);
          }
          this.playerX += Math.sin(performance.now() * 0.003) * 55 * dt;
        } else if (this.activeWeather === 'asteroid_field') {
          if (Math.random() < dt * 1.2) {
            this.spawnAsteroid();
          }
        }
      }
    } else {
      this.weatherSpawnTimer -= dt;
      if (this.weatherSpawnTimer <= 0) {
        this.weatherSpawnTimer = 45.0;
        const roll = Math.random();
        this.triggerWeather(roll < 0.5 ? 'thunderstorm' : 'asteroid_field');
      }
    }

    // Update Asteroids
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const ast = this.asteroids[i];
      ast.x += ast.vx * dt;
      ast.y += ast.vy * dt;
      ast.rotation += ast.vRot * dt;

      if (ast.y > h + 100 || ast.x < -100 || ast.x > w + 100) {
        this.asteroids.splice(i, 1);
      }
    }

    // Bomb shockwave expanding
    if (this.bombEffectTimer > 0) {
      this.bombEffectTimer -= dt;
      this.bombShockwaveRadius += dt * 900;
    }

    // Boost & Invulnerability timers
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    const upg = upgradeManager.getCalculatedBonuses();

    // Boost meter recharge / depletion
    const boostPressed = this.heldKeys['ShiftLeft'] || this.heldKeys['ShiftRight'];
    if (boostPressed && this.boostGauge > 10) {
      this.isBoosting = true;
      this.boostGauge = Math.max(0, this.boostGauge - dt * 35);
    } else {
      this.isBoosting = false;
      this.boostGauge = Math.min(100, this.boostGauge + dt * 18 * upg.boostRechargeMultiplier);
    }

    // Shield passive recharge if not damaged recently
    const maxShieldWithUpg = cfg.maxShield + this.bonusShieldCapacity + upg.shieldBonus;
    if (this.playerShield < maxShieldWithUpg) {
      this.playerShield = Math.min(maxShieldWithUpg, this.playerShield + dt * 4);
    }

    // Combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.currentCombo = 0;
      }
    }

    // Handle Player Movement
    let dx = 0;
    let dy = 0;

    if (this.heldKeys['KeyA'] || this.heldKeys['ArrowLeft']) dx -= 1;
    if (this.heldKeys['KeyD'] || this.heldKeys['ArrowRight']) dx += 1;
    if (this.heldKeys['KeyW'] || this.heldKeys['ArrowUp']) dy -= 1;
    if (this.heldKeys['KeyS'] || this.heldKeys['ArrowDown']) dy += 1;

    // Pointer / Touch drag controls
    if (this.pointerPos.active) {
      const pdx = this.pointerPos.x - this.playerX;
      const pdy = this.pointerPos.y - this.playerY;
      const dist = Math.hypot(pdx, pdy);
      if (dist > 4) {
        dx = pdx / Math.max(dist, 1);
        dy = pdy / Math.max(dist, 1);
      }
    }

    // Smooth banking tilt
    this.playerTiltX += (dx - this.playerTiltX) * dt * 12;

    const currentSpeed = cfg.speed * (1 + upg.speedPercentBonus) * (this.isBoosting ? 1.55 : 1.0);
    this.playerX += dx * currentSpeed * dt;
    this.playerY += dy * currentSpeed * dt;

    // Clamp inside viewport
    const pad = 28;
    this.playerX = Math.max(pad, Math.min(w - pad, this.playerX));
    this.playerY = Math.max(pad, Math.min(h - pad, this.playerY));

    // Player Shooting
    const wantsToShoot = this.heldKeys['Space'] || this.heldKeys['KeyJ'] || this.pointerPos.active;
    this.shootCooldownTimer -= dt;
    this.missileCooldownTimer -= dt;

    if (wantsToShoot && this.shootCooldownTimer <= 0) {
      this.firePlayerWeapon();
    }

    if (this.missileCooldownTimer <= 0 && this.planeId === 'garuda' && this.enemies.length > 0) {
      this.fireHomingMissiles();
    }

    // Wingman update & targeting
    if (this.wingmanActive) {
      const targetWingX = this.playerX - 55;
      const targetWingY = this.playerY + 22;
      this.wingmanX += (targetWingX - this.wingmanX) * dt * 10;
      this.wingmanY += (targetWingY - this.wingmanY) * dt * 10;

      this.wingmanShootTimer -= dt;
      if (this.wingmanShootTimer <= 0 && this.enemies.length > 0) {
        this.wingmanShootTimer = 0.38;
        const closest = [...this.enemies].sort((a, b) => {
          return Math.hypot(a.x - this.wingmanX, a.y - this.wingmanY) - Math.hypot(b.x - this.wingmanX, b.y - this.wingmanY);
        })[0];
        if (closest) {
          const angle = Math.atan2(closest.y - this.wingmanY, closest.x - this.wingmanX);
          const vx = Math.cos(angle) * 780;
          const vy = Math.sin(angle) * 780;
          this.addBullet(this.wingmanX, this.wingmanY - 12, vx, vy, 3.5, 18, true, '#10b981', 'laser');
        }
      }

      this.wingmanTimer -= dt;
      if (this.wingmanTimer <= 0) {
        this.wingmanActive = false;
        this.wingmanCooldown = 35.0;
        this.addCombatLog('Wingman Falcon-2 returning to carrier for rearming.', 'warning');
      }
    } else {
      this.wingmanCooldown -= dt;
      if (this.wingmanCooldown <= 0) {
        this.wingmanActive = true;
        this.wingmanHp = 100;
        this.wingmanTimer = 50.0;
        this.wingmanX = this.playerX - 55;
        this.wingmanY = this.playerY + 22;
        this.addCombatLog('WINGMAN SUPPORT: Falcon-2 escort fighter redeployed.', 'powerup');
      }
    }

    // Update Entities
    this.updateBullets(dt);
    this.updateMissiles(dt);
    this.updateEnemies(dt);
    this.updatePowerups(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);

    // Wave Progression
    this.updateWaveManager(dt);

    // Collisions
    this.checkCollisions();

    // Notify HUD stats
    this.emitStats();

    // Record combat replay frame
    combatReplayBuffer.recordFrame({
      playerX: this.playerX,
      playerY: this.playerY,
      playerTiltX: this.playerTiltX,
      playerHp: this.playerHp,
      maxHp: cfg.maxHp,
      playerShield: this.playerShield,
      maxShield: cfg.maxShield + this.bonusShieldCapacity,
      planeId: this.planeId,
      isBoosting: this.isBoosting,
      score: this.score,
      wave: this.wave,
      enemies: this.enemies.map(e => ({
        type: e.type,
        x: e.x,
        y: e.y,
        hp: e.hp,
        maxHp: e.maxHp,
        width: e.width,
        height: e.height,
      })),
      bullets: this.bullets.map(b => ({
        x: b.x,
        y: b.y,
        color: b.color,
        isPlayer: b.isPlayer,
        radius: b.radius,
      })),
    });
  }

  private firePlayerWeapon() {
    const cfg = PLANE_CONFIGS[this.planeId];
    this.shotsFired++;

    if (this.planeId === 'garuda') {
      this.shootCooldownTimer = 0.12;
      soundSystem.playShoot('plasma');

      if (this.weaponLevel === 1) {
        this.addBullet(this.playerX - 9, this.playerY - 20, 0, -820, 3.5, 24, true, '#38bdf8', 'plasma');
        this.addBullet(this.playerX + 9, this.playerY - 20, 0, -820, 3.5, 24, true, '#38bdf8', 'plasma');
      } else if (this.weaponLevel === 2) {
        this.addBullet(this.playerX - 12, this.playerY - 20, -50, -820, 4, 26, true, '#38bdf8', 'plasma');
        this.addBullet(this.playerX, this.playerY - 24, 0, -860, 4, 28, true, '#67e8f9', 'plasma');
        this.addBullet(this.playerX + 12, this.playerY - 20, 50, -820, 4, 26, true, '#38bdf8', 'plasma');
      } else {
        // High level spread
        [-120, -40, 0, 40, 120].forEach(vx => {
          this.addBullet(this.playerX, this.playerY - 20, vx, -840, 4.5, 28, true, '#38bdf8', 'plasma');
        });
      }
    } else if (this.planeId === 'valkyrie') {
      this.shootCooldownTimer = 0.08;
      soundSystem.playShoot('laser');

      const spread = this.weaponLevel >= 3 ? 4 : 2;
      for (let i = 0; i < spread; i++) {
        const offset = (i - (spread - 1) / 2) * 12;
        const vx = offset * 4;
        this.addBullet(this.playerX + offset, this.playerY - 24, vx, -920, 3, 20, true, '#10b981', 'laser');
      }
    } else if (this.planeId === 'titan') {
      this.shootCooldownTimer = 0.15;
      soundSystem.playShoot('vulcan');

      const count = this.weaponLevel >= 3 ? 5 : 3;
      for (let i = 0; i < count; i++) {
        const angle = ((i - (count - 1) / 2) * 9 * Math.PI) / 180;
        const vx = Math.sin(angle) * 780;
        const vy = -Math.cos(angle) * 780;
        this.addBullet(this.playerX, this.playerY - 22, vx, vy, 5.5, 36, true, '#f59e0b', 'vulcan');
      }
    }
  }

  private fireHomingMissiles() {
    this.missileCooldownTimer = 1.2;
    soundSystem.playMissile();
    soundSystem.playPilotChatter('target_locked');

    // Find closest enemies
    const sorted = [...this.enemies].sort((a, b) => {
      const da = Math.hypot(a.x - this.playerX, a.y - this.playerY);
      const db = Math.hypot(b.x - this.playerX, b.y - this.playerY);
      return da - db;
    });

    [-18, 18].forEach((ox, idx) => {
      const target = sorted[idx] || sorted[0] || null;
      this.missiles.push({
        x: this.playerX + ox,
        y: this.playerY - 10,
        vx: ox * 4,
        vy: -200,
        targetId: target ? target.id : null,
        damage: 45,
        speed: 520,
        turnRate: 4.8,
        lifetime: 2.5,
        color: '#ef4444',
      });
    });
  }

  private addBullet(
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    damage: number,
    isPlayer: boolean,
    color: string,
    type: Bullet['type']
  ) {
    let finalDamage = damage;
    if (isPlayer) {
      const upg = upgradeManager.getCalculatedBonuses();
      finalDamage = Math.round(damage * (1 + upg.damageMultiplierBonus));
    }
    this.bullets.push({
      x,
      y,
      vx,
      vy,
      radius,
      damage: finalDamage,
      isPlayer,
      color,
      glowColor: color,
      type,
    });
  }

  private updateBullets(dt: number) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Despawn offscreen
      if (b.x < -30 || b.x > w + 30 || b.y < -40 || b.y > h + 40) {
        this.bullets.splice(i, 1);
      }
    }
  }

  private updateMissiles(dt: number) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.lifetime -= dt;

      // Target seeking
      let target = this.enemies.find(e => e.id === m.targetId);
      if (!target && this.enemies.length > 0) {
        target = this.enemies[0];
        m.targetId = target.id;
      }

      if (target) {
        const targetAngle = Math.atan2(target.y - m.y, target.x - m.x);
        const currentAngle = Math.atan2(m.vy, m.vx);
        let diff = targetAngle - currentAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), m.turnRate * dt);
        m.vx = Math.cos(newAngle) * m.speed;
        m.vy = Math.sin(newAngle) * m.speed;
      }

      m.x += m.vx * dt;
      m.y += m.vy * dt;

      // Smoke trail
      if (Math.random() < 0.6) {
        this.particles.push({
          x: m.x,
          y: m.y,
          vx: (Math.random() - 0.5) * 20,
          vy: 40 + Math.random() * 20,
          size: 3 + Math.random() * 3,
          alpha: 0.6,
          decay: 1.8,
          color: '#94a3b8',
          type: 'smoke',
          rotation: 0,
          vRot: 0,
        });
      }

      if (m.lifetime <= 0 || m.x < -40 || m.x > w + 40 || m.y < -40 || m.y > h + 40) {
        this.missiles.splice(i, 1);
      }
    }
  }

  private updateEnemies(dt: number) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.behaviorTimer += dt;

      if (e.hitFlashTimer > 0) {
        e.hitFlashTimer -= dt;
      }

      // Enemy specific movement patterns
      if (e.type === 'drone') {
        e.y += e.vy * dt;
        e.x += Math.sin(e.behaviorTimer * 4) * 140 * dt;
      } else if (e.type === 'scout') {
        e.y += e.vy * dt;
        e.x += e.vx * dt;
        if (e.x < 30 || e.x > w - 30) e.vx = -e.vx;
      } else if (e.type === 'gunship') {
        if (e.y < 160) {
          e.y += e.vy * dt;
        } else {
          e.x += Math.cos(e.behaviorTimer * 1.5) * 80 * dt;
        }
      } else if (e.type === 'bomber' || e.type === 'cruiser') {
        if (e.y < 120) {
          e.y += e.vy * dt;
        } else {
          e.x += Math.sin(e.behaviorTimer * 0.8) * 40 * dt;
        }
      } else if (e.type === 'boss') {
        // Boss flight behavior
        if (e.y < 140) {
          e.y += 60 * dt;
        } else {
          e.x += Math.sin(e.behaviorTimer * 1.2) * 110 * dt;
        }
        this.bossInstance = e;
      }

      // Enemy Shooting logic
      e.shootTimer -= dt;
      if (e.shootTimer <= 0 && e.y > 20 && e.y < h - 100) {
        this.enemyShoot(e);
        e.shootTimer = e.shootCooldown;
      }

      // Telegraph charge-up animation for heavy lasers
      if (e.telegraphTimer > 0) {
        e.telegraphTimer -= dt;
        if (e.telegraphTimer <= 0 && e.type === 'cruiser') {
          // Unleash high-damage vertical beam
          for (let b = 0; b < 6; b++) {
            this.addBullet(e.x, e.y + 40 + b * 20, 0, 620, 5, 25, false, '#f43f5e', 'enemy_laser');
          }
        }
      }

      // Offscreen despawn
      if (e.y > h + 100 && e.type !== 'boss') {
        this.enemies.splice(i, 1);
      }
    }
  }

  private enemyShoot(e: Enemy) {
    if (e.type === 'drone') {
      this.addBullet(e.x, e.y + 16, 0, 280, 4, 12, false, '#f43f5e', 'enemy_orb');
    } else if (e.type === 'scout') {
      // Aimed shot towards player
      const angle = Math.atan2(this.playerY - e.y, this.playerX - e.x);
      const vx = Math.cos(angle) * 320;
      const vy = Math.sin(angle) * 320;
      this.addBullet(e.x, e.y + 18, vx, vy, 4, 15, false, '#fb923c', 'enemy_orb');
    } else if (e.type === 'gunship') {
      // Twin spread
      this.addBullet(e.x - 16, e.y + 20, -60, 300, 4.5, 18, false, '#ec4899', 'enemy_orb');
      this.addBullet(e.x + 16, e.y + 20, 60, 300, 4.5, 18, false, '#ec4899', 'enemy_orb');
    } else if (e.type === 'bomber') {
      // Ring burst of 6 energy pellets
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI * 2) / 6;
        this.addBullet(e.x, e.y + 20, Math.cos(ang) * 220, Math.sin(ang) * 220, 4.5, 16, false, '#eab308', 'enemy_orb');
      }
    } else if (e.type === 'cruiser') {
      // Start laser telegraph
      e.telegraphTimer = e.telegraphMax;
    } else if (e.type === 'boss') {
      // Multi-pattern Boss Attack
      const hpPct = e.hp / e.maxHp;
      if (hpPct > 0.5) {
        // Phase 1: Alternating double fans
        for (let i = -2; i <= 2; i++) {
          const vx = i * 65;
          this.addBullet(e.x, e.y + 35, vx, 260, 5, 20, false, '#ef4444', 'enemy_orb');
        }
      } else {
        // Phase 2 / Enraged: Spiral bullet hell + aimed heavy missiles
        const angleOffset = e.behaviorTimer * 3.5;
        for (let i = 0; i < 4; i++) {
          const ang = angleOffset + (i * Math.PI) / 2;
          this.addBullet(e.x, e.y + 30, Math.cos(ang) * 240, Math.sin(ang) * 240, 5, 22, false, '#a855f7', 'enemy_orb');
        }
      }
    }
  }

  private updateWaveManager(dt: number) {
    if (this.isBossActive) return;

    this.waveTimer += dt;

    // Spawn regular wave enemies
    if (this.waveEnemiesSpawned < this.waveEnemiesTotal) {
      if (this.waveTimer > 1.2) {
        this.waveTimer = 0;
        this.spawnWaveGroup();
      }
    } else if (this.enemies.length === 0) {
      // Wave cleared! Check if boss wave or advance
      if (this.wave % 3 === 0) {
        this.spawnBoss();
      } else {
        this.advanceWave();
      }
    }
  }

  private spawnWaveGroup() {
    const w = this.canvas.width;
    const groupType = Math.random();

    if (groupType < 0.4) {
      // V-Formation of Scouts
      const count = 3;
      const startX = 60 + Math.random() * (w - 120);
      for (let i = 0; i < count; i++) {
        this.enemies.push({
          id: Math.random(),
          type: 'scout',
          x: startX + (i - 1) * 40,
          y: -40 - Math.abs(i - 1) * 30,
          vx: (Math.random() - 0.5) * 60,
          vy: 160 * this.difficultyMultiplier,
          hp: 35,
          maxHp: 35,
          width: 34,
          height: 32,
          shootCooldown: 2.2 / this.difficultyMultiplier,
          shootTimer: 0.8 + Math.random(),
          scoreValue: 150,
          hitFlashTimer: 0,
          telegraphTimer: 0,
          telegraphMax: 0,
          angle: 0,
          behaviorTimer: 0,
        });
        this.waveEnemiesSpawned++;
      }
    } else if (groupType < 0.75) {
      // Twin Gunship escort
      for (let i = 0; i < 2; i++) {
        this.enemies.push({
          id: Math.random(),
          type: 'gunship',
          x: (i === 0 ? 0.3 : 0.7) * w,
          y: -50 - i * 40,
          vx: 0,
          vy: 130 * this.difficultyMultiplier,
          hp: 85,
          maxHp: 85,
          width: 48,
          height: 42,
          shootCooldown: 2.0 / this.difficultyMultiplier,
          shootTimer: 1.0,
          scoreValue: 350,
          hitFlashTimer: 0,
          telegraphTimer: 0,
          telegraphMax: 0,
          angle: 0,
          behaviorTimer: 0,
        });
        this.waveEnemiesSpawned++;
      }
    } else {
      // Armored Cruiser or Bomber
      this.enemies.push({
        id: Math.random(),
        type: 'cruiser',
        x: w * 0.5,
        y: -90,
        vx: 0,
        vy: 80 * this.difficultyMultiplier,
        hp: 220,
        maxHp: 220,
        width: 72,
        height: 64,
        shootCooldown: 3.5 / this.difficultyMultiplier,
        shootTimer: 2.0,
        scoreValue: 750,
        hitFlashTimer: 0,
        telegraphTimer: 0,
        telegraphMax: 1.2,
        angle: 0,
        behaviorTimer: 0,
      });
      this.waveEnemiesSpawned++;
    }
  }

  private spawnBoss() {
    this.isBossActive = true;
    soundSystem.playBossWarning();
    soundSystem.playPilotChatter('flagship_detected');
    this.addCombatLog('WARNING: Hostile Capital Dreadnought incoming!', 'boss');

    this.createFloatingText(
      this.canvas.width / 2,
      this.canvas.height * 0.3,
      'WARNING: CAPITAL DREADNOUGHT INCOMING',
      '#ef4444',
      22
    );

    const bossHp = 1800 + this.wave * 400;
    this.enemies.push({
      id: 99999,
      type: 'boss',
      name: `CRIMSON TITAN MK-${Math.ceil(this.wave / 3)}`,
      x: this.canvas.width / 2,
      y: -120,
      vx: 0,
      vy: 40 * this.difficultyMultiplier,
      hp: bossHp,
      maxHp: bossHp,
      width: 130,
      height: 90,
      shootCooldown: 1.6 / this.difficultyMultiplier,
      shootTimer: 2.0,
      scoreValue: 5000,
      hitFlashTimer: 0,
      telegraphTimer: 0,
      telegraphMax: 1.4,
      angle: 0,
      behaviorTimer: 0,
      phase: 1,
    });
  }

  private advanceWave() {
    this.wave++;
    this.waveTimer = 0;
    this.waveEnemiesSpawned = 0;
    this.waveEnemiesTotal = 12 + this.wave * 3;
    this.callbacks.onSectorCleared(this.wave);
    soundSystem.playPilotChatter('sector_cleared');
    this.addCombatLog(`Sector ${this.wave} reached. Airspace sector secure.`, 'warning');

    this.createFloatingText(
      this.canvas.width / 2,
      this.canvas.height * 0.3,
      `SECTOR ${this.wave}: AIRSPACE SECURED`,
      '#38bdf8',
      20
    );

    // Report Sector advancement to Daily Missions
    const completed = missionManager.reportProgress('reach_sector', this.wave, 'set');
    if (completed.length > 0) {
      this.handleCompletedMissions(completed);
    }
  }

  private checkCollisions() {
    // 1. Player Bullets vs Enemies
    for (let bIdx = this.bullets.length - 1; bIdx >= 0; bIdx--) {
      const b = this.bullets[bIdx];
      if (!b.isPlayer) continue;

      for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
        const e = this.enemies[eIdx];
        const halfW = e.width / 2;
        const halfH = e.height / 2;

        if (b.x >= e.x - halfW && b.x <= e.x + halfW && b.y >= e.y - halfH && b.y <= e.y + halfH) {
          // Bullet hit
          this.shotsHit++;
          e.hp -= b.damage;
          e.hitFlashTimer = 0.08;
          soundSystem.playHit();

          this.createSpark(b.x, b.y, b.color);
          this.bullets.splice(bIdx, 1);

          if (e.hp <= 0) {
            this.destroyEnemy(e, eIdx);
          }
          break;
        }
      }
    }

    // Player Bullets vs Asteroids
    for (let bIdx = this.bullets.length - 1; bIdx >= 0; bIdx--) {
      const b = this.bullets[bIdx];
      if (!b.isPlayer) continue;

      for (let aIdx = this.asteroids.length - 1; aIdx >= 0; aIdx--) {
        const ast = this.asteroids[aIdx];
        if (Math.hypot(b.x - ast.x, b.y - ast.y) < ast.radius + b.radius) {
          ast.hp -= b.damage;
          this.createSpark(b.x, b.y, b.color);
          this.bullets.splice(bIdx, 1);
          if (ast.hp <= 0) {
            this.createExplosion(ast.x, ast.y, 'medium', '#f97316');
            this.score += 200;
            this.asteroids.splice(aIdx, 1);
            this.addCombatLog('Asteroid hazard pulverized.', 'kill');
          }
          break;
        }
      }
    }

    // Player vs Asteroids
    if (this.isRunning && this.playerHp > 0 && this.invulnerableTimer <= 0) {
      for (let aIdx = this.asteroids.length - 1; aIdx >= 0; aIdx--) {
        const ast = this.asteroids[aIdx];
        if (Math.hypot(this.playerX - ast.x, this.playerY - ast.y) < ast.radius + 18) {
          this.damagePlayer(25);
          this.createExplosion(ast.x, ast.y, 'medium', '#ef4444');
          this.asteroids.splice(aIdx, 1);
          this.addCombatLog('Collision with asteroid hazard!', 'warning');
          break;
        }
      }
    }
    for (let mIdx = this.missiles.length - 1; mIdx >= 0; mIdx--) {
      const m = this.missiles[mIdx];
      for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
        const e = this.enemies[eIdx];
        if (Math.hypot(m.x - e.x, m.y - e.y) < e.width / 2 + 8) {
          e.hp -= m.damage;
          e.hitFlashTimer = 0.12;
          this.createExplosion(m.x, m.y, 'small', '#ef4444');
          this.missiles.splice(mIdx, 1);

          if (e.hp <= 0) {
            this.destroyEnemy(e, eIdx);
          }
          break;
        }
      }
    }

    // Enemy Bullets vs Wingman
    if (this.wingmanActive) {
      for (let bIdx = this.bullets.length - 1; bIdx >= 0; bIdx--) {
        const b = this.bullets[bIdx];
        if (b.isPlayer) continue;
        if (Math.hypot(b.x - this.wingmanX, b.y - this.wingmanY) < b.radius + 16) {
          this.wingmanHp -= b.damage;
          this.bullets.splice(bIdx, 1);
          this.createSpark(this.wingmanX, this.wingmanY, '#10b981');
          if (this.wingmanHp <= 0) {
            this.wingmanActive = false;
            this.wingmanCooldown = 45.0;
            this.createExplosion(this.wingmanX, this.wingmanY, 'small', '#10b981');
            soundSystem.playPilotChatter('wingman_down');
            this.addCombatLog('WINGMAN DOWN: Falcon-2 shot down and forced to eject!', 'warning');
          }
          break;
        }
      }
    }

    // 3. Enemy Bullets vs Player
    if (this.invulnerableTimer <= 0) {
      const playerRadius = 8; // Generous tight hitbox for great dodging feel!

      for (let bIdx = this.bullets.length - 1; bIdx >= 0; bIdx--) {
        const b = this.bullets[bIdx];
        if (b.isPlayer) continue;

        if (Math.hypot(b.x - this.playerX, b.y - this.playerY) < b.radius + playerRadius) {
          this.damagePlayer(b.damage);
          this.bullets.splice(bIdx, 1);
          break;
        }
      }

      // 4. Enemy Body vs Player (Ramming)
      for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
        const e = this.enemies[eIdx];
        if (Math.hypot(e.x - this.playerX, e.y - this.playerY) < e.width / 2 + playerRadius) {
          this.damagePlayer(40);
          e.hp -= 100;
          if (e.hp <= 0) this.destroyEnemy(e, eIdx);
          break;
        }
      }
    }

    // 5. Player vs Powerups
    for (let pIdx = this.powerups.length - 1; pIdx >= 0; pIdx--) {
      const p = this.powerups[pIdx];
      if (Math.hypot(p.x - this.playerX, p.y - this.playerY) < 32) {
        this.collectPowerup(p);
        this.powerups.splice(pIdx, 1);
      }
    }
  }

  private destroyEnemy(e: Enemy, index: number) {
    this.enemies.splice(index, 1);
    this.enemiesKilled++;

    const newlyCompleted: DailyMission[] = [];
    newlyCompleted.push(...missionManager.reportProgress('kill_enemies', 1, 'add'));

    // Hitstop freeze on heavy explosions
    if (e.type === 'boss') {
      this.hitstopTimer = 0.08;
      this.trauma = 0.8;
      soundSystem.playExplosion('boss');
      this.bossesDefeated++;
      this.isBossActive = false;
      this.bossInstance = null;
      this.addCombatLog('Capital Dreadnought neutralized! +5000 PTS', 'boss');
      this.createFloatingText(e.x, e.y, 'BOSS ANNIHILATED +5000', '#fbbf24', 24);

      newlyCompleted.push(...missionManager.reportProgress('kill_bosses', 1, 'add'));
      this.advanceWave();
    } else if (e.type === 'cruiser' || e.type === 'bomber' || e.type === 'gunship' || e.type === 'scout') {
      this.eliteEnemiesKilled++;
      this.hitstopTimer = 0.04;
      this.trauma = 0.4;
      soundSystem.playExplosion('medium');
      this.addCombatLog(`Hostile ${e.type} destroyed.`, 'kill');
    } else {
      this.regularEnemiesKilled++;
      soundSystem.playExplosion('small');
      this.addCombatLog(`Hostile ${e.type} downed.`, 'kill');
    }

    // Explosion particles
    this.createExplosion(e.x, e.y, e.type === 'boss' ? 'boss' : 'medium', '#f97316');

    // Combo system & score
    this.currentCombo++;
    this.comboTimer = 2.8;
    if (this.currentCombo > this.maxCombo) {
      this.maxCombo = this.currentCombo;
    }

    newlyCompleted.push(...missionManager.reportProgress('reach_combo', this.currentCombo, 'set'));

    if (newlyCompleted.length > 0) {
      this.handleCompletedMissions(newlyCompleted);
    }

    // Score calculation with dynamic combo multiplier + daily mission bonus multiplier
    const comboMultiplier = 1 + Math.floor(this.currentCombo / 5) * 0.5;
    const missionBonusMultiplier = missionManager.getTotalScoreMultiplierBonus();
    const totalMultiplier = comboMultiplier * (1 + missionBonusMultiplier);
    const finalPoints = Math.round(e.scoreValue * totalMultiplier);
    this.score += finalPoints;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('sky_raider_highscore', this.highScore.toString());
      } catch {
        // Safe storage ignore
      }
    }

    const pointLabel = missionBonusMultiplier > 0 ? `+${finalPoints} (x${totalMultiplier.toFixed(1)})` : `+${finalPoints}`;
    this.createFloatingText(e.x, e.y, pointLabel, '#f8fafc', 14);

    // Drop Powerups with weighted probabilities
    const dropRoll = Math.random();
    if (dropRoll < 0.28 || e.type === 'boss') {
      let pType: PowerupType = 'star';
      if (dropRoll < 0.08) pType = 'power';
      else if (dropRoll < 0.16) pType = 'shield';
      else if (dropRoll < 0.22) pType = 'bomb';

      this.powerups.push({
        x: e.x,
        y: e.y,
        vx: (Math.random() - 0.5) * 40,
        vy: 80,
        type: pType,
        bobPhase: Math.random() * Math.PI,
        value: pType === 'star' ? 200 : 1,
        radius: 14,
      });
    }
  }

  private collectPowerup(p: Powerup) {
    soundSystem.playPowerup();
    this.powerupsCollected++;
    const cfg = PLANE_CONFIGS[this.planeId];
    this.addCombatLog(`Power-up acquired: ${p.type.toUpperCase()}`, 'powerup');

    const completed = missionManager.reportProgress('collect_powerups', 1, 'add');
    if (completed.length > 0) {
      this.handleCompletedMissions(completed);
    }

    if (p.type === 'power') {
      this.weaponLevel = Math.min(5, this.weaponLevel + 1);
      this.createFloatingText(this.playerX, this.playerY - 30, `FIREPOWER LVL ${this.weaponLevel}`, '#38bdf8', 16);
    } else if (p.type === 'shield') {
      const maxShieldTotal = cfg.maxShield + this.bonusShieldCapacity;
      this.playerShield = Math.min(maxShieldTotal, this.playerShield + 40);
      this.createFloatingText(this.playerX, this.playerY - 30, 'SHIELDS RESTORED', '#10b981', 16);
    } else if (p.type === 'bomb') {
      const maxBombsTotal = cfg.maxBombs + missionManager.getExtraBombBonus();
      this.playerBombs = Math.min(maxBombsTotal, this.playerBombs + 1);
      this.createFloatingText(this.playerX, this.playerY - 30, '+1 OVERDRIVE BOMB', '#f59e0b', 16);
    } else {
      const missionBonus = missionManager.getTotalScoreMultiplierBonus();
      const bonusPts = Math.round(500 * (1 + missionBonus));
      this.score += bonusPts;
      this.createFloatingText(this.playerX, this.playerY - 30, `+${bonusPts} BONUS`, '#fbbf24', 16);
    }
  }

  private damagePlayer(amount: number) {
    soundSystem.playShieldHit();
    this.trauma = Math.min(1.0, this.trauma + 0.35);
    this.addCombatLog(`Warning: Armor sustaining enemy fire!`, 'warning');

    if (this.playerShield > 0) {
      this.playerShield -= amount;
      if (this.playerShield < 0) {
        this.playerHp += this.playerShield; // bleed through to hp
        this.playerShield = 0;
      }
    } else {
      this.playerHp -= amount;
    }

    if (this.playerShield < 25 || this.playerHp < 35) {
      soundSystem.playPilotChatter('shields_failing');
    }

    this.createExplosion(this.playerX, this.playerY, 'small', '#38bdf8');

    // Brief invulnerability to prevent instant multi-hit deletion
    this.invulnerableTimer = 0.8;

    if (this.playerHp <= 0) {
      this.playerHp = 0;
      this.onPlayerDeath();
    }
  }

  private onPlayerDeath() {
    this.isRunning = false;
    combatReplayBuffer.stopRecording();
    soundSystem.playExplosion('boss');
    this.createExplosion(this.playerX, this.playerY, 'boss', '#ef4444');

    const stats = this.getCurrentStats();
    setTimeout(() => {
      this.callbacks.onGameOver(stats);
    }, 700);
  }

  private createSpark(x: number, y: number, color: string) {
    for (let i = 0; i < 4; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 90;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: 2 + Math.random() * 2,
        alpha: 1,
        decay: 3.5,
        color,
        type: 'spark',
        rotation: 0,
        vRot: 0,
      });
    }
  }

  private createExplosion(x: number, y: number, size: 'small' | 'medium' | 'boss', primaryColor: string) {
    const count = size === 'boss' ? 70 : size === 'medium' ? 30 : 16;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (size === 'boss' ? 120 : 60) + Math.random() * (size === 'boss' ? 240 : 140);
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: (size === 'boss' ? 6 : 4) + Math.random() * 6,
        alpha: 1,
        decay: 1.2 + Math.random() * 1.5,
        color: Math.random() < 0.6 ? primaryColor : '#f97316',
        type: Math.random() < 0.3 ? 'debris' : 'fire',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 6,
      });
    }
  }

  private createFloatingText(x: number, y: number, text: string, color: string, size: number) {
    this.floatingTexts.push({
      x,
      y,
      vy: -50,
      text,
      color,
      alpha: 1,
      size,
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
      p.alpha -= p.decay * dt;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updatePowerups(dt: number) {
    const h = this.canvas.height;
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.bobPhase += dt * 3;
      p.x += Math.sin(p.bobPhase) * 30 * dt;
      p.y += p.vy * dt;

      if (p.y > h + 40) {
        this.powerups.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 1.2;

      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private emitStats() {
    this.callbacks.onStatsUpdate(this.getCurrentStats());
  }

  public getCurrentStats(): GameStats {
    const cfg = PLANE_CONFIGS[this.planeId];
    const comboMultiplier = 1 + Math.floor(this.currentCombo / 5) * 0.5;
    const missionBonusMultiplier = missionManager.getTotalScoreMultiplierBonus();
    const totalScoreMultiplier = comboMultiplier * (1 + missionBonusMultiplier);

    return {
      score: this.score,
      highScore: this.highScore,
      scoreMultiplier: totalScoreMultiplier,
      missionBonusMultiplier,
      wave: this.wave,
      sectorName: `SECTOR ${this.wave}: ${this.wave % 3 === 0 ? 'HOSTILE FLAGSHIP' : 'ARCHIPELAGO PATROL'}`,
      hp: this.playerHp,
      maxHp: cfg.maxHp,
      shield: this.playerShield,
      maxShield: cfg.maxShield + this.bonusShieldCapacity,
      weaponLevel: this.weaponLevel,
      bombs: this.playerBombs,
      maxBombs: cfg.maxBombs + missionManager.getExtraBombBonus(),
      boostGauge: this.boostGauge,
      isBoosting: this.isBoosting,
      enemiesKilled: this.enemiesKilled,
      regularEnemiesKilled: this.regularEnemiesKilled,
      eliteEnemiesKilled: this.eliteEnemiesKilled,
      bossesDefeated: this.bossesDefeated,
      shotsFired: this.shotsFired,
      shotsHit: this.shotsHit,
      currentCombo: this.currentCombo,
      comboTimer: this.comboTimer,
      maxCombo: this.maxCombo,
      bombsUsed: this.bombsUsed,
      powerupsCollected: this.powerupsCollected,
      bossHp: this.bossInstance ? this.bossInstance.hp : null,
      bossMaxHp: this.bossInstance ? this.bossInstance.maxHp : null,
      bossName: this.bossInstance ? (this.bossInstance.name || 'CRIMSON TITAN') : null,
      activeMissions: missionManager.getMissions(),
      combatLogs: this.combatLogs,
      aceRating: pilotManager.getAceRating().rating,
      aceTitle: pilotManager.getAceRating().title,
      activeWeather: this.activeWeather,
      weatherTimer: this.weatherTimer,
      wingmanActive: this.wingmanActive,
      wingmanHp: this.wingmanHp,
      wingmanMaxHp: this.wingmanMaxHp,
      wingmanTimer: this.wingmanActive ? this.wingmanTimer : this.wingmanCooldown,
    };
  }

  // ================= Rendering System =================

  private render() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.save();

    // Camera Shake (trauma squared for punchy decay)
    if (this.trauma > 0) {
      const shakeMag = this.trauma * this.trauma * 14;
      const ox = (Math.random() * 2 - 1) * shakeMag;
      const oy = (Math.random() * 2 - 1) * shakeMag;
      ctx.translate(ox, oy);
    }

    // 1. Deep Ocean / Archipelago Background
    ctx.fillStyle = '#061325';
    ctx.fillRect(0, 0, w, h);

    // Subtle water depth contours
    const waterGrad = ctx.createLinearGradient(0, 0, 0, h);
    waterGrad.addColorStop(0, '#061325');
    waterGrad.addColorStop(0.5, '#081d39');
    waterGrad.addColorStop(1, '#06162a');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, w, h);

    // Parallax Islands
    this.renderIslands(ctx);

    // Parallax Clouds (lower layer)
    this.renderClouds(ctx);

    // Afterburner Speed lines
    if (this.isBoosting) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 14; i++) {
        const sx = (i / 14) * w + (Math.random() * 20 - 10);
        const sy = Math.random() * h;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, sy + 60 + Math.random() * 50);
        ctx.stroke();
      }
    }

    // 2. Powerups
    this.renderPowerups(ctx);

    // Render Asteroid Hazards
    this.asteroids.forEach(ast => {
      ctx.save();
      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.rotation);
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, ast.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(-ast.radius * 0.3, -ast.radius * 0.2, ast.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Thunderstorm lightning flash overlay
    if (this.activeWeather === 'thunderstorm' && this.lightningFlashTimer < 0.25) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(0, 0, w, h);
    }

    // 3. Enemies & Telegraph Beams
    this.renderEnemies(ctx);

    // 4. Bullets & Missiles
    this.renderBullets(ctx);
    this.renderMissiles(ctx);

    // Render Wingman Escort
    if (this.wingmanActive) {
      drawWingman(ctx, this.wingmanX, this.wingmanY);
    }

    // 5. Player Aircraft
    if (this.isRunning && this.playerHp > 0) {
      drawFighterJet(
        ctx,
        this.playerX,
        this.playerY,
        this.planeId,
        this.playerTiltX,
        this.isBoosting,
        this.invulnerableTimer > 0
      );

      // Energy Shield Bubble if shield active
      if (this.playerShield > 10) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.playerX, this.playerY - 2, 30, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.2 + (this.playerShield / 100) * 0.3})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 6. Particles & Explosions
    this.renderParticles(ctx);

    // 7. Tactical Bomb Shockwave
    if (this.bombEffectTimer > 0) {
      ctx.save();
      const bAlpha = this.bombEffectTimer;
      ctx.beginPath();
      ctx.arc(this.playerX, this.playerY, this.bombShockwaveRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(56, 189, 248, ${bAlpha})`;
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 255, 255, ${bAlpha * 0.2})`;
      ctx.fill();
      ctx.restore();
    }

    // 8. Floating Combat Text
    this.renderFloatingTexts(ctx);

    ctx.restore();
  }

  private renderIslands(ctx: CanvasRenderingContext2D) {
    this.islands.forEach(isl => {
      ctx.save();
      ctx.translate(isl.x, isl.y);

      // Island Beach Reef Ring
      ctx.fillStyle = '#0f766e';
      ctx.beginPath();
      ctx.ellipse(0, 0, isl.width / 2 + 10, isl.height / 2 + 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Island Landmass
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.ellipse(0, 0, isl.width / 2, isl.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  private renderClouds(ctx: CanvasRenderingContext2D) {
    this.clouds.forEach(c => {
      ctx.save();
      const grad = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, c.size);
      grad.addColorStop(0, `rgba(255, 255, 255, ${c.alpha})`);
      grad.addColorStop(0.7, `rgba(226, 232, 240, ${c.alpha * 0.5})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  private renderPowerups(ctx: CanvasRenderingContext2D) {
    this.powerups.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);

      // Rotating glow badge
      ctx.shadowBlur = 10;
      let badgeColor = '#38bdf8';
      let symbol = 'P';
      if (p.type === 'shield') {
        badgeColor = '#10b981';
        symbol = 'S';
      } else if (p.type === 'bomb') {
        badgeColor = '#f59e0b';
        symbol = 'B';
      } else if (p.type === 'star') {
        badgeColor = '#fbbf24';
        symbol = '★';
      }

      ctx.shadowColor = badgeColor;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = badgeColor;
      ctx.font = 'bold 12px Chakra Petch, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol, 0, 1);

      ctx.restore();
    });
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    this.enemies.forEach(e => {
      ctx.save();
      ctx.translate(e.x, e.y);

      // Telegraph aiming laser line for Cruisers
      if (e.telegraphTimer > 0) {
        ctx.save();
        const tAlpha = (1 - e.telegraphTimer / e.telegraphMax) * 0.8;
        ctx.strokeStyle = `rgba(239, 68, 68, ${tAlpha})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(0, 700);
        ctx.stroke();
        ctx.restore();
      }

      // Hit flash silhouette
      if (e.hitFlashTimer > 0) {
        ctx.fillStyle = '#ffffff';
      }

      if (e.type === 'drone') {
        ctx.fillStyle = e.hitFlashTimer > 0 ? '#fff' : '#475569';
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(14, -10);
        ctx.lineTo(-14, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Eye sensor
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'scout') {
        ctx.fillStyle = e.hitFlashTimer > 0 ? '#fff' : '#1e293b';
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(16, 2);
        ctx.lineTo(12, -14);
        ctx.lineTo(-12, -14);
        ctx.lineTo(-16, 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (e.type === 'gunship') {
        ctx.fillStyle = e.hitFlashTimer > 0 ? '#fff' : '#334155';
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(-22, -16, 44, 32);
        ctx.fill();
        ctx.stroke();

        // Dual gun pods
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-20, 10, 8, 12);
        ctx.fillRect(12, 10, 8, 12);
      } else if (e.type === 'cruiser') {
        ctx.fillStyle = e.hitFlashTimer > 0 ? '#fff' : '#0f172a';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 32);
        ctx.lineTo(32, 10);
        ctx.lineTo(34, -28);
        ctx.lineTo(-34, -28);
        ctx.lineTo(-32, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Bridge Core
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'boss') {
        // Massive Dreadnought Flagship
        ctx.fillStyle = e.hitFlashTimer > 0 ? '#ffffff' : '#18181b';
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(0, 42);
        ctx.lineTo(40, 20);
        ctx.lineTo(65, 0);
        ctx.lineTo(55, -40);
        ctx.lineTo(0, -32);
        ctx.lineTo(-55, -40);
        ctx.lineTo(-65, 0);
        ctx.lineTo(-40, 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pulsing Boss Core
        const coreAlpha = 0.5 + Math.sin(Date.now() * 0.008) * 0.4;
        ctx.fillStyle = `rgba(239, 68, 68, ${coreAlpha})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 5, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  private renderBullets(ctx: CanvasRenderingContext2D) {
    this.bullets.forEach(b => {
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = b.glowColor;

      if (b.type === 'laser') {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x - 2, b.y - 12, 4, 24);
      } else if (b.type === 'vulcan') {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Plasma / Energy Orbs
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.radius, b.radius * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // White hot center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  private renderMissiles(ctx: CanvasRenderingContext2D) {
    this.missiles.forEach(m => {
      ctx.save();
      ctx.translate(m.x, m.y);
      const angle = Math.atan2(m.vy, m.vx) + Math.PI / 2;
      ctx.rotate(angle);

      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-2, -6, 4, 12);

      // Red tip
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-2, -6);
      ctx.lineTo(0, -10);
      ctx.lineTo(2, -6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.type === 'smoke') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'debris') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.size}px 'Chakra Petch', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }
}
