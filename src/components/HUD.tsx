import React from 'react';
import { GameStats } from '../game/types';
import { Shield, Heart, Zap, Bomb, Pause, Target, CheckCircle2 } from 'lucide-react';

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
      {/* Top Perimeter Cluster */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Player Hull & Shield Gauge + Daily Mission Tracker */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1.5 bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl min-w-[210px] shadow-lg">
            {/* Pilot Callsign & Rank Strip */}
            <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-800/80 pb-1.5 mb-0.5">
              <span className="font-bold text-cyan-400 tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block shadow-[0_0_6px_#38bdf8]" />
                {pilotCallsign}
              </span>
              <span className="text-amber-400 font-semibold">{pilotRank}</span>
            </div>

            {/* Hull HP Bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-1.5 font-bold tracking-wider">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  HULL ARMOR
                </span>
                <span className="font-mono tabular-nums text-[11px] text-slate-400">
                  {Math.ceil(stats.hp)} / {stats.maxHp}
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-150 rounded-full ${
                    hpPercent < 25 ? 'bg-rose-600 animate-pulse' : hpPercent < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* Shield Bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-1.5 font-bold tracking-wider text-cyan-400">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  DEFENSE SHIELD
                </span>
                <span className="font-mono tabular-nums text-[11px] text-cyan-300">
                  {Math.ceil(stats.shield)} / {stats.maxShield}
                </span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-150 shadow-[0_0_8px_#38bdf8]"
                  style={{ width: `${shieldPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Daily Directive Quick Tracker Widget */}
          {activeMission && (
            <button
              onClick={onOpenMissions}
              className="pointer-events-auto flex flex-col gap-1 text-left bg-slate-950/80 hover:bg-slate-900/90 border border-slate-800/80 hover:border-amber-500/40 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-md max-w-[240px]"
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
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    activeMission.completed ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((activeMission.progress / activeMission.target) * 100))}%`,
                  }}
                />
              </div>
            </button>
          )}
        </div>

        {/* Top-Center: Boss Health Meter (When Active) */}
        {stats.bossHp !== null && stats.bossMaxHp !== null && (
          <div className="flex flex-col items-center max-w-sm w-full mx-4 bg-slate-950/90 border border-red-900/60 p-2.5 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-fade-in">
            <div className="flex items-center justify-between w-full text-xs text-red-400 font-bold tracking-widest uppercase mb-1">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
                {stats.bossName || 'HOSTILE FLAGSHIP'}
              </span>
              <span className="font-mono tabular-nums">
                {Math.ceil((stats.bossHp / stats.bossMaxHp) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-red-950">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full transition-all duration-100 shadow-[0_0_10px_#ef4444]"
                style={{ width: `${Math.max(0, (stats.bossHp / stats.bossMaxHp) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Top-Right: Score, Combo & Pause Button */}
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-end bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl min-w-[160px] shadow-lg">
            <span className="text-[10px] tracking-widest text-slate-400 uppercase font-mono">COMBAT SCORE</span>
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

              {stats.currentCombo > 1 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    x{stats.scoreMultiplier ? stats.scoreMultiplier.toFixed(1) : (1 + Math.floor(stats.currentCombo / 5) * 0.5).toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            <div className="text-[11px] font-mono text-cyan-400 mt-1 font-semibold">
              SECTOR {stats.wave}
            </div>
          </div>

          {/* Interactive Pause button */}
          <button
            onClick={onPause}
            aria-label="Pause Game"
            className="pointer-events-auto p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer shadow-lg"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Perimeter Cluster */}
      <div className="flex items-end justify-between w-full">
        {/* Bottom-Left: Overdrive Bombs Cluster */}
        <div className="flex items-center gap-3">
          <button
            onClick={onTriggerBomb}
            disabled={stats.bombs <= 0}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border font-bold text-sm tracking-wider uppercase transition-all cursor-pointer shadow-lg ${
              stats.bombs > 0
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 hover:bg-amber-500/30 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-slate-950/60 border-slate-800 text-slate-600 opacity-60 cursor-not-allowed'
            }`}
          >
            <Bomb className="w-5 h-5 text-amber-400" />
            <div className="flex flex-col text-left">
              <span>BOMB [B]</span>
              <span className="text-[10px] font-mono font-normal opacity-80">
                {stats.bombs} / {stats.maxBombs} READY
              </span>
            </div>
          </button>

          {/* Weapon Power Display */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 px-3 py-2.5 rounded-xl">
            <Zap className="w-4 h-4 text-cyan-400" />
            <div className="text-xs">
              <div className="text-slate-400 text-[10px]">CANNON</div>
              <div className="text-cyan-400 font-bold font-mono">LVL {stats.weaponLevel}</div>
            </div>
          </div>
        </div>

        {/* Bottom-Right: Afterburner Boost Gauge */}
        <div className="flex flex-col items-end bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl min-w-[140px] shadow-lg">
          <div className="flex items-center justify-between w-full text-xs text-slate-300 mb-1">
            <span className="font-bold tracking-wider text-[11px] text-amber-400">AFTERBURNER [SHIFT]</span>
            <span className="font-mono tabular-nums text-[10px] text-slate-400">{Math.ceil(boostPercent)}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                stats.isBoosting ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-sky-500'
              }`}
              style={{ width: `${boostPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
