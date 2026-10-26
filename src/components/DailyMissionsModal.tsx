import React, { useState } from 'react';
import { DailyMission, SpecialContract } from '../game/types';
import { missionManager, getTodayDateString, SPECIAL_CONTRACTS } from '../game/missions';
import { X, Award, Shield, Zap, Bomb, CheckCircle2, RotateCw, Calendar, ScrollText } from 'lucide-react';

interface DailyMissionsModalProps {
  missions: DailyMission[];
  onClose: () => void;
  onRefreshMissions: () => void;
  onSelectContract: (contract: SpecialContract | null) => void;
  activeContract: SpecialContract | null;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({
  missions,
  onClose,
  onRefreshMissions,
  onSelectContract,
  activeContract,
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
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl text-slate-100 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
          <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-semibold">
            MISI TAKTIS MARKAS BESAR · DIPERBARUI HARIAN
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wider">MISI TEMPUR HARIAN</h2>
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>TANGGAL: {todayStr}</span>
          </div>
        </div>

        {/* Active Multiplier & Buff Banner */}
        <div className="bg-gradient-to-r from-amber-500/15 via-slate-950/70 to-cyan-500/15 border border-amber-500/30 rounded-xl p-3.5 mb-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              PENGALI BONUS TEMPUR AKTIF
            </div>
            <div className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-amber-400 font-mono tabular-nums">
                +{Math.round(totalScoreBonus * 100)}% BONUS SKOR
              </span>
              <span className="text-xs text-slate-400 font-normal">
                ({completedCount}/{missions.length} Misi Selesai)
              </span>
            </div>
          </div>

          <button
            onClick={onRefreshMissions}
            title="Acak ulang operasional harian"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCw className="w-3 h-3 text-cyan-400" />
            <span>ACAK ULANG</span>
          </button>
        </div>

        {/* Special Contracts Selection */}
        <div className="mb-6">
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
            <ScrollText className="w-3.5 h-3.5" />
            <span>KONTRAK KHUSUS (PILIH 1)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SPECIAL_CONTRACTS.map((contract) => {
              const isSelected = activeContract?.id === contract.id;
              return (
                <button
                  key={contract.id}
                  onClick={() => onSelectContract(isSelected ? null : contract)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-white flex justify-between">
                    {contract.title}
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{contract.description}</div>
                  <div className="text-[11px] font-mono font-bold text-amber-400 mt-2">
                    +{contract.bonusXp} XP BONUS
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mission Cards List */}
        <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-1">
          {missions.map((mission) => {
            const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
            return (
              <div
                key={mission.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  mission.completed
                    ? 'bg-emerald-950/20 border-emerald-500/50'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-400">{mission.codename}</span>
                      {mission.completed && <span className="text-[10px] text-emerald-400">SELESAI</span>}
                    </div>
                    <div className="font-bold text-sm text-white mt-0.5">{mission.title}</div>
                    <p className="text-xs text-slate-400 mt-0.5">{mission.description}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-amber-300">
                    {getRewardIcon(mission.rewardType)}
                    <span className="tabular-nums font-semibold">{mission.rewardLabel}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className={`h-full ${mission.completed ? 'bg-emerald-400' : 'bg-cyan-400'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl cursor-pointer"
        >
          KONFIRMASI & KEMBALI
        </button>
      </div>
    </div>
  );
};
