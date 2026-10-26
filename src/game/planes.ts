import { PlaneConfig, PlaneId } from './types';

export const PLANE_CONFIGS: Record<PlaneId, PlaneConfig> = {
  garuda: {
    id: 'garuda',
    name: 'Garuda-X',
    codename: 'Strike Falcon',
    tagline: 'Superior Air Dominance',
    speed: 340,
    firepower: 4,
    maxHp: 100,
    maxShield: 80,
    maxBombs: 3,
    primaryColor: '#38bdf8', // Sky cyan
    accentColor: '#ef4444',  // Crimson red
    glowColor: 'rgba(56, 189, 248, 0.6)',
    description: 'Balanced multirole tactical jet equipped with twin plasma auto-cannons and autonomous micro-missile interceptors.',
    specialWeaponName: 'Micro-Missile Pod',
  },
  valkyrie: {
    id: 'valkyrie',
    name: 'Phantom Valkyrie',
    codename: 'Stealth Interceptor',
    tagline: 'Hypersonic Agility',
    speed: 400,
    firepower: 5,
    maxHp: 75,
    maxShield: 100,
    maxBombs: 3,
    primaryColor: '#10b981', // Emerald green
    accentColor: '#06b6d4',  // Cyan
    glowColor: 'rgba(16, 185, 129, 0.6)',
    description: 'Ultra-fast forward-swept wing stealth jet firing concentrated high-frequency laser streams and piercing beams.',
    specialWeaponName: 'Phase Laser Array',
  },
  titan: {
    id: 'titan',
    name: 'Titan Fortress',
    codename: 'Heavy Dreadnought',
    tagline: 'Heavy Armored Siege',
    speed: 280,
    firepower: 5,
    maxHp: 150,
    maxShield: 60,
    maxBombs: 4,
    primaryColor: '#f59e0b', // Amber gold
    accentColor: '#ea580c',  // Deep orange
    glowColor: 'rgba(245, 158, 11, 0.6)',
    description: 'Heavily armored aerial gunship featuring twin rotary vulcan cannons with explosive flak spread.',
    specialWeaponName: 'Rotary Vulcan Flak',
  },
};

/**
 * Draws high-precision vector aircraft onto the canvas
 */
export function drawFighterJet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  planeId: PlaneId,
  tiltX: number = 0, // -1 to 1 for banking roll
  isBoosting: boolean = false,
  invulnerableFlash: boolean = false
) {
  ctx.save();
  ctx.translate(x, y);

  if (invulnerableFlash) {
    ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.03) * 0.4;
  }

  // Slight roll rotation and scale squash-and-stretch
  const rollAngle = tiltX * 0.15;
  ctx.rotate(rollAngle);
  const squashX = 1 - Math.abs(tiltX) * 0.12;
  ctx.scale(squashX, 1);

  const cfg = PLANE_CONFIGS[planeId];

  // Draw Thruster Plumes / Engine Afterburners
  const flameLength = isBoosting ? 26 + Math.random() * 8 : 14 + Math.random() * 5;
  const flameWidth = isBoosting ? 7 : 4;

  if (planeId === 'garuda') {
    // Twin engines
    drawThrusterFlame(ctx, -7, 24, flameLength, flameWidth, '#38bdf8', '#ffffff');
    drawThrusterFlame(ctx, 7, 24, flameLength, flameWidth, '#38bdf8', '#ffffff');

    // Plane Body: Garuda-X
    ctx.shadowBlur = 10;
    ctx.shadowColor = cfg.glowColor;

    // Wings
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(8, -6);
    ctx.lineTo(26, 8);
    ctx.lineTo(28, 18);
    ctx.lineTo(16, 16);
    ctx.lineTo(12, 22);
    ctx.lineTo(6, 24);
    ctx.lineTo(0, 20);
    ctx.lineTo(-6, 24);
    ctx.lineTo(-12, 22);
    ctx.lineTo(-16, 16);
    ctx.lineTo(-28, 18);
    ctx.lineTo(-26, 8);
    ctx.lineTo(-8, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Red Canards & Wingtips (Indonesian Red Accent)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(22, 10);
    ctx.lineTo(28, 18);
    ctx.lineTo(24, 18);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-22, 10);
    ctx.lineTo(-28, 18);
    ctx.lineTo(-24, 18);
    ctx.closePath();
    ctx.fill();

    // Central Fuselage
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(5, -10);
    ctx.lineTo(5, 16);
    ctx.lineTo(0, 21);
    ctx.lineTo(-5, 16);
    ctx.lineTo(-5, -10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Glass Cockpit
    const grad = ctx.createLinearGradient(0, -18, 0, -6);
    grad.addColorStop(0, '#e0f2fe');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, -10, 2.5, 7, 0, 0, Math.PI * 2);
    ctx.fill();

  } else if (planeId === 'valkyrie') {
    // Single Central High-Tech Vector Thruster
    drawThrusterFlame(ctx, 0, 25, flameLength * 1.2, flameWidth * 1.3, '#10b981', '#a7f3d0');

    ctx.shadowBlur = 12;
    ctx.shadowColor = cfg.glowColor;

    // Forward-swept wings
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(7, -8);
    ctx.lineTo(28, -12); // Forward sweep!
    ctx.lineTo(24, 6);
    ctx.lineTo(12, 14);
    ctx.lineTo(6, 24);
    ctx.lineTo(0, 22);
    ctx.lineTo(-6, 24);
    ctx.lineTo(-12, 14);
    ctx.lineTo(-24, 6);
    ctx.lineTo(-28, -12);
    ctx.lineTo(-7, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing edge neon green accents
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, -7);
    ctx.lineTo(27, -11);
    ctx.moveTo(-8, -7);
    ctx.lineTo(-27, -11);
    ctx.stroke();

    // Fuselage
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(4, -4);
    ctx.lineTo(4, 18);
    ctx.lineTo(0, 22);
    ctx.lineTo(-4, 18);
    ctx.lineTo(-4, -4);
    ctx.closePath();
    ctx.fill();

    // Stealth Cockpit
    const grad = ctx.createLinearGradient(0, -18, 0, -4);
    grad.addColorStop(0, '#6ee7b7');
    grad.addColorStop(1, '#047857');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, -8, 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();

  } else if (planeId === 'titan') {
    // Quad Thrusters
    drawThrusterFlame(ctx, -14, 22, flameLength, flameWidth, '#f59e0b', '#fef3c7');
    drawThrusterFlame(ctx, -7, 25, flameLength * 1.1, flameWidth, '#ea580c', '#ffffff');
    drawThrusterFlame(ctx, 7, 25, flameLength * 1.1, flameWidth, '#ea580c', '#ffffff');
    drawThrusterFlame(ctx, 14, 22, flameLength, flameWidth, '#f59e0b', '#fef3c7');

    ctx.shadowBlur = 12;
    ctx.shadowColor = cfg.glowColor;

    // Heavy broad armored fuselage
    ctx.fillStyle = '#1e1e24';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(10, -14);
    ctx.lineTo(22, -8);
    ctx.lineTo(30, 8);
    ctx.lineTo(28, 20);
    ctx.lineTo(16, 22);
    ctx.lineTo(12, 18);
    ctx.lineTo(8, 24);
    ctx.lineTo(0, 22);
    ctx.lineTo(-8, 24);
    ctx.lineTo(-12, 18);
    ctx.lineTo(-16, 22);
    ctx.lineTo(-28, 20);
    ctx.lineTo(-30, 8);
    ctx.lineTo(-22, -8);
    ctx.lineTo(-10, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dual vulcan barrels on wings
    ctx.fillStyle = '#475569';
    ctx.fillRect(-23, -16, 3, 16);
    ctx.fillRect(20, -16, 3, 16);

    // Armor plating lines
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(16, 0);
    ctx.moveTo(-10, 8);
    ctx.lineTo(10, 8);
    ctx.stroke();

    // Reinforced Cockpit
    const grad = ctx.createLinearGradient(0, -16, 0, -4);
    grad.addColorStop(0, '#fde68a');
    grad.addColorStop(1, '#b45309');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, -7, 3.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Small wingtip aerodynamic vortices
  if (isBoosting || Math.abs(tiltX) > 0.4) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(26, 12);
    ctx.lineTo(26, 28 + Math.random() * 8);
    ctx.moveTo(-26, 12);
    ctx.lineTo(-26, 28 + Math.random() * 8);
    ctx.stroke();
  }

  ctx.restore();
}

function drawThrusterFlame(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  len: number,
  w: number,
  coreColor: string,
  innerColor: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ox - w, oy);
  ctx.quadraticCurveTo(ox, oy + len * 0.7, ox, oy + len);
  ctx.quadraticCurveTo(ox, oy + len * 0.7, ox + w, oy);
  ctx.closePath();

  const grad = ctx.createLinearGradient(ox, oy, ox, oy + len);
  grad.addColorStop(0, innerColor);
  grad.addColorStop(0.4, coreColor);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

export function drawWingman(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';

  // Thruster
  drawThrusterFlame(ctx, 0, 16, 10, 3, '#10b981', '#a7f3d0');

  // Wingman body (compact escort drone jet)
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(6, -4);
  ctx.lineTo(18, 6);
  ctx.lineTo(12, 14);
  ctx.lineTo(0, 10);
  ctx.lineTo(-12, 14);
  ctx.lineTo(-18, 6);
  ctx.lineTo(-6, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cockpit
  ctx.fillStyle = '#34d399';
  ctx.beginPath();
  ctx.ellipse(0, -6, 1.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
