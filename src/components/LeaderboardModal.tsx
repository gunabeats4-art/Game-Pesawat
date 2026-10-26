import React, { useState } from 'react';
import { leaderboardManager, LeaderboardEntry } from '../game/leaderboard';
import { PILOT_AVATARS } from '../game/pilot';
import { PLANE_CONFIGS } from '../game/planes';
import { PlaneId } from '../game/types';
import { X, Trophy, Medal, Crown, Crosshair, RotateCcw, User } from 'lucide-react';

interface LeaderboardModalProps {
  onClose: () => void;
  playerCallsign?: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  onClose,
  playerCallsign,
}) => {
  const [filter, setFilter] = useState<'all' | PlaneId>('all');
  const entries: LeaderboardEntry[] = leaderboardManager.getTop10(filter);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold shadow-[0_0_8px_rgba(245,158,11,0.25)]">
            <Crown className="w-4 h-4 fill-current" />
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-400/20 text-slate-300 border border-slate-400/40 font-bold">
            <Medal className="w-4 h-4 fill-current" />
          </div>
        );
      case 3:
        return (
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-700/20 text-amber-600 border border-amber-700/40 font-bold">
            <Medal className="w-4 h-4 fill-current" />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-mono text-xs font-semibold tabular-nums">
            #{rank}
          </div>
        );
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 select-none font-display">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl text-slate-100 relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Leaderboard"
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
          <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-semibold">
            CENTRAL COMMAND · GLOBAL ACE RANKINGS
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wider flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" />
            TOP 10 SQUADRON RECORD
          </h2>

          {/* Interactive Aircraft Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 shrink-0 text-xs font-mono">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-slate-800 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setFilter('garuda')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                filter === 'garuda'
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              GARUDA-X
            </button>
            <button
              onClick={() => setFilter('valkyrie')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                filter === 'valkyrie'
                  ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              VALKYRIE
            </button>
            <button
              onClick={() => setFilter('titan')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                filter === 'titan'
                  ? 'bg-amber-950 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              TITAN
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="flex-1 overflow-y-auto pr-1 mb-6 border border-slate-800/80 rounded-xl bg-slate-950/60 divide-y divide-slate-800/60">
          {entries.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              NO SORTIE RECORDS FOUND FOR THIS SQUADRON FILTER
            </div>
          ) : (
            entries.map((entry, idx) => {
              const rank = idx + 1;
              const isCurrentPlayer =
                entry.isPlayer || (playerCallsign && entry.callsign === playerCallsign);
              const avatar =
                PILOT_AVATARS.find((a) => a.id === entry.avatarId) || PILOT_AVATARS[0];
              const plane = PLANE_CONFIGS[entry.planeId];

              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 sm:p-3.5 transition-colors ${
                    isCurrentPlayer
                      ? 'bg-cyan-950/30 border-l-2 border-cyan-400'
                      : rank <= 3
                      ? 'bg-slate-900/40 hover:bg-slate-900/70'
                      : 'hover:bg-slate-900/30'
                  }`}
                >
                  {/* Left: Rank & Pilot Avatar & Callsign */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">{getRankBadge(rank)}</div>

                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-900">
                      <img
                        src={avatar.image}
                        alt={entry.callsign}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm sm:text-base font-mono tracking-wider text-white truncate">
                          {entry.callsign}
                        </span>
                        {isCurrentPlayer && (
                          <span className="text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded">
                            YOU
                          </span>
                        )}
                      </div>

                      {/* Clean Unboxed Metadata with Typographic Separators */}
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mt-0.5">
                        <span style={{ color: plane.primaryColor }}>{plane.name}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span>Sector {entry.wave}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span>{entry.accuracy}% ACC</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score and Date */}
                  <div className="text-right shrink-0 pl-3">
                    <div className="text-base sm:text-xl font-bold font-mono tabular-nums text-white tracking-wider">
                      {entry.score.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {entry.date}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Reset for testing and Close button */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => {
              leaderboardManager.resetToDefaults();
              setFilter('all');
            }}
            title="Reset community high scores to defaults"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET TO DEFAULTS</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] cursor-pointer text-sm"
          >
            CLOSE RANKINGS
          </button>
        </div>
      </div>
    </div>
  );
};
