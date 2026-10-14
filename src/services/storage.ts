import { SaveSlotData, CharacterId, WeaponType, Difficulty } from '../types/game';

const DB_NAME = 'SeoulLastStandDB';
const DB_VERSION = 1;
const STORE_NAME = 'save_slots';
const LOCAL_STORAGE_KEY = 'seoul_last_stand_slots_backup';

export const DEFAULT_WEAPONS_AMMO: Record<WeaponType, number> = {
  pistol: Infinity,
  machinegun: 500,
  shotgun: 500,
  flamethrower: 500,
  laser: 500,
};

export const createEmptySlot = (slotId: number): SaveSlotData => ({
  slotId,
  isEmpty: true,
  character: 'junhyuk',
  currentStage: 1,
  checkpointIndex: 0,
  hp: 200,
  maxHp: 200,
  currentWeapon: 'pistol',
  weaponsAmmo: { ...DEFAULT_WEAPONS_AMMO },
  bombs: 5,
  score: 0,
  rescuedCivilians: 0,
  bossesDefeated: [],
  playTimeSeconds: 0,
  lastSavedDate: '',
  gameCompleted: false,
  difficulty: 'normal',
});

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'slotId' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('Failed to open IndexedDB, falling back to localStorage');
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  public async getAllSlots(): Promise<SaveSlotData[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const list = request.result as SaveSlotData[];
          const slots: SaveSlotData[] = [];
          for (let i = 1; i <= 5; i++) {
            const found = list.find((s) => s.slotId === i);
            if (found) {
              slots.push(found);
            } else {
              slots.push(createEmptySlot(i));
            }
          }
          resolve(slots);
        };

        request.onerror = () => {
          resolve(this.getFallbackSlots());
        };
      });
    } catch {
      return this.getFallbackSlots();
    }
  }

  public async getSlot(slotId: number): Promise<SaveSlotData> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(slotId);

        request.onsuccess = () => {
          if (request.result) {
            resolve(request.result);
          } else {
            resolve(createEmptySlot(slotId));
          }
        };

        request.onerror = () => {
          const fallback = this.getFallbackSlots().find((s) => s.slotId === slotId);
          resolve(fallback || createEmptySlot(slotId));
        };
      });
    } catch {
      const fallback = this.getFallbackSlots().find((s) => s.slotId === slotId);
      return fallback || createEmptySlot(slotId);
    }
  }

  public async saveSlot(slotData: SaveSlotData): Promise<boolean> {
    const updatedData: SaveSlotData = {
      ...slotData,
      isEmpty: false,
      lastSavedDate: new Date().toISOString(),
    };

    // Save to localStorage backup first
    this.saveToFallback(updatedData);

    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(updatedData);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch {
      return true; // Already saved in fallback
    }
  }

  public async deleteSlot(slotId: number): Promise<boolean> {
    const emptySlot = createEmptySlot(slotId);
    this.saveToFallback(emptySlot);

    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(slotId);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch {
      return true;
    }
  }

  public async getLatestPlayedSlot(): Promise<SaveSlotData | null> {
    const all = await this.getAllSlots();
    const active = all.filter((s) => !s.isEmpty && s.lastSavedDate);
    if (active.length === 0) return null;

    active.sort((a, b) => new Date(b.lastSavedDate).getTime() - new Date(a.lastSavedDate).getTime());
    return active[0];
  }

  public exportSlotJSON(slotData: SaveSlotData): string {
    return JSON.stringify(slotData, null, 2);
  }

  public importSlotJSON(jsonStr: string, targetSlotId?: number): SaveSlotData {
    try {
      const parsed = JSON.parse(jsonStr) as SaveSlotData;
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('올바른 저장 파일 형식이 아닙니다.');
      }
      const slotId = targetSlotId ?? parsed.slotId ?? 1;
      const validated: SaveSlotData = {
        ...createEmptySlot(slotId),
        ...parsed,
        slotId,
        isEmpty: false,
        lastSavedDate: new Date().toISOString(),
      };
      return validated;
    } catch (e: any) {
      throw new Error(`저장 파일 불러오기 실패: ${e.message}`);
    }
  }

  private getFallbackSlots(): SaveSlotData[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    const slots: SaveSlotData[] = [];
    for (let i = 1; i <= 5; i++) {
      slots.push(createEmptySlot(i));
    }
    return slots;
  }

  private saveToFallback(slot: SaveSlotData): void {
    try {
      const current = this.getFallbackSlots();
      const idx = current.findIndex((s) => s.slotId === slot.slotId);
      if (idx !== -1) {
        current[idx] = slot;
      } else {
        current.push(slot);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  }
}

export const storageService = new StorageService();
