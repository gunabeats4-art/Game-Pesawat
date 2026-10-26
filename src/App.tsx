/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { DailyMissionsModal } from './components/DailyMissionsModal';
import { PilotProfileModal } from './components/PilotProfileModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { StoredAchievementData, AchievementStatus } from './game/achievements';
import { DailyMission, GameState, GameStats, PlaneId } from './game/types';
import { SkyRaiderEngine } from './game/engine';
import { soundSystem } from './game/audio';
import { PLANE_CONFIGS } from './game/planes';
import { missionManager, getTodayDateString } from './game/missions';
import { pilotManager, PilotProfile, getRankInfo } from './game/pilot';
import { leaderboardManager } from './game/leaderboard';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [selectedPlane, setSelectedPlane] = useState<PlaneId>('garuda');
  const [isMuted, setIsMuted] = useState<boolean>(soundSystem.isMuted);
  const [showMissionsModal, setShowMissionsModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [lastLeaderboardRank, setLastLeaderboardRank] = useState<number | null>(null);
  const [missions, setMissions] = useState<DailyMission[]>(() => missionManager.getMissions());
  const [pilotProfile, setPilotProfile] = useState<PilotProfile>(() => pilotManager.getProfile());
  const [lastSortieResult, setLastSortieResult] = useState<{
    xpGained: number;
    didRankUp: boolean;
    newRankTitle: string;
    unlockedAchievements: AchievementStatus[];
  } | null>(null);

  const engineRef = useRef<SkyRaiderEngine | null>(null);

  // Default Stats state
  const [stats, setStats] = useState<GameStats>(() => {
    const cfg = PLANE_CONFIGS['garuda'];
    let storedHighScore = 0;
    try {
      const stored = localStorage.getItem('sky_raider_highscore');
      if (stored) storedHighScore = parseInt(stored, 10) || 0;
    } catch {
      storedHighScore = 0;
    }

    const currentMissions = missionManager.getMissions();
    const missionBonus = missionManager.getTotalScoreMultiplierBonus();

    return {
      score: 0,
      highScore: storedHighScore,
      scoreMultiplier: 1 + missionBonus,
      missionBonusMultiplier: missionBonus,
      wave: 1,
      sectorName: 'SECTOR 1: ARCHIPELAGO PATROL',
      hp: cfg.maxHp,
      maxHp: cfg.maxHp,
      shield: cfg.maxShield + missionManager.getShieldOverchargeBonus(),
      maxShield: cfg.maxShield + missionManager.getShieldOverchargeBonus(),
      weaponLevel: 1 + missionManager.getWeaponLevelBonus(),
      bombs: cfg.maxBombs + missionManager.getExtraBombBonus(),
      maxBombs: cfg.maxBombs + missionManager.getExtraBombBonus(),
      boostGauge: 100,
      isBoosting: false,
      enemiesKilled: 0,
      bossesDefeated: 0,
      shotsFired: 0,
      shotsHit: 0,
      currentCombo: 0,
      comboTimer: 0,
      maxCombo: 0,
      bombsUsed: 0,
      powerupsCollected: 0,
      bossHp: null,
      bossMaxHp: null,
      bossName: null,
      activeMissions: currentMissions,
    };
  });

  // Callbacks for engine
  const handleStatsUpdate = useCallback((newStats: GameStats) => {
    setStats(newStats);
    setMissions(newStats.activeMissions || missionManager.getMissions());
  }, []);

  const handleGameOver = useCallback((finalStats: GameStats) => {
    setStats(finalStats);
    setGameState('GAME_OVER');
    setMissions(missionManager.getMissions());

    // Record sortie in pilot career log
    const sortieResult = pilotManager.recordSortie(finalStats, false);
    setLastSortieResult({
      xpGained: sortieResult.xpGained,
      didRankUp: sortieResult.didRankUp,
      newRankTitle: sortieResult.newRank.title,
      unlockedAchievements: sortieResult.unlockedAchievements || [],
    });
    setPilotProfile(pilotManager.getProfile());

    // Submit to global leaderboard
    const accuracy = finalStats.shotsFired > 0 ? Math.round((finalStats.shotsHit / finalStats.shotsFired) * 100) : 0;
    if (finalStats.score > 0) {
      const currentProfile = pilotManager.getProfile();
      const lbResult = leaderboardManager.submitScore({
        callsign: currentProfile.callsign,
        avatarId: currentProfile.avatarId,
        score: finalStats.score,
        planeId: selectedPlane,
        wave: finalStats.wave,
        accuracy,
        date: getTodayDateString(),
      });
      setLastLeaderboardRank(lbResult.isTop10 ? lbResult.rank : null);
    } else {
      setLastLeaderboardRank(null);
    }
  }, [selectedPlane]);

  const handleVictory = useCallback((finalStats: GameStats) => {
    setStats(finalStats);
    setGameState('VICTORY');
    setMissions(missionManager.getMissions());

    // Record victorious sortie in pilot career log
    const sortieResult = pilotManager.recordSortie(finalStats, true);
    setLastSortieResult({
      xpGained: sortieResult.xpGained,
      didRankUp: sortieResult.didRankUp,
      newRankTitle: sortieResult.newRank.title,
      unlockedAchievements: sortieResult.unlockedAchievements || [],
    });
    setPilotProfile(pilotManager.getProfile());

    // Submit to global leaderboard
    const accuracy = finalStats.shotsFired > 0 ? Math.round((finalStats.shotsHit / finalStats.shotsFired) * 100) : 0;
    if (finalStats.score > 0) {
      const currentProfile = pilotManager.getProfile();
      const lbResult = leaderboardManager.submitScore({
        callsign: currentProfile.callsign,
        avatarId: currentProfile.avatarId,
        score: finalStats.score,
        planeId: selectedPlane,
        wave: finalStats.wave,
        accuracy,
        date: getTodayDateString(),
      });
      setLastLeaderboardRank(lbResult.isTop10 ? lbResult.rank : null);
    } else {
      setLastLeaderboardRank(null);
    }
  }, [selectedPlane]);

  const handleSectorCleared = useCallback((_sector: number) => {
    // Engine already notifies with text
  }, []);

  const handleStartGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.setPlane(selectedPlane);
      engineRef.current.start();
    }
    setGameState('PLAYING');
    setMissions(missionManager.getMissions());
  }, [selectedPlane]);

  const handlePause = useCallback(() => {
    if (gameState === 'PLAYING') {
      if (engineRef.current) {
        engineRef.current.pause();
      }
      setGameState('PAUSED');
      setMissions(missionManager.getMissions());
    }
  }, [gameState]);

  const handleResume = useCallback(() => {
    if (gameState === 'PAUSED') {
      if (engineRef.current) {
        engineRef.current.resume();
      }
      setGameState('PLAYING');
    }
  }, [gameState]);

  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.setPlane(selectedPlane);
      engineRef.current.start();
    }
    setGameState('PLAYING');
    setMissions(missionManager.getMissions());
  }, [selectedPlane]);

  const handleReturnToTitle = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.destroy();
    }
    setGameState('TITLE');
    setMissions(missionManager.getMissions());
  }, []);

  const handleTriggerBomb = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerBomb();
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = soundSystem.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  const handleOpenMissions = useCallback(() => {
    if (gameState === 'PLAYING') {
      if (engineRef.current) {
        engineRef.current.pause();
      }
      setGameState('PAUSED');
    }
    setMissions(missionManager.getMissions());
    setShowMissionsModal(true);
  }, [gameState]);

  const handleCloseMissions = useCallback(() => {
    setShowMissionsModal(false);
  }, []);

  const handleRefreshMissions = useCallback(() => {
    const updated = missionManager.refreshDailyMissions();
    setMissions([...updated]);
  }, []);

  const handleOpenProfile = useCallback(() => {
    if (gameState === 'PLAYING') {
      if (engineRef.current) {
        engineRef.current.pause();
      }
      setGameState('PAUSED');
    }
    setPilotProfile(pilotManager.getProfile());
    setShowProfileModal(true);
  }, [gameState]);

  const handleCloseProfile = useCallback(() => {
    setShowProfileModal(false);
  }, []);

  const handleOpenLeaderboard = useCallback(() => {
    if (gameState === 'PLAYING') {
      if (engineRef.current) {
        engineRef.current.pause();
      }
      setGameState('PAUSED');
    }
    setShowLeaderboardModal(true);
  }, [gameState]);

  const handleCloseLeaderboard = useCallback(() => {
    setShowLeaderboardModal(false);
  }, []);

  const handleProfileUpdated = useCallback((newProfile: PilotProfile) => {
    setPilotProfile({ ...newProfile });
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyD' && !showMissionsModal && !showProfileModal && !showLeaderboardModal && gameState === 'TITLE') {
        handleOpenMissions();
      } else if (e.code === 'KeyP' && !showProfileModal && !showMissionsModal && !showLeaderboardModal && gameState === 'TITLE') {
        handleOpenProfile();
      } else if (e.code === 'KeyL' && !showLeaderboardModal && !showProfileModal && !showMissionsModal && gameState === 'TITLE') {
        handleOpenLeaderboard();
      } else if (e.code === 'Escape') {
        if (showLeaderboardModal) {
          setShowLeaderboardModal(false);
        } else if (showProfileModal) {
          setShowProfileModal(false);
        } else if (showMissionsModal) {
          setShowMissionsModal(false);
        } else if (gameState === 'PLAYING') {
          handlePause();
        } else if (gameState === 'PAUSED') {
          handleResume();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    gameState,
    showMissionsModal,
    showProfileModal,
    showLeaderboardModal,
    handlePause,
    handleResume,
    handleOpenMissions,
    handleOpenProfile,
    handleOpenLeaderboard,
  ]);

  const currentRank = getRankInfo(pilotProfile.careerXp).currentRank;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 60fps Game Simulation Canvas in Isolated Container */}
      <GameCanvas
        planeId={selectedPlane}
        onStatsUpdate={handleStatsUpdate}
        onGameOver={handleGameOver}
        onVictory={handleVictory}
        onSectorCleared={handleSectorCleared}
        engineRef={engineRef}
      />

      {/* Atmospheric Title Screen */}
      {gameState === 'TITLE' && (
        <TitleScreen
          selectedPlane={selectedPlane}
          onSelectPlane={(id) => {
            setSelectedPlane(id);
            if (engineRef.current) {
              engineRef.current.setPlane(id);
            }
          }}
          onStartGame={handleStartGame}
          highScore={stats.highScore}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          activeMissions={missions}
          onOpenMissions={handleOpenMissions}
          pilotProfile={pilotProfile}
          onOpenProfile={handleOpenProfile}
          onOpenLeaderboard={handleOpenLeaderboard}
        />
      )}

      {/* In-Game World-Matched HUD */}
      {gameState === 'PLAYING' && (
        <HUD
          stats={stats}
          onPause={handlePause}
          onTriggerBomb={handleTriggerBomb}
          onOpenMissions={handleOpenMissions}
          pilotCallsign={pilotProfile.callsign}
          pilotRank={currentRank.title}
        />
      )}

      {/* Tactical Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onReturnToTitle={handleReturnToTitle}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          activeMissions={missions}
          onOpenMissions={handleOpenMissions}
          onOpenLeaderboard={handleOpenLeaderboard}
        />
      )}

      {/* Game Over / Mission Complete Modal */}
      {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && (
        <GameOverModal
          isVictory={gameState === 'VICTORY'}
          stats={stats}
          onRestart={handleRestart}
          onReturnToTitle={handleReturnToTitle}
          onOpenMissions={handleOpenMissions}
          xpEarned={lastSortieResult?.xpGained || 0}
          didRankUp={Boolean(lastSortieResult?.didRankUp)}
          newRankTitle={lastSortieResult?.newRankTitle || ''}
          onOpenProfile={handleOpenProfile}
          leaderboardRank={lastLeaderboardRank}
          onOpenLeaderboard={handleOpenLeaderboard}
          unlockedAchievements={lastSortieResult?.unlockedAchievements || []}
        />
      )}

      {/* Daily Directives Modal */}
      {showMissionsModal && (
        <DailyMissionsModal
          missions={missions}
          onClose={handleCloseMissions}
          onRefreshMissions={handleRefreshMissions}
        />
      )}

      {/* Pilot Profile Dossier Modal */}
      {showProfileModal && (
        <PilotProfileModal
          onClose={handleCloseProfile}
          onProfileUpdated={handleProfileUpdated}
        />
      )}

      {/* Global Community Leaderboard Modal */}
      {showLeaderboardModal && (
        <LeaderboardModal
          onClose={handleCloseLeaderboard}
          playerCallsign={pilotProfile.callsign}
        />
      )}
    </div>
  );
}
