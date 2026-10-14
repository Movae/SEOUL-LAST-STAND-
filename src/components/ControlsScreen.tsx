import React, { useState } from 'react';
import { ArrowLeft, Crosshair, Shield, RefreshCw, Zap, Flame, Bomb } from 'lucide-react';
import { audioService } from '../services/audio';

interface ControlsScreenProps {
  onBack: () => void;
}

export const ControlsScreen: React.FC<ControlsScreenProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'keys' | 'weapons' | 'tips'>('keys');

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 bg-slate-950 text-white font-sans overflow-hidden select-none">
      {/* Top Bar */}
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
            OPERATIONAL CONTROLS GUIDE
          </h2>
          <p className="text-xs text-amber-400 font-bold">전투 기동 및 사격 제어 매뉴얼</p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs font-bold">
          <button
            onClick={() => setActiveTab('keys')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'keys' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            기본 조작키
          </button>
          <button
            onClick={() => setActiveTab('weapons')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'weapons' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            무기 제원
          </button>
          <button
            onClick={() => setActiveTab('tips')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'tips' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            특수 팁
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto w-full my-auto overflow-y-auto max-h-[75vh] py-2">
        {activeTab === 'keys' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Keyboard Map Illustration */}
            <div className="bg-slate-900/90 border-2 border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xl">
              <h3 className="text-sm font-black uppercase text-amber-400 tracking-wider mb-4 flex items-center gap-2">
                <Crosshair className="w-4 h-4" />
                <span>키보드 조작 체계</span>
              </h3>

              {/* Visual Stylized Keyboard Keys Grid */}
              <div className="space-y-2.5 font-mono text-xs">
                {/* Row 1: Numbers 1-5 */}
                <div className="flex gap-1.5 justify-center">
                  {['1', '2', '3', '4', '5'].map((n) => (
                    <div
                      key={n}
                      className="w-12 h-11 bg-slate-800 border-2 border-slate-600 rounded flex flex-col items-center justify-center shadow"
                    >
                      <span className="font-bold text-amber-300">{n}</span>
                      <span className="text-[9px] text-slate-400">무기선택</span>
                    </div>
                  ))}
                </div>

                {/* Row 2: Q key & Aim Up */}
                <div className="flex gap-1.5 justify-center">
                  <div className="w-14 h-11 bg-blue-900/80 border-2 border-blue-500 rounded flex flex-col items-center justify-center shadow">
                    <span className="font-bold text-blue-200">Q</span>
                    <span className="text-[8px] text-blue-300">영웅전환</span>
                  </div>
                  <div className="w-12 h-11 bg-slate-800 border-2 border-slate-600 rounded flex flex-col items-center justify-center shadow">
                    <span className="font-bold text-slate-200">W / ↑</span>
                    <span className="text-[8px] text-slate-400">상단조준</span>
                  </div>
                  <div className="w-14 h-11 bg-emerald-900/80 border-2 border-emerald-500 rounded flex flex-col items-center justify-center shadow">
                    <span className="font-bold text-emerald-200">E</span>
                    <span className="text-[8px] text-emerald-300">시민구출</span>
                  </div>
                </div>

                {/* Row 3: A / D Move, J Shoot, K Bomb */}
                <div className="flex gap-1.5 justify-center">
                  <div className="w-12 h-11 bg-slate-800 border-2 border-slate-600 rounded flex flex-col items-center justify-center shadow">
                    <span className="font-bold text-slate-200">A / ←</span>
                    <span className="text-[8px] text-slate-400">좌측이동</span>
                  </div>
                  <div className="w-12 h-11 bg-slate-800 border-2 border-slate-600 rounded flex flex-col items-center justify-center shadow">
                    <span className="font-bold text-slate-200">D / →</span>
                    <span className="text-[8px] text-slate-400">우측이동</span>
                  </div>
                  <div className="w-14 h-11 bg-red-900/80 border-2 border-red-500 rounded flex flex-col items-center justify-center shadow">
                    <span className="font-bold text-red-200">J</span>
                    <span className="text-[8px] text-red-300">총기발사</span>
                  </div>
                  <div className="w-14 h-11 bg-amber-900/80 border-2 border-amber-500 rounded flex flex-col items-center justify-center shadow">
                    <span className="font-bold text-amber-200">K</span>
                    <span className="text-[8px] text-amber-300">폭탄투척</span>
                  </div>
                </div>

                {/* Row 4: Shift Roll & Space Jump */}
                <div className="flex gap-2 justify-center pt-1">
                  <div className="w-24 h-11 bg-purple-900/80 border-2 border-purple-500 rounded flex flex-col items-center justify-center shadow">
                    <span className="font-bold text-purple-200">SHIFT</span>
                    <span className="text-[8px] text-purple-300">구르기 회피</span>
                  </div>
                  <div className="w-36 h-11 bg-slate-800 border-2 border-slate-600 rounded flex flex-col items-center justify-center shadow">
                    <span className="font-bold text-slate-200">SPACEBAR</span>
                    <span className="text-[8px] text-slate-400">점프</span>
                  </div>
                  <div className="w-16 h-11 bg-slate-850 border border-slate-700 rounded flex flex-col items-center justify-center">
                    <span className="font-bold text-slate-400">ESC</span>
                    <span className="text-[8px] text-slate-500">일시정지</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-[11px] text-slate-400 mt-4 border-t border-slate-800 pt-2">
                Shift 구르기 동작 중에는 모든 적의 탄환과 공격을 무효화합니다!
              </div>
            </div>

            {/* Right: Action Descriptions List */}
            <div className="bg-slate-900/90 border-2 border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-black uppercase text-amber-400 tracking-wider mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>조작 액션 상세 설명</span>
              </h3>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-1 bg-slate-800 text-amber-400 font-mono font-bold rounded text-xs shrink-0">
                  A / D
                </span>
                <div className="text-xs">
                  <strong className="text-slate-200">좌우 기동 이동</strong>
                  <p className="text-slate-400 text-[11px]">방향키로도 조작 가능. 조준 방향을 자동으로 전환합니다.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-1 bg-slate-800 text-amber-400 font-mono font-bold rounded text-xs shrink-0">
                  SPACE
                </span>
                <div className="text-xs">
                  <strong className="text-slate-200">도약 점프</strong>
                  <p className="text-slate-400 text-[11px]">지면에서 높게 도약하여 지진 충격파나 장애물을 피합니다.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-1 bg-red-950 border border-red-700 text-red-300 font-mono font-bold rounded text-xs shrink-0">
                  J 키
                </span>
                <div className="text-xs">
                  <strong className="text-slate-200">총기 발사 (W키 조합시 대각선 상단 조준)</strong>
                  <p className="text-slate-400 text-[11px]">장착된 화기를 전방 또는 공중으로 고속 난사합니다.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-1 bg-amber-950 border border-amber-700 text-amber-300 font-mono font-bold rounded text-xs shrink-0">
                  K 키
                </span>
                <div className="text-xs">
                  <strong className="text-slate-200">세열 수류탄 폭탄 투척</strong>
                  <p className="text-slate-400 text-[11px]">포물선을 그리며 투척되어 밀집된 좀비와 방패를 단숨에 폭파합니다.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-1 bg-purple-950 border border-purple-700 text-purple-300 font-mono font-bold rounded text-xs shrink-0">
                  SHIFT
                </span>
                <div className="text-xs">
                  <strong className="text-slate-200">전술 구르기 회피</strong>
                  <p className="text-slate-400 text-[11px]">무적 판정으로 적 돌진과 탄막 공격을 뚫고 지나갈 수 있습니다.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-1 bg-blue-950 border border-blue-700 text-blue-300 font-mono font-bold rounded text-xs shrink-0">
                  Q 키
                </span>
                <div className="text-xs">
                  <strong className="text-slate-200">실시간 특임대원 전환</strong>
                  <p className="text-slate-400 text-[11px]">전투 중 언제든지 강준혁, 윤서아, 한지우, 박하린으로 즉각 교대합니다.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'weapons' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold">1번 키</span>
                <h4 className="text-base font-black text-amber-300">권총 (K5)</h4>
                <div className="text-xs text-slate-400 font-semibold mb-2">탄약: 무제한</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  절대 고갈되지 않는 든든한 기본 제식 화기.
                </p>
              </div>
              <div className="text-[11px] text-amber-400/90 font-bold mt-4 pt-2 border-t border-slate-800">
                특수 무기 소진 시 자동 전환
              </div>
            </div>

            <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-orange-400 font-bold">2번 키</span>
                <h4 className="text-base font-black text-orange-400">기관총 (K3)</h4>
                <div className="text-xs text-slate-400 font-semibold mb-2">탄약: 500발</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  초당 10발 이상의 분당 압도적 고속 난사.
                </p>
              </div>
              <div className="text-[11px] text-orange-400/90 font-bold mt-4 pt-2 border-t border-slate-800">
                몰려드는 무리 제압 특화
              </div>
            </div>

            <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-red-400 font-bold">3번 키</span>
                <h4 className="text-base font-black text-red-400">샷건 (USAS)</h4>
                <div className="text-xs text-slate-400 font-semibold mb-2">탄약: 500발</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  6발의 펠릿 동시 발사 및 강력한 넉백 충격.
                </p>
              </div>
              <div className="text-[11px] text-red-400/90 font-bold mt-4 pt-2 border-t border-slate-800">
                근접 파괴력 & 넉백
              </div>
            </div>

            <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-500 font-bold">4번 키</span>
                <h4 className="text-base font-black text-amber-500">화염방사기</h4>
                <div className="text-xs text-slate-400 font-semibold mb-2">연료: 500</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  지속적인 화염 원뿔을 방사하여 적을 불태웁니다.
                </p>
              </div>
              <div className="text-[11px] text-amber-500/90 font-bold mt-4 pt-2 border-t border-slate-800">
                범위 지속 화상 피해
              </div>
            </div>

            <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">5번 키</span>
                <h4 className="text-base font-black text-cyan-400">외계 레이저건</h4>
                <div className="text-xs text-slate-400 font-semibold mb-2">탄약: 500발</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  고에너지 빔으로 적들을 일렬로 꿰뚫어 버립니다.
                </p>
              </div>
              <div className="text-[11px] text-cyan-400/90 font-bold mt-4 pt-2 border-t border-slate-800">
                다중 적 직선 관통
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tips' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900 border-2 border-slate-800 rounded-xl">
              <h4 className="font-bold text-amber-400 mb-2">보급품 공중 낙하</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                60초마다 랜덤 특수 무기, 45초마다 빨간 포션(+80 HP), 90초마다 폭탄(+3개)이
                낙하산을 타고 투하됩니다.
              </p>
            </div>
            <div className="p-4 bg-slate-900 border-2 border-slate-800 rounded-xl">
              <h4 className="font-bold text-emerald-400 mb-2">서울 시민 구출 이벤트</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                철창이나 밧줄에 묶인 서울 시민에게 다가가거나 E키를 누르면
                시민이 경례와 함께 감사를 표하며 1,000점 보너스와 체력을 회복시켜 줍니다!
              </p>
            </div>
            <div className="p-4 bg-slate-900 border-2 border-slate-800 rounded-xl">
              <h4 className="font-bold text-blue-400 mb-2">부활과 안전 거점</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                체력이 다해도 3초 후 최근 도달한 안전 체크포인트에서 체력 200, 폭탄 5개,
                무적 보호막과 특수 무기 보급을 받고 즉시 재기동합니다.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-900 pt-3">
        <span>SEOUL: LAST STAND 조작 가이드</span>
        <span>ESC키를 눌러 언제든 인게임에서 조작법을 확인할 수 있습니다</span>
      </div>
    </div>
  );
};
