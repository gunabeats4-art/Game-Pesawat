import React from 'react';
import { GameStats } from '../game/types';
import { Shield, Heart, Zap, Bomb, Pause, Target, CheckCircle2, AlertTriangle, Skull, Sparkles, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HUDProps {
  stats: GameStats;
  onPause: () => void;
  onTriggerBomb: () => void;
  onOpenMissions?: () => void;
  pilotCallsign?: string;
  pilotRank?: string;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  onPause,
  onTriggerBomb,
  onOpenMissions,
  pilotCallsign = 'FALCON-1',
  pilotRank = 'Flight Cadet',
}) => {
  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const shieldPercent = Math.max(0, Math.min(100, (stats.shield / stats.maxShield) * 100));
  const boostPercent = Math.max(0, Math.min(100, stats.boostGauge));

  // Find first active in-progress mission or completed mission
  const activeMission =
    stats.activeMissions?.find((m) => !m.completed) ||
    stats.activeMissions?.[0];

  return (
    <div className="absolute inset-0 z-10 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6 overflow-hidden font-display">
      {/* Weather Hazard Banner */}
      <AnimatePresence>
        {stats.activeWeather && stats.activeWeather !== 'clear' && (
          <motion.div
            key="weather-hazard"
            initial={{ y: -30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-amber-950/90 border border-amber-500/80 px-4 py-1.5 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-2 font-mono text-xs text-amber-300"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>BAHAYA: {stats.activeWeather === 'thunderstorm' ? 'BADAI PETIR HEBAT' : 'SABUK ASTEROID DENSE'} ({Math.ceil(stats.weatherTimer || 0)}d)</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Perimeter Cluster */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Player Hull & Shield Gauge + Daily Mission Tracker + Combat Log */}
        <div className="flex flex-col gap-2">
          {/* Player Armor & Shield Card */}
          <motion.div
            initial={{ opacity: 0, x: -25, y: -15 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col gap-1.5 bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl min-w-[210px] shadow-lg backdrop-blur-xs"
          >
            {/* Pilot Callsign & Rank Strip */}
            <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-800/80 pb-1.5 mb-0.5">
              <span className="font-bold text-cyan-400 tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block shadow-[0_0_6px_#38bdf8]" />
                {pilotCallsign}
              </span>
              <span className="text-amber-400 font-semibold">{pilotRank}</span>
            </div>

            {/* Hull HP Bar with Framer Motion animated width */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-1.5 font-bold tracking-wider">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  PELINDUNG LAMBUNG
                </span>
                <span className="font-mono tabular-nums text-[11px] text-slate-400">
                  {Math.ceil(stats.hp)} / {stats.maxHp}
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <motion.div
                  className={`h-full rounded-full ${
                    hpPercent < 25 ? 'bg-rose-600 animate-pulse' : hpPercent < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  initial={{ width: '0%' }}
                  animate={{ width: `${hpPercent}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
            </div>

            {/* Shield Bar with Framer Motion animated width */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-1.5 font-bold tracking-wider text-cyan-400">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  PERISAI PERTAHANAN
                </span>
                <span className="font-mono tabular-nums text-[11px] text-cyan-300">
                  {Math.ceil(stats.shield)} / {stats.maxShield}
                </span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <motion.div
                  className="h-full bg-cyan-400 rounded-full shadow-[0_0_8px_#38bdf8]"
                  initial={{ width: '0%' }}
                  animate={{ width: `${shieldPercent}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Wingman Status Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
            className="flex flex-col gap-1.5 bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl min-w-[210px] shadow-lg backdrop-blur-xs"
          >
            <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-800/80 pb-1.5">
              <span className="font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${stats.wingmanActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                PESAWAT SAYAP: FALCON-2
              </span>
              <span className={stats.wingmanActive ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                {stats.wingmanActive ? 'AKTIF' : `ISI ULANG (${Math.ceil(stats.wingmanTimer || 0)}d)`}
              </span>
            </div>
            <AnimatePresence>
              {stats.wingmanActive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                    <span className="font-mono text-emerald-300">HP PELINDUNG</span>
                    <span className="font-mono tabular-nums text-slate-400">
                      {Math.ceil(stats.wingmanHp)} / {stats.wingmanMaxHp}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <motion.div
                      className="h-full bg-emerald-400 rounded-full shadow-[0_0_6px_#10b981]"
                      initial={{ width: '0%' }}
                      animate={{ width: `${Math.max(0, Math.min(100, (stats.wingmanHp / stats.wingmanMaxHp) * 100))}%` }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Daily Directive Quick Tracker Widget */}
          {activeMission && (
            <motion.button
              onClick={onOpenMissions}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="pointer-events-auto flex flex-col gap-1 text-left bg-slate-950/80 hover:bg-slate-900/90 border border-slate-800/80 hover:border-amber-500/40 px-3 py-2 rounded-xl transition-colors cursor-pointer shadow-md max-w-[240px] backdrop-blur-xs"
            >
              <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                <span className="flex items-center gap-1 text-amber-400 font-semibold uppercase">
                  <Target className="w-3 h-3" />
                  {activeMission.codename}
                </span>
                <span className="tabular-nums text-slate-300">
                  {activeMission.progress}/{activeMission.target}
                </span>
              </div>

              <div className="text-[11px] text-slate-300 truncate font-semibold">
                {activeMission.title}
              </div>

              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    activeMission.completed ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                  initial={{ width: '0%' }}
                  animate={{
                    width: `${Math.min(100, Math.round((activeMission.progress / activeMission.target) * 100))}%`,
                  }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
            </motion.button>
          )}

          {/* Real-Time Combat Log Ticker with Animated Entries */}
          {stats.combatLogs && stats.combatLogs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="hidden sm:flex flex-col gap-1 bg-slate-950/85 border border-slate-800/80 p-2.5 rounded-xl shadow-lg max-w-[280px] max-h-[175px] overflow-hidden pointer-events-auto backdrop-blur-xs"
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800/80 pb-1">
                <span className="font-bold tracking-wider text-cyan-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LOG TEMPUR
                </span>
                <span className="text-amber-400">{stats.aceTitle || 'ELANG TEMPUR'} ({stats.aceRating || 50})</span>
              </div>

              <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 text-[11px] font-mono scrollbar-none">
                <AnimatePresence initial={false}>
                  {stats.combatLogs.slice(0, 5).map((log) => {
                    const textLower = log.text.toLowerCase();
                    let icon = <Radio className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />;
                    let textColor = 'text-slate-300';

                    if (log.type === 'boss' || textLower.includes('dreadnought') || textLower.includes('boss')) {
                      icon = <Skull className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5 animate-pulse" />;
                      textColor = 'text-red-300 font-semibold';
                    } else if (log.type === 'warning' || textLower.includes('hazard') || textLower.includes('warning') || textLower.includes('lightning') || textLower.includes('asteroid') || textLower.includes('sustaining')) {
                      icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
                      textColor = 'text-amber-300';
                    } else if (log.type === 'powerup' || textLower.includes('power-up') || textLower.includes('wingman') || textLower.includes('escort')) {
                      icon = <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
                      textColor = 'text-emerald-300';
                    } else if (log.type === 'kill' || textLower.includes('downed') || textLower.includes('destroyed') || textLower.includes('pulverized')) {
                      icon = <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />;
                      textColor = 'text-cyan-200';
                    }

                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -18, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 18, scale: 0.9 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className={`flex items-start gap-1.5 leading-tight ${textColor}`}
                      >
                        {icon}
                        <span className="truncate">{log.text}</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>

        {/* Top-Center: Boss Health Meter (When Active) */}
        <AnimatePresence>
          {stats.bossHp !== null && stats.bossMaxHp !== null && (
            <motion.div
              key="boss-meter"
              initial={{ y: -35, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -35, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="flex flex-col items-center max-w-sm w-full mx-4 bg-slate-950/90 border border-red-900/60 p-2.5 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.25)] backdrop-blur-xs"
            >
              <div className="flex items-center justify-between w-full text-xs text-red-400 font-bold tracking-widest uppercase mb-1">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  {stats.bossName || 'KAPAL INDUK MUSUH'}
                </span>
                <span className="font-mono tabular-nums">
                  {Math.ceil((stats.bossHp / stats.bossMaxHp) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-red-950">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full shadow-[0_0_10px_#ef4444]"
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.max(0, (stats.bossHp / stats.bossMaxHp) * 100)}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top-Right: Score, Combo & Pause Button */}
        <motion.div
          initial={{ opacity: 0, x: 25, y: -15 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex items-start gap-3"
        >
          <div className="flex flex-col items-end bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl min-w-[160px] shadow-lg backdrop-blur-xs">
            <span className="text-[10px] tracking-widest text-slate-400 uppercase font-mono">SKOR TEMPUR</span>
            <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white tracking-wider">
              {stats.score.toLocaleString()}
            </span>

            {/* Active Multiplier Badges */}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap justify-end">
              {stats.missionBonusMultiplier > 0 && (
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                  +{Math.round(stats.missionBonusMultiplier * 100)}% BONUS
                </span>
              )}

              <AnimatePresence>
                {stats.currentCombo > 1 && (
                  <motion.div
                    key="combo-multiplier"
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    className="flex items-center gap-1"
                  >
                    <span className="text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                      x{stats.scoreMultiplier ? stats.scoreMultiplier.toFixed(1) : (1 + Math.floor(stats.currentCombo / 5) * 0.5).toFixed(1)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="text-[11px] font-mono text-cyan-400 mt-1 font-semibold">
              SEKTOR {stats.wave}
            </div>
          </div>

          {/* Interactive Pause button */}
          <motion.button
            onClick={onPause}
            aria-label="Pause Game"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="pointer-events-auto p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer shadow-lg backdrop-blur-xs"
          >
            <Pause className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>

      {/* Bottom Perimeter Cluster */}
      <div className="flex items-end justify-between w-full">
        {/* Bottom-Left: Overdrive Bombs Cluster */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex items-center gap-3"
        >
          <motion.button
            onClick={onTriggerBomb}
            disabled={stats.bombs <= 0}
            whileHover={stats.bombs > 0 ? { scale: 1.04 } : undefined}
            whileTap={stats.bombs > 0 ? { scale: 0.95 } : undefined}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border font-bold text-sm tracking-wider uppercase transition-colors cursor-pointer shadow-lg backdrop-blur-xs ${
              stats.bombs > 0
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 hover:bg-amber-500/30 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-slate-950/60 border-slate-800 text-slate-600 opacity-60 cursor-not-allowed'
            }`}
          >
            <Bomb className="w-5 h-5 text-amber-400" />
            <div className="flex flex-col text-left">
              <span>BOM [B]</span>
              <span className="text-[10px] font-mono font-normal opacity-80">
                {stats.bombs} / {stats.maxBombs} SIAP
              </span>
            </div>
          </motion.button>

          {/* Weapon Power Display */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 px-3 py-2.5 rounded-xl backdrop-blur-xs">
            <Zap className="w-4 h-4 text-cyan-400" />
            <div className="text-xs">
              <div className="text-slate-400 text-[10px]">MERIAM</div>
              <div className="text-cyan-400 font-bold font-mono">LVL {stats.weaponLevel}</div>
            </div>
          </div>
        </motion.div>

        {/* Bottom-Right: Afterburner Boost Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex flex-col items-end bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl min-w-[140px] shadow-lg backdrop-blur-xs"
        >
          <div className="flex items-center justify-between w-full text-xs text-slate-300 mb-1">
            <span className="font-bold tracking-wider text-[11px] text-amber-400">DORONGAN AFTERBURNER [SHIFT]</span>
            <span className="font-mono tabular-nums text-[10px] text-slate-400">{Math.ceil(boostPercent)}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
            <motion.div
              className={`h-full rounded-full ${
                stats.isBoosting ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-sky-500'
              }`}
              initial={{ width: '0%' }}
              animate={{ width: `${boostPercent}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

