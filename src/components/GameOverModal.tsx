import React, { useEffect } from 'react';
import { GameStats } from '../game/types';
import { AchievementStatus } from '../game/achievements';
import { RotateCcw, Home, Award, Target, Crosshair, Zap, Trophy, Crown, CheckCircle2 } from 'lucide-react';

interface GameOverModalProps {
  isVictory: boolean;
  stats: GameStats;
  onRestart: () => void;
  onReturnToTitle: () => void;
  onOpenMissions?: () => void;
  xpEarned?: number;
  didRankUp?: boolean;
  newRankTitle?: string;
  onOpenProfile?: () => void;
  leaderboardRank?: number | null;
  onOpenLeaderboard?: () => void;
  unlockedAchievements?: AchievementStatus[];
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  stats,
  onRestart,
  onReturnToTitle,
  onOpenMissions,
  xpEarned = 0,
  didRankUp = false,
  newRankTitle = '',
  onOpenProfile,
  leaderboardRank = null,
  onOpenLeaderboard,
  unlockedAchievements = [],
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart]);

  const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;
  const isNewHighScore = stats.score >= stats.highScore && stats.score > 0;
  const completedMissions = stats.activeMissions?.filter((m) => m.completed) || [];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/90 select-none font-display">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-slate-100">
        {/* Status Header */}
        <div className="text-center mb-6">
          <div
            className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 border ${
              isVictory
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-400'
            }`}
          >
            {isVictory ? <Award className="w-8 h-8" /> : <Target className="w-8 h-8" />}
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-wider mb-1">
            {isVictory ? 'MISSION ACCOMPLISHED' : 'AIRCRAFT DOWNED'}
          </h2>
          <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">
            {isVictory ? 'ALL HOSTILE FORCES ELIMINATED' : 'TACTICAL RETREAT · SORTIE TERMINATED'}
          </p>
        </div>

        {/* Score & Record Display */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center mb-5">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">FINAL SCORE</div>
          <div className="text-3xl sm:text-4xl font-bold font-mono tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-200">
            {stats.score.toLocaleString()}
          </div>

          {stats.missionBonusMultiplier > 0 && (
            <div className="text-xs font-mono text-amber-400 mt-1">
              INCLUDES +{Math.round(stats.missionBonusMultiplier * 100)}% DAILY MISSION BONUS MULTIPLIER
            </div>
          )}

          {isNewHighScore ? (
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold">
              <Award className="w-3.5 h-3.5" /> NEW SQUADRON RECORD!
            </div>
          ) : (
            <div className="text-xs font-mono text-slate-400 mt-1">
              BEST: <span className="tabular-nums text-slate-300">{stats.highScore.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Detailed Debrief Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5 text-center">
          <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase mb-0.5">SECTOR</div>
            <div className="text-lg font-bold font-mono text-cyan-400 tabular-nums">{stats.wave}</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase mb-0.5">KILLS</div>
            <div className="text-lg font-bold font-mono text-rose-400 tabular-nums">{stats.enemiesKilled}</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase mb-0.5">MAX COMBO</div>
            <div className="text-lg font-bold font-mono text-amber-400 tabular-nums">x{stats.maxCombo}</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase mb-0.5">ACCURACY</div>
            <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">{accuracy}%</div>
          </div>
        </div>

        {/* Daily Directives Summary Badge */}
        {stats.activeMissions && stats.activeMissions.length > 0 && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 mb-5 flex items-center justify-between text-left">
            <div>
              <div className="text-[10px] font-mono uppercase text-amber-400 font-semibold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> DAILY DIRECTIVES PROGRESS
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                <span className="font-bold text-white tabular-nums">{completedMissions.length}</span> of{' '}
                <span className="tabular-nums">{stats.activeMissions.length}</span> Directives Complete
              </div>
            </div>

            {onOpenMissions && (
              <button
                onClick={onOpenMissions}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 hover:text-white transition-colors cursor-pointer"
              >
                DIRECTIVES
              </button>
            )}
          </div>
        )}

        {/* Pilot Career XP & Rank Promotion Banner */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 mb-5 flex items-center justify-between text-left">
          <div>
            <div className="text-[10px] font-mono uppercase text-cyan-400 font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> PILOT CAREER PROGRESSION
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              <span className="font-bold text-white tabular-nums">+{xpEarned.toLocaleString()} XP</span> Earned This Sortie
            </div>
            {didRankUp && (
              <div className="text-xs font-bold text-amber-400 mt-1 flex items-center gap-1 animate-pulse">
                <span>★ PROMOTION EARNED:</span>
                <span>{newRankTitle}!</span>
              </div>
            )}
          </div>

          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono text-amber-300 hover:text-white transition-colors cursor-pointer"
            >
              DOSSIER
            </button>
          )}
        </div>

        {/* Newly Unlocked Combat Achievements Banner */}
        {unlockedAchievements && unlockedAchievements.length > 0 && (
          <div className="bg-amber-950/30 border border-amber-500/50 rounded-xl p-3 mb-5 text-left shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <div className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" /> COMBAT BADGE UNLOCKED!
              </span>
              <span className="text-[9px] text-amber-300/80">INSPECT IN DOSSIER</span>
            </div>
            <div className="mt-1.5 space-y-1">
              {unlockedAchievements.map((ach) => (
                <div key={ach.id} className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {ach.title}
                  </span>
                  <span className="text-[10px] uppercase text-amber-300/90 font-semibold">
                    {ach.tier}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2.5">
          {leaderboardRank && leaderboardRank <= 10 && (
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center justify-between shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                GLOBAL TOP 10 REACHED: RANK #{leaderboardRank}!
              </span>
              {onOpenLeaderboard && (
                <button
                  onClick={onOpenLeaderboard}
                  className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 cursor-pointer"
                >
                  VIEW
                </button>
              )}
            </div>
          )}

          <button
            onClick={onRestart}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(14,165,233,0.35)] cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            PLAY AGAIN [SPACE / ENTER]
          </button>

          <div className="grid grid-cols-2 gap-2">
            {onOpenLeaderboard && (
              <button
                onClick={onOpenLeaderboard}
                className="py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-amber-300 font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-mono"
              >
                <Trophy className="w-3.5 h-3.5" />
                LEADERBOARD
              </button>
            )}

            <button
              onClick={onReturnToTitle}
              className={`py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-mono ${
                !onOpenLeaderboard ? 'col-span-2' : ''
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              HANGAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
