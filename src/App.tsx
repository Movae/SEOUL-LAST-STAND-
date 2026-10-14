/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import {
  CharacterId,
  Difficulty,
  GameScreenState,
  SaveSlotData,
} from './types/game';
import { CANVAS_WIDTH, CANVAS_HEIGHT, STAGES } from './game/constants';
import { GameEngine } from './game/engine';
import { GameRenderer } from './game/renderer';
import { TitleScreen } from './components/TitleScreen';
import { CharacterSelectScreen } from './components/CharacterSelectScreen';
import { SaveSlotModal } from './components/SaveSlotModal';
import { ControlsScreen } from './components/ControlsScreen';
import { GameHUD } from './components/GameHUD';
import { PauseMenu } from './components/PauseMenu';
import { StageClearScreen } from './components/StageClearScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { EndingScreen } from './components/EndingScreen';
import { audioService } from './services/audio';

export default function App() {
  const [screen, setScreen] = useState<GameScreenState>('TITLE');
  const [chosenCharacter, setChosenCharacter] = useState<CharacterId>('junhyuk');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // In-Game UI state
  const [isPaused, setIsPaused] = useState(false);
  const [stageClearedId, setStageClearedId] = useState<number | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [, setTick] = useState(0); // Forces re-render of HUD

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Initialize or re-attach GameEngine
  const initEngine = () => {
    if (!canvasRef.current) return null;
    if (!engineRef.current) {
      const engine = new GameEngine(canvasRef.current);
      const renderer = new GameRenderer(canvasRef.current.getContext('2d')!);
      engineRef.current = engine;
      rendererRef.current = renderer;

      engine.onStateChange = () => {
        // Render canvas frame
        if (engineRef.current && rendererRef.current) {
          const eng = engineRef.current;
          const stage = STAGES[eng.currentStageIndex];
          rendererRef.current.render(
            stage,
            eng.cameraX,
            {
              x: eng.player.x,
              y: eng.player.y,
              vx: eng.player.vx,
              vy: eng.player.vy,
              facing: eng.player.facing,
              characterId: eng.player.characterId,
              hp: eng.player.hp,
              maxHp: eng.player.maxHp,
              isRolling: eng.player.isRolling,
              isShooting: eng.player.isShooting,
              aimUp: eng.player.aimUp,
              invincibleTimer: eng.player.invincibleTimer,
              currentWeapon: eng.player.currentWeapon,
              animTick: eng.player.animTick,
              isDead: eng.player.isDead,
            },
            eng.enemies,
            eng.projectiles,
            eng.particles,
            eng.floatingTexts,
            eng.supplyDrops,
            eng.civilians,
            eng.checkpoints,
            eng.screenShake,
            performance.now()
          );
        }
        setTick((t) => (t + 1) % 1000);
      };

      engine.onStageClear = (clearedStage) => {
        setStageClearedId(clearedStage);
      };

      engine.onGameOver = () => {
        setIsGameOver(true);
      };

      engine.onGameEnding = () => {
        engine.stop();
        setScreen('ENDING');
      };

      engine.onPauseToggle = (paused) => {
        setIsPaused(paused);
      };
    }
    return engineRef.current;
  };

  // Launch game with a save slot
  const handleLaunchGame = (slot: SaveSlotData) => {
    setScreen('PLAYING');
    setIsPaused(false);
    setStageClearedId(null);
    setIsGameOver(false);

    setTimeout(() => {
      const engine = initEngine();
      if (engine) {
        engine.difficulty = difficulty;
        engine.loadFromSlot(slot);
        engine.start();
      }
    }, 50);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleToggleMute = () => {
    const muted = audioService.toggleMute();
    setIsMuted(muted);
  };

  // Clean up when unmounting
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen bg-slate-950 flex items-center justify-center overflow-hidden"
    >
      {/* 16:9 Aspect Ratio Arcade Cabinet Container */}
      <div className="relative w-full h-full max-w-[177.78vh] max-h-[56.25vw] aspect-video flex items-center justify-center overflow-hidden shadow-2xl bg-black border-2 border-slate-900">
        {/* Fullscreen Button in corner */}
        <button
          onClick={handleToggleFullscreen}
          className="absolute top-3 right-3 z-40 p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 backdrop-blur-sm cursor-pointer transition-colors shadow"
          title={isFullscreen ? '전체화면 종료' : '전체화면 전환'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* 1. TITLE SCREEN */}
        {screen === 'TITLE' && (
          <TitleScreen
            difficulty={difficulty}
            onChangeDifficulty={setDifficulty}
            onStartNew={() => setScreen('CHARACTER_SELECT')}
            onContinue={(slot) => handleLaunchGame(slot)}
            onOpenLoadMenu={() => setScreen('LOAD_MENU')}
            onOpenControls={() => setScreen('CONTROLS')}
          />
        )}

        {/* 2. CHARACTER SELECT SCREEN */}
        {screen === 'CHARACTER_SELECT' && (
          <CharacterSelectScreen
            onSelectCharacter={(charId) => {
              setChosenCharacter(charId);
              setScreen('SLOT_SELECT_NEW');
            }}
            onBack={() => setScreen('TITLE')}
          />
        )}

        {/* 3. NEW GAME SLOT SELECT */}
        {screen === 'SLOT_SELECT_NEW' && (
          <SaveSlotModal
            mode="NEW_GAME"
            chosenCharacter={chosenCharacter}
            onSelectSlot={(slot) => handleLaunchGame(slot)}
            onBack={() => setScreen('CHARACTER_SELECT')}
          />
        )}

        {/* 4. LOAD SAVED GAME MENU */}
        {screen === 'LOAD_MENU' && (
          <SaveSlotModal
            mode="LOAD"
            onSelectSlot={(slot) => handleLaunchGame(slot)}
            onBack={() => setScreen('TITLE')}
          />
        )}

        {/* 5. CONTROLS GUIDE */}
        {screen === 'CONTROLS' && (
          <ControlsScreen onBack={() => setScreen('TITLE')} />
        )}

        {/* 6. PLAYING CANVAS VIEW */}
        {screen === 'PLAYING' && (
          <div className="relative w-full h-full">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full h-full object-contain block bg-slate-950"
            />

            {engineRef.current && (
              <GameHUD
                engine={engineRef.current}
                onPause={() => {
                  engineRef.current?.togglePause();
                  setIsPaused(true);
                }}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
              />
            )}

            {/* Pause Menu Modal */}
            {isPaused && engineRef.current && (
              <PauseMenu
                engine={engineRef.current}
                onResume={() => {
                  engineRef.current?.togglePause();
                  setIsPaused(false);
                }}
                onRestartCheckpoint={() => {
                  engineRef.current?.respawnAtCheckpoint();
                  engineRef.current?.togglePause();
                  setIsPaused(false);
                }}
                onReturnToTitle={() => {
                  engineRef.current?.stop();
                  setScreen('TITLE');
                  audioService.playBGM('title');
                }}
              />
            )}

            {/* Stage Clear Modal */}
            {stageClearedId !== null && engineRef.current && (
              <StageClearScreen
                stageId={stageClearedId}
                engine={engineRef.current}
                onNextStage={() => {
                  const eng = engineRef.current!;
                  const nextStageIndex = stageClearedId; // index of next stage
                  setStageClearedId(null);
                  eng.startStage(nextStageIndex, 0);
                  eng.autoSave();
                }}
              />
            )}

            {/* Game Over / Respawn Countdown Modal */}
            {isGameOver && engineRef.current && (
              <GameOverScreen
                engine={engineRef.current}
                onInstantRespawn={() => {
                  engineRef.current?.respawnAtCheckpoint();
                  setIsGameOver(false);
                }}
                onReturnToTitle={() => {
                  engineRef.current?.stop();
                  setScreen('TITLE');
                  audioService.playBGM('title');
                }}
              />
            )}
          </div>
        )}

        {/* 7. ENDING & CREDITS */}
        {screen === 'ENDING' && engineRef.current && (
          <EndingScreen
            engine={engineRef.current}
            onReturnToTitle={() => {
              setScreen('TITLE');
              audioService.playBGM('title');
            }}
          />
        )}
      </div>
    </div>
  );
}
