import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Shield, Play, RotateCcw, FolderOpen, HelpCircle } from 'lucide-react';
import { Difficulty, SaveSlotData } from '../types/game';
import { storageService } from '../services/storage';
import { audioService } from '../services/audio';

interface TitleScreenProps {
  onStartNew: () => void;
  onContinue: (slot: SaveSlotData) => void;
  onOpenLoadMenu: () => void;
  onOpenControls: () => void;
  difficulty: Difficulty;
  onChangeDifficulty: (diff: Difficulty) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartNew,
  onContinue,
  onOpenLoadMenu,
  onOpenControls,
  difficulty,
  onChangeDifficulty,
}) => {
  const [latestSlot, setLatestSlot] = useState<SaveSlotData | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    storageService.getLatestPlayedSlot().then(setLatestSlot);
    audioService.playBGM('title');
  }, []);

  const handleToggleMute = () => {
    const muted = audioService.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 select-none overflow-hidden bg-slate-950 font-sans">
      {/* Background Hero Banner */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/game_hero_banner_1791994586608.jpg"
          alt="Seoul Last Stand Hero Banner"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-45 scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        <div className="absolute inset-0 bg-radial from-transparent to-slate-950/80" />
      </div>

      {/* Top Bar: Difficulty & Sound controls */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between py-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400">
          <Shield className="w-4 h-4 text-amber-400" />
          <span>수도방위사령부 특수기동대</span>
          <span className="text-slate-600">·</span>
          <span>서울 전면 탈환 작전</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Difficulty Segmented Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-700/80 rounded-lg">
            {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  audioService.playMenuClick();
                  onChangeDifficulty(d);
                }}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                  difficulty === d
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d === 'easy' ? '쉬움' : d === 'normal' ? '보통' : '어려움'}
              </button>
            ))}
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-lg bg-slate-900/90 border border-slate-700/80 text-slate-300 hover:text-amber-400 transition-colors"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Center: Main Logo & Comic Header */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto">
        <div className="inline-block px-4 py-1 mb-2 bg-red-600 text-white font-extrabold text-xs tracking-widest uppercase border-2 border-slate-950 shadow-md transform -rotate-1">
          2D SIDE-SCROLLING SHOOTING ACTION
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(239,68,68,0.7)] font-['Outfit'] uppercase mb-1">
          SEOUL: LAST STAND
        </h1>

        <p className="text-2xl md:text-3xl font-extrabold text-amber-400 tracking-wider font-['Black_Han_Sans'] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-6">
          서울 최후의 저항
        </p>

        <p className="max-w-xl text-sm text-slate-300 font-medium leading-relaxed drop-shadow">
          외계 침공과 변이 바이러스로 함락된 수도 서울. 4명의 정예 특수작전팀이 되어
          명동에서 외계 함선까지 8대 결전을 돌파하고 시민들을 구원하라!
        </p>

        {/* 4 Main Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-md mt-8">
          {/* 1. START */}
          <button
            onClick={() => {
              audioService.playMenuClick();
              onStartNew();
            }}
            className="group relative flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-base rounded-lg border-2 border-slate-900 shadow-[0_4px_0_#78350f] hover:translate-y-[-2px] active:translate-y-[2px] transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>START — 새 게임</span>
          </button>

          {/* 2. CONTINUE */}
          <button
            onClick={() => {
              if (latestSlot) {
                audioService.playMenuClick();
                onContinue(latestSlot);
              }
            }}
            disabled={!latestSlot}
            className={`flex items-center justify-center gap-2 px-6 py-3.5 font-black text-base rounded-lg border-2 border-slate-900 shadow-[0_4px_0_#1e293b] transition-all ${
              latestSlot
                ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer hover:translate-y-[-2px] active:translate-y-[2px]'
                : 'bg-slate-800 text-slate-500 border-slate-800 cursor-not-allowed opacity-60'
            }`}
            title={latestSlot ? `최근 저장: STAGE ${latestSlot.currentStage}` : '저장된 게임이 없습니다'}
          >
            <RotateCcw className="w-5 h-5" />
            <span>CONTINUE — 이어하기</span>
          </button>

          {/* 3. LOAD GAME */}
          <button
            onClick={() => {
              audioService.playMenuClick();
              onOpenLoadMenu();
            }}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-black text-base rounded-lg border-2 border-slate-700 shadow-[0_4px_0_#0f172a] hover:translate-y-[-2px] active:translate-y-[2px] transition-all cursor-pointer"
          >
            <FolderOpen className="w-5 h-5" />
            <span>LOAD GAME — 게임 불러오기</span>
          </button>

          {/* 4. CONTROLS */}
          <button
            onClick={() => {
              audioService.playMenuClick();
              onOpenControls();
            }}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-black text-base rounded-lg border-2 border-slate-700 shadow-[0_4px_0_#0f172a] hover:translate-y-[-2px] active:translate-y-[2px] transition-all cursor-pointer"
          >
            <HelpCircle className="w-5 h-5" />
            <span>CONTROLS — 조작법</span>
          </button>
        </div>

        {/* Latest Save Slot Summary (if exists) */}
        {latestSlot && (
          <div className="mt-4 text-xs text-slate-400 font-mono">
            최근 기록: SLOT 0{latestSlot.slotId} · STAGE {latestSlot.currentStage} · SCORE {latestSlot.score.toLocaleString()}
          </div>
        )}
      </div>

      {/* Bottom Footer Notice */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-900">
        <div>16:9 반응형 캔버스 · IndexedDB 5슬롯 세이브 지원</div>
        <div>외계 침공 서울 사수 본부 © 2026</div>
      </div>
    </div>
  );
};
