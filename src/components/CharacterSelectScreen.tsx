import React, { useState } from 'react';
import { ArrowLeft, Check, Zap, Target, Heart, ShieldAlert } from 'lucide-react';
import { CharacterId, CharacterData } from '../types/game';
import { CHARACTERS } from '../game/constants';
import { audioService } from '../services/audio';

interface CharacterSelectScreenProps {
  onSelectCharacter: (charId: CharacterId) => void;
  onBack: () => void;
}

export const CharacterSelectScreen: React.FC<CharacterSelectScreenProps> = ({
  onSelectCharacter,
  onBack,
}) => {
  const [selectedId, setSelectedId] = useState<CharacterId>('junhyuk');
  const characters = Object.values(CHARACTERS);
  const activeChar = CHARACTERS[selectedId];

  const getTraitIcon = (id: CharacterId) => {
    switch (id) {
      case 'junhyuk':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'seoa':
        return <Target className="w-5 h-5 text-emerald-400" />;
      case 'jiwoo':
        return <Heart className="w-5 h-5 text-pink-400" />;
      case 'harin':
        return <ShieldAlert className="w-5 h-5 text-orange-400" />;
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 bg-slate-950 text-white font-sans overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <button
          onClick={() => {
            audioService.playMenuClick();
            onBack();
          }}
          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>메인 메뉴로 돌아가기</span>
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-black tracking-wider uppercase font-['Outfit']">
            SELECT SPECIAL OPERATIVE
          </h2>
          <p className="text-xs text-amber-400 font-bold">작전에 투입할 4인의 대원 중 1명을 선택하십시오 (인게임 Q키로 실시간 전환 가능)</p>
        </div>

        <div className="w-32" />
      </div>

      {/* Main Grid: 4 Operative Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-auto max-w-6xl mx-auto w-full">
        {characters.map((c) => {
          const isSelected = selectedId === c.id;
          return (
            <div
              key={c.id}
              onClick={() => {
                audioService.playMenuClick();
                setSelectedId(c.id);
              }}
              className={`relative flex flex-col justify-between p-5 rounded-xl border-3 transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber-400 bg-slate-900/90 shadow-[0_0_24px_rgba(245,158,11,0.25)] translate-y-[-4px]'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 bg-amber-400 text-slate-950 p-1 rounded-full shadow">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}

              {/* Card Header: Role & Name */}
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                  {c.gender} · {c.role}
                </div>
                <h3 className="text-2xl font-black tracking-tight" style={{ color: c.accentColor }}>
                  {c.name}
                </h3>
                <p className="text-xs text-slate-400 font-medium mb-4">{c.title}</p>
              </div>

              {/* Stylized Silhouette Avatar Box */}
              <div
                className="w-full h-36 rounded-lg border-2 border-slate-950 flex flex-col items-center justify-center p-3 relative overflow-hidden mb-4 shadow-inner"
                style={{ backgroundColor: `${c.color}22` }}
              >
                <div
                  className="w-16 h-16 rounded-full border-3 border-slate-950 flex items-center justify-center shadow-lg mb-2"
                  style={{ backgroundColor: c.color }}
                >
                  <span className="text-2xl font-black text-white">{c.name[0]}</span>
                </div>
                <div className="text-xs font-bold text-center px-2 py-0.5 rounded bg-slate-950/80 text-slate-200">
                  HP: 200 · 탄약 보급 최적화
                </div>
              </div>

              {/* Stats Bars */}
              <div className="space-y-1.5 text-xs mb-4">
                <div className="flex justify-between items-center text-slate-300">
                  <span>기동 속도</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((lv) => (
                      <div
                        key={lv}
                        className={`w-3 h-2 rounded-xs ${
                          lv <= c.stats.speed ? 'bg-amber-400' : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>공격 화력</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((lv) => (
                      <div
                        key={lv}
                        className={`w-3 h-2 rounded-xs ${
                          lv <= c.stats.firepower ? 'bg-red-500' : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>방어 내구</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((lv) => (
                      <div
                        key={lv}
                        className={`w-3 h-2 rounded-xs ${
                          lv <= c.stats.defense ? 'bg-blue-500' : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>지원 유틸</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((lv) => (
                      <div
                        key={lv}
                        className={`w-3 h-2 rounded-xs ${
                          lv <= c.stats.utility ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Special Trait Description */}
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 font-bold mb-1" style={{ color: c.accentColor }}>
                  {getTraitIcon(c.id)}
                  <span>{c.traitName}</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-tight">{c.traitDesc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Panel: Selected Quote & Confirm Button */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between p-4 bg-slate-900 border-2 border-slate-800 rounded-xl">
        <div className="pr-4">
          <div className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-0.5">
            {activeChar.role} · {activeChar.name}
          </div>
          <div className="text-sm font-semibold italic text-slate-200">
            {activeChar.quote}
          </div>
        </div>

        <button
          onClick={() => {
            audioService.playMenuClick();
            onSelectCharacter(selectedId);
          }}
          className="shrink-0 px-8 py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-base rounded-lg border-2 border-slate-950 shadow-[0_4px_0_#78350f] hover:translate-y-[-2px] active:translate-y-[2px] transition-all cursor-pointer"
        >
          출격 저장 슬롯 선택 →
        </button>
      </div>
    </div>
  );
};
