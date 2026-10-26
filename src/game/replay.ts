/**
 * Combat Replay Recorder and Buffer for Sky Raider: Elang Tempur
 * Records the last 30 seconds of gameplay for slow-motion highlight reel playback.
 */

import { PlaneId } from './types';

export interface ReplayFrame {
  timestamp: number;
  playerX: number;
  playerY: number;
  playerTiltX: number;
  playerHp: number;
  maxHp: number;
  playerShield: number;
  maxShield: number;
  planeId: PlaneId;
  isBoosting: boolean;
  score: number;
  wave: number;
  enemies: Array<{
    type: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    width: number;
    height: number;
  }>;
  bullets: Array<{
    x: number;
    y: number;
    color: string;
    isPlayer: boolean;
    radius: number;
  }>;
}

export class CombatReplayBuffer {
  private frames: ReplayFrame[] = [];
  private maxDurationSeconds: number = 30;
  private captureIntervalMs: number = 100; // Snapshot every 100ms (~10 frames/sec for 30s = 300 frames)
  private lastCaptureTime: number = 0;
  public isRecording: boolean = false;

  public startRecording() {
    this.frames = [];
    this.isRecording = true;
    this.lastCaptureTime = performance.now();
  }

  public recordFrame(state: Omit<ReplayFrame, 'timestamp'>) {
    if (!this.isRecording) return;
    const now = performance.now();
    if (now - this.lastCaptureTime >= this.captureIntervalMs) {
      this.lastCaptureTime = now;
      this.frames.push({
        timestamp: now,
        ...state,
      });

      // Keep only last 30 seconds (300 frames at 100ms)
      const maxFrames = (this.maxDurationSeconds * 1000) / this.captureIntervalMs;
      if (this.frames.length > maxFrames) {
        this.frames.shift();
      }
    }
  }

  public stopRecording() {
    this.isRecording = false;
  }

  public getFrames(): ReplayFrame[] {
    return this.frames;
  }

  public hasReplayData(): boolean {
    return this.frames.length > 10;
  }
}

export const combatReplayBuffer = new CombatReplayBuffer();
