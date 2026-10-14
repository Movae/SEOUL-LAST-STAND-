export type CharacterId = 'junhyuk' | 'seoa' | 'jiwoo' | 'harin';

export interface CharacterData {
  id: CharacterId;
  name: string;
  title: string;
  gender: '남성' | '여성';
  role: string;
  traitName: string;
  traitDesc: string;
  color: string;
  secondaryColor: string;
  accentColor: string;
  stats: {
    speed: number; // 1-5
    firepower: number; // 1-5
    defense: number; // 1-5
    utility: number; // 1-5
  };
  quote: string;
}

export type WeaponType = 'pistol' | 'machinegun' | 'shotgun' | 'flamethrower' | 'laser';

export interface WeaponData {
  id: WeaponType;
  name: string;
  keyNum: number;
  maxAmmo: number;
  damage: number;
  fireInterval: number; // ms
  bulletSpeed: number;
  spread: number;
  pellets?: number;
  color: string;
  isInfinite: boolean;
  sound: string;
  description: string;
}

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface SaveSlotData {
  slotId: number; // 1 ~ 5
  isEmpty: boolean;
  character: CharacterId;
  currentStage: number; // 1 ~ 8
  checkpointIndex: number;
  hp: number;
  maxHp: number;
  currentWeapon: WeaponType;
  weaponsAmmo: Record<WeaponType, number>;
  bombs: number;
  score: number;
  rescuedCivilians: number;
  bossesDefeated: number[];
  playTimeSeconds: number;
  lastSavedDate: string;
  gameCompleted: boolean;
  difficulty: Difficulty;
}

export interface Enemy {
  id: string;
  type: 'shambler' | 'crawler' | 'shield_cop' | 'military_gunner' | 'runner' | 'jumper' | 'winged_infector' | 'spitter' | 'armored_cyborg' | 'bomber' | 'xeno_stalker' | 'tentacle_mutant' | 'alien_shocktrooper' | 'boss';
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  speed: number;
  facing: -1 | 1;
  attackCooldown: number;
  isBoss?: boolean;
  bossName?: string;
  bossTitle?: string;
  bossPhase?: number;
  bossPatternTimer?: number;
  shieldHp?: number;
  isAttacking?: boolean;
  attackAnimTimer?: number;
  grounded?: boolean;
  invulnerableTime?: number;
  deathTimer?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  fromPlayer: boolean;
  weaponType?: WeaponType;
  color: string;
  size: number;
  pierceCount?: number;
  isBomb?: boolean;
  isAlien?: boolean;
  life: number;
  maxLife: number;
  gravity?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'smoke' | 'spark' | 'blood' | 'fire' | 'laser' | 'casing' | 'dust' | 'bubble';
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  borderColor?: string;
  fontSize: number;
  life: number;
  maxLife: number;
  isCritical?: boolean;
}

export interface SupplyDrop {
  id: string;
  type: 'weapon' | 'health' | 'bomb';
  weaponType?: WeaponType;
  x: number;
  y: number;
  vy: number;
  parachuteOpen: boolean;
  collected: boolean;
  groundY: number;
}

export interface Civilian {
  id: string;
  x: number;
  y: number;
  state: 'trapped' | 'saluting' | 'running';
  timer: number;
  message: string;
  facing: -1 | 1;
}

export interface Checkpoint {
  id: number;
  x: number;
  y: number;
  activated: boolean;
  name: string;
}

export interface StageConfig {
  id: number;
  name: string;
  subName: string;
  timeOfDay: string;
  skyGradient: [string, string, string];
  cityMood: 'day' | 'golden' | 'sunset' | 'dusk' | 'night' | 'alien';
  description: string;
  length: number;
  checkpoints: { x: number; name: string }[];
  civilians: { x: number }[];
  boss: {
    name: string;
    title: string;
    hp: number;
    patterns: string[];
    description: string;
  };
}

export type GameScreenState =
  | 'TITLE'
  | 'CHARACTER_SELECT'
  | 'SLOT_SELECT_NEW'
  | 'LOAD_MENU'
  | 'CONTROLS'
  | 'SETTINGS'
  | 'PLAYING'
  | 'STAGE_CLEAR'
  | 'GAME_OVER'
  | 'ENDING';
