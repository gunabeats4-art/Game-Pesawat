/**
 * Combat Replay Highlight Reel Modal & Canvas Player
 * Renders recorded slow-motion replay frames of the last 30 seconds of gameplay.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { combatReplayBuffer, ReplayFrame } from '../game/replay';
import { drawFighterJet } from '../game/planes';
import { X, Play, Pause, RotateCcw, Film, FastForward, Clock } from 'lucide-react';

interface ReplayModalProps {
  onClose: () => void;
}

export const ReplayModal: React.FC<ReplayModalProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frames = combatReplayBuffer.getFrames();
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const totalFrames = frames.length;

  const renderFrame = useCallback((frame: ReplayFrame, ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // 1. Deep Ocean Background
    ctx.fillStyle = '#061325';
    ctx.fillRect(0, 0, w, h);

    const waterGrad = ctx.createLinearGradient(0, 0, 0, h);
    waterGrad.addColorStop(0, '#061325');
    waterGrad.addColorStop(0.5, '#081d39');
    waterGrad.addColorStop(1, '#06162a');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Render Bullets
    frame.bullets.forEach((b) => {
      ctx.save();
      ctx.shadowBlur = 6;
      ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 3. Render Enemies
    frame.enemies.forEach((e) => {
      ctx.save();
      ctx.translate(e.x, e.y);
      if (e.type === 'drone') {
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(14, -10);
        ctx.lineTo(-14, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (e.type === 'scout') {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(16, 2);
        ctx.lineTo(12, -14);
        ctx.lineTo(-12, -14);
        ctx.lineTo(-16, 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (e.type === 'boss') {
        ctx.fillStyle = '#18181b';
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 42);
        ctx.lineTo(40, 20);
        ctx.lineTo(65, 0);
        ctx.lineTo(55, -40);
        ctx.lineTo(0, -32);
        ctx.lineTo(-55, -40);
        ctx.lineTo(-65, 0);
        ctx.lineTo(-40, 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(-20, -16, 40, 32);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    });

    // 4. Render Player
    ctx.save();
    drawFighterJet(
      ctx,
      frame.playerX,
      frame.playerY,
      frame.planeId,
      frame.playerTiltX,
      frame.isBoosting,
      false
    );

    if (frame.playerShield > 10) {
      ctx.beginPath();
      ctx.arc(frame.playerX, frame.playerY - 2, 30, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || totalFrames === 0) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 800;

    let idx = currentFrameIndex;
    lastTimeRef.current = performance.now();

    const playLoop = (now: number) => {
      if (isPlaying) {
        const delta = (now - (lastTimeRef.current || now)) / 1000;
        if (delta >= 0.15) { // Slow motion playback (0.5x speed)
          lastTimeRef.current = now;
          idx = (idx + 1) % totalFrames;
          setCurrentFrameIndex(idx);
        }
      }

      const frame = frames[idx];
      if (frame) {
        renderFrame(frame, ctx, canvas.width, canvas.height);
      }

      animRef.current = requestAnimationFrame(playLoop);
    };

    animRef.current = requestAnimationFrame(playLoop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, frames, totalFrames, renderFrame]);

  if (totalFrames === 0) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 select-none font-display">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full text-center text-slate-100 shadow-2xl">
          <Film className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">DATA REPLAY TIDAK TERSEDIA</h3>
          <p className="text-xs text-slate-400 mb-5">
            Selesaikan pertempuran untuk menghasilkan data rekaman siaran ulang.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer"
          >
            KEMBALI
          </button>
        </div>
      </div>
    );
  }

  const currentFrame = frames[currentFrameIndex] || frames[0];
  const progressPercent = Math.round((currentFrameIndex / (totalFrames - 1 || 1)) * 100);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 select-none font-display">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-lg w-full text-slate-100 shadow-2xl flex flex-col items-center relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Tutup Replay"
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Film className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-bold">
            TELEMETRI TEMPUR // SIARAN ULANG GERAK LAMBAT
          </span>
        </div>

        {/* Canvas Display */}
        <div className="relative w-full aspect-[3/4] max-h-[420px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner mb-4 flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />

          {/* Slow Motion Badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-lg text-[10px] font-mono text-amber-300 font-bold flex items-center gap-1.5 shadow">
            <Clock className="w-3 h-3 animate-spin" />
            <span>0.5X GERAK LAMBAT</span>
          </div>

          {/* Telemetry HUD info */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-slate-950/80 backdrop-blur border border-slate-800/80 px-3 py-1.5 rounded-lg font-mono text-[11px]">
            <span className="text-cyan-400">SKOR: {currentFrame?.score.toLocaleString('id-ID')}</span>
            <span className="text-amber-400">SEKTOR {currentFrame?.wave}</span>
            <span className="text-rose-400">HP: {Math.ceil(currentFrame?.playerHp || 0)}</span>
          </div>
        </div>

        {/* Scrub Bar */}
        <div className="w-full mb-4">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span>GARIS WAKTU REPLAY</span>
            <span className="tabular-nums">
              BINGKAI {currentFrameIndex + 1} / {totalFrames} ({progressPercent}%)
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={totalFrames - 1}
            value={currentFrameIndex}
            onChange={(e) => setCurrentFrameIndex(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => setCurrentFrameIndex(0)}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Ulangi Siaran Ulang"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)] cursor-pointer flex items-center justify-center gap-2"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'JEDA SIARAN ULANG' : 'PUTAR SIARAN ULANG'}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            KELUAR
          </button>
        </div>
      </div>
    </div>
  );
};
