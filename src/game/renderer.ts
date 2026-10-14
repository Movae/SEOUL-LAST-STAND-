import {
  CharacterData,
  Enemy,
  Projectile,
  Particle,
  FloatingText,
  SupplyDrop,
  Civilian,
  StageConfig,
  WeaponType,
} from '../types/game';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, CHARACTERS, WEAPONS } from './constants';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private imageCache: Map<string, HTMLImageElement> = new Map();

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.preloadImages();
  }

  private preloadImages() {
    const urls = [
      '/src/assets/images/game_hero_banner_1791994586608.jpg',
      '/src/assets/images/game_stage_gwanghwamun_1791994589323.jpg',
      '/src/assets/images/game_stage_namsan_1791994590031.jpg',
      '/src/assets/images/game_ending_sunrise_1791994588451.jpg',
    ];
    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = () => this.imageCache.set(url, img);
    });
  }

  public render(
    stage: StageConfig,
    cameraX: number,
    player: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      facing: -1 | 1;
      characterId: string;
      hp: number;
      maxHp: number;
      isRolling: boolean;
      isShooting: boolean;
      aimUp: boolean;
      invincibleTimer: number;
      currentWeapon: WeaponType;
      animTick: number;
      isDead: boolean;
    },
    enemies: Enemy[],
    projectiles: Projectile[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    supplyDrops: SupplyDrop[],
    civilians: Civilian[],
    checkpoints: { x: number; activated: boolean; name: string }[],
    screenShake: { x: number; y: number },
    gameTime: number
  ) {
    const { ctx } = this;

    ctx.save();
    // Screen shake
    ctx.translate(screenShake.x, screenShake.y);

    // 1. Sky & Backdrop
    this.drawSky(stage, cameraX);

    // 2. Parallax Distant Seoul Skyline
    this.drawDistantCity(stage, cameraX);

    // 3. Midground Seoul Buildings & Korean signs
    this.drawMidground(stage, cameraX);

    // 4. Combat Ground & Street Level
    this.drawGround(stage, cameraX);

    // 5. Checkpoints
    this.drawCheckpoints(checkpoints, cameraX, gameTime);

    // 6. Civilians
    this.drawCivilians(civilians, cameraX, gameTime);

    // 7. Supply Drops
    this.drawSupplyDrops(supplyDrops, cameraX, gameTime);

    // 8. Enemies & Bosses
    this.drawEnemies(enemies, cameraX, gameTime);

    // 9. Player Character
    this.drawPlayer(player, cameraX, gameTime);

    // 10. Projectiles
    this.drawProjectiles(projectiles, cameraX);

    // 11. Particles & Explosion bursts
    this.drawParticles(particles, cameraX);

    // 12. Floating Comic Texts ("BOOM!", "CRITICAL!")
    this.drawFloatingTexts(floatingTexts, cameraX);

    ctx.restore();
  }

  // --- Background Drawing ---

  private drawSky(stage: StageConfig, cameraX: number) {
    const { ctx } = this;
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, stage.skyGradient[0]);
    grad.addColorStop(0.6, stage.skyGradient[1]);
    grad.addColorStop(1, stage.skyGradient[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Sun / Moon / Alien Dreadnought in sky
    if (stage.cityMood === 'day' || stage.cityMood === 'golden') {
      const sunX = ((800 - cameraX * 0.02) % (CANVAS_WIDTH + 200)) - 100;
      ctx.fillStyle = stage.cityMood === 'golden' ? '#F59E0B' : '#FEF08A';
      ctx.beginPath();
      ctx.arc(sunX, 120, 48, 0, Math.PI * 2);
      ctx.fill();
    } else if (stage.cityMood === 'night' || stage.cityMood === 'alien') {
      const moonX = ((900 - cameraX * 0.02) % (CANVAS_WIDTH + 200)) - 100;
      ctx.fillStyle = stage.cityMood === 'alien' ? '#A855F7' : '#F8FAFC';
      ctx.beginPath();
      ctx.arc(moonX, 110, 40, 0, Math.PI * 2);
      ctx.fill();

      // Alien mothership silhouette looming in the sky
      const shipX = ((300 - cameraX * 0.05) % (CANVAS_WIDTH + 400)) - 200;
      ctx.fillStyle = 'rgba(20, 10, 40, 0.6)';
      ctx.beginPath();
      ctx.ellipse(shipX + 200, 140, 260, 45, 0, 0, Math.PI * 2);
      ctx.fill();
      // Alien engine lights
      ctx.fillStyle = '#C084FC';
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.arc(shipX + 80 + i * 40, 155, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawDistantCity(stage: StageConfig, cameraX: number) {
    const { ctx } = this;
    const parallax = cameraX * 0.15;

    ctx.save();
    ctx.fillStyle = stage.cityMood === 'day' ? '#64748B' : stage.cityMood === 'night' ? '#1E1B4B' : '#334155';

    // Repeating distant mountain & skyline
    const startIdx = Math.floor(parallax / 600);
    for (let i = startIdx - 1; i <= startIdx + 3; i++) {
      const baseX = i * 600 - parallax;

      // Distant mountain
      ctx.beginPath();
      ctx.moveTo(baseX - 100, GROUND_Y);
      ctx.lineTo(baseX + 150, GROUND_Y - 220);
      ctx.lineTo(baseX + 320, GROUND_Y - 140);
      ctx.lineTo(baseX + 480, GROUND_Y - 260);
      ctx.lineTo(baseX + 700, GROUND_Y);
      ctx.fill();

      // Iconic Namsan Tower or Lotte Tower depending on stage
      if (stage.id === 1 || stage.id === 3 || stage.id === 7) {
        // Namsan Tower silhouette
        ctx.fillRect(baseX + 475, GROUND_Y - 380, 10, 120);
        ctx.beginPath();
        ctx.arc(baseX + 480, GROUND_Y - 330, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(baseX + 478, GROUND_Y - 420, 4, 40);
      } else if (stage.id === 6 || stage.id === 8) {
        // Lotte World Tower silhouette
        ctx.beginPath();
        ctx.moveTo(baseX + 180, GROUND_Y);
        ctx.lineTo(baseX + 200, GROUND_Y - 420);
        ctx.lineTo(baseX + 210, GROUND_Y - 420);
        ctx.lineTo(baseX + 230, GROUND_Y);
        ctx.fill();
      } else if (stage.id === 4) {
        // 63 Building & Han River bridge
        ctx.fillRect(baseX + 160, GROUND_Y - 320, 60, 320);
      }
    }
    ctx.restore();
  }

  private drawMidground(stage: StageConfig, cameraX: number) {
    const { ctx } = this;
    const parallax = cameraX * 0.45;

    ctx.save();
    const startIdx = Math.floor(parallax / 320);

    const signs = ['명동 식당', '편의점 GS', '메탈 노래방', '서울 약국', 'PC 토피아', '통신 기지', '군 방어본부', '긴급 대피소'];

    for (let i = startIdx - 1; i <= startIdx + 5; i++) {
      const baseX = i * 320 - parallax;
      const height = 240 + ((i * 73) % 120);

      // Building outline & fill
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#0F172A';
      ctx.fillStyle = stage.cityMood === 'night' ? '#090D16' : '#1E293B';
      ctx.fillRect(baseX, GROUND_Y - height, 290, height);
      ctx.strokeRect(baseX, GROUND_Y - height, 290, height);

      // Lit Windows
      const winCols = 4;
      const winRows = Math.floor(height / 45);
      for (let r = 0; r < winRows; r++) {
        for (let c = 0; c < winCols; c++) {
          const isLit = (i * 7 + r * 5 + c * 3) % 3 === 0;
          ctx.fillStyle = isLit ? (stage.cityMood === 'night' ? '#FEF08A' : '#94A3B8') : '#0F172A';
          ctx.fillRect(baseX + 20 + c * 65, GROUND_Y - height + 25 + r * 42, 40, 24);
        }
      }

      // Korean Store Signboard (Comic Style)
      const signText = signs[Math.abs(i) % signs.length];
      const signY = GROUND_Y - height + 15;
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(baseX + 25, signY, 140, 32);
      ctx.strokeRect(baseX + 25, signY, 140, 32);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px "Do Hyeon", "Black Han Sans", sans-serif';
      ctx.fillText(signText, baseX + 35, signY + 22);
    }

    ctx.restore();
  }

  private drawGround(stage: StageConfig, cameraX: number) {
    const { ctx } = this;

    // Asphalt road
    ctx.fillStyle = '#18181B';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    // Bold border edge on road
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    // Sidewalk curb
    ctx.fillStyle = '#3F3F46';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 14);

    // Yellow road markings (scrolling)
    ctx.fillStyle = '#EAB308';
    const markOffset = (cameraX % 140);
    for (let x = -markOffset; x < CANVAS_WIDTH + 140; x += 140) {
      ctx.fillRect(x, GROUND_Y + 45, 75, 10);
    }

    // Street barricades & damaged sandbags
    const barricadeStep = 700;
    const bStart = Math.floor(cameraX / barricadeStep);
    for (let i = bStart - 1; i <= bStart + 2; i++) {
      const bx = i * barricadeStep + 350 - cameraX;
      if (bx > -100 && bx < CANVAS_WIDTH + 100) {
        this.drawBarricade(bx, GROUND_Y);
      }
    }
  }

  private drawBarricade(x: number, y: number) {
    const { ctx } = this;
    ctx.save();
    // Metal barrier
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#111827';
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(x, y - 40, 70, 35);
    ctx.strokeRect(x, y - 40, 70, 35);

    // Diagonal hazard stripes
    ctx.fillStyle = '#18181B';
    ctx.beginPath();
    ctx.moveTo(x + 10, y - 5);
    ctx.lineTo(x + 25, y - 40);
    ctx.lineTo(x + 38, y - 40);
    ctx.lineTo(x + 23, y - 5);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 40, y - 5);
    ctx.lineTo(x + 55, y - 40);
    ctx.lineTo(x + 68, y - 40);
    ctx.lineTo(x + 53, y - 5);
    ctx.fill();

    // Feet
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 8, y - 5);
    ctx.lineTo(x + 8, y);
    ctx.moveTo(x + 62, y - 5);
    ctx.lineTo(x + 62, y);
    ctx.stroke();

    ctx.restore();
  }

  // --- Interactive Entities ---

  private drawCheckpoints(
    checkpoints: { x: number; activated: boolean; name: string }[],
    cameraX: number,
    gameTime: number
  ) {
    const { ctx } = this;
    checkpoints.forEach((cp) => {
      const screenX = cp.x - cameraX;
      if (screenX < -100 || screenX > CANVAS_WIDTH + 100) return;

      ctx.save();
      // Military beacon pole
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000000';
      ctx.fillStyle = '#475569';
      ctx.fillRect(screenX - 8, GROUND_Y - 90, 16, 90);
      ctx.strokeRect(screenX - 8, GROUND_Y - 90, 16, 90);

      // Top beacon light
      const pulse = Math.sin(gameTime * 0.008) * 0.3 + 0.7;
      ctx.fillStyle = cp.activated ? `rgba(59, 130, 246, ${pulse})` : `rgba(239, 68, 68, ${pulse})`;
      ctx.beginPath();
      ctx.arc(screenX, GROUND_Y - 95, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Flag / Sign
      ctx.fillStyle = cp.activated ? '#2563EB' : '#DC2626';
      ctx.fillRect(screenX + 8, GROUND_Y - 85, 90, 28);
      ctx.strokeRect(screenX + 8, GROUND_Y - 85, 90, 28);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(cp.activated ? '안전 거점' : '체크포인트', screenX + 16, GROUND_Y - 67);

      ctx.restore();
    });
  }

  private drawCivilians(civilians: Civilian[], cameraX: number, gameTime: number) {
    const { ctx } = this;
    civilians.forEach((c) => {
      const screenX = c.x - cameraX;
      if (screenX < -100 || screenX > CANVAS_WIDTH + 100) return;

      ctx.save();
      ctx.translate(screenX, GROUND_Y);

      // Comic black contour
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000';

      if (c.state === 'trapped') {
        // Cowering civilian tied up or behind cage
        ctx.fillStyle = '#FEF08A';
        // Head
        ctx.beginPath();
        ctx.arc(0, -45, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Crying / Scared face
        ctx.fillStyle = '#000';
        ctx.fillRect(-5, -48, 3, 5);
        ctx.fillRect(2, -48, 3, 5);

        // Body with ropes
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(-15, -31, 30, 31);
        ctx.strokeRect(-15, -31, 30, 31);

        // Rope coils
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-15, -22);
        ctx.lineTo(15, -22);
        ctx.moveTo(-15, -12);
        ctx.lineTo(15, -12);
        ctx.stroke();

        // Speech bubble: "살려주세요!"
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-40, -82, 80, 24);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-40, -82, 80, 24);
        ctx.fillStyle = '#DC2626';
        ctx.font = 'bold 12px "Do Hyeon", sans-serif';
        ctx.fillText('살려주세요!', -30, -66);
      } else {
        // Saluting / rescued civilian running
        const bob = Math.sin(gameTime * 0.02) * 5;
        // Head
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(0, -45 + bob, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Body
        ctx.fillStyle = '#22C55E';
        ctx.fillRect(-12, -31 + bob, 24, 31);
        ctx.strokeRect(-12, -31 + bob, 24, 31);

        // Saluting Arm
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(12, -25 + bob);
        ctx.lineTo(20, -40 + bob);
        ctx.lineTo(10, -48 + bob);
        ctx.stroke();

        // Speech Bubble: "감사합니다!"
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-45, -85 + bob, 90, 24);
        ctx.lineWidth = 2;
        ctx.strokeRect(-45, -85 + bob, 90, 24);
        ctx.fillStyle = '#15803D';
        ctx.font = 'bold 12px "Do Hyeon", sans-serif';
        ctx.fillText('감사합니다!', -35, -69 + bob);
      }

      ctx.restore();
    });
  }

  private drawSupplyDrops(supplyDrops: SupplyDrop[], cameraX: number, gameTime: number) {
    const { ctx } = this;
    supplyDrops.forEach((drop) => {
      if (drop.collected) return;
      const screenX = drop.x - cameraX;
      if (screenX < -100 || screenX > CANVAS_WIDTH + 100) return;

      ctx.save();
      ctx.translate(screenX, drop.y);

      // Parachute
      if (drop.parachuteOpen && drop.y < drop.groundY - 30) {
        const sway = Math.sin(gameTime * 0.005 + drop.x) * 6;
        ctx.translate(sway, 0);

        // Chute dome
        ctx.fillStyle = drop.type === 'health' ? '#EF4444' : drop.type === 'weapon' ? '#3B82F6' : '#F59E0B';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -50, 42, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Chute cords
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-40, -50);
        ctx.lineTo(0, -10);
        ctx.moveTo(40, -50);
        ctx.lineTo(0, -10);
        ctx.moveTo(0, -50);
        ctx.lineTo(0, -10);
        ctx.stroke();
      }

      // Crate box
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000';
      if (drop.type === 'health') {
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(-18, -18, 36, 36);
        ctx.strokeRect(-18, -18, 36, 36);
        // Medical cross
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-4, -12, 8, 24);
        ctx.fillRect(-12, -4, 24, 8);
      } else if (drop.type === 'weapon') {
        ctx.fillStyle = '#2563EB';
        ctx.fillRect(-18, -18, 36, 36);
        ctx.strokeRect(-18, -18, 36, 36);
        // Weapon symbol
        ctx.fillStyle = '#FEF08A';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('W', -7, 7);
      } else {
        // Bomb crate
        ctx.fillStyle = '#D97706';
        ctx.fillRect(-18, -18, 36, 36);
        ctx.strokeRect(-18, -18, 36, 36);
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  // --- Characters & Enemies ---

  private drawPlayer(
    player: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      facing: -1 | 1;
      characterId: string;
      hp: number;
      maxHp: number;
      isRolling: boolean;
      isShooting: boolean;
      aimUp: boolean;
      invincibleTimer: number;
      currentWeapon: WeaponType;
      animTick: number;
      isDead: boolean;
    },
    cameraX: number,
    gameTime: number
  ) {
    const { ctx } = this;
    const screenX = player.x - cameraX;

    // Flicker if invincible
    if (player.invincibleTimer > 0 && Math.floor(gameTime / 60) % 2 === 0) {
      return;
    }

    const charDef = CHARACTERS[player.characterId as keyof typeof CHARACTERS] || CHARACTERS.junhyuk;

    ctx.save();
    ctx.translate(screenX, player.y);
    ctx.scale(player.facing, 1);

    // Invulnerability shield aura
    if (player.invincibleTimer > 0) {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -35, 42, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (player.isDead) {
      // Death pose
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000';
      ctx.fillStyle = '#64748B';
      ctx.fillRect(-30, -15, 60, 15);
      ctx.strokeRect(-30, -15, 60, 15);
      ctx.restore();
      return;
    }

    if (player.isRolling) {
      // Rolling tumbleweed pose
      const rot = (player.animTick * 0.3) % (Math.PI * 2);
      ctx.rotate(rot);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000';
      ctx.fillStyle = charDef.color;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      return;
    }

    // --- Standing / Running Cel-Shaded Soldier ---
    const runCycle = Math.sin(player.animTick * 0.3);
    const legAngle1 = (player.vx !== 0 ? runCycle * 0.6 : 0);
    const legAngle2 = (player.vx !== 0 ? -runCycle * 0.6 : 0);

    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#000000';

    // Back Leg
    ctx.save();
    ctx.translate(-5, -20);
    ctx.rotate(legAngle2);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-6, 0, 12, 22);
    ctx.strokeRect(-6, 0, 12, 22);
    // Boot
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-6, 18, 16, 8);
    ctx.strokeRect(-6, 18, 16, 8);
    ctx.restore();

    // Front Leg
    ctx.save();
    ctx.translate(5, -20);
    ctx.rotate(legAngle1);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-6, 0, 12, 22);
    ctx.strokeRect(-6, 0, 12, 22);
    // Boot
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-6, 18, 16, 8);
    ctx.strokeRect(-6, 18, 16, 8);
    ctx.restore();

    // Torso / Tactical Vest
    ctx.fillStyle = charDef.color;
    ctx.fillRect(-14, -50, 28, 32);
    ctx.strokeRect(-14, -50, 28, 32);

    // Armor plate details
    ctx.fillStyle = charDef.secondaryColor;
    ctx.fillRect(-10, -44, 20, 12);
    ctx.strokeRect(-10, -44, 20, 12);

    // Head / Helmet
    ctx.fillStyle = '#FDE047'; // Skin
    ctx.beginPath();
    ctx.arc(0, -62, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Character specific head gear
    if (player.characterId === 'junhyuk') {
      // Tactical Army Helmet + Visor
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(0, -68, 15, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
    } else if (player.characterId === 'seoa') {
      // Green Beret + Sniper eyepatch
      ctx.fillStyle = '#047857';
      ctx.fillRect(-12, -76, 26, 10);
      ctx.strokeRect(-12, -76, 26, 10);
      ctx.fillStyle = '#06B6D4';
      ctx.fillRect(4, -64, 5, 5); // Cyber optic
    } else if (player.characterId === 'jiwoo') {
      // Medic headset + White Cap
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(-12, -76, 24, 10);
      ctx.strokeRect(-12, -76, 24, 10);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(-3, -74, 6, 6);
    } else {
      // Harin: Heavy exo visor
      ctx.fillStyle = '#78350F';
      ctx.fillRect(-12, -76, 26, 12);
      ctx.strokeRect(-12, -76, 26, 12);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(2, -64, 8, 4);
    }

    // Arm and Weapon
    ctx.save();
    ctx.translate(6, -40);
    const weaponAimAngle = player.aimUp ? -Math.PI / 4 : 0;
    ctx.rotate(weaponAimAngle);

    // Gun sprite
    this.drawEquippedGun(player.currentWeapon);

    // Muzzle flash when shooting
    if (player.isShooting) {
      ctx.fillStyle = '#FDE047';
      ctx.strokeStyle = '#EA580C';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(38, -3);
      ctx.lineTo(55, -9);
      ctx.lineTo(48, -3);
      ctx.lineTo(58, 0);
      ctx.lineTo(48, 3);
      ctx.lineTo(55, 9);
      ctx.lineTo(38, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
  }

  private drawEquippedGun(weaponType: WeaponType) {
    const { ctx } = this;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#000';

    if (weaponType === 'pistol') {
      ctx.fillStyle = '#475569';
      ctx.fillRect(6, -5, 20, 8);
      ctx.strokeRect(6, -5, 20, 8);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(4, -1, 6, 10);
    } else if (weaponType === 'machinegun') {
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, -6, 32, 10);
      ctx.strokeRect(4, -6, 32, 10);
      // Ammo box drum
      ctx.fillStyle = '#15803D';
      ctx.fillRect(10, 4, 12, 12);
      ctx.strokeRect(10, 4, 12, 12);
    } else if (weaponType === 'shotgun') {
      ctx.fillStyle = '#7F1D1D';
      ctx.fillRect(4, -5, 30, 9);
      ctx.strokeRect(4, -5, 30, 9);
      // Pump
      ctx.fillStyle = '#D97706';
      ctx.fillRect(16, 4, 10, 5);
      ctx.strokeRect(16, 4, 10, 5);
    } else if (weaponType === 'flamethrower') {
      ctx.fillStyle = '#C2410C';
      ctx.fillRect(4, -7, 34, 12);
      ctx.strokeRect(4, -7, 34, 12);
      // Pilot flame nozzle
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(38, -1, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Laser Gun
      ctx.fillStyle = '#0891B2';
      ctx.fillRect(4, -6, 34, 11);
      ctx.strokeRect(4, -6, 34, 11);
      // Neon core
      ctx.fillStyle = '#22D3EE';
      ctx.fillRect(12, -3, 14, 5);
    }
  }

  private drawEnemies(enemies: Enemy[], cameraX: number, gameTime: number) {
    const { ctx } = this;

    enemies.forEach((enemy) => {
      const screenX = enemy.x - cameraX;
      if (screenX < -200 || screenX > CANVAS_WIDTH + 200) return;

      ctx.save();
      ctx.translate(screenX, enemy.y);
      ctx.scale(enemy.facing, 1);

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000000';

      if (enemy.isBoss) {
        this.drawBoss(enemy, gameTime);
      } else {
        this.drawRegularEnemy(enemy, gameTime);
      }

      ctx.restore();

      // Enemy HP bar (above enemy)
      if (enemy.hp < enemy.maxHp && !enemy.isBoss) {
        ctx.save();
        const barW = enemy.width;
        const barH = 5;
        const barX = screenX - barW / 2;
        const barY = enemy.y - enemy.height - 10;
        ctx.fillStyle = '#450A0A';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(barX, barY, barW * (enemy.hp / enemy.maxHp), barH);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
        ctx.restore();
      }
    });
  }

  private drawRegularEnemy(enemy: Enemy, gameTime: number) {
    const { ctx } = this;
    const walkBob = Math.sin(gameTime * 0.015 + enemy.x) * 4;

    if (enemy.type === 'shield_cop') {
      // Riot police zombie with heavy shield
      ctx.fillStyle = '#1E3A8A';
      ctx.fillRect(-15, -enemy.height + 15, 30, enemy.height - 15);
      ctx.strokeRect(-15, -enemy.height + 15, 30, enemy.height - 15);

      // Head / Police Helmet
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(0, -enemy.height + 12, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Massive Riot Shield in front
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(10, -enemy.height, 12, enemy.height);
      ctx.strokeRect(10, -enemy.height, 12, enemy.height);
      // Shield logo
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('POLICE', 11, -enemy.height / 2);
    } else if (enemy.type === 'winged_infector') {
      // Aerial gargoyle zombie
      const flap = Math.sin(gameTime * 0.02) * 15;
      // Wings
      ctx.fillStyle = '#581C87';
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(-40, -45 + flap);
      ctx.lineTo(-20, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(40, -45 + flap);
      ctx.lineTo(20, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Body
      ctx.fillStyle = '#7E22CE';
      ctx.fillRect(-12, -35, 24, 35);
      ctx.strokeRect(-12, -35, 24, 35);
      // Red eyes
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(2, -30, 4, 4);
    } else if (enemy.type === 'alien_shocktrooper') {
      // Sleek alien soldier
      ctx.fillStyle = '#0D9488';
      ctx.fillRect(-14, -enemy.height + 15, 28, enemy.height - 15);
      ctx.strokeRect(-14, -enemy.height + 15, 28, enemy.height - 15);

      // Alien Helmet / Visor
      ctx.fillStyle = '#14B8A6';
      ctx.beginPath();
      ctx.ellipse(0, -enemy.height + 10, 14, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Neon Alien Rifle
      ctx.fillStyle = '#042F2E';
      ctx.fillRect(8, -enemy.height / 2, 26, 8);
      ctx.strokeRect(8, -enemy.height / 2, 26, 8);
      ctx.fillStyle = '#2DD4BF';
      ctx.fillRect(24, -enemy.height / 2 + 2, 8, 4);
    } else if (enemy.type === 'bomber') {
      // Pulsating suicide bomber
      const pulseColor = Math.floor(gameTime / 120) % 2 === 0 ? '#EF4444' : '#F97316';
      ctx.fillStyle = pulseColor;
      ctx.beginPath();
      ctx.arc(0, -enemy.height / 2, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Standard Shambler / Runner / Crawler
      ctx.fillStyle = enemy.type === 'runner' ? '#B91C1C' : '#15803D';
      ctx.fillRect(-12, -enemy.height + 15 + walkBob, 24, enemy.height - 15);
      ctx.strokeRect(-12, -enemy.height + 15 + walkBob, 24, enemy.height - 15);

      // Zombie Head
      ctx.fillStyle = '#84CC16';
      ctx.beginPath();
      ctx.arc(0, -enemy.height + 10 + walkBob, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rotting clothes / Eyes
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(3, -enemy.height + 7 + walkBob, 4, 4);

      // Outstretched arms
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(8, -enemy.height + 25 + walkBob);
      ctx.lineTo(24, -enemy.height + 22 + walkBob);
      ctx.stroke();
    }
  }

  private drawBoss(enemy: Enemy, gameTime: number) {
    const { ctx } = this;
    const isEnraged = (enemy.bossPhase || 1) >= 2;

    // Enraged red comic aura
    if (isEnraged) {
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + Math.sin(gameTime * 0.01) * 0.3})`;
      ctx.lineWidth = 6;
      ctx.strokeRect(-enemy.width / 2 - 8, -enemy.height - 8, enemy.width + 16, enemy.height + 16);
    }

    // Huge Boss Body
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';

    if (enemy.bossName?.includes('제노스')) {
      // Final Boss: Supreme Overlord Xenos
      ctx.fillStyle = '#2E1065';
      ctx.fillRect(-enemy.width / 2, -enemy.height, enemy.width, enemy.height);
      ctx.strokeRect(-enemy.width / 2, -enemy.height, enemy.width, enemy.height);

      // Energy core
      ctx.fillStyle = '#A855F7';
      ctx.beginPath();
      ctx.arc(0, -enemy.height / 2, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Overlord Crown & Eyes
      ctx.fillStyle = '#F43F5E';
      ctx.fillRect(-20, -enemy.height + 15, 12, 8);
      ctx.fillRect(8, -enemy.height + 15, 12, 8);
    } else if (enemy.bossName?.includes('비행')) {
      // Stage 4: Colossal Winged Dread
      const flap = Math.sin(gameTime * 0.015) * 25;
      ctx.fillStyle = '#4C1D95';
      ctx.fillRect(-30, -enemy.height, 60, enemy.height);
      ctx.strokeRect(-30, -enemy.height, 60, enemy.height);

      // Massive Wings
      ctx.fillStyle = '#7C3AED';
      ctx.beginPath();
      ctx.moveTo(0, -enemy.height / 2);
      ctx.lineTo(-enemy.width / 2 - 30, -enemy.height - flap);
      ctx.lineTo(-enemy.width / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -enemy.height / 2);
      ctx.lineTo(enemy.width / 2 + 30, -enemy.height - flap);
      ctx.lineTo(enemy.width / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Heavy Mecha / Golem Boss
      ctx.fillStyle = isEnraged ? '#991B1B' : '#334155';
      ctx.fillRect(-enemy.width / 2, -enemy.height, enemy.width, enemy.height);
      ctx.strokeRect(-enemy.width / 2, -enemy.height, enemy.width, enemy.height);

      // Armor plating & glowing eyes
      ctx.fillStyle = isEnraged ? '#FBBF24' : '#EF4444';
      ctx.fillRect(-15, -enemy.height + 25, 30, 10);
      ctx.strokeRect(-15, -enemy.height + 25, 30, 10);

      // Cannon arm
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(enemy.width / 2 - 10, -enemy.height * 0.7, 45, 24);
      ctx.strokeRect(enemy.width / 2 - 10, -enemy.height * 0.7, 45, 24);
    }
  }

  // --- Projectiles, Particles, Comic Texts ---

  private drawProjectiles(projectiles: Projectile[], cameraX: number) {
    const { ctx } = this;
    projectiles.forEach((p) => {
      const screenX = p.x - cameraX;
      if (screenX < -50 || screenX > CANVAS_WIDTH + 50) return;

      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000';

      if (p.isBomb) {
        // Grenade rolling / flying
        ctx.fillStyle = '#15803D';
        ctx.beginPath();
        ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Fuse spark
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(screenX - 2, p.y - p.size - 4, 4, 4);
      } else if (p.weaponType === 'laser' || p.isAlien) {
        // Glowing laser beam
        ctx.fillStyle = p.color;
        ctx.fillRect(screenX - 18, p.y - 4, 36, 8);
        ctx.strokeRect(screenX - 18, p.y - 4, 36, 8);
      } else if (p.weaponType === 'flamethrower') {
        // Fire burst
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Bullet tracer
        ctx.fillStyle = p.color;
        ctx.fillRect(screenX - 8, p.y - 2, 16, 4);
        ctx.strokeRect(screenX - 8, p.y - 2, 16, 4);
      }

      ctx.restore();
    });
  }

  private drawParticles(particles: Particle[], cameraX: number) {
    const { ctx } = this;
    particles.forEach((p) => {
      const screenX = p.x - cameraX;
      if (screenX < -50 || screenX > CANVAS_WIDTH + 50) return;

      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = p.color;

      if (p.type === 'casing') {
        ctx.fillRect(screenX, p.y, 6, 3);
      } else {
        ctx.beginPath();
        ctx.arc(screenX, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  private drawFloatingTexts(floatingTexts: FloatingText[], cameraX: number) {
    const { ctx } = this;
    floatingTexts.forEach((ft) => {
      const screenX = ft.x - cameraX;
      if (screenX < -100 || screenX > CANVAS_WIDTH + 100) return;

      const progress = 1 - ft.life / ft.maxLife;
      const offsetY = progress * 35;
      const scale = ft.isCritical ? 1.3 : 1.0;

      ctx.save();
      ctx.translate(screenX, ft.y - offsetY);
      ctx.scale(scale, scale);

      // Comic font with thick black outline
      ctx.font = `900 ${ft.fontSize}px "Outfit", "Black Han Sans", sans-serif`;
      ctx.textAlign = 'center';

      ctx.strokeStyle = ft.borderColor || '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, 0, 0);

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);

      ctx.restore();
    });
  }
}
