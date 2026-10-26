import React, { useEffect } from 'react';
import { PlaneId, GameStats } from '../game/types';
import { PLANE_CONFIGS } from '../game/planes';
import { SectorMap3D } from './SectorMap3D';
import { upgradeManager } from '../game/upgrades';
import { soundSystem } from '../game/audio';
import { motion } from 'framer-motion';
import {
  X,
  Target,
  AlertTriangle,
  Zap,
  Shield,
  Crosshair,
  Flame,
  Radio,
  Sparkles,
  Plane,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface TacticalBriefingModalProps {
  stats: GameStats;
  selectedPlaneId: PlaneId;
  onDeploy: () => void;
  onClose: () => void;
  onOpenHangar?: () => void;
}

export const TacticalBriefingModal: React.FC<TacticalBriefingModalProps> = ({
  stats,
  selectedPlaneId,
  onDeploy,
  onClose,
  onOpenHangar,
}) => {
  const currentPlane = PLANE_CONFIGS[selectedPlaneId];
  const powerRating = upgradeManager.calculatePowerRating();
  const bonuses = upgradeManager.getCalculatedBonuses();

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        soundSystem.playPowerup();
        onDeploy();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onDeploy]);

  // Generate 3D objective markers based on sector & wave
  const mapObjectives = [
    {
      id: 'obj_flagship',
      label: 'Hostile Flagship Intercept Zone',
      x: 3,
      z: -7,
      color: 0xef4444, // Red
      type: 'boss' as const,
    },
    {
      id: 'obj_waypoint',
      label: 'Squadron Rendezvous Point',
      x: -6,
      z: 2,
      color: 0xf59e0b, // Amber
      type: 'waypoint' as const,
    },
    {
      id: 'obj_outpost',
      label: 'Sector Extraction Gate',
      x: 5,
      z: 6,
      color: 0x10b981, // Emerald
      type: 'outpost' as const,
    },
  ];

  // Generate 3D hazard zones based on active weather or wave
  const mapHazards = [];
  if (stats.activeWeather === 'thunderstorm') {
    mapHazards.push({
      id: 'haz_storm',
      label: 'Severe Thunderstorm Front',
      x: -2,
      z: -3,
      radius: 6,
      color: 0xf59e0b,
      type: 'thunderstorm' as const,
    });
  } else if (stats.activeWeather === 'asteroid_field') {
    mapHazards.push({
      id: 'haz_asteroid',
      label: 'Asteroid Belt Density Zone',
      x: 4,
      z: 1,
      radius: 5.5,
      color: 0xef4444,
      type: 'asteroid' as const,
    });
  } else if (stats.wave >= 2) {
    mapHazards.push({
      id: 'haz_patrol',
      label: 'Dense Enemy Air Patrol Sector',
      x: -4,
      z: -5,
      radius: 5,
      color: 0x06b6d4,
      type: 'patrol' as const,
    });
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/92 select-none font-display backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="bg-slate-900 border border-slate-700/90 rounded-2xl p-5 sm:p-6 max-w-5xl w-full shadow-2xl text-slate-100 relative max-h-[94vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Tactical Briefing"
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-2 mb-1">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-semibold">
            KOMANDO UDARA PUSAT · BRIEFING PRE-MISI SEKTOR
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-wider">
              {stats.sectorName || `SEKTOR ${stats.wave}: PATROLI ARCHIPELAGO`}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Analisis topografi 3D, prakiraan bahaya lingkungan, dan instruksi misi sebelum lepas landas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold rounded-xl shadow-[0_0_10px_rgba(56,189,248,0.2)]">
              SEKTOR {stats.wave}
            </span>
            <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold rounded-xl shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              ANCAMAN: {stats.wave >= 4 ? 'TINGKAT KRITIS' : stats.wave >= 2 ? 'TINGKAT TINGGI' : 'TINGKAT SEDANG'}
            </span>
          </div>
        </div>

        {/* Main Content Grid: 3D Holographic Map + Intel Directives */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Left Column: 3D Sector Holographic Map */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <SectorMap3D
              sectorName={stats.sectorName}
              sectorWave={stats.wave}
              weatherHazard={stats.activeWeather}
              objectives={mapObjectives}
              hazards={mapHazards}
              className="w-full h-72 sm:h-80"
            />

            {/* Map Legend */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
                <span>Kapal Induk Musuh</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]" />
                <span>Titik Temu Skuadron</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                <span>Gerbang Ekstraksi</span>
              </div>
              <div className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
                <span>Batas Zona Bahaya</span>
              </div>
            </div>
          </div>

          {/* Right Column: Intelligence & Directives Analysis */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            {/* Environmental Hazards Forecast Panel */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5 font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>LAPORAN BAHAYA LINGKUNGAN</span>
              </div>

              {stats.activeWeather && stats.activeWeather !== 'clear' ? (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs font-mono leading-relaxed space-y-1">
                  <div className="font-bold text-amber-300 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {stats.activeWeather === 'thunderstorm'
                        ? 'BAHAYA: BADAI PETIR EKSTREM'
                        : 'BAHAYA: SABUK ASTEROID PADAT'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {stats.activeWeather === 'thunderstorm'
                      ? 'Interferensi listrik atmosferik terdeteksi. Waspadai kilatan petir di lintasan terbang. Siapkan Afterburner [SHIFT] untuk مناورة menghindar cepat.'
                      : 'Sabuk asteroid berkecepatan tinggi melintas di sektor sasaran. Hancurkan asteroid kecil dengan meriam dan gunakan dorongan boost melalui puing-puing.'}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>KONDISI ATMOSFER CERAH · VISIBILITAS TERBANG OPTIMAL</span>
                </div>
              )}
            </div>

            {/* Directives & Objectives Tracker */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex-1">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span>INSTRUKSI UTAMA MISI</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">TARGET MISI</span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {stats.activeMissions && stats.activeMissions.length > 0 ? (
                  stats.activeMissions.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs font-mono"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{m.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">{m.description}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-bold text-amber-400 tabular-nums">
                          {m.progress}/{m.target}
                        </div>
                        <div className="text-[9px] text-emerald-400">+{m.rewardLabel}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs font-mono text-slate-400 p-2 text-center">
                    PATROLI SEKTOR · HANCURKAN KAPAL INDUK DREADNOUGHT MUSUH
                  </div>
                )}
              </div>
            </div>

            {/* Jet Loadout Summary Card */}
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-cyan-400/50 flex items-center justify-center shrink-0">
                  <Plane className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="font-bold text-white">{currentPlane.name}</div>
                  <div className="text-[10px] text-cyan-400">{powerRating} PWR · {currentPlane.codename}</div>
                </div>
              </div>

              {onOpenHangar && (
                <button
                  onClick={onOpenHangar}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-[10px] transition-colors cursor-pointer"
                >
                  MODIFIKASI
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 font-mono text-xs rounded-xl transition-colors cursor-pointer"
          >
            BATALKAN BRIEFING
          </button>

          <button
            onClick={() => {
              soundSystem.playPowerup();
              onDeploy();
            }}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-sm tracking-wider rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.4)] hover:shadow-[0_0_28px_rgba(14,165,233,0.6)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>LUNCURKAN MISI & DEPLOY</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
