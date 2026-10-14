class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;

  private isMuted: boolean = false;
  private masterVolume: number = 0.8;
  private sfxVolume: number = 0.8;
  private bgmVolume: number = 0.5;

  private currentBgmTrack: string | null = null;
  private bgmTimer: number | null = null;
  private bgmStep: number = 0;
  private bgmNodes: AudioNode[] = [];

  constructor() {
    // Lazy init on first user gesture
  }

  private initAudio() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.bgmVolume;
      this.bgmGain.connect(this.masterGain);
    } catch {
      // AudioContext unavailable
    }
  }

  public ensureContext() {
    this.initAudio();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }

  public setBgmVolume(vol: number) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    if (this.bgmGain) {
      this.bgmGain.gain.value = this.bgmVolume;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
    }
    return this.isMuted;
  }

  public getSettings() {
    return {
      masterVolume: this.masterVolume,
      sfxVolume: this.sfxVolume,
      bgmVolume: this.bgmVolume,
      isMuted: this.isMuted,
    };
  }

  // --- Sound Effects ---

  public playMenuClick() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  public playPistol() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Fast frequency drop + noise crack
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(now + 0.13);

    this.playNoise(0.08, 0.4, 2000);
  }

  public playMachineGun() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(550, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.09);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(now + 0.1);

    this.playNoise(0.06, 0.35, 3000);
  }

  public playShotgun() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Low punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.28);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(now + 0.3);

    // Heavy noisy blast
    this.playNoise(0.24, 0.7, 1200);
  }

  public playFlame() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    this.playNoise(0.15, 0.25, 800, 'bandpass');
  }

  public playLaser() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.18);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(now + 0.19);
  }

  public playExplosion() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Sub rumble
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(120, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.6);

    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start();
    subOsc.stop(now + 0.62);

    this.playNoise(0.55, 0.75, 900);
  }

  public playZombieHit() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(now + 0.09);
  }

  public playZombieDeath() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(now + 0.24);

    this.playNoise(0.18, 0.4, 1100);
  }

  public playPlayerHit() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(now + 0.2);
  }

  public playPickup() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.08); // A5
    osc.frequency.setValueAtTime(1174.66, now + 0.16); // D6

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.setValueAtTime(0.4, now + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(now + 0.33);
  }

  public playParachuteDrop() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Siren blip
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.linearRampToValueAtTime(1100, now + 0.25);
    osc.frequency.linearRampToValueAtTime(750, now + 0.5);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(now + 0.56);
  }

  public playBossRoar() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(40, now + 1.2);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(now + 1.25);

    this.playNoise(0.9, 0.5, 600);
  }

  public playBossDeath() {
    this.ensureContext();
    if (!this.ctx) return;
    this.playExplosion();
    setTimeout(() => this.playExplosion(), 250);
    setTimeout(() => this.playExplosion(), 500);
    setTimeout(() => this.playExplosion(), 850);
  }

  public playCivilianRescued() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Triumphant fanfare
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.35, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.21);
    });
  }

  private playNoise(duration: number, volume: number, filterFreq: number = 1000, filterType: BiquadFilterType = 'lowpass') {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  // --- Background Synthesizer Music Engine ---

  public playBGM(trackName: 'title' | 'day_action' | 'night_cyber' | 'mothership_boss' | 'ending') {
    this.ensureContext();
    if (this.currentBgmTrack === trackName) return;
    this.stopBGM();
    this.currentBgmTrack = trackName;
    this.bgmStep = 0;

    let bpm = 124;
    if (trackName === 'day_action') bpm = 132;
    if (trackName === 'night_cyber') bpm = 138;
    if (trackName === 'mothership_boss') bpm = 145;
    if (trackName === 'ending') bpm = 90;

    const stepInterval = (60 / bpm) / 4 * 1000; // 16th notes

    this.bgmTimer = window.setInterval(() => {
      this.tickBGM(trackName);
    }, stepInterval);
  }

  public stopBGM() {
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.currentBgmTrack = null;
  }

  private tickBGM(track: string) {
    if (!this.ctx || !this.bgmGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const step = this.bgmStep % 32;
    this.bgmStep++;

    // Procedural musical patterns based on track
    if (track === 'title') {
      // Gritty tactical beat
      if (step % 8 === 0) this.playBgmBass(110, 0.35, 0.2); // A2
      if (step % 8 === 4) this.playBgmBass(98, 0.35, 0.2); // G2
      if (step % 4 === 2) this.playBgmSnare();
      if (step % 2 === 0) this.playBgmHihat();
      if (step === 0 || step === 16) this.playBgmLead(440, 0.25, 0.4);
      if (step === 8 || step === 24) this.playBgmLead(523.25, 0.25, 0.4);
    } else if (track === 'day_action') {
      // High-energy 132bpm run-and-gun synth
      const bassNotes = [130.81, 146.83, 164.81, 130.81]; // C3, D3, E3, C3
      const currentNote = bassNotes[Math.floor(step / 8) % bassNotes.length];
      if (step % 4 === 0 || step % 4 === 3) this.playBgmBass(currentNote, 0.3, 0.15);
      if (step % 4 === 2) this.playBgmSnare();
      if (step % 2 === 0) this.playBgmHihat();
      // Arpeggios
      const arp = [523.25, 659.25, 783.99, 1046.5];
      this.playBgmLead(arp[step % 4], 0.12, 0.08);
    } else if (track === 'night_cyber') {
      // Cyberpunk 138bpm pulsing bass
      const root = step < 16 ? 110 : 87.31; // A2 to F2
      if (step % 2 === 0) this.playBgmBass(root, 0.35, 0.12);
      if (step % 8 === 4) this.playBgmSnare();
      if (step % 4 === 2) this.playBgmHihat();
      if (step % 8 === 0) this.playBgmLead(root * 4, 0.18, 0.25);
    } else if (track === 'mothership_boss') {
      // Apocalyptic 145bpm boss fight
      const root = 73.42; // D2
      if (step % 4 === 0) this.playBgmBass(root, 0.45, 0.18);
      if (step % 4 === 2) this.playBgmSnare();
      this.playBgmHihat();
      if (step % 4 === 1 || step % 4 === 3) {
        this.playBgmLead(step % 2 === 0 ? 587.33 : 622.25, 0.2, 0.1);
      }
    } else if (track === 'ending') {
      // Hopeful sunrise anthem
      const chords = [261.63, 329.63, 392.0, 523.25]; // C major
      if (step % 8 === 0) {
        this.playBgmBass(130.81, 0.25, 0.6);
        this.playBgmLead(chords[Math.floor(step / 8) % 4] * 2, 0.25, 0.5);
      }
      if (step % 4 === 0) this.playBgmHihat();
    }
  }

  private playBgmBass(freq: number, vol: number, dur: number) {
    if (!this.ctx || !this.bgmGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    osc.start();
    osc.stop(now + dur + 0.05);
  }

  private playBgmLead(freq: number, vol: number, dur: number) {
    if (!this.ctx || !this.bgmGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start();
    osc.stop(now + dur + 0.05);
  }

  private playBgmSnare() {
    if (!this.ctx || !this.bgmGain) return;
    this.playNoise(0.1, 0.2, 1800);
  }

  private playBgmHihat() {
    if (!this.ctx || !this.bgmGain) return;
    this.playNoise(0.04, 0.08, 6000, 'highpass');
  }
}

export const audioService = new AudioService();
