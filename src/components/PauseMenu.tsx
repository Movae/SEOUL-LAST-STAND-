import React, { useState } from 'react';
import { Play, RotateCcw, Home, Volume2, Shield, Settings } from 'lucide-react';
import { GameEngine } from '../game/engine';
import { audioService } from '../services/audio';
import { Difficulty } from '../types/game';

interface PauseMenuProps {
  engine: GameEngine;
  onResume: () => void;
  onRestartCheckpoint: () => void;
  onReturnToTitle: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  engine,
  onResume,
  onRestartCheckpoint,
  onReturnToTitle,
}) => {
  const audioSettings = audioService.getSettings();
  const [masterVol, setMasterVol] = useState(audioSettings.masterVolume);
  const [bgmVol, setBgmVol] = useState(audioSettings.bgmVolume);
  const [sfxVol, setSfxVol] = useState(audioSettings.sfxVolume);
  const [difficulty, setDifficulty] = useState<Difficulty>(engine.difficulty);

  const handleMasterChange = (v: number) => {
    setMasterVol(v);
    audioService.setMasterVolume(v);
  };

  const handleBgmChange = (v: number) => {
    setBgmVol(v);
    audioService.setBgmVolume(v);
  };

  const handleSfxChange = (v: number) => {
    setSfxVol(v);
    audioService.setSfxVolume(v);
  };

  const handleDifficultyChange = (d: Difficulty) => {
    audioService.playMenuClick();
    setDifficulty(d);
    engine.difficulty = d;
    engine.autoSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none font-sans">
      <div className="max-w-md w-full bg-slate-900 border-3 border-slate-700 rounded-2xl p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="text-center pb-4 border-b border-slate-800">
          <div className="inline-block px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded mb-2">
            MISSION PAUSED
          </div>
          <h3 className="text-2xl font-black font-['Outfit'] uppercase">작전 일시 정지</h3>
          <p className="text-xs text-slate-400 mt-1">현재 상태가 안전 거점에 자동 저장되었습니다</p>
        </div>

        {/* Settings Area */}
        <div className="py-4 space-y-4 border-b border-slate-800 text-xs">
          {/* Difficulty */}
          <div>
            <div className="flex items-center gap-1.5 font-bold text-slate-300 mb-2">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>작전 난이도</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
              {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => handleDifficultyChange(d)}
                  className={`py-1.5 text-xs font-bold rounded transition-colors ${
                    difficulty === d
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d === 'easy' ? '쉬움' : d === 'normal' ? '보통' : '어려움'}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Sliders */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                마스터 볼륨
              </span>
              <span className="font-mono text-slate-400">{Math.round(masterVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={masterVol}
              onChange={(e) => handleMasterChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold">배경음악 (BGM)</span>
              <span className="font-mono text-slate-400">{Math.round(bgmVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bgmVol}
              onChange={(e) => handleBgmChange(parseFloat(e.target.value))}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold">전투 효과음 (SFX)</span>
              <span className="font-mono text-slate-400">{Math.round(sfxVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVol}
              onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 space-y-2.5">
          <button
            onClick={() => {
              audioService.playMenuClick();
              onResume();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg border-2 border-slate-950 shadow-[0_3px_0_#78350f] hover:translate-y-[-1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>작전 재개 (계속하기)</span>
          </button>

          <button
            onClick={() => {
              audioService.playMenuClick();
              onRestartCheckpoint();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>안전 체크포인트에서 재시작</span>
          </button>

          <button
            onClick={() => {
              audioService.playMenuClick();
              engine.autoSave();
              onReturnToTitle();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white font-bold text-xs rounded-lg border border-slate-800 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>저장 후 메인 메뉴로</span>
          </button>
        </div>
      </div>
    </div>
  );
};
