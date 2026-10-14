import React from 'react';
import { Volume2, VolumeX, Pause, Shield, Bomb, Heart, Users, RefreshCw } from 'lucide-react';
import { GameEngine } from '../game/engine';
import { CHARACTERS, STAGES, WEAPONS } from '../game/constants';
import { WeaponType } from '../types/game';

interface GameHUDProps {
  engine: GameEngine;
  onPause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  engine,
  onPause,
  isMuted,
  onToggleMute,
}) => {
  const { player } = engine;
  const char = CHARACTERS[player.characterId] || CHARACTERS.junhyuk;
  const stage = STAGES[engine.currentStageIndex];
  const currentWeapon = WEAPONS[player.currentWeapon];
  const boss = engine.currentBoss;

  const hpRatio = Math.max(0, Math.min(1, player.hp / player.maxHp));
  const hpBarColor =
    hpRatio > 0.5 ? 'bg-emerald-500' : hpRatio > 0.25 ? 'bg-amber-500' : 'bg-red-500';

  const weaponsList: WeaponType[] = ['pistol', 'machinegun', 'shotgun', 'flamethrower', 'laser'];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 select-none">
      {/* Top Zone: Player Stats, Boss Bar, Score */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Player Profile & HP Bar */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-950/85 backdrop-blur-sm p-3 rounded-xl border-2 border-slate-800 shadow-xl max-w-sm">
          {/* Character Avatar Icon with Q shortcut badge */}
          <div className="relative">
            <div
              className="w-13 h-13 rounded-lg border-2 border-slate-900 flex items-center justify-center shadow"
              style={{ backgroundColor: char.color }}
            >
              <span className="text-xl font-black text-white">{char.name[0]}</span>
            </div>
            <button
              onClick={() => engine.switchCharacter()}
              className="absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black border border-slate-900 shadow cursor-pointer"
              title="Q 키로 다음 대원으로 교대"
            >
              Q교대
            </button>
          </div>

          {/* Details & HP */}
          <div className="flex-1 min-w-[150px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-black text-white" style={{ color: char.accentColor }}>
                {char.name} ({char.role.split(' ')[0]})
              </span>
              <span className="font-mono text-[11px] text-slate-300 font-bold">
                HP {player.hp} / {player.maxHp}
              </span>
            </div>

            {/* Health Bar */}
            <div className="w-full h-3.5 bg-slate-900 rounded-sm border border-slate-700 overflow-hidden relative shadow-inner">
              <div
                className={`h-full ${hpBarColor} transition-all duration-150`}
                style={{ width: `${hpRatio * 100}%` }}
              />
            </div>

            {/* Trait indicator */}
            <div className="text-[10px] text-slate-400 mt-1 truncate">
              특성: <span className="text-slate-300 font-medium">{char.traitName}</span>
            </div>
          </div>
        </div>

        {/* Center: Stage Title & Boss HP Bar (if active) */}
        <div className="flex flex-col items-center max-w-md w-full px-4">
          {boss && engine.bossActive && boss.hp > 0 ? (
            /* Boss Health Bar */
            <div className="w-full bg-slate-950/90 backdrop-blur-sm p-3 rounded-xl border-3 border-red-600 shadow-2xl animate-pulse">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-red-400 uppercase tracking-widest">
                  ⚠ BOSS: {boss.bossName}
                </span>
                {boss.bossPhase === 2 && (
                  <span className="text-[10px] font-black px-2 py-0.5 bg-red-600 text-white rounded">
                    PHASE 2 - BERSERK
                  </span>
                )}
                <span className="text-xs font-mono font-bold text-white">
                  {Math.max(0, boss.hp)} / {boss.maxHp}
                </span>
              </div>
              <div className="w-full h-3.5 bg-slate-900 rounded-sm border border-red-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-150"
                  style={{ width: `${Math.max(0, Math.min(1, boss.hp / boss.maxHp)) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            /* District & Stage Header */
            <div className="bg-slate-950/80 backdrop-blur-sm px-4 py-1.5 rounded-lg border border-slate-800 text-center shadow">
              <div className="text-xs font-extrabold text-amber-400 tracking-wider">
                {stage.name} · {stage.timeOfDay}
              </div>
              <div className="text-[10px] text-slate-400">{stage.subName}</div>
            </div>
          )}
        </div>

        {/* Right: Weapon, Ammo, Bomb, Score, Pause */}
        <div className="pointer-events-auto flex items-center gap-3">
          {/* Stats Box */}
          <div className="flex items-center gap-4 bg-slate-950/85 backdrop-blur-sm px-4 py-2.5 rounded-xl border-2 border-slate-800 shadow-xl text-xs">
            {/* Equipped Weapon */}
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold">장착 무기</span>
              <span className="font-black text-amber-400 text-sm">{currentWeapon.name.split(' ')[0]}</span>
              <span className="font-mono text-[11px] text-slate-200">
                {currentWeapon.isInfinite ? (
                  <span className="text-emerald-400 font-bold">탄약 무제한</span>
                ) : (
                  `${player.weaponsAmmo[player.currentWeapon]} / 500`
                )}
              </span>
            </div>

            <div className="w-px h-8 bg-slate-800" />

            {/* Bombs (Grenades) */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">폭탄 (K)</span>
              <div className="flex items-center gap-1 mt-0.5">
                <Bomb className="w-4 h-4 text-amber-400" />
                <span className="font-mono font-black text-base text-white">
                  {player.bombs}
                  <span className="text-[10px] text-slate-500">/10</span>
                </span>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-800" />

            {/* Rescued Citizens */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">구출 시민</span>
              <div className="flex items-center gap-1 mt-0.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="font-mono font-black text-base text-emerald-400">
                  {engine.rescuedCivilians}
                </span>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-800" />

            {/* Score */}
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold">SCORE</span>
              <span className="font-mono font-black text-base text-white tracking-wide">
                {engine.score.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Sound & Pause Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMute}
              className="p-2.5 rounded-lg bg-slate-950/85 hover:bg-slate-900 border-2 border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer shadow"
              title="음악/효과음 토글"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={onPause}
              className="p-2.5 rounded-lg bg-slate-950/85 hover:bg-slate-900 border-2 border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer shadow"
              title="일시정지 (ESC)"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Zone: Weapon Quick Bar (1-5) and Control Hotkeys */}
      <div className="flex items-end justify-between w-full">
        {/* Weapon Slots 1 to 5 */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-sm p-1.5 rounded-xl border-2 border-slate-800 shadow-xl">
          {weaponsList.map((wKey, idx) => {
            const w = WEAPONS[wKey];
            const isEquipped = player.currentWeapon === wKey;
            const ammo = player.weaponsAmmo[wKey];
            const isUsable = w.isInfinite || ammo > 0;

            return (
              <button
                key={wKey}
                onClick={() => engine.selectWeaponByNumber(idx + 1)}
                className={`relative flex flex-col items-center justify-between w-18 h-14 p-1.5 rounded-lg border-2 transition-all cursor-pointer ${
                  isEquipped
                    ? 'border-amber-400 bg-slate-850 shadow-md translate-y-[-2px]'
                    : isUsable
                    ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                    : 'border-slate-850 bg-slate-950 text-slate-600 opacity-60'
                }`}
              >
                <div className="flex justify-between items-center w-full text-[9px] font-mono">
                  <span className="font-bold px-1 rounded bg-slate-950 text-slate-300">{idx + 1}</span>
                  {isEquipped && <span className="text-amber-400 font-black">● 장착</span>}
                </div>

                <div className="text-[11px] font-bold text-white truncate max-w-full">
                  {w.name.split(' ')[0]}
                </div>

                <div className="text-[10px] font-mono font-semibold" style={{ color: w.color }}>
                  {w.isInfinite ? '∞' : `${ammo}`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Hotkey Guide Tips */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-950/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-800 text-[11px] text-slate-400 font-medium shadow">
          <span><strong className="text-slate-200">A/D</strong> 이동</span>
          <span>·</span>
          <span><strong className="text-slate-200">Space</strong> 점프</span>
          <span>·</span>
          <span><strong className="text-red-400">J</strong> 사격</span>
          <span>·</span>
          <span><strong className="text-amber-400">K</strong> 폭탄</span>
          <span>·</span>
          <span><strong className="text-purple-400">Shift</strong> 회피</span>
          <span>·</span>
          <span><strong className="text-blue-400">Q</strong> 영웅교대</span>
          <span>·</span>
          <span><strong className="text-emerald-400">E</strong> 구출</span>
        </div>
      </div>
    </div>
  );
};
