import React, { useEffect, useRef } from 'react';
import { SkyRaiderEngine } from '../game/engine';
import { GameStats, PlaneId } from '../game/types';

interface GameCanvasProps {
  planeId: PlaneId;
  onStatsUpdate: (stats: GameStats) => void;
  onGameOver: (finalStats: GameStats) => void;
  onVictory: (finalStats: GameStats) => void;
  onSectorCleared: (sector: number) => void;
  engineRef: React.MutableRefObject<SkyRaiderEngine | null>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  planeId,
  onStatsUpdate,
  onGameOver,
  onVictory,
  onSectorCleared,
  engineRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Responsive Canvas sizing to fill viewport while keeping crisp 1:1 pixel rendering
    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // We set canvas logical width/height to fill container
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    handleResize();

    // Create engine instance
    const engine = new SkyRaiderEngine(canvas, {
      onStatsUpdate,
      onGameOver,
      onVictory,
      onSectorCleared,
    });
    engine.setPlane(planeId);
    engineRef.current = engine;

    window.addEventListener('resize', handleResize);

    // Pointer Events for Touch / Mouse Drag Controls
    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      engine.setPointer(e.clientX - rect.left, e.clientY - rect.top, true);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      engine.setPointer(e.clientX - rect.left, e.clientY - rect.top, true);
    };

    const handlePointerUp = () => {
      engine.setPointer(0, 0, false);
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      engine.destroy();
      engineRef.current = null;
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [planeId, onStatsUpdate, onGameOver, onVictory, onSectorCleared, engineRef]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair touch-none"
      />
    </div>
  );
};
