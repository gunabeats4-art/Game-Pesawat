import React, { useState, useEffect } from 'react';
import {
  pilotManager,
  PILOT_AVATARS,
  PilotProfile,
} from '../game/pilot';
import {
  achievementManager,
  AchievementCategory,
  AchievementStatus,
  AchievementTier,
} from '../game/achievements';
import { insigniaManager, InsigniaStatus, GeometricShape } from '../game/insignias';
import { careerManager, CareerRank } from '../game/career';
import { rankEmblemManager, RankEmblemStatus } from '../game/rankEmblems';
import { RankEmblemSVG } from './RankEmblemSVG';
import {
  X,
  Award,
  Shield,
  Crosshair,
  Bomb,
  Target,
  Edit2,
  Check,
  User,
  Zap,
  Flame,
  Crown,
  Trophy,
  Lock,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

interface PilotProfileModalProps {
  onClose: () => void;
  onProfileUpdated: (profile: PilotProfile) => void;
}

// Count-up animated number hook for Lifetime Career Statistics
const AnimatedNumber: React.FC<{ value: number; formatter?: (val: number) => string; className?: string }> = ({
  value,
  formatter = (v) => v.toLocaleString(),
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 800; // 800ms smooth count-up
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setDisplayValue(Math.floor(progress * value));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [value]);

  return <span className={className}>{formatter(displayValue)}</span>;
};

export const PilotProfileModal: React.FC<PilotProfileModalProps> = ({
  onClose,
  onProfileUpdated,
}) => {
  const profile = pilotManager.getProfile();
  const careerData = careerManager.getData();
  const careerProgress = careerManager.getProgress();

  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(profile.avatarId);
  const [callsignInput, setCallsignInput] = useState<string>(careerData.pilotName || profile.callsign);
  const [isEditingCallsign, setIsEditingCallsign] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | AchievementCategory>('all');
  const [equippedInsigniaId, setEquippedInsigniaId] = useState<string>(insigniaManager.getEquippedId());
  const [equippedRankEmblemId, setEquippedRankEmblemId] = useState<string>(rankEmblemManager.getEquippedId());
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const insigniaStatuses: InsigniaStatus[] = insigniaManager.getStatuses(profile);
  const rankEmblemStatuses: RankEmblemStatus[] = rankEmblemManager.getStatuses(careerProgress.currentRank.level, careerData.xp);
  const unlockedEmblemCount = rankEmblemStatuses.filter((e) => e.unlocked).length;
  const emblemCompletionPercent = Math.round((unlockedEmblemCount / 10) * 100);
  const activeRankEmblem = rankEmblemStatuses.find((e) => e.id === equippedRankEmblemId) || rankEmblemStatuses[0];

  const activeAvatar =
    PILOT_AVATARS.find((a) => a.id === selectedAvatarId) || PILOT_AVATARS[0];

  const achievementStatuses: AchievementStatus[] = achievementManager.getAchievementStatuses(profile);
  const totalUnlocked = achievementStatuses.filter((a) => a.unlocked).length;
  const totalCount = achievementStatuses.length;
  const overallCompletion = Math.round((totalUnlocked / totalCount) * 100);

  const filteredAchievements = selectedCategory === 'all'
    ? achievementStatuses
    : achievementStatuses.filter((a) => a.category === selectedCategory);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSelectAvatar = (id: string) => {
    setSelectedAvatarId(id);
    pilotManager.updateAvatar(id);
    careerManager.updateAvatar(id);
    onProfileUpdated(pilotManager.getProfile());
  };

  const handleSaveCallsign = () => {
    const trimmed = callsignInput.trim().toUpperCase().slice(0, 14);
    if (trimmed) {
      pilotManager.updateCallsign(trimmed);
      careerManager.updatePilotName(trimmed);
      setCallsignInput(trimmed);
      setIsEditingCallsign(false);
      onProfileUpdated(pilotManager.getProfile());
    }
  };

  const handleEquipInsignia = (id: string) => {
    if (insigniaManager.equipInsignia(id)) {
      setEquippedInsigniaId(id);
      onProfileUpdated(pilotManager.getProfile());
    }
  };

  const handleEquipRankEmblem = (id: string) => {
    if (rankEmblemManager.equipEmblem(id, careerProgress.currentRank.level)) {
      setEquippedRankEmblemId(id);
      onProfileUpdated(pilotManager.getProfile());
    }
  };

  const handleResetCareer = () => {
    careerManager.reset();
    setCallsignInput('FALCON-1');
    setShowResetConfirm(false);
    onProfileUpdated(pilotManager.getProfile());
  };

  const lifetimeAccuracyPercent =
    careerData.stats.shotsFired > 0
      ? Math.round((careerData.stats.shotsHit / careerData.stats.shotsFired) * 100)
      : 0;

  const getRankTierBadgeStyle = (tierColor: 'gold' | 'cyan' | 'purple') => {
    switch (tierColor) {
      case 'gold':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-300';
      case 'cyan':
        return 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300';
      case 'purple':
        return 'bg-purple-500/15 border-purple-500/30 text-purple-300';
    }
  };

  const renderGeometricEmblemSVG = (shape: GeometricShape, primaryColor: string, secondaryColor: string, size = 36) => {
    switch (shape) {
      case 'delta':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <polygon points="20,4 36,34 4,34" fill={secondaryColor} stroke={primaryColor} strokeWidth="2.5" />
            <polygon points="20,12 30,30 10,30" fill={primaryColor} fillOpacity="0.4" />
            <circle cx="20" cy="22" r="3" fill="#ffffff" />
          </svg>
        );
      case 'hexagon':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <polygon points="20,3 36,11 36,29 20,37 4,29 4,11" fill={secondaryColor} stroke={primaryColor} strokeWidth="2.5" />
            <polygon points="20,9 31,15 31,25 20,31 9,25 9,15" fill={primaryColor} fillOpacity="0.3" />
            <circle cx="20" cy="20" r="4" fill={primaryColor} />
          </svg>
        );
      case 'starburst':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <path d="M20 2 L24 14 L36 16 L27 24 L29 36 L20 30 L11 36 L13 24 L4 16 L16 14 Z" fill={secondaryColor} stroke={primaryColor} strokeWidth="2" />
            <circle cx="20" cy="20" r="6" fill={primaryColor} />
          </svg>
        );
      case 'shield':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <path d="M20 4 L34 9 V22 C34 30 20 37 20 37 C20 37 6 30 6 22 V9 Z" fill={secondaryColor} stroke={primaryColor} strokeWidth="2.5" />
            <path d="M20 10 L28 14 V21 C28 26 20 31 20 31 C20 31 12 26 12 21 V14 Z" fill={primaryColor} fillOpacity="0.4" />
            <circle cx="20" cy="21" r="3" fill="#ffffff" />
          </svg>
        );
      case 'citadel':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <polygon points="12,12 28,12 32,34 8,34" fill={secondaryColor} stroke={primaryColor} strokeWidth="2.5" />
            <rect x="16" y="6" width="8" height="8" fill={primaryColor} />
            <line x1="12" y1="22" x2="28" y2="22" stroke={primaryColor} strokeWidth="2" />
            <circle cx="20" cy="28" r="3" fill="#ffffff" />
          </svg>
        );
      case 'vortex':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="16" fill={secondaryColor} stroke={primaryColor} strokeWidth="2.5" />
            <path d="M20 4 C28 4 36 12 36 20 C36 28 28 36 20 36 C12 36 4 28 4 20" stroke={primaryColor} strokeWidth="3" strokeDasharray="6 4" fill="none" />
            <circle cx="20" cy="20" r="5" fill={primaryColor} />
          </svg>
        );
      default:
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <polygon points="20,4 36,34 4,34" fill={secondaryColor} stroke={primaryColor} strokeWidth="2" />
          </svg>
        );
    }
  };

  const getTierBadge = (tier: AchievementTier) => {
    switch (tier) {
      case 'platinum':
        return <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-300">PLATINUM</span>;
      case 'gold':
        return <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-400">GOLD</span>;
      case 'silver':
        return <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-300">SILVER</span>;
      case 'bronze':
        return <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-600">BRONZE</span>;
    }
  };

  const renderIcon = (iconName: string, isUnlocked: boolean, tier: AchievementTier) => {
    const props = { className: 'w-5 h-5 shrink-0' };
    let iconComp;
    switch (iconName) {
      case 'crown':
        iconComp = <Crown {...props} />;
        break;
      case 'crosshair':
        iconComp = <Crosshair {...props} />;
        break;
      case 'target':
        iconComp = <Target {...props} />;
        break;
      case 'shield':
        iconComp = <Shield {...props} />;
        break;
      case 'zap':
        iconComp = <Zap {...props} />;
        break;
      case 'flame':
        iconComp = <Flame {...props} />;
        break;
      case 'bomb':
        iconComp = <Bomb {...props} />;
        break;
      case 'trophy':
        iconComp = <Trophy {...props} />;
        break;
      default:
        iconComp = <Award {...props} />;
        break;
    }

    let colorClass = 'text-slate-600';
    if (isUnlocked) {
      if (tier === 'platinum') colorClass = 'text-cyan-300';
      else if (tier === 'gold') colorClass = 'text-amber-400';
      else if (tier === 'silver') colorClass = 'text-slate-200';
      else colorClass = 'text-amber-500';
    }

    return <div className={colorClass}>{iconComp}</div>;
  };

  const streakInfo = careerManager.getStreakInfo();

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 select-none font-display">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl p-5 sm:p-7 max-w-3xl w-full shadow-2xl text-slate-100 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Tutup Berkas Pilot"
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-semibold">
            KOMANDO ANGKATAN UDARA PUSAT · REKAM JEJAK PILOT
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-wider mb-4">
          BERKAS PROFIL PILOT TEMPUR
        </h2>

        {/* Pilot Identity & Rank Banner */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 mb-5 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Active Avatar Portrait */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.3)] bg-slate-900">
              <img
                src={activeAvatar.image}
                alt={activeAvatar.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                }}
              />
              <div className="hidden text-cyan-400">
                <User className="w-12 h-12" />
              </div>
            </div>

            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded bg-slate-950 border border-cyan-400 text-[10px] font-mono text-cyan-300 font-bold tracking-widest shadow">
              LVL {careerProgress.currentRank.level}
            </div>
          </div>

          {/* Callsign & Rank Info */}
          <div className="flex-1 text-center sm:text-left w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                {isEditingCallsign ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      maxLength={14}
                      value={callsignInput}
                      onChange={(e) => setCallsignInput(e.target.value.toUpperCase())}
                      className="bg-slate-900 border border-cyan-400 px-2.5 py-1 rounded-lg text-lg font-bold font-mono text-white uppercase focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveCallsign}
                      className="p-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-wider">
                      {careerData.pilotName || profile.callsign}
                    </h3>
                    <button
                      onClick={() => setIsEditingCallsign(true)}
                      title="Edit Nama Pilot"
                      className="p-1 text-slate-400 hover:text-cyan-400 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5">
                {/* Military Rank Pill Badge with Equipped Rank Emblem SVG */}
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 border rounded-lg text-xs font-mono font-bold ${getRankTierBadgeStyle(
                    careerProgress.currentRank.tierColor
                  )}`}
                >
                  <RankEmblemSVG
                    motif={activeRankEmblem.motif}
                    primaryColor={activeRankEmblem.primaryColor}
                    secondaryColor={activeRankEmblem.secondaryColor}
                    size={18}
                    unlocked={activeRankEmblem.unlocked}
                  />
                  <span>{careerProgress.currentRank.insignia}</span>
                  <span>{careerProgress.currentRank.title}</span>
                </div>

                {/* Mission Streak Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/40 rounded-lg text-xs font-mono font-bold text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-500/40 animate-pulse shrink-0" />
                  <span>RENTETAN MISI: {streakInfo.streakDays} HARI</span>
                  {streakInfo.streakMultiplier > 1 && (
                    <span className="text-[10px] text-amber-200/90 font-semibold bg-amber-900/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                      +{Math.round((streakInfo.streakMultiplier - 1) * 100)}% XP
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-3">{activeAvatar.bio}</p>

            {/* Career Progression Bar */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>PROGRESI KARIR</span>
                <span className="tabular-nums text-slate-300">
                  {careerProgress.isMaxRank ? (
                    <span className="text-purple-400 font-bold">PANGKAT MAKSIMAL</span>
                  ) : (
                    `${careerProgress.currentXp.toLocaleString('id-ID')} XP · Berikutnya: ${careerProgress.xpRemaining.toLocaleString('id-ID')} XP lagi`
                  )}
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-400 rounded-full transition-all duration-500 shadow-[0_0_8px_#38bdf8]"
                  style={{ width: `${careerProgress.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Avatar Selection Grid */}
        <div className="mb-5">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
            PILIH AVATAR PILOT:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PILOT_AVATARS.map((avatar) => {
              const isSelected = selectedAvatarId === avatar.id;
              return (
                <button
                  key={avatar.id}
                  onClick={() => handleSelectAvatar(avatar.id)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-400 ring-1 ring-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="aspect-square w-full rounded-lg overflow-hidden mb-1.5 bg-slate-900">
                    <img
                      src={avatar.image}
                      alt={avatar.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="font-bold text-xs text-white truncate">
                    {avatar.defaultCallsign}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {avatar.specialty}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lifetime Career Statistics (4x2 Grid) */}
        <div className="mb-6">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span>STATISTIK KARIR SEUMUR HIDUP</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            {/* 1. MISSIONS FLOWN (white) */}
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                TOTAL MISI
              </div>
              <div className="text-xl font-bold font-mono text-white tabular-nums">
                <AnimatedNumber value={careerData.stats.missionsFlown} />
              </div>
            </div>

            {/* 2. ENEMIES DEFEATED (pink/rose) */}
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                MUSUH DIKALAHKAN
              </div>
              <div className="text-xl font-bold font-mono text-rose-400 tabular-nums">
                <AnimatedNumber value={careerData.stats.enemiesDefeated} />
              </div>
            </div>

            {/* 3. FLAGSHIPS SUNK (yellow/amber) */}
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                KAPAL INDUK DITENGGELAMKAN
              </div>
              <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
                <AnimatedNumber value={careerData.stats.flagshipsSunk} />
              </div>
            </div>

            {/* 4. BOMBS DEPLOYED (cyan) */}
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                BOM DIGUNAKAN
              </div>
              <div className="text-xl font-bold font-mono text-cyan-400 tabular-nums">
                <AnimatedNumber value={careerData.stats.bombsDeployed} />
              </div>
            </div>

            {/* 5. CAREER SCORE (green/emerald) */}
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                SKOR KARIR
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                <AnimatedNumber value={careerData.stats.careerScore} />
              </div>
            </div>

            {/* 6. HIGHEST SECTOR (sky blue, format "SECTOR {n}") */}
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                SEKTOR TERTINGGI
              </div>
              <div className="text-xl font-bold font-mono text-sky-400 tabular-nums">
                SEKTOR {careerData.stats.highestSector}
              </div>
            </div>

            {/* 7. OVERALL ACCURACY (yellow/amber, format "{n}%") */}
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                AKURASI KESELURUHAN
              </div>
              <div className="text-xl font-bold font-mono text-amber-300 tabular-nums">
                <AnimatedNumber value={lifetimeAccuracyPercent} formatter={(v) => `${v}%`} />
              </div>
            </div>

            {/* 8. RECORD SCORE (white, highlight NEW RECORD if broken) */}
            <div className={`bg-slate-950/80 border p-3 rounded-xl relative ${careerData.isNewRecord ? 'border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'border-slate-800'}`}>
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-1 flex items-center justify-center gap-1">
                <span>REKOR SKOR</span>
                {careerData.isNewRecord && (
                  <span className="text-[8px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1 rounded animate-pulse">
                    REKOR BARU
                  </span>
                )}
              </div>
              <div className="text-xl font-bold font-mono text-white tabular-nums">
                <AnimatedNumber value={careerData.stats.recordScore} />
              </div>
            </div>
          </div>
        </div>

        {/* Combat Achievements & Milestone Badges */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                PENCAPAIAN TEMPUR & LENCANA PRESTASI
              </span>
            </div>

            {/* Overall Unlocked Summary */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">TERBUKA:</span>
              <span className="font-bold text-amber-400 tabular-nums">
                {totalUnlocked} / {totalCount}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 font-bold tabular-nums">
                {overallCompletion}%
              </span>
            </div>
          </div>

          {/* Overall Completion Bar */}
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800 mb-3">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${overallCompletion}%` }}
            />
          </div>

          {/* Interactive Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800/80 rounded-xl mb-3">
            {[
              { id: 'all', label: 'Semua Lencana' },
              { id: 'combat', label: 'Pertempuran' },
              { id: 'accuracy', label: 'Presisi' },
              { id: 'tactical', label: 'Taktis' },
              { id: 'career', label: 'Karir' },
            ].map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id as 'all' | AchievementCategory)}
                  className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Achievement Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredAchievements.map((ach) => {
              const isUnlocked = ach.unlocked;

              // Border and background based on tier and unlock state
              let cardStyle = 'bg-slate-950/40 border-slate-800/80 text-slate-500';
              if (isUnlocked) {
                if (ach.tier === 'platinum') {
                  cardStyle = 'bg-cyan-950/20 border-cyan-500/40 shadow-[0_0_12px_rgba(56,189,248,0.15)] text-slate-200';
                } else if (ach.tier === 'gold') {
                  cardStyle = 'bg-amber-950/25 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.12)] text-slate-200';
                } else if (ach.tier === 'silver') {
                  cardStyle = 'bg-slate-900/60 border-slate-600/50 shadow-[0_0_8px_rgba(148,163,184,0.1)] text-slate-200';
                } else {
                  cardStyle = 'bg-amber-950/15 border-amber-700/40 text-slate-200';
                }
              }

              return (
                <div
                  key={ach.id}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${cardStyle}`}
                >
                  <div>
                    {/* Top Row: Icon, Title, Tier & Status */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isUnlocked
                              ? ach.tier === 'platinum'
                                ? 'bg-cyan-500/15 border-cyan-400/50'
                                : ach.tier === 'gold'
                                ? 'bg-amber-500/20 border-amber-400/50'
                                : ach.tier === 'silver'
                                ? 'bg-slate-500/20 border-slate-400/50'
                                : 'bg-amber-800/20 border-amber-700/50'
                              : 'bg-slate-900/80 border-slate-800 text-slate-600'
                          }`}
                        >
                          {renderIcon(ach.iconName, isUnlocked, ach.tier)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs truncate text-white">
                              {ach.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            {getTierBadge(ach.tier)}
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-400 uppercase font-mono">{ach.category}</span>
                          </div>
                        </div>
                      </div>

                      {/* Unlocked / Locked Indicator */}
                      <div className="shrink-0">
                        {isUnlocked ? (
                          <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500/20 text-emerald-400" />
                            <span>TERCAPAI</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                            <Lock className="w-3 h-3" />
                            <span>TERKUNCI</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-400 mb-2.5 line-clamp-2">
                      {ach.description}
                    </p>
                  </div>

                  {/* Progress Bar & Numerical Metrics */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>PROGRES</span>
                      <span className="tabular-nums text-slate-300">
                        {isUnlocked ? (
                          <span className="text-emerald-400 font-semibold">100% SELESAI</span>
                        ) : (
                          `${ach.currentProgress.toLocaleString('id-ID')} / ${ach.maxProgress.toLocaleString('id-ID')} ${ach.progressUnit} (${ach.progressPercent}%)`
                        )}
                      </span>
                    </div>

                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isUnlocked
                            ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                            : 'bg-cyan-500'
                        }`}
                        style={{ width: `${ach.progressPercent}%` }}
                      />
                    </div>

                    {isUnlocked && ach.unlockedAt && (
                      <div className="text-[9px] font-mono text-slate-500 mt-1.5 text-right">
                        Diberikan pada {ach.unlockedAt}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Equippable Geometric Insignias Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              INSIGNIA & LAMBANG GEOMETRIS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {insigniaStatuses.map((insignia) => {
              const isEquipped = insignia.id === equippedInsigniaId;

              return (
                <div
                  key={insignia.id}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                    isEquipped
                      ? 'bg-cyan-950/30 border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                      : insignia.unlocked
                      ? 'bg-slate-950/60 border-slate-700 hover:border-slate-600'
                      : 'bg-slate-950/30 border-slate-800/80 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 shadow-inner">
                          {renderGeometricEmblemSVG(
                            insignia.geometricShape,
                            insignia.colorTheme.primary,
                            insignia.colorTheme.secondary,
                            32
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white truncate">
                            {insignia.name}
                          </div>
                          <div className="text-[10px] font-mono text-cyan-400">
                            {insignia.codename}
                          </div>
                        </div>
                      </div>

                      {/* Equip or Locked badge */}
                      <div className="shrink-0">
                        {isEquipped ? (
                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400 text-[10px] font-mono font-bold text-cyan-300 shadow-[0_0_8px_#38bdf8]">
                            DIPAKAI
                          </span>
                        ) : insignia.unlocked ? (
                          <button
                            onClick={() => handleEquipInsignia(insignia.id)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[10px] font-mono font-bold text-slate-200 transition-colors cursor-pointer"
                          >
                            PAKAI
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                            <Lock className="w-3 h-3" />
                            <span>TERKUNCI</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 mb-3 line-clamp-2">
                      {insignia.description}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>TANTANGAN</span>
                      <span className="tabular-nums text-slate-300">
                        {insignia.unlocked ? (
                          <span className="text-emerald-400 font-semibold">TERBUKA</span>
                        ) : (
                          `${insignia.currentProgress.toLocaleString('id-ID')} / ${insignia.requirementTarget.toLocaleString('id-ID')} (${insignia.progressPercent}%)`
                        )}
                      </span>
                    </div>

                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          insignia.unlocked ? 'bg-cyan-400 shadow-[0_0_6px_#38bdf8]' : 'bg-slate-600'
                        }`}
                        style={{ width: `${insignia.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 10 Military Rank Emblems Collection Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                LENCANA PANGKAT MILITER (10 PANGKAT)
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">TERBUKA:</span>
              <span className="font-bold text-amber-400 tabular-nums">
                {unlockedEmblemCount} / 10
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 font-bold tabular-nums">
                {emblemCompletionPercent}%
              </span>
            </div>
          </div>

          {/* Collection Completion Bar */}
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800 mb-3">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-cyan-400 to-purple-400 rounded-full transition-all duration-300"
              style={{ width: `${emblemCompletionPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {rankEmblemStatuses.map((emblem) => {
              const isEquipped = emblem.id === equippedRankEmblemId;

              return (
                <div
                  key={emblem.id}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                    isEquipped
                      ? 'bg-amber-950/30 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                      : emblem.unlocked
                      ? 'bg-slate-950/60 border-slate-700 hover:border-slate-600'
                      : 'bg-slate-950/30 border-slate-800/80 opacity-70'
                  }`}
                >
                  <div>
                    {/* Emblem Header Row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-xl bg-slate-900 border flex items-center justify-center shrink-0 shadow-inner ${
                            emblem.unlocked
                              ? 'border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                              : 'border-slate-800 opacity-50'
                          }`}
                        >
                          <RankEmblemSVG
                            motif={emblem.motif}
                            primaryColor={emblem.primaryColor}
                            secondaryColor={emblem.secondaryColor}
                            size={36}
                            unlocked={emblem.unlocked}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-white truncate">
                              {emblem.rankTitle}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-amber-400 truncate">
                            {emblem.emblemName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            LVL {emblem.level} · {emblem.insigniaSymbol}
                          </div>
                        </div>
                      </div>

                      {/* Equip / Equipped / Locked Button */}
                      <div className="shrink-0">
                        {isEquipped ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400 text-[10px] font-mono font-bold text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                            DIPAKAI
                          </span>
                        ) : emblem.unlocked ? (
                          <button
                            onClick={() => handleEquipRankEmblem(emblem.id)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[10px] font-mono font-bold text-slate-200 transition-colors cursor-pointer"
                          >
                            PAKAI
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                            <Lock className="w-3 h-3" />
                            <span>TERKUNCI</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 mb-2.5 line-clamp-2">
                      {emblem.description}
                    </p>
                  </div>

                  {/* Requirement Progress */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>SYARAT</span>
                      <span className="tabular-nums text-slate-300">
                        {emblem.unlocked ? (
                          <span className="text-emerald-400 font-semibold">DIPEROLEH (LVL {emblem.level})</span>
                        ) : (
                          `CAPAI LVL ${emblem.level} (${emblem.minXp.toLocaleString('id-ID')} XP)`
                        )}
                      </span>
                    </div>

                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          emblem.unlocked ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-slate-700'
                        }`}
                        style={{ width: `${emblem.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Close Button CTA */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] cursor-pointer"
        >
          TUTUP BERKAS KARIR
        </button>

        {/* Reset Career Data Section */}
        <div className="mt-4 border-t border-slate-800/80 pt-4 flex flex-col items-center">
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 text-rose-400 hover:text-rose-200 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              RESET DATA KARIR
            </button>
          ) : (
            <div className="bg-rose-950/80 border border-rose-600/80 rounded-xl p-3.5 text-center max-w-md w-full shadow-lg">
              <div className="flex items-center justify-center gap-1.5 text-rose-300 font-mono text-xs font-bold uppercase mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>KONFIRMASI RESET KARIR?</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono mb-3">
                Reset semua XP karir pilot, kenaikan pangkat, dan statistik seumur hidup? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handleResetCareer}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono rounded-lg transition-colors cursor-pointer"
                >
                  RESET KARIR
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs font-mono rounded-lg transition-colors cursor-pointer"
                >
                  BATAL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
