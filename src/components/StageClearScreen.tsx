import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ArrowRight, Trophy, Users, ShieldCheck, Star } from 'lucide-react';
import { GameEngine } from '../game/engine';
import { STAGES } from '../game/constants';
import { audioService } from '../services/audio';

interface StageClearScreenProps {
  stageId: number;
  engine: GameEngine;
  onNextStage: () => void;
}

export const StageClearScreen: React.FC<StageClearScreenProps> = ({
  stageId,
  engine,
  onNextStage,
}) => {
  const currentStage = STAGES[stageId - 1];
  const nextStage = STAGES[stageId]; // if exists

  useEffect(() => {
    // Stage clear fanfare
    audioService.playCivilianRescued();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none font-sans">
      <div className="max-w-lg w-full bg-slate-900 border-4 border-amber-500 rounded-2xl p-6 shadow-2xl text-white text-center">
        {/* Banner */}
        <div className="inline-block px-6 py-1.5 bg-amber-500 text-slate-950 font-black text-sm uppercase tracking-widest rounded-lg border-2 border-slate-950 shadow-md mb-3 transform -rotate-1">
          ★ STAGE {stageId} CLEARED ★
        </div>

        <h3 className="text-3xl font-black font-['Outfit'] uppercase tracking-tight text-white mb-1">
          {currentStage.name} 탈환 완료!
        </h3>
        <p className="text-xs text-amber-300 font-bold mb-6">
          {currentStage.boss.name} 격파 및 구역 안정화 달성
        </p>

        {/* Stats Summary Card */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3 mb-6 text-xs text-slate-300">
          <div className="flex justify-between items-center py-1 border-b border-slate-800">
            <span className="flex items-center gap-1.5 font-bold text-slate-400">
              <Trophy className="w-4 h-4 text-amber-400" />
              보스 격파 기본 점수
            </span>
            <span className="font-mono font-bold text-amber-400">
              +{(5000 * stageId).toLocaleString()} PTS
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-800">
            <span className="flex items-center gap-1.5 font-bold text-slate-400">
              <Users className="w-4 h-4 text-emerald-400" />
              서울 시민 구출 누적
            </span>
            <span className="font-mono font-bold text-emerald-400">
              {engine.rescuedCivilians}명 (+{(engine.rescuedCivilians * 1000).toLocaleString()} PTS)
            </span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="flex items-center gap-1.5 font-bold text-slate-200">
              <Star className="w-4 h-4 text-amber-400" />
              작전 총 누적 점수
            </span>
            <span className="font-mono font-black text-lg text-white">
              {engine.score.toLocaleString()} PTS
            </span>
          </div>
        </div>

        {/* Next Stage Teaser */}
        {nextStage && (
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-3 text-left mb-6">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-0.5">
              다음 작전 구역 정보
            </div>
            <div className="text-sm font-black text-white">
              {nextStage.name} ({nextStage.timeOfDay})
            </div>
            <div className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {nextStage.description}
            </div>
          </div>
        )}

        {/* Next Button */}
        <button
          onClick={() => {
            audioService.playMenuClick();
            onNextStage();
          }}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base rounded-lg border-2 border-slate-950 shadow-[0_4px_0_#78350f] hover:translate-y-[-2px] active:translate-y-[2px] transition-all cursor-pointer"
        >
          <span>다음 스테이지 돌격</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
