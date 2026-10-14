import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Home, Trophy, Users, Clock, Award, Star } from 'lucide-react';
import { GameEngine } from '../game/engine';
import { CHARACTERS } from '../game/constants';
import { audioService } from '../services/audio';

interface EndingScreenProps {
  engine: GameEngine;
  onReturnToTitle: () => void;
}

export const EndingScreen: React.FC<EndingScreenProps> = ({
  engine,
  onReturnToTitle,
}) => {
  const [step, setStep] = useState<'cutscene' | 'heroes' | 'credits'>('cutscene');

  useEffect(() => {
    audioService.playBGM('ending');
    // Epic victory confetti shower
    const interval = setInterval(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { y: 0.5 },
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}분 ${s}초`;
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 bg-slate-950 text-white font-sans overflow-hidden select-none">
      {/* Background Sunrise Victory Artwork */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/game_ending_sunrise_1791994588451.jpg"
          alt="Seoul Sunrise Victory"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-50 scale-100 transition-all duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      </div>

      {/* Top Banner */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="text-xs font-bold text-amber-400 tracking-wider uppercase">
          SEOUL: LAST STAND · OPERATION COMPLETE
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStep('cutscene')}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              step === 'cutscene' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
            }`}
          >
            스토리 엔딩
          </button>
          <button
            onClick={() => setStep('heroes')}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              step === 'heroes' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
            }`}
          >
            4인의 영웅
          </button>
          <button
            onClick={() => setStep('credits')}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              step === 'credits' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
            }`}
          >
            크레딧 & 기록
          </button>
        </div>
      </div>

      {/* Center Narrative Area */}
      <div className="relative z-10 max-w-4xl mx-auto w-full my-auto py-4">
        {step === 'cutscene' && (
          <div className="bg-slate-900/90 border-3 border-amber-500/80 rounded-2xl p-8 backdrop-blur-md shadow-2xl text-center space-y-5 animate-fade-in">
            <div className="inline-block px-4 py-1 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded shadow">
              THE VIRUS CONTROL MATRIX SHATTERED
            </div>

            <h2 className="text-4xl md:text-5xl font-black font-['Outfit'] uppercase text-white drop-shadow">
              서울의 여명, 그리고 귀환
            </h2>

            <div className="space-y-4 text-slate-200 text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-medium">
              <p>
                외계 지휘관 제노스가 쓰러지며 함선 중심부의 바이러스 제어 장치가 완전히 폭발했습니다.
              </p>
              <p className="text-amber-300 font-bold">
                푸른 역파동이 서울 전역의 상공을 가르자, 괴물로 변했던 수십만의 시민들이
                기적처럼 본래의 인간 모습으로 되돌아오며 깨어났습니다.
              </p>
              <p>
                새벽 6시, 폐허가 된 한강과 남산 너머로 찬란한 아침 햇살이 비쳐듭니다.
                명동에서 광화문, 홍대, 여의도, 강남, 잠실, 남산을 거쳐 외계 모함까지...
                서울의 8대 전선을 돌파한 특수작전팀 4명의 사투가 마침내 승리로 끝을 맺었습니다.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setStep('heroes')}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-lg border-2 border-slate-950 shadow-[0_4px_0_#78350f] cursor-pointer"
              >
                영웅들의 모습 보기 →
              </button>
            </div>
          </div>
        )}

        {step === 'heroes' && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center">
              <h3 className="text-2xl font-black text-white font-['Outfit']">대한민국을 구한 4인의 수호자</h3>
              <p className="text-xs text-amber-400 font-bold">REPUBLIC OF KOREA GUARDIANS</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {Object.values(CHARACTERS).map((c) => (
                <div key={c.id} className="bg-slate-900/90 border-2 border-slate-700 rounded-xl p-4 text-center">
                  <div
                    className="w-16 h-16 rounded-full mx-auto border-3 border-slate-950 flex items-center justify-center mb-3 shadow-lg"
                    style={{ backgroundColor: c.color }}
                  >
                    <span className="text-2xl font-black text-white">{c.name[0]}</span>
                  </div>
                  <h4 className="text-lg font-black" style={{ color: c.accentColor }}>{c.name}</h4>
                  <div className="text-xs font-bold text-slate-400 mb-2">{c.role}</div>
                  <p className="text-[11px] text-slate-300 italic mb-2">"{c.quote}"</p>
                  <div className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-amber-300 font-bold border border-slate-800">
                    수도방위 명예 훈장 수여
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setStep('credits')}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-lg border-2 border-slate-950 shadow-[0_4px_0_#78350f] cursor-pointer"
              >
                최종 작전 결과 및 크레딧 보기 →
              </button>
            </div>
          </div>
        )}

        {step === 'credits' && (
          <div className="bg-slate-900/95 border-3 border-amber-500 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-5 animate-fade-in">
            <div className="text-center">
              <Award className="w-10 h-10 text-amber-400 mx-auto mb-1" />
              <h3 className="text-2xl font-black text-white font-['Outfit']">FINAL MISSION REPORT</h3>
              <p className="text-xs text-amber-400 font-bold">서울 탈환 최종 결과 보고서</p>
            </div>

            {/* Final Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 font-semibold block mb-1">최종 작전 점수</span>
                <span className="font-mono text-xl font-black text-amber-400">
                  {engine.score.toLocaleString()} PTS
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 font-semibold block mb-1">구출한 서울 시민</span>
                <span className="font-mono text-xl font-black text-emerald-400">
                  {engine.rescuedCivilians} 명
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 font-semibold block mb-1">돌파한 스테이지</span>
                <span className="font-mono text-xl font-black text-blue-400">
                  8 / 8 완료
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 font-semibold block mb-1">총 작전 소요 시간</span>
                <span className="font-mono text-xl font-black text-purple-400">
                  {formatTime(Math.round(engine.playTimeSeconds))}
                </span>
              </div>
            </div>

            {/* Ending Credits Box */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-center text-xs space-y-1.5 text-slate-300">
              <div className="text-amber-400 font-bold mb-1">CREDITS</div>
              <div><strong>게임 기획 & 총괄 디렉팅:</strong> SEOUL DEFENSE STUDIO</div>
              <div><strong>원작 모티브 & 아트 스타일:</strong> 2D Cel-Shaded Comic Action Engine</div>
              <div><strong>사운드 & BGM:</strong> Web Audio Procedural Synthesizer</div>
              <div><strong>스페셜 땡스:</strong> 서울을 지켜낸 모든 플레이어 대원 여러분</div>
            </div>

            {/* Return Button */}
            <div className="text-center pt-2">
              <button
                onClick={() => {
                  audioService.playMenuClick();
                  onReturnToTitle();
                }}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base rounded-lg border-2 border-slate-950 shadow-[0_4px_0_#78350f] cursor-pointer"
              >
                <Home className="w-5 h-5" />
                <span>메인 타이틀 화면으로</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 flex justify-between items-center text-xs text-slate-400 border-t border-slate-800 pt-3">
        <span>SEOUL: LAST STAND — 엔딩 크레딧</span>
        <span>대한민국 서울 해방을 축하합니다!</span>
      </div>
    </div>
  );
};
