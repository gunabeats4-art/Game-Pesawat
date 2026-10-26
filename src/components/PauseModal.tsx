import React, { useEffect } from 'react';
import { DailyMission } from '../game/types';
import { Play, RotateCcw, Home, Volume2, VolumeX, Target, CheckCircle2, Trophy } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onReturnToTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  activeMissions: DailyMission[];
  onOpenMissions: () => void;
  onOpenLeaderboard?: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onReturnToTitle,
  isMuted,
  onToggleMute,
  activeMissions,
  onOpenMissions,
  onOpenLeaderboard,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        onResume();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onResume]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 select-none font-display">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center text-slate-100">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 text-cyan-400">
          <Play className="w-6 h-6 fill-current" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-wider mb-0.5">TACTICAL PAUSE</h2>
        <p className="text-xs text-slate-400 mb-4 font-mono">MISSION TIME SUSPENDED</p>

        {/* Daily Directives Quick View */}
        {activeMissions && activeMissions.length > 0 && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 mb-5 text-left">
            <div className="flex items-center justify-between text-xs font-mono text-amber-400 mb-2">
              <span className="flex items-center gap-1 font-semibold uppercase">
                <Target className="w-3.5 h-3.5" /> DAILY DIRECTIVES
              </span>
              <button
                onClick={onOpenMissions}
                className="text-cyan-400 hover:text-cyan-300 underline text-[11px] cursor-pointer"
              >
                VIEW DETAILS
              </button>
            </div>
            <div className="space-y-1.5">
              {activeMissions.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 truncate max-w-[200px] flex items-center gap-1.5">
                    {m.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                    )}
                    {m.title}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-400">
                    {m.progress}/{m.target}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2.5 mb-5">
          <button
            onClick={onResume}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            RESUME SORTIE [ESC]
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-200 font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            RESTART MISSION
          </button>

          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-amber-300 font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-mono"
            >
              <Trophy className="w-3.5 h-3.5" />
              GLOBAL LEADERBOARD
            </button>
          )}

          <button
            onClick={onReturnToTitle}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            RETURN TO HANGAR
          </button>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <span>AUDIO TOGGLE</span>
          <button
            onClick={onToggleMute}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-lg hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isMuted ? 'MUTED' : 'ACTIVE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
