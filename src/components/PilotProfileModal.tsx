import React, { useState } from 'react';
import {
  pilotManager,
  PILOT_AVATARS,
  getRankInfo,
  PilotProfile,
} from '../game/pilot';
import {
  achievementManager,
  AchievementCategory,
  AchievementStatus,
  AchievementTier,
} from '../game/achievements';
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
} from 'lucide-react';

interface PilotProfileModalProps {
  onClose: () => void;
  onProfileUpdated: (profile: PilotProfile) => void;
}

export const PilotProfileModal: React.FC<PilotProfileModalProps> = ({
  onClose,
  onProfileUpdated,
}) => {
  const profile = pilotManager.getProfile();
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(profile.avatarId);
  const [callsignInput, setCallsignInput] = useState<string>(profile.callsign);
  const [isEditingCallsign, setIsEditingCallsign] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | AchievementCategory>('all');

  const activeAvatar =
    PILOT_AVATARS.find((a) => a.id === selectedAvatarId) || PILOT_AVATARS[0];
  const rankInfo = getRankInfo(profile.careerXp);
  const achievementStatuses: AchievementStatus[] = achievementManager.getAchievementStatuses(profile);

  const totalUnlocked = achievementStatuses.filter((a) => a.unlocked).length;
  const totalCount = achievementStatuses.length;
  const overallCompletion = Math.round((totalUnlocked / totalCount) * 100);

  const filteredAchievements = selectedCategory === 'all'
    ? achievementStatuses
    : achievementStatuses.filter((a) => a.category === selectedCategory);

  const handleSelectAvatar = (id: string) => {
    setSelectedAvatarId(id);
    pilotManager.updateAvatar(id);
    onProfileUpdated(pilotManager.getProfile());
  };

  const handleSaveCallsign = () => {
    const trimmed = callsignInput.trim().toUpperCase().slice(0, 14);
    if (trimmed) {
      pilotManager.updateCallsign(trimmed);
      setCallsignInput(trimmed);
      setIsEditingCallsign(false);
      onProfileUpdated(pilotManager.getProfile());
    }
  };

  const lifetimeAccuracy =
    profile.totalShotsFired > 0
      ? Math.round((profile.totalShotsHit / profile.totalShotsFired) * 100)
      : 0;

  const getTierBadge = (tier: AchievementTier) => {
    switch (tier) {
      case 'platinum':
        return (
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-300">
            PLATINUM
          </span>
        );
      case 'gold':
        return (
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-400">
            GOLD
          </span>
        );
      case 'silver':
        return (
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-300">
            SILVER
          </span>
        );
      case 'bronze':
        return (
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-600">
            BRONZE
          </span>
        );
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

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 select-none font-display">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl p-5 sm:p-7 max-w-3xl w-full shadow-2xl text-slate-100 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Pilot Dossier"
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-semibold">
            CENTRAL AIR COMMAND · PILOT SERVICE RECORD
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-wider mb-4">
          COMBAT PILOT DOSSIER
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

            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-[10px] font-mono text-cyan-300 font-bold tracking-widest shadow">
              LVL {rankInfo.currentRank.level}
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
                      {profile.callsign}
                    </h3>
                    <button
                      onClick={() => setIsEditingCallsign(true)}
                      title="Edit Callsign"
                      className="p-1 text-slate-400 hover:text-cyan-400 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Military Rank Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-lg text-xs font-mono text-amber-300">
                <span>{rankInfo.currentRank.insignia}</span>
                <span className="font-bold">{rankInfo.currentRank.title}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-3">{activeAvatar.bio}</p>

            {/* Career Rank XP Bar */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>CAREER PROGRESSION</span>
                <span className="tabular-nums text-slate-300">
                  {profile.careerXp.toLocaleString()} XP
                  {rankInfo.nextRank && ` · Next: ${rankInfo.xpRemaining.toLocaleString()} XP needed`}
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-400 rounded-full transition-all duration-300 shadow-[0_0_8px_#38bdf8]"
                  style={{ width: `${rankInfo.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Avatar Selection Grid */}
        <div className="mb-5">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
            SELECT PILOT AVATAR:
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

        {/* Lifetime Combat Record */}
        <div className="mb-6">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span>LIFETIME CAREER STATISTICS</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-0.5">
                MISSIONS FLOWN
              </div>
              <div className="text-lg font-bold font-mono text-white tabular-nums">
                {profile.missionsFlown}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-0.5">
                ENEMIES DEFEATED
              </div>
              <div className="text-lg font-bold font-mono text-rose-400 tabular-nums">
                {profile.enemiesDefeated.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-0.5">
                FLAGSHIPS SUNK
              </div>
              <div className="text-lg font-bold font-mono text-amber-400 tabular-nums">
                {profile.bossesDefeated}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-0.5">
                BOMBS DEPLOYED
              </div>
              <div className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
                {profile.bombsDeployed}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-0.5">
                CAREER SCORE
              </div>
              <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                {profile.totalScoreEarned.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-0.5">
                HIGHEST SECTOR
              </div>
              <div className="text-lg font-bold font-mono text-sky-400 tabular-nums">
                SECTOR {profile.highestWave}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-0.5">
                OVERALL ACCURACY
              </div>
              <div className="text-lg font-bold font-mono text-amber-300 tabular-nums">
                {lifetimeAccuracy}%
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-0.5">
                RECORD SCORE
              </div>
              <div className="text-lg font-bold font-mono text-white tabular-nums">
                {profile.highestScore.toLocaleString()}
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
                COMBAT ACHIEVEMENTS & MILESTONE BADGES
              </span>
            </div>

            {/* Overall Unlocked Summary */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">UNLOCKED:</span>
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
              { id: 'all', label: 'All Badges' },
              { id: 'combat', label: 'Combat' },
              { id: 'accuracy', label: 'Precision' },
              { id: 'tactical', label: 'Tactical' },
              { id: 'career', label: 'Career' },
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
                            <span>ACHIEVED</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                            <Lock className="w-3 h-3" />
                            <span>LOCKED</span>
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
                      <span>PROGRESS</span>
                      <span className="tabular-nums text-slate-300">
                        {isUnlocked ? (
                          <span className="text-emerald-400 font-semibold">100% COMPLETED</span>
                        ) : (
                          `${ach.currentProgress.toLocaleString()} / ${ach.maxProgress.toLocaleString()} ${ach.progressUnit} (${ach.progressPercent}%)`
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
                        Awarded on {ach.unlockedAt}
                      </div>
                    )}
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
          CLOSE SERVICE DOSSIER
        </button>
      </div>
    </div>
  );
};
