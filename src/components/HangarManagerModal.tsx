import React, { useState, useEffect, useRef } from 'react';
import { PlaneId } from '../game/types';
import { PLANE_CONFIGS, drawFighterJet } from '../game/planes';
import { careerManager } from '../game/career';
import {
  upgradeManager,
  UpgradeComponentType,
  UPGRADE_SPECS,
  UPGRADE_LEVEL_COSTS,
} from '../game/upgrades';
import { soundSystem } from '../game/audio';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  Shield,
  Crosshair,
  Award,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Wrench,
  ShieldCheck,
} from 'lucide-react';

interface HangarManagerModalProps {
  onClose: () => void;
  selectedPlaneId: PlaneId;
  onSelectPlane: (planeId: PlaneId) => void;
  onUpgradesUpdated?: () => void;
}

export const HangarManagerModal: React.FC<HangarManagerModalProps> = ({
  onClose,
  selectedPlaneId,
  onSelectPlane,
  onUpgradesUpdated,
}) => {
  const [careerData, setCareerData] = useState(() => careerManager.getData());
  const [levels, setLevels] = useState(() => upgradeManager.getLevels());
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const bonuses = upgradeManager.getCalculatedBonuses();
  const powerRating = upgradeManager.calculatePowerRating();
  const currentPlane = PLANE_CONFIGS[selectedPlaneId];

  // Draw active jet preview in canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tilt = 0;
    let tiltDir = 1;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle bank rotation preview
      tilt += 0.015 * tiltDir;
      if (tilt > 0.4) tiltDir = -1;
      if (tilt < -0.4) tiltDir = 1;

      drawFighterJet(
        ctx,
        canvas.width / 2,
        canvas.height / 2 + 5,
        selectedPlaneId,
        tilt,
        true, // Show boosting thrusters!
        false
      );

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [selectedPlaneId, levels]);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleUpgrade = (type: UpgradeComponentType) => {
    const result = upgradeManager.upgradeComponent(type);
    if (result.success) {
      soundSystem.playPowerup();
      setCareerData({ ...careerManager.getData() });
      setLevels(upgradeManager.getLevels());
      if (onUpgradesUpdated) onUpgradesUpdated();
    } else {
      soundSystem.playHit();
    }
  };

  const handleResetUpgrades = () => {
    const { refundedXp } = upgradeManager.resetUpgrades();
    soundSystem.playPowerup();
    setCareerData({ ...careerManager.getData() });
    setLevels(upgradeManager.getLevels());
    setShowResetConfirm(false);
    if (onUpgradesUpdated) onUpgradesUpdated();
  };

  const planesList: PlaneId[] = ['garuda', 'valkyrie', 'titan'];

  const getComponentIcon = (type: UpgradeComponentType) => {
    switch (type) {
      case 'engine':
        return <Zap className="w-5 h-5 text-sky-400" />;
      case 'armor':
        return <Shield className="w-5 h-5 text-emerald-400" />;
      case 'weapons':
        return <Crosshair className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 select-none font-display backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="bg-slate-900 border border-slate-700/90 rounded-2xl p-5 sm:p-6 max-w-4xl w-full shadow-2xl text-slate-100 relative max-h-[94vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Hangar Manager"
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-2 mb-1">
          <Wrench className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-semibold">
            TACTICAL HANGAR & META-PROGRESSION BAY
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-wider">
              JET CUSTOMIZATION & UPGRADES
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Allocate accumulated Career XP to enhance engine performance, hull armor & tactical cannons.
            </p>
          </div>

          {/* XP Balance & Power Rating Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-cyan-500/40 rounded-xl shadow-[0_0_12px_rgba(56,189,248,0.2)]">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin-slow" />
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-slate-400 uppercase">CAREER XP BALANCE</span>
                <span className="text-sm font-bold font-mono text-cyan-300 tabular-nums">
                  {careerData.xp.toLocaleString()} XP
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-amber-500/40 rounded-xl shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Award className="w-4 h-4 text-amber-400" />
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-slate-400 uppercase">POWER RATING</span>
                <span className="text-sm font-bold font-mono text-amber-300 tabular-nums">
                  {powerRating} PWR
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Fighter Jet Display & Preview Banner */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center gap-6">
          {/* Plane Switcher & Interactive Canvas */}
          <div className="flex flex-col items-center shrink-0 w-full md:w-56">
            <div className="relative w-full h-36 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
              <canvas ref={canvasRef} width={200} height={140} className="block" />

              {/* Plane Navigation Buttons */}
              <button
                onClick={() => {
                  const idx = planesList.indexOf(selectedPlaneId);
                  const prev = planesList[(idx - 1 + planesList.length) % planesList.length];
                  onSelectPlane(prev);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const idx = planesList.indexOf(selectedPlaneId);
                  const next = planesList[(idx + 1) % planesList.length];
                  onSelectPlane(next);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2 text-center">
              <div className="font-bold font-mono text-sm text-white">
                {currentPlane.name}
              </div>
              <div className="text-[11px] font-mono text-cyan-400">
                {currentPlane.codename}
              </div>
            </div>
          </div>

          {/* Jet Stats Breakdown with Upgrade Delta Indicators */}
          <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            {/* Speed */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-slate-400 text-[10px] uppercase mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3 text-sky-400" />
                <span>SPEED</span>
              </div>
              <div className="text-base font-bold text-white tabular-nums">
                {Math.round(currentPlane.speed * (1 + bonuses.speedPercentBonus))} knots
              </div>
              {bonuses.speedPercentBonus > 0 && (
                <div className="text-[10px] text-sky-400 font-semibold mt-0.5">
                  +{Math.round(bonuses.speedPercentBonus * 100)}% Upgrade
                </div>
              )}
            </div>

            {/* Armor HP */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-slate-400 text-[10px] uppercase mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>HULL ARMOR</span>
              </div>
              <div className="text-base font-bold text-white tabular-nums">
                {currentPlane.maxHp + bonuses.hpBonus} HP
              </div>
              {bonuses.hpBonus > 0 && (
                <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                  +{bonuses.hpBonus} HP Upgrade
                </div>
              )}
            </div>

            {/* Shield Capacity */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-slate-400 text-[10px] uppercase mb-1 flex items-center gap-1">
                <Shield className="w-3 h-3 text-cyan-400" />
                <span>AEGIS SHIELD</span>
              </div>
              <div className="text-base font-bold text-white tabular-nums">
                {currentPlane.maxShield + bonuses.shieldBonus} Shield
              </div>
              {bonuses.shieldBonus > 0 && (
                <div className="text-[10px] text-cyan-400 font-semibold mt-0.5">
                  +{bonuses.shieldBonus} Shield Upgrade
                </div>
              )}
            </div>

            {/* Cannon Base Level */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-slate-400 text-[10px] uppercase mb-1 flex items-center gap-1">
                <Crosshair className="w-3 h-3 text-amber-400" />
                <span>CANNON BASE</span>
              </div>
              <div className="text-base font-bold text-white tabular-nums">
                LVL {1 + bonuses.baseWeaponLevelBonus}
              </div>
              {bonuses.damageMultiplierBonus > 0 && (
                <div className="text-[10px] text-amber-400 font-semibold mt-0.5">
                  +{Math.round(bonuses.damageMultiplierBonus * 100)}% Dmg
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3 Core Component Upgrade Cards */}
        <div className="mb-6">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5 font-bold">
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>FUSELAGE & SYSTEMS UPGRADE MODULES</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['engine', 'armor', 'weapons'] as UpgradeComponentType[]).map((type) => {
              const spec = UPGRADE_SPECS[type];
              const currentLvl = levels[type];
              const isMax = currentLvl >= 5;
              const cost = upgradeManager.getUpgradeCost(type);
              const canAfford = cost !== null && careerData.xp >= cost;

              return (
                <motion.div
                  key={type}
                  whileHover={{ y: -2 }}
                  className={`bg-slate-950/80 border rounded-2xl p-4 flex flex-col justify-between transition-all shadow-md ${
                    isMax
                      ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : canAfford
                      ? 'border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.1)]'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Header: Icon, Name & Codename */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 shadow-inner">
                          {getComponentIcon(type)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">{spec.name}</h4>
                          <span className="text-[10px] font-mono text-cyan-400 block">
                            {spec.codename}
                          </span>
                        </div>
                      </div>

                      <div className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono font-bold text-slate-300">
                        LVL {currentLvl}/5
                      </div>
                    </div>

                    {/* 5-Segment Level Progress Pips */}
                    <div className="flex items-center gap-1.5 mb-3">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`h-2 flex-1 rounded-full transition-all ${
                            lvl <= currentLvl
                              ? 'bg-gradient-to-r from-cyan-400 to-amber-400 shadow-[0_0_6px_#38bdf8]'
                              : 'bg-slate-900 border border-slate-800'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Spec Description */}
                    <p className="text-[11px] text-slate-400 mb-4 line-clamp-2">
                      {spec.description}
                    </p>

                    {/* Level Stat Details */}
                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-2.5 text-[11px] font-mono mb-4 text-slate-300 space-y-1">
                      {type === 'engine' && (
                        <>
                          <div className="flex justify-between">
                            <span>Top Speed:</span>
                            <span className="text-sky-300 font-bold">
                              +{(currentLvl - 1) * 5}% ({Math.round(currentPlane.speed * (1 + (currentLvl - 1) * 0.05))} kn)
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Afterburner Cap:</span>
                            <span className="text-sky-300 font-bold">
                              +{(currentLvl - 1) * 15}%
                            </span>
                          </div>
                        </>
                      )}

                      {type === 'armor' && (
                        <>
                          <div className="flex justify-between">
                            <span>Hull Armor HP:</span>
                            <span className="text-emerald-300 font-bold">
                              +{(currentLvl - 1) * 25} HP
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Aegis Shield:</span>
                            <span className="text-cyan-300 font-bold">
                              +{(currentLvl - 1) * 18} Shield
                            </span>
                          </div>
                        </>
                      )}

                      {type === 'weapons' && (
                        <>
                          <div className="flex justify-between">
                            <span>Cannon Damage:</span>
                            <span className="text-amber-300 font-bold">
                              +{(currentLvl - 1) * 12}% Dmg
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Base Cannon Level:</span>
                            <span className="text-amber-300 font-bold">
                              LVL {1 + (currentLvl >= 5 ? 2 : currentLvl >= 3 ? 1 : 0)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Upgrade CTA Button */}
                  <div>
                    {isMax ? (
                      <div className="w-full py-2.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        <span>MAX LEVEL REACHED</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(type)}
                        disabled={!canAfford}
                        className={`w-full py-2.5 font-mono font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          canAfford
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                            : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>
                          UPGRADE ({cost?.toLocaleString()} XP)
                        </span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Action Controls & Reset Upgrades */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4">
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET & REFUND UPGRADES</span>
            </button>
          ) : (
            <div className="bg-rose-950/80 border border-rose-600/80 rounded-xl p-3 text-center max-w-md w-full shadow-lg">
              <div className="flex items-center justify-center gap-1.5 text-rose-300 font-mono text-xs font-bold uppercase mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>CONFIRM REFUND UPGRADES?</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono mb-3">
                Reset all jet components back to Level 1 and refund spent XP back into your Career XP balance?
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handleResetUpgrades}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono rounded-lg transition-colors cursor-pointer"
                >
                  REFUND ALL XP
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs font-mono rounded-lg transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs rounded-xl transition-colors cursor-pointer"
          >
            CONFIRM & EXIT HANGAR
          </button>
        </div>
      </motion.div>
    </div>
  );
};
