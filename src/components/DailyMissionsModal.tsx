import React from 'react';
import { DailyMission } from '../game/types';
import { missionManager, getTodayDateString } from '../game/missions';
import { X, Award, Shield, Zap, Bomb, CheckCircle2, RotateCw, Calendar } from 'lucide-react';

interface DailyMissionsModalProps {
  missions: DailyMission[];
  onClose: () => void;
  onRefreshMissions: () => void;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({
  missions,
  onClose,
  onRefreshMissions,
}) => {
  const completedCount = missions.filter((m) => m.completed).length;
  const totalScoreBonus = missionManager.getTotalScoreMultiplierBonus();
  const todayStr = getTodayDateString();

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'shield_overcharge':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'instant_bomb':
        return <Bomb className="w-4 h-4 text-amber-400" />;
      case 'hyper_cannons':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      default:
        return <Award className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 select-none font-display">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-2xl text-slate-100 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Directives"
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
          <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-semibold">
            HQ TACTICAL DIRECTIVES · ROTATING DAILY
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wider">DAILY COMBAT MISSIONS</h2>
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>DATE: {todayStr}</span>
          </div>
        </div>

        {/* Active Multiplier & Buff Banner */}
        <div className="bg-gradient-to-r from-amber-500/15 via-slate-950/70 to-cyan-500/15 border border-amber-500/30 rounded-xl p-3.5 mb-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              ACTIVE COMBAT MULTIPLIER
            </div>
            <div className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-amber-400 font-mono tabular-nums">
                +{Math.round(totalScoreBonus * 100)}% SCORE BONUS
              </span>
              <span className="text-xs text-slate-400 font-normal">
                ({completedCount}/{missions.length} Directives Cleared)
              </span>
            </div>
          </div>

          <button
            onClick={onRefreshMissions}
            title="Reroll daily operations for new tactical challenges"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCw className="w-3 h-3 text-cyan-400" />
            <span>REROLL</span>
          </button>
        </div>

        {/* Mission Cards List */}
        <div className="space-y-3 mb-6 max-h-[340px] overflow-y-auto pr-1">
          {missions.map((mission) => {
            const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));

            return (
              <div
                key={mission.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  mission.completed
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-400 tracking-wider">
                        {mission.codename}
                      </span>
                      {mission.completed && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> COMPLETED
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-sm sm:text-base text-white mt-0.5">
                      {mission.title}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{mission.description}</p>
                  </div>

                  {/* Reward Badge */}
                  <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-amber-300">
                    {getRewardIcon(mission.rewardType)}
                    <span className="tabular-nums font-semibold">{mission.rewardLabel}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>PROGRESS</span>
                    <span className="tabular-nums text-slate-300 font-semibold">
                      {mission.progress} / {mission.target} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        mission.completed ? 'bg-emerald-400' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] cursor-pointer"
        >
          CONFIRM DIRECTIVES & RETURN
        </button>
      </div>
    </div>
  );
};
