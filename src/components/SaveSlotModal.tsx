import React, { useEffect, useState } from 'react';
import { ArrowLeft, Trash2, Download, Upload, Play, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { SaveSlotData, CharacterId } from '../types/game';
import { storageService, createEmptySlot } from '../services/storage';
import { CHARACTERS, STAGES, WEAPONS } from '../game/constants';
import { audioService } from '../services/audio';

interface SaveSlotModalProps {
  mode: 'LOAD' | 'NEW_GAME';
  chosenCharacter?: CharacterId;
  onSelectSlot: (slot: SaveSlotData) => void;
  onBack: () => void;
}

export const SaveSlotModal: React.FC<SaveSlotModalProps> = ({
  mode,
  chosenCharacter = 'junhyuk',
  onSelectSlot,
  onBack,
}) => {
  const [slots, setSlots] = useState<SaveSlotData[]>([]);
  const [deleteTargetSlotId, setDeleteTargetSlotId] = useState<number | null>(null);
  const [overwriteTargetSlot, setOverwriteTargetSlot] = useState<SaveSlotData | null>(null);

  const loadSlots = async () => {
    const list = await storageService.getAllSlots();
    setSlots(list);
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const handleDeleteConfirmed = async () => {
    if (deleteTargetSlotId === null) return;
    audioService.playExplosion();
    await storageService.deleteSlot(deleteTargetSlotId);
    setDeleteTargetSlotId(null);
    await loadSlots();
  };

  const handleSlotClicked = (slot: SaveSlotData) => {
    audioService.playMenuClick();
    if (mode === 'LOAD') {
      if (!slot.isEmpty) {
        onSelectSlot(slot);
      }
    } else {
      // NEW_GAME mode
      if (!slot.isEmpty) {
        // Overwrite confirm
        setOverwriteTargetSlot(slot);
      } else {
        // Start directly in empty slot
        const newSlot: SaveSlotData = {
          ...createEmptySlot(slot.slotId),
          character: chosenCharacter,
          isEmpty: false,
          lastSavedDate: new Date().toISOString(),
        };
        storageService.saveSlot(newSlot).then(() => onSelectSlot(newSlot));
      }
    }
  };

  const handleConfirmOverwrite = async () => {
    if (!overwriteTargetSlot) return;
    const newSlot: SaveSlotData = {
      ...createEmptySlot(overwriteTargetSlot.slotId),
      character: chosenCharacter,
      isEmpty: false,
      lastSavedDate: new Date().toISOString(),
    };
    await storageService.saveSlot(newSlot);
    setOverwriteTargetSlot(null);
    onSelectSlot(newSlot);
  };

  const handleExport = (slot: SaveSlotData, e: React.MouseEvent) => {
    e.stopPropagation();
    audioService.playMenuClick();
    const jsonStr = storageService.exportSlotJSON(slot);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seoul_last_stand_slot_0${slot.slotId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const imported = storageService.importSlotJSON(text);
        await storageService.saveSlot(imported);
        audioService.playPickup();
        await loadSlots();
      } catch (err: any) {
        alert(err.message || '저장 파일을 읽어올 수 없습니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatPlayTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}분 ${s}초`;
  };

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
          <span>뒤로 가기</span>
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-black tracking-wider uppercase font-['Outfit']">
            {mode === 'LOAD' ? 'LOAD SAVED MISSION' : 'SELECT MISSION SAVE SLOT'}
          </h2>
          <p className="text-xs text-amber-400 font-bold">
            {mode === 'LOAD' ? '불러올 저장 슬롯을 선택하십시오' : '새 작전을 저장할 슬롯을 지정하십시오 (총 5슬롯)'}
          </p>
        </div>

        {/* Import JSON button */}
        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold rounded-lg cursor-pointer text-slate-300 hover:text-white transition-colors">
          <Upload className="w-3.5 h-3.5" />
          <span>JSON 가져오기</span>
          <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
        </label>
      </div>

      {/* 5 Slots Grid */}
      <div className="flex flex-col gap-3 max-w-4xl mx-auto w-full my-auto overflow-y-auto max-h-[75vh] py-2">
        {slots.map((slot) => {
          const char = CHARACTERS[slot.character] || CHARACTERS.junhyuk;
          const stage = STAGES[Math.max(0, Math.min(7, slot.currentStage - 1))];
          const wep = WEAPONS[slot.currentWeapon] || WEAPONS.pistol;

          return (
            <div
              key={slot.slotId}
              onClick={() => handleSlotClicked(slot)}
              className={`flex flex-col md:flex-row items-center justify-between p-4 rounded-xl border-2 transition-all ${
                slot.isEmpty
                  ? 'border-dashed border-slate-800 bg-slate-900/30 text-slate-500'
                  : 'border-slate-700 bg-slate-900/80 hover:border-amber-400 hover:bg-slate-900 text-slate-200 cursor-pointer shadow-md'
              }`}
            >
              {/* Slot Badge & Summary */}
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-slate-950 border border-slate-800 font-mono">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">SLOT</span>
                  <span className="text-xl font-black text-amber-400">0{slot.slotId}</span>
                </div>

                {slot.isEmpty ? (
                  <div className="text-base font-bold text-slate-500">
                    [ 빈 슬롯 — 새로운 작전 시작 가능 ]
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-black text-white" style={{ color: char.accentColor }}>
                        {char.name} ({char.role})
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                        {stage.name}
                      </span>
                      {slot.gameCompleted && (
                        <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>작전 완료</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>체력: <strong className="text-emerald-400">{slot.hp}/200</strong></span>
                      <span>·</span>
                      <span>무기: <strong className="text-slate-200">{wep.name}</strong></span>
                      <span>·</span>
                      <span>폭탄: <strong className="text-amber-400">{slot.bombs}개</strong></span>
                      <span>·</span>
                      <span>점수: <strong className="text-white">{slot.score.toLocaleString()}</strong></span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatPlayTime(slot.playTimeSeconds)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono mt-1">
                      마지막 저장: {slot.lastSavedDate ? new Date(slot.lastSavedDate).toLocaleString('ko-KR') : '-'}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-3 md:mt-0 w-full md:w-auto justify-end">
                {mode === 'LOAD' ? (
                  <>
                    <button
                      disabled={slot.isEmpty}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSlotClicked(slot);
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-black text-xs border ${
                        slot.isEmpty
                          ? 'bg-slate-800 text-slate-600 border-slate-800 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 cursor-pointer shadow'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>불러오기</span>
                    </button>

                    <button
                      disabled={slot.isEmpty}
                      onClick={(e) => {
                        e.stopPropagation();
                        audioService.playMenuClick();
                        setDeleteTargetSlotId(slot.slotId);
                      }}
                      className={`p-2 rounded-lg border ${
                        slot.isEmpty
                          ? 'bg-slate-800 text-slate-600 border-slate-800 cursor-not-allowed'
                          : 'bg-red-950/50 hover:bg-red-900 border-red-800 text-red-300 hover:text-white cursor-pointer'
                      }`}
                      title="저장 데이터 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {!slot.isEmpty && (
                      <button
                        onClick={(e) => handleExport(slot, e)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                        title="JSON 내보내기"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSlotClicked(slot);
                    }}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-black text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-400 cursor-pointer shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{slot.isEmpty ? '새 게임 시작' : '덮어쓰고 시작'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-900 pt-3">
        <span>브라우저 IndexedDB 로컬 안전 보관소 지원</span>
        <span>각 슬롯은 상호 독립적으로 분리 저장됩니다</span>
      </div>

      {/* Delete Confirmation Modal (Prompt Requirement Exact Wording) */}
      {deleteTargetSlotId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-md w-full bg-slate-900 border-3 border-red-600 rounded-xl p-6 shadow-2xl text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-black text-white mb-2">저장 데이터 삭제 확인</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              "이 저장 데이터를 삭제하시겠습니까? 삭제한 데이터는 복구할 수 없습니다."
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleDeleteConfirmed}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-lg border border-red-500 shadow cursor-pointer"
              >
                삭제하기
              </button>
              <button
                onClick={() => setDeleteTargetSlotId(null)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-lg border border-slate-700 cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overwrite Confirmation Modal for New Game */}
      {overwriteTargetSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-md w-full bg-slate-900 border-3 border-amber-500 rounded-xl p-6 shadow-2xl text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-black text-white mb-2">기존 저장 데이터 덮어쓰기</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              SLOT 0{overwriteTargetSlot.slotId}에는 이미 진행 중인 작전 데이터가 있습니다.
              새 게임을 시작하면 기존 기록이 지워집니다. 진행하시겠습니까?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleConfirmOverwrite}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-lg border border-amber-400 shadow cursor-pointer"
              >
                덮어쓰고 시작
              </button>
              <button
                onClick={() => setOverwriteTargetSlot(null)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-lg border border-slate-700 cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
