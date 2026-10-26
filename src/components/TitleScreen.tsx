import React, { useEffect } from 'react';
import { DailyMission, PlaneId } from '../game/types';
import { PLANE_CONFIGS } from '../game/planes';
import { Volume2, VolumeX, Shield, Zap, Flame, Crosshair, Target, User, Trophy, Wrench } from 'lucide-react';
import { PilotProfile, PILOT_AVATARS, getRankInfo } from '../game/pilot';

interface TitleScreenProps {
  selectedPlane: PlaneId;
  onSelectPlane: (id: PlaneId) => void;
  onStartGame: () => void;
  highScore: number;
  isMuted: boolean;
  onToggleMute: () => void;
  activeMissions: DailyMission[];
  onOpenMissions: () => void;
  pilotProfile: PilotProfile;
  onOpenProfile: () => void;
  onOpenLeaderboard: () => void;
  onOpenHangar?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedPlane,
  onSelectPlane,
  onStartGame,
  highScore,
  isMuted,
  onToggleMute,
  activeMissions,
  onOpenMissions,
  pilotProfile,
  onOpenProfile,
  onOpenLeaderboard,
  onOpenHangar,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartGame();
      } else if (e.code === 'Digit1') {
        onSelectPlane('garuda');
      } else if (e.code === 'Digit2') {
        onSelectPlane('valkyrie');
      } else if (e.code === 'Digit3') {
        onSelectPlane('titan');
      } else if (e.code === 'KeyD') {
        onOpenMissions();
      } else if (e.code === 'KeyP') {
        onOpenProfile();
      } else if (e.code === 'KeyL') {
        onOpenLeaderboard();
      } else if (e.code === 'KeyH' && onOpenHangar) {
        onOpenHangar();
      } else if (e.code === 'KeyM') {
        onToggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame, onSelectPlane, onToggleMute, onOpenMissions, onOpenProfile, onOpenLeaderboard, onOpenHangar]);

  const activePlane = PLANE_CONFIGS[selectedPlane];
  const completedMissionsCount = activeMissions.filter(m => m.completed).length;
  const currentAvatar =
    PILOT_AVATARS.find((a) => a.id === pilotProfile.avatarId) || PILOT_AVATARS[0];
  const rankInfo = getRankInfo(pilotProfile.careerXp);

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 sm:p-10 select-none bg-gradient-to-b from-slate-950/85 via-slate-900/60 to-slate-950/90 text-slate-100">
      {/* Top Header Strip */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
        {/* Pilot Profile Quick Badge */}
        <button
          onClick={onOpenProfile}
          title="Open Combat Pilot Dossier [P]"
          className="flex items-center gap-2.5 p-1 sm:p-1.5 pr-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400 transition-all cursor-pointer shadow-md group"
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-cyan-400 shrink-0 bg-slate-900">
            <img
              src={currentAvatar.image}
              alt={pilotProfile.callsign}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-left hidden sm:block">
            <div className="font-bold text-xs text-white group-hover:text-cyan-300 font-mono tracking-wider flex items-center gap-1">
              <span>{pilotProfile.callsign}</span>
            </div>
            <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
              <span>{rankInfo.currentRank.insignia}</span>
              <span>{rankInfo.currentRank.title}</span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hangar & Upgrades Trigger Button */}
          {onOpenHangar && (
            <button
              onClick={onOpenHangar}
              title="Open Tactical Hangar & Upgrades [H]"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(56,189,248,0.15)]"
            >
              <Wrench className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline font-semibold">HANGAR</span>
            </button>
          )}

          {/* Global Leaderboard Trigger Button */}
          <button
            onClick={onOpenLeaderboard}
            title="Lihat Peringkat Komunitas Global [L]"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-amber-300 text-xs font-mono transition-all cursor-pointer shadow-sm"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-semibold">PERINGKAT</span>
          </button>

          {/* Daily Missions Trigger Button */}
          <button
            onClick={onOpenMissions}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.15)]"
          >
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-semibold">INSTRUKSI</span>
            <span className="tabular-nums font-bold text-amber-400">
              [{completedMissionsCount}/{activeMissions.length}]
            </span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-300">
            <span className="text-slate-400">REKOR:</span>
            <span className="text-amber-400 font-semibold text-sm">{highScore.toLocaleString()}</span>
          </div>

          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Aktifkan Suara' : 'Matikan Suara'}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup */}
      <div className="flex flex-col items-center justify-center my-auto text-center max-w-4xl mx-auto">
        <div className="mb-3">
          {/* Custom SVG Wings & Emblem Lockup */}
          <svg
            className="w-48 sm:w-64 h-16 sm:h-20 mx-auto filter drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]"
            viewBox="0 0 300 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Left Wing Lines */}
            <path d="M120 40L20 20L50 45L120 45Z" fill="url(#wingGradLeft)" opacity="0.85" />
            <path d="M110 50L40 38L65 54L110 54Z" fill="url(#wingGradLeft)" opacity="0.6" />
            <path d="M100 58L60 50L75 62L100 62Z" fill="url(#wingGradLeft)" opacity="0.4" />

            {/* Right Wing Lines */}
            <path d="M180 40L280 20L250 45L180 45Z" fill="url(#wingGradRight)" opacity="0.85" />
            <path d="M190 50L260 38L235 54L190 54Z" fill="url(#wingGradRight)" opacity="0.6" />
            <path d="M200 58L240 50L225 62L200 62Z" fill="url(#wingGradRight)" opacity="0.4" />

            {/* Central Diamond Falcon Shield */}
            <polygon points="150,15 168,40 150,65 132,40" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
            <polygon points="150,22 162,40 150,58 138,40" fill="#ef4444" opacity="0.8" />
            <circle cx="150" cy="40" r="4" fill="#ffffff" />

            <defs>
              <linearGradient id="wingGradLeft" x1="20" y1="20" x2="120" y2="45" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="1" stopColor="#0284c7" />
              </linearGradient>
              <linearGradient id="wingGradRight" x1="280" y1="20" x2="180" y2="45" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="1" stopColor="#0284c7" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Title Lockup */}
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-sky-400 drop-shadow-[0_4px_16px_rgba(14,165,233,0.35)]">
          SKY RAIDER
        </h1>
        <p className="font-display tracking-[0.35em] text-sm sm:text-base font-semibold text-red-400 mt-1 uppercase">
          ELANG TEMPUR · PERTEMPURAN UDARA NUSANTARA
        </p>

        <p className="text-slate-400 text-xs sm:text-sm mt-3 max-w-lg mx-auto">
          Luncurkan pesawat tempurmu, hindari formasi peluru musuh, lepaskan bom taktis, dan hancurkan kapal induk dreadnought.
        </p>

        {/* Aircraft Hangar Selection */}
        <div className="w-full mt-7 mb-7">
          <div className="text-left text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
            <span>PILIH PESAWAT TEMPUR:</span>
            <span className="text-cyan-400 font-semibold">{activePlane.codename}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['garuda', 'valkyrie', 'titan'] as PlaneId[]).map((id, idx) => {
              const plane = PLANE_CONFIGS[id];
              const isSelected = selectedPlane === id;
              return (
                <button
                  key={id}
                  onClick={() => onSelectPlane(id)}
                  className={`text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-900/90 border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.25)] ring-1 ring-cyan-400'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-bold text-sm tracking-wide text-white">
                      {idx + 1}. {plane.name}
                    </span>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${plane.primaryColor}22`,
                        color: plane.primaryColor,
                      }}
                    >
                      {plane.codename}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 min-h-[32px] leading-relaxed">
                    {plane.description}
                  </p>

                  {/* Spec Bars */}
                  <div className="space-y-1.5 text-[10px] font-mono text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" /> KECEPATAN
                      </span>
                      <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${(plane.speed / 420) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Crosshair className="w-3 h-3 text-red-400" /> DAYA TEMBAK
                      </span>
                      <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-400 rounded-full"
                          style={{ width: `${(plane.firepower / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-emerald-400" /> PELINDUNG
                      </span>
                      <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${(plane.maxHp / 150) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Start CTA Button */}
        <button
          onClick={onStartGame}
          className="group relative px-10 py-3.5 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-display font-bold text-base sm:text-lg tracking-wider rounded-xl shadow-[0_0_24px_rgba(14,165,233,0.5)] hover:shadow-[0_0_32px_rgba(14,165,233,0.7)] transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Zap className="w-5 h-5 fill-current" />
            LUNCURKAN MISI
            <span className="text-xs font-mono font-normal opacity-80 ml-2 py-0.5 px-2 bg-slate-950/20 rounded">
              ENTER / SPACE
            </span>
          </span>
        </button>
      </div>

      {/* Single Flat Control-Hint Line */}
      <div className="w-full max-w-4xl mx-auto pt-4 border-t border-slate-800/80 text-center">
        <p className="text-xs font-mono text-slate-400 tracking-wide">
          <span className="text-cyan-400">WASD / Geser</span> Gerak · <span className="text-cyan-400">Space</span> Tembak ·{' '}
          <span className="text-amber-400">B</span> Bom · <span className="text-emerald-400">Shift</span> Boost ·{' '}
          <span className="text-sky-300">P</span> Profil · <span className="text-amber-300">L</span> Peringkat · <span className="text-cyan-300">D</span> Instruksi ·{' '}
          <span className="text-cyan-300">H</span> Hangar · <span className="text-slate-300">Esc</span> Jeda
        </p>
      </div>
    </div>
  );
};
