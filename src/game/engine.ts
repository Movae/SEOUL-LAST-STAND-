import {
  CharacterId,
  WeaponType,
  Difficulty,
  SaveSlotData,
  Enemy,
  Projectile,
  Particle,
  FloatingText,
  SupplyDrop,
  Civilian,
  StageConfig,
} from '../types/game';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  GRAVITY,
  CHARACTERS,
  WEAPONS,
  STAGES,
} from './constants';
import { audioService } from '../services/audio';
import { storageService } from '../services/storage';

export class GameEngine {
  // Game Loop
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private animFrameId: number | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Active Save Slot
  public currentSlotId: number = 1;
  public difficulty: Difficulty = 'normal';

  // Game Progress
  public currentStageIndex: number = 0; // 0 to 7
  public activeCheckpointIndex: number = 0;
  public score: number = 0;
  public rescuedCivilians: number = 0;
  public bossesDefeated: number[] = [];
  public playTimeSeconds: number = 0;
  public gameCompleted: boolean = false;

  // Player State
  public player = {
    x: 120,
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    width: 36,
    height: 72,
    facing: 1 as -1 | 1,
    characterId: 'junhyuk' as CharacterId,
    hp: 200,
    maxHp: 200,
    currentWeapon: 'pistol' as WeaponType,
    weaponsAmmo: {
      pistol: Infinity,
      machinegun: 500,
      shotgun: 500,
      flamethrower: 500,
      laser: 500,
    },
    bombs: 5,
    maxBombs: 10,
    isGrounded: true,
    isRolling: false,
    rollTimer: 0,
    isShooting: false,
    aimUp: false,
    invincibleTimer: 0,
    lastShootTime: 0,
    animTick: 0,
    isDead: false,
    deathTimer: 0,
  };

  // Camera & Viewport
  public cameraX: number = 0;
  public screenShake = { x: 0, y: 0, intensity: 0 };

  // Entities
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public supplyDrops: SupplyDrop[] = [];
  public civilians: Civilian[] = [];
  public checkpoints: { x: number; activated: boolean; name: string }[] = [];

  // Drop Timers (ms)
  private weaponDropTimer: number = 60000;
  private healthDropTimer: number = 45000;
  private bombDropTimer: number = 90000;
  private autoSaveTimer: number = 30000;
  private naturalRegenTimer: number = 2000;

  // Input states
  private keys: Record<string, boolean> = {};

  // Callbacks to UI
  public onStateChange?: () => void;
  public onStageClear?: (stageId: number) => void;
  public onGameOver?: (respawnCountdown: number) => void;
  public onGameEnding?: () => void;
  public onPauseToggle?: (paused: boolean) => void;

  public isPaused: boolean = false;
  public bossActive: boolean = false;
  public currentBoss: Enemy | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupInputs();
  }

  // --- Input Handlers ---

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;

      // Single triggers
      if (e.key === 'q' || e.key === 'Q') {
        this.switchCharacter();
      }
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        this.selectWeaponByNumber(parseInt(e.key, 10));
      }
      if (e.key === 'k' || e.key === 'K') {
        this.throwBomb();
      }
      if (e.key === 'e' || e.key === 'E') {
        this.interactRescue();
      }
      if (e.key === 'Escape') {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
    });
  }

  // --- Stage Loading & Initialization ---

  public loadFromSlot(slot: SaveSlotData) {
    this.currentSlotId = slot.slotId;
    this.player.characterId = slot.character || 'junhyuk';
    this.currentStageIndex = Math.max(0, Math.min(7, (slot.currentStage || 1) - 1));
    this.activeCheckpointIndex = slot.checkpointIndex || 0;
    this.player.hp = slot.hp || 200;
    this.player.maxHp = 200;
    this.player.currentWeapon = slot.currentWeapon || 'pistol';
    this.player.weaponsAmmo = { ...slot.weaponsAmmo };
    this.player.bombs = slot.bombs ?? 5;
    this.score = slot.score || 0;
    this.rescuedCivilians = slot.rescuedCivilians || 0;
    this.bossesDefeated = slot.bossesDefeated || [];
    this.playTimeSeconds = slot.playTimeSeconds || 0;
    this.gameCompleted = slot.gameCompleted || false;
    this.difficulty = slot.difficulty || 'normal';

    this.startStage(this.currentStageIndex, this.activeCheckpointIndex);
  }

  public startStage(stageIndex: number, checkpointIndex: number = 0) {
    this.currentStageIndex = stageIndex;
    this.activeCheckpointIndex = checkpointIndex;
    const stage = STAGES[stageIndex];

    // Spawn coordinate based on checkpoint
    const spawnX = checkpointIndex > 0 && stage.checkpoints[checkpointIndex - 1]
      ? stage.checkpoints[checkpointIndex - 1].x + 30
      : 120;

    this.player.x = spawnX;
    this.player.y = GROUND_Y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isDead = false;
    this.player.deathTimer = 0;
    this.player.invincibleTimer = 1800; // 1.8s invincibility on spawn
    this.cameraX = Math.max(0, spawnX - 200);

    // Reset entities
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.supplyDrops = [];
    this.bossActive = false;
    this.currentBoss = null;

    // Checkpoints
    this.checkpoints = stage.checkpoints.map((cp, idx) => ({
      x: cp.x,
      name: cp.name,
      activated: idx < checkpointIndex,
    }));

    // Civilians
    this.civilians = stage.civilians.map((c, idx) => ({
      id: `civ_${stage.id}_${idx}`,
      x: c.x,
      y: GROUND_Y,
      state: 'trapped',
      timer: 0,
      message: '살려주세요!',
      facing: 1,
    }));

    // Spawn Stage Enemies along the level
    this.spawnStageEnemies(stage);

    // Audio BGM
    this.playStageBGM(stage.id);

    // Show Title Popup
    this.addFloatingText(stage.name, spawnX + 150, GROUND_Y - 200, '#FEF08A', 36, true);
  }

  private playStageBGM(stageId: number) {
    if (stageId <= 4) {
      audioService.playBGM('day_action');
    } else if (stageId <= 7) {
      audioService.playBGM('night_cyber');
    } else {
      audioService.playBGM('mothership_boss');
    }
  }

  private spawnStageEnemies(stage: StageConfig) {
    this.enemies = [];
    const count = 18 + stage.id * 4;
    const spacing = (stage.length - 800) / count;

    for (let i = 0; i < count; i++) {
      const ex = 600 + i * spacing + (Math.random() * 80 - 40);
      let type: Enemy['type'] = 'shambler';

      if (stage.id === 1) {
        type = Math.random() < 0.35 ? 'crawler' : 'shambler';
      } else if (stage.id === 2) {
        type = Math.random() < 0.4 ? 'shield_cop' : 'military_gunner';
      } else if (stage.id === 3) {
        type = Math.random() < 0.45 ? 'runner' : 'jumper';
      } else if (stage.id === 4) {
        type = Math.random() < 0.45 ? 'winged_infector' : 'spitter';
      } else if (stage.id === 5) {
        type = Math.random() < 0.4 ? 'armored_cyborg' : 'bomber';
      } else if (stage.id === 6) {
        type = Math.random() < 0.4 ? 'xeno_stalker' : 'tentacle_mutant';
      } else {
        type = Math.random() < 0.5 ? 'alien_shocktrooper' : 'armored_cyborg';
      }

      const isFlyer = type === 'winged_infector';
      const hpMultiplier = this.difficulty === 'easy' ? 0.75 : this.difficulty === 'hard' ? 1.35 : 1.0;
      const baseHp = type === 'shield_cop' || type === 'armored_cyborg' ? 80 : 45;

      this.enemies.push({
        id: `enemy_${stage.id}_${i}`,
        type,
        x: ex,
        y: isFlyer ? GROUND_Y - 140 : GROUND_Y,
        vx: 0,
        vy: 0,
        width: type === 'crawler' ? 40 : 32,
        height: type === 'crawler' ? 32 : 64,
        hp: Math.round(baseHp * hpMultiplier),
        maxHp: Math.round(baseHp * hpMultiplier),
        speed: type === 'runner' ? 3.2 : type === 'crawler' ? 2.5 : 1.6,
        facing: -1,
        attackCooldown: 60 + Math.random() * 60,
        shieldHp: type === 'shield_cop' ? 100 : 0,
        grounded: true,
      });
    }

    // Prepare Boss at arena near end
    const bossX = stage.length - 250;
    const hpMult = this.difficulty === 'easy' ? 0.8 : this.difficulty === 'hard' ? 1.3 : 1.0;
    const bossHp = Math.round(stage.boss.hp * hpMult);

    this.enemies.push({
      id: `boss_${stage.id}`,
      type: 'boss',
      isBoss: true,
      bossName: stage.boss.name,
      bossTitle: stage.boss.title,
      bossPhase: 1,
      bossPatternTimer: 0,
      x: bossX,
      y: GROUND_Y,
      vx: 0,
      vy: 0,
      width: 110,
      height: 120,
      hp: bossHp,
      maxHp: bossHp,
      speed: 1.8,
      facing: -1,
      attackCooldown: 120,
      grounded: true,
    });
  }

  // --- Character & Weapon Switching ---

  public switchCharacter() {
    if (this.player.isDead) return;
    const charIds: CharacterId[] = ['junhyuk', 'seoa', 'jiwoo', 'harin'];
    const curIdx = charIds.indexOf(this.player.characterId);
    const nextIdx = (curIdx + 1) % charIds.length;
    this.player.characterId = charIds[nextIdx];

    const charDef = CHARACTERS[this.player.characterId];
    this.addFloatingText(`${charDef.name} (${charDef.role}) 전환!`, this.player.x, this.player.y - 70, charDef.accentColor, 18, true);
    audioService.playMenuClick();
    this.autoSave();
  }

  public selectWeaponByNumber(num: number) {
    if (this.player.isDead) return;
    const weaponsList: WeaponType[] = ['pistol', 'machinegun', 'shotgun', 'flamethrower', 'laser'];
    const chosen = weaponsList[num - 1];
    if (!chosen) return;

    if (chosen !== 'pistol' && this.player.weaponsAmmo[chosen] <= 0) {
      this.addFloatingText('탄약 부족!', this.player.x, this.player.y - 60, '#EF4444', 16);
      return;
    }

    this.player.currentWeapon = chosen;
    audioService.playMenuClick();
    const wDef = WEAPONS[chosen];
    this.addFloatingText(`${wDef.name} 장착`, this.player.x, this.player.y - 60, wDef.color, 16);
  }

  // --- Core Game Loop ---

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    audioService.stopBGM();
  }

  public togglePause() {
    this.isPaused = !this.isPaused;
    if (this.onPauseToggle) {
      this.onPauseToggle(this.isPaused);
    }
  }

  private loop = (time: number) => {
    if (!this.isRunning) return;
    const dt = Math.min(50, time - this.lastTime);
    this.lastTime = time;

    if (!this.isPaused) {
      this.update(dt, time);
    }

    if (this.onStateChange) {
      this.onStateChange();
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number, totalTime: number) {
    this.player.animTick++;
    this.playTimeSeconds += dt / 1000;

    // Screen Shake decay
    if (this.screenShake.intensity > 0) {
      this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.intensity = Math.max(0, this.screenShake.intensity - dt * 0.05);
    } else {
      this.screenShake.x = 0;
      this.screenShake.y = 0;
    }

    // Airdrop Timers
    this.updateAirdropTimers(dt);

    // Player Update
    this.updatePlayer(dt, totalTime);

    // Projectiles Update
    this.updateProjectiles(dt);

    // Enemies Update
    this.updateEnemies(dt);

    // Civilians Update
    this.updateCivilians(dt);

    // Supply Drops Update
    this.updateSupplyDrops(dt);

    // Particles & Text Update
    this.updateParticlesAndTexts(dt);

    // Checkpoint Trigger
    this.checkCheckpoints();

    // Auto-save interval
    this.autoSaveTimer -= dt;
    if (this.autoSaveTimer <= 0) {
      this.autoSaveTimer = 30000;
      this.autoSave();
    }

    // Camera follow player
    const targetCamX = this.player.x - CANVAS_WIDTH * 0.35;
    const stage = STAGES[this.currentStageIndex];
    this.cameraX = Math.max(0, Math.min(stage.length - CANVAS_WIDTH, targetCamX));
  }

  // --- Airdrop Supply Timers ---

  private updateAirdropTimers(dt: number) {
    this.weaponDropTimer -= dt;
    if (this.weaponDropTimer <= 0) {
      this.weaponDropTimer = 60000;
      this.triggerAirdrop('weapon');
    }

    this.healthDropTimer -= dt;
    if (this.healthDropTimer <= 0) {
      this.healthDropTimer = 45000;
      this.triggerAirdrop('health');
    }

    this.bombDropTimer -= dt;
    if (this.bombDropTimer <= 0) {
      this.bombDropTimer = 90000;
      this.triggerAirdrop('bomb');
    }
  }

  public triggerAirdrop(type: 'weapon' | 'health' | 'bomb') {
    const dropX = this.player.x + (Math.random() * 200 - 50);
    const weaponsList: WeaponType[] = ['machinegun', 'shotgun', 'flamethrower', 'laser'];
    const randomWep = weaponsList[Math.floor(Math.random() * weaponsList.length)];

    this.supplyDrops.push({
      id: `drop_${Date.now()}_${Math.random()}`,
      type,
      weaponType: type === 'weapon' ? randomWep : undefined,
      x: dropX,
      y: 40,
      vy: 1.5,
      parachuteOpen: true,
      collected: false,
      groundY: GROUND_Y,
    });

    audioService.playParachuteDrop();
    this.addFloatingText('보급품 공중 투하!', this.player.x, 150, '#38BDF8', 20, true);
  }

  // --- Player Logic ---

  private updatePlayer(dt: number, totalTime: number) {
    const { player } = this;
    const char = CHARACTERS[player.characterId];

    if (player.invincibleTimer > 0) {
      player.invincibleTimer -= dt;
    }

    // Passive regeneration for Han Ji-woo (Medic)
    if (player.characterId === 'jiwoo' && !player.isDead) {
      this.naturalRegenTimer -= dt;
      if (this.naturalRegenTimer <= 0) {
        this.naturalRegenTimer = 2000;
        if (player.hp < player.maxHp) {
          player.hp = Math.min(player.maxHp, player.hp + 2);
        }
      }
    }

    // Death & Respawn Logic
    if (player.isDead) {
      player.deathTimer -= dt;
      if (player.deathTimer <= 0) {
        this.respawnAtCheckpoint();
      }
      return;
    }

    // Tactical Roll (Shift)
    if (player.isRolling) {
      player.rollTimer -= dt;
      player.vx = player.facing * 7.5;
      if (player.rollTimer <= 0) {
        player.isRolling = false;
      }
    } else {
      // Movement Speed (Kang Jun-hyuk bonus +20%)
      const speedMult = player.characterId === 'junhyuk' ? 1.2 : 1.0;
      const baseSpeed = 4.8 * speedMult;

      const left = this.keys['a'] || this.keys['arrowleft'];
      const right = this.keys['d'] || this.keys['arrowright'];

      if (left && !right) {
        player.vx = -baseSpeed;
        player.facing = -1;
      } else if (right && !left) {
        player.vx = baseSpeed;
        player.facing = 1;
      } else {
        player.vx = 0;
      }

      // Roll Trigger (Shift key)
      const shift = this.keys['shift'] || this.keys['shiftleft'] || this.keys['shiftright'];
      if (shift && player.isGrounded && !player.isRolling) {
        player.isRolling = true;
        // Han Jiwoo roll invincibility +30% longer
        player.rollTimer = player.characterId === 'jiwoo' ? 420 : 320;
        player.invincibleTimer = player.rollTimer;
        // Spawn roll dust
        for (let i = 0; i < 6; i++) {
          this.particles.push({
            x: player.x,
            y: player.y,
            vx: -player.facing * (Math.random() * 3 + 1),
            vy: -Math.random() * 2,
            life: 250,
            maxLife: 250,
            color: '#E2E8F0',
            size: 6,
            type: 'dust',
          });
        }
      }

      // Jump (Space)
      const space = this.keys[' '] || this.keys['space'];
      if (space && player.isGrounded) {
        player.vy = -12.5;
        player.isGrounded = false;
      }
    }

    // Aim Up
    player.aimUp = !!(this.keys['w'] || this.keys['arrowup']);

    // Gravity & Physics
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    // Ground Collision
    if (player.y >= GROUND_Y) {
      player.y = GROUND_Y;
      player.vy = 0;
      player.isGrounded = true;
    }

    // Boundary constraints
    const stage = STAGES[this.currentStageIndex];
    player.x = Math.max(20, Math.min(stage.length - 20, player.x));

    // Shooting (J key)
    player.isShooting = !!(this.keys['j'] || this.keys['keyj']);
    if (player.isShooting) {
      this.handlePlayerShooting(totalTime);
    }
  }

  private handlePlayerShooting(time: number) {
    const { player } = this;
    const wep = WEAPONS[player.currentWeapon];

    // Junhyuk fire rate bonus
    const fireInterval = player.characterId === 'junhyuk' ? wep.fireInterval * 0.82 : wep.fireInterval;

    if (time - player.lastShootTime < fireInterval) return;
    player.lastShootTime = time;

    // Check Ammo
    if (!wep.isInfinite) {
      if (player.weaponsAmmo[player.currentWeapon] <= 0) {
        // Auto-switch to pistol as per requirements!
        player.currentWeapon = 'pistol';
        this.addFloatingText('탄약 소진! 권총으로 전환', player.x, player.y - 50, '#F59E0B', 15);
        return;
      }
      player.weaponsAmmo[player.currentWeapon]--;
    }

    // Sound effect
    if (wep.id === 'pistol') audioService.playPistol();
    else if (wep.id === 'machinegun') audioService.playMachineGun();
    else if (wep.id === 'shotgun') audioService.playShotgun();
    else if (wep.id === 'flamethrower') audioService.playFlame();
    else if (wep.id === 'laser') audioService.playLaser();

    // Damage & Trait calculations
    let damage = wep.damage;
    // Harin bonus on shotgun & flame
    if (player.characterId === 'harin' && (wep.id === 'shotgun' || wep.id === 'flamethrower')) {
      damage *= 1.25;
    }

    // Seo-ah critical hit
    let isCritical = false;
    const critChance = player.characterId === 'seoa' ? 0.35 : 0.05;
    if (Math.random() < critChance) {
      damage *= 2;
      isCritical = true;
    }

    // Gun angle
    let angle = 0;
    if (player.aimUp) {
      angle = -Math.PI / 4;
    }
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const gunX = player.x + player.facing * 28;
    const gunY = player.y - 40;

    const pelletsCount = wep.pellets || 1;

    for (let p = 0; p < pelletsCount; p++) {
      const spread = (Math.random() - 0.5) * wep.spread;
      const speed = wep.bulletSpeed;
      const finalVx = player.facing * speed * Math.cos(angle + spread);
      const finalVy = speed * Math.sin(angle + spread);

      this.projectiles.push({
        id: `proj_${Date.now()}_${Math.random()}`,
        x: gunX,
        y: gunY,
        vx: finalVx,
        vy: finalVy,
        damage,
        fromPlayer: true,
        weaponType: wep.id,
        color: wep.color,
        size: wep.id === 'flamethrower' ? 14 : wep.id === 'shotgun' ? 4 : 5,
        pierceCount: player.characterId === 'seoa' ? 2 : wep.id === 'laser' ? 5 : 1,
        life: wep.id === 'flamethrower' ? 380 : 1200,
        maxLife: wep.id === 'flamethrower' ? 380 : 1200,
      });
    }

    // Casing particle
    this.particles.push({
      x: gunX - player.facing * 5,
      y: gunY,
      vx: -player.facing * (Math.random() * 2 + 1),
      vy: -(Math.random() * 2 + 2),
      life: 500,
      maxLife: 500,
      color: '#FBBF24',
      size: 4,
      type: 'casing',
    });
  }

  public throwBomb() {
    const { player } = this;
    if (player.isDead || player.bombs <= 0) return;
    player.bombs--;

    audioService.playMenuClick();

    // Throw Metal Slug grenade
    this.projectiles.push({
      id: `bomb_${Date.now()}`,
      x: player.x + player.facing * 15,
      y: player.y - 45,
      vx: player.facing * 8.5,
      vy: -9,
      damage: player.characterId === 'harin' ? 140 : 100,
      fromPlayer: true,
      isBomb: true,
      color: '#15803D',
      size: 8,
      life: 900,
      maxLife: 900,
      gravity: 0.5,
    });
  }

  // --- Rescuing Civilians ---

  public interactRescue() {
    const { player } = this;
    if (player.isDead) return;

    this.civilians.forEach((c) => {
      if (c.state === 'trapped' && Math.abs(c.x - player.x) < 70) {
        c.state = 'saluting';
        c.message = '감사합니다 대원님!';
        this.rescuedCivilians++;
        this.score += 1000;
        player.hp = Math.min(player.maxHp, player.hp + 20);

        audioService.playCivilianRescued();
        this.addFloatingText('SAVED! +1000', c.x, c.y - 70, '#22C55E', 22, true);

        // Run away after 1 second
        setTimeout(() => {
          c.state = 'running';
          c.facing = -1;
        }, 1200);
      }
    });
  }

  // --- Projectile Physics & Collisions ---

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      if (p.gravity) {
        p.vy += p.gravity;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;

      // Ground bounce for grenade
      if (p.isBomb && p.y >= GROUND_Y - p.size) {
        p.y = GROUND_Y - p.size;
        p.vy = -p.vy * 0.4;
        p.vx *= 0.7;
        if (Math.abs(p.vy) < 1) p.vy = 0;
      }

      // Bomb Detonation
      if (p.isBomb && (p.life <= 0 || (p.y >= GROUND_Y - p.size && Math.abs(p.vx) < 0.5))) {
        this.explodeBomb(p.x, p.y, p.damage);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Expire
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Player Projectile vs Enemies
      if (p.fromPlayer) {
        let hit = false;
        for (const enemy of this.enemies) {
          if (enemy.hp <= 0) continue;

          // Box collision
          const exMin = enemy.x - enemy.width / 2;
          const exMax = enemy.x + enemy.width / 2;
          const eyMin = enemy.y - enemy.height;
          const eyMax = enemy.y;

          if (p.x >= exMin && p.x <= exMax && p.y >= eyMin && p.y <= eyMax) {
            this.damageEnemy(enemy, p.damage, p.weaponType);
            hit = true;

            // Reduce pierce count
            if (p.pierceCount) {
              p.pierceCount--;
              if (p.pierceCount <= 0) break;
            } else {
              break;
            }
          }
        }

        if (hit && (!p.pierceCount || p.pierceCount <= 0)) {
          this.projectiles.splice(i, 1);
          continue;
        }
      } else {
        // Enemy Projectile vs Player
        if (!this.player.isDead && this.player.invincibleTimer <= 0) {
          const pxMin = this.player.x - this.player.width / 2;
          const pxMax = this.player.x + this.player.width / 2;
          const pyMin = this.player.y - this.player.height;
          const pyMax = this.player.y;

          if (p.x >= pxMin && p.x <= pxMax && p.y >= pyMin && p.y <= pyMax) {
            this.damagePlayer(p.damage);
            this.projectiles.splice(i, 1);
            continue;
          }
        }
      }
    }
  }

  private explodeBomb(x: number, y: number, damage: number) {
    audioService.playExplosion();
    this.screenShake.intensity = 18;

    const radius = this.player.characterId === 'harin' ? 140 : 100;

    // Damage enemies in radius
    for (const enemy of this.enemies) {
      const dist = Math.hypot(enemy.x - x, enemy.y - y);
      if (dist <= radius) {
        const falloff = 1 - dist / radius;
        this.damageEnemy(enemy, Math.round(damage * (0.5 + falloff * 0.5)), 'shotgun');
      }
    }

    // Comic Explosion particles & onomatopoeia
    this.addFloatingText('BOOM!', x, y - 40, '#EF4444', 32, true);

    for (let i = 0; i < 28; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 8 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 500,
        maxLife: 500,
        color: i % 2 === 0 ? '#F97316' : '#EF4444',
        size: Math.random() * 12 + 6,
        type: 'fire',
      });
    }
  }

  // --- Enemy Logic & Boss AI ---

  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Boss activation check
      if (enemy.isBoss && !this.bossActive && Math.abs(enemy.x - this.player.x) < 700) {
        this.bossActive = true;
        this.currentBoss = enemy;
        audioService.playBossRoar();
        this.screenShake.intensity = 15;
        this.addFloatingText(`WARNING: ${enemy.bossName}`, enemy.x - 100, GROUND_Y - 220, '#EF4444', 28, true);
      }

      if (enemy.hp <= 0) {
        // Death countdown / explosion
        if (!enemy.deathTimer) {
          enemy.deathTimer = enemy.isBoss ? 2000 : 300;
          if (enemy.isBoss) {
            audioService.playBossDeath();
            this.handleBossDefeated(enemy);
          } else {
            audioService.playZombieDeath();
          }
        }
        enemy.deathTimer -= dt;
        if (enemy.deathTimer <= 0) {
          this.enemies.splice(i, 1);
        }
        continue;
      }

      // Boss Logic
      if (enemy.isBoss) {
        this.updateBossAI(enemy, dt);
        continue;
      }

      // Regular Enemy AI
      const distToPlayer = Math.abs(enemy.x - this.player.x);
      enemy.facing = this.player.x > enemy.x ? 1 : -1;

      if (distToPlayer < 650) {
        // Move towards player
        enemy.x += enemy.facing * enemy.speed;

        // Attack cooldown
        enemy.attackCooldown -= dt * 0.06;
        if (enemy.attackCooldown <= 0) {
          enemy.attackCooldown = 70 + Math.random() * 50;

          if (enemy.type === 'military_gunner' || enemy.type === 'alien_shocktrooper') {
            // Ranged shoot
            this.projectiles.push({
              id: `ep_${Date.now()}_${Math.random()}`,
              x: enemy.x + enemy.facing * 20,
              y: enemy.y - enemy.height / 2,
              vx: enemy.facing * 8,
              vy: 0,
              damage: 16,
              fromPlayer: false,
              isAlien: enemy.type === 'alien_shocktrooper',
              color: enemy.type === 'alien_shocktrooper' ? '#2DD4BF' : '#F97316',
              size: 5,
              life: 1500,
              maxLife: 1500,
            });
          } else if (enemy.type === 'spitter') {
            // Lob acid ball
            this.projectiles.push({
              id: `acid_${Date.now()}`,
              x: enemy.x,
              y: enemy.y - enemy.height,
              vx: enemy.facing * 5.5,
              vy: -6,
              damage: 20,
              fromPlayer: false,
              color: '#84CC16',
              size: 8,
              life: 2000,
              maxLife: 2000,
              gravity: 0.35,
            });
          }
        }

        // Melee hit on player contact
        if (distToPlayer < 35 && Math.abs(enemy.y - this.player.y) < 50) {
          this.damagePlayer(enemy.type === 'bomber' ? 60 : 15);
          if (enemy.type === 'bomber') {
            enemy.hp = 0;
            this.explodeBomb(enemy.x, enemy.y, 40);
          }
        }
      }
    }
  }

  private updateBossAI(boss: Enemy, dt: number) {
    boss.facing = this.player.x > boss.x ? 1 : -1;
    boss.bossPatternTimer = (boss.bossPatternTimer || 0) + dt;

    // Phase 2 check (<= 50% HP)
    if (boss.hp <= boss.maxHp * 0.5 && boss.bossPhase === 1) {
      boss.bossPhase = 2;
      boss.speed *= 1.4;
      this.screenShake.intensity = 20;
      audioService.playBossRoar();
      this.addFloatingText('PHASE 2: BERSERK!', boss.x, boss.y - boss.height - 40, '#DC2626', 30, true);
    }

    const stageId = STAGES[this.currentStageIndex].id;
    const interval = boss.bossPhase === 2 ? 1800 : 2500;

    if (boss.bossPatternTimer >= interval) {
      boss.bossPatternTimer = 0;
      const pattern = Math.floor(Math.random() * 3);

      if (pattern === 0) {
        // Pattern 1: High velocity rush / charge
        boss.vx = boss.facing * (boss.bossPhase === 2 ? 9 : 6);
        this.addFloatingText('CHARGE!', boss.x, boss.y - boss.height - 20, '#F59E0B', 20);
        setTimeout(() => { boss.vx = 0; }, 600);
      } else if (pattern === 1) {
        // Pattern 2: Multidirectional projectile barrage
        for (let a = -0.4; a <= 0.4; a += 0.2) {
          this.projectiles.push({
            id: `boss_proj_${Date.now()}_${a}`,
            x: boss.x + boss.facing * 30,
            y: boss.y - boss.height * 0.6,
            vx: boss.facing * 7 * Math.cos(a),
            vy: 7 * Math.sin(a),
            damage: 22,
            fromPlayer: false,
            isAlien: stageId >= 6,
            color: stageId >= 6 ? '#A855F7' : '#DC2626',
            size: 8,
            life: 2000,
            maxLife: 2000,
          });
        }
      } else {
        // Pattern 3: Ground shockwave stomp
        this.screenShake.intensity = 15;
        this.projectiles.push({
          id: `wave_l_${Date.now()}`,
          x: boss.x - 30,
          y: GROUND_Y - 10,
          vx: -6.5,
          vy: 0,
          damage: 25,
          fromPlayer: false,
          color: '#EAB308',
          size: 14,
          life: 1500,
          maxLife: 1500,
        });
        this.projectiles.push({
          id: `wave_r_${Date.now()}`,
          x: boss.x + 30,
          y: GROUND_Y - 10,
          vx: 6.5,
          vy: 0,
          damage: 25,
          fromPlayer: false,
          color: '#EAB308',
          size: 14,
          life: 1500,
          maxLife: 1500,
        });
      }
    }

    // Apply boss movement
    boss.x += (boss.vx || 0);
    // Boundary lock in arena
    const stage = STAGES[this.currentStageIndex];
    boss.x = Math.max(stage.length - 800, Math.min(stage.length - 80, boss.x));
  }

  private handleBossDefeated(boss: Enemy) {
    this.bossActive = false;
    this.score += 5000 * (this.currentStageIndex + 1);

    if (!this.bossesDefeated.includes(this.currentStageIndex + 1)) {
      this.bossesDefeated.push(this.currentStageIndex + 1);
    }

    this.addFloatingText('STAGE BOSS DEFEATED!', this.player.x, GROUND_Y - 200, '#FBBF24', 36, true);

    // Auto save progress
    this.autoSave();

    // Check if Stage 8 (Final Ending)
    if (this.currentStageIndex === 7) {
      this.gameCompleted = true;
      this.autoSave();
      setTimeout(() => {
        if (this.onGameEnding) this.onGameEnding();
      }, 2500);
    } else {
      setTimeout(() => {
        if (this.onStageClear) this.onStageClear(this.currentStageIndex + 1);
      }, 2500);
    }
  }

  // --- Damage System ---

  public damageEnemy(enemy: Enemy, damage: number, weaponType?: WeaponType) {
    if (enemy.hp <= 0) return;

    // Riot shield absorption
    if (enemy.shieldHp && enemy.shieldHp > 0 && enemy.facing !== this.player.facing) {
      enemy.shieldHp -= damage;
      audioService.playZombieHit();
      this.addFloatingText('BLOCKED!', enemy.x, enemy.y - enemy.height, '#94A3B8', 14);
      if (enemy.shieldHp <= 0) {
        enemy.shieldHp = 0;
        this.addFloatingText('SHIELD BROKEN!', enemy.x, enemy.y - enemy.height, '#F59E0B', 16, true);
      }
      return;
    }

    enemy.hp -= damage;
    audioService.playZombieHit();

    // Knockback
    const knockback = weaponType === 'shotgun' ? 6 : 2;
    enemy.x += this.player.facing * knockback;

    // Floating damage text
    this.addFloatingText(`-${Math.round(damage)}`, enemy.x, enemy.y - enemy.height - 10, '#FEF08A', 16);

    // Blood / Spark Particles
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: enemy.x,
        y: enemy.y - enemy.height / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 200,
        maxLife: 200,
        color: enemy.isBoss || enemy.type === 'alien_shocktrooper' ? '#A855F7' : '#15803D',
        size: 4,
        type: 'blood',
      });
    }

    if (enemy.hp <= 0) {
      this.score += enemy.isBoss ? 5000 : 150;
    }
  }

  public damagePlayer(damage: number) {
    const { player } = this;
    if (player.isDead || player.invincibleTimer > 0) return;

    // Harin defense bonus (-15% damage)
    let finalDamage = damage;
    if (player.characterId === 'harin') {
      finalDamage *= 0.85;
    }

    player.hp -= Math.round(finalDamage);
    player.invincibleTimer = 800; // 0.8s invulnerable after hit
    this.screenShake.intensity = 8;
    audioService.playPlayerHit();

    this.addFloatingText(`-${Math.round(finalDamage)}`, player.x, player.y - 60, '#EF4444', 18, true);

    if (player.hp <= 0) {
      player.hp = 0;
      player.isDead = true;
      player.deathTimer = 3000; // 3 seconds countdown as requested!

      if (this.onGameOver) {
        this.onGameOver(3);
      }
    }
  }

  // --- Respawn & Checkpoint System ---

  public respawnAtCheckpoint() {
    const { player } = this;
    const stage = STAGES[this.currentStageIndex];

    const spawnX = this.activeCheckpointIndex > 0 && stage.checkpoints[this.activeCheckpointIndex - 1]
      ? stage.checkpoints[this.activeCheckpointIndex - 1].x + 30
      : 120;

    player.x = spawnX;
    player.y = GROUND_Y;
    player.hp = 200; // Restored to 200 HP as requested!
    player.bombs = 5; // Reset to 5 bombs as requested!
    player.isDead = false;
    player.deathTimer = 0;
    player.invincibleTimer = 3000; // Temporary invincibility
    this.cameraX = Math.max(0, spawnX - 200);

    // Prompt requirement: "부활 시 랜덤 특수 무기 1개 공중 투하"
    this.triggerAirdrop('weapon');

    this.addFloatingText('체크포인트에서 부활!', player.x, player.y - 80, '#38BDF8', 24, true);
    this.autoSave();
  }

  private checkCheckpoints() {
    const { player } = this;
    this.checkpoints.forEach((cp, idx) => {
      if (!cp.activated && player.x >= cp.x) {
        cp.activated = true;
        this.activeCheckpointIndex = idx + 1;
        audioService.playCivilianRescued();
        this.addFloatingText(`체크포인트: ${cp.name}`, player.x, GROUND_Y - 120, '#38BDF8', 22, true);
        this.autoSave();
      }
    });
  }

  // --- Civilians & Supplies ---

  private updateCivilians(dt: number) {
    this.civilians.forEach((c) => {
      if (c.state === 'running') {
        c.x += c.facing * 3.5;
      }
    });
  }

  private updateSupplyDrops(dt: number) {
    const { player } = this;
    for (const drop of this.supplyDrops) {
      if (drop.collected) continue;

      if (drop.y < drop.groundY - 18) {
        drop.y += drop.vy;
      }

      // Check collision with player or proximity
      const dist = Math.hypot(drop.x - player.x, drop.y - (player.y - 30));
      if (dist < 45) {
        drop.collected = true;
        audioService.playPickup();

        if (drop.type === 'health') {
          // Requirement: "빨간 포션 획득 시 체력 80 회복, 최대 200을 초과하지 않음"
          player.hp = Math.min(200, player.hp + 80);
          this.addFloatingText('+80 HP 회복!', player.x, player.y - 70, '#22C55E', 22, true);
        } else if (drop.type === 'bomb') {
          // Requirement: "폭탄 보급품 획득 시 3개 추가, 최대 10개"
          player.bombs = Math.min(10, player.bombs + 3);
          this.addFloatingText('+3 폭탄 획득!', player.x, player.y - 70, '#F59E0B', 22, true);
        } else if (drop.type === 'weapon' && drop.weaponType) {
          // Special weapon ammo replenished to 500
          player.weaponsAmmo[drop.weaponType] = 500;
          player.currentWeapon = drop.weaponType;
          const wDef = WEAPONS[drop.weaponType];
          this.addFloatingText(`${wDef.name} 500발 획득!`, player.x, player.y - 70, wDef.color, 22, true);
        }
      }
    }
  }

  // --- Particles & Text ---

  private updateParticlesAndTexts(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public addFloatingText(text: string, x: number, y: number, color: string, fontSize: number = 18, isCritical: boolean = false) {
    this.floatingTexts.push({
      id: `ft_${Date.now()}_${Math.random()}`,
      text,
      x,
      y,
      color,
      borderColor: '#000000',
      fontSize,
      life: 1400,
      maxLife: 1400,
      isCritical,
    });
  }

  // --- Save / Load Helpers ---

  public async autoSave() {
    const slotData: SaveSlotData = {
      slotId: this.currentSlotId,
      isEmpty: false,
      character: this.player.characterId,
      currentStage: this.currentStageIndex + 1,
      checkpointIndex: this.activeCheckpointIndex,
      hp: this.player.hp,
      maxHp: 200,
      currentWeapon: this.player.currentWeapon,
      weaponsAmmo: { ...this.player.weaponsAmmo },
      bombs: this.player.bombs,
      score: this.score,
      rescuedCivilians: this.rescuedCivilians,
      bossesDefeated: [...this.bossesDefeated],
      playTimeSeconds: Math.round(this.playTimeSeconds),
      lastSavedDate: new Date().toISOString(),
      gameCompleted: this.gameCompleted,
      difficulty: this.difficulty,
    };

    await storageService.saveSlot(slotData);
  }
}
