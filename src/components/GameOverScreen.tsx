import React, { useEffect, useState } from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';
import { GameEngine } from '../game/engine';
import { audioService } from '../services/audio';

interface GameOverScreenProps {
  engine: GameEngine;
  onInstantRespawn: () => void;
  onReturnToTitle: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  engine,
  onInstantRespawn,
  onReturnToTitle,
}) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onInstantRespawn();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onInstantRespawn]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none font-sans">
      <div className="max-w-md w-full bg-slate-900 border-4 border-red-600 rounded-2xl p-6 shadow-2xl text-white text-center">
        <ShieldAlert className="w-14 h-14 text-red-500 mx-auto mb-2 animate-bounce" />

        <div className="inline-block px-3 py-1 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded mb-2">
          CASUALTY IN ACTION
        </div>

        <h3 className="text-3xl font-black text-white font-['Outfit'] uppercase mb-2">
          전투 불능!
        </h3>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          안전 거점의 긴급 나노 의료 캡슐이 가동됩니다.<br />
          <strong className="text-amber-400 font-mono text-xl">{countdown}</strong>초 후 최근 체크포인트에서 체력 200과 폭탄 5개를 재보급받아 즉각 부활합니다.
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => {
              audioService.playMenuClick();
              onInstantRespawn();
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-lg border-2 border-slate-950 shadow-[0_4px_0_#1e3a8a] hover:translate-y-[-2px] active:translate-y-[2px] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>대기 없이 지금 즉시 부활</span>
          </button>

          <button
            onClick={() => {
              audioService.playMenuClick();
              engine.autoSave();
              onReturnToTitle();
            }}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white font-bold text-xs rounded-lg border border-slate-800 transition-colors cursor-pointer"
          >
            작전 중단 및 메인 메뉴로
          </button>
        </div>
      </div>
    </div>
  );
};
