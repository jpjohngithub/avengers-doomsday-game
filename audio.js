// Clean, Warm Cinematic Audio System (Zero Buzzing, Soft Filtered Sound Effects & Mute Control)
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmMuted = false;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.bgmInterval = null;
    this.bossMode = false;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.startWarmAmbientBGM();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  createNoiseBuffer(durationSec = 0.25) {
    const bufferSize = Math.floor(this.ctx.sampleRate * durationSec);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    return buffer;
  }

  playUIHover() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.04);
    g.gain.setValueAtTime(0.04, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playUISelect() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Distinct, Clean Hero Attack Sounds (No Harsh Sawtooth Buzz)
  playAttack(type) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    if (type === 'web') {
      // Spider-Man: Crisp compressed air "Thwip" + physical punch thud
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.14);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(650, now + 0.12);
      filter.Q.setValueAtTime(4, now);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.28, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      noise.connect(filter);
      filter.connect(g);
      g.connect(this.sfxGain);
      noise.start(now);

    } else if (type === 'lightning') {
      // Thor: Heavy hammer whoosh + low thunderous thump
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);
      g.gain.setValueAtTime(0.32, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.29);

    } else if (type === 'elastic') {
      // Reed Richards (Senhor Fantástico): Deep elastic whip snap
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(290, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(85, now + 0.22);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      g.gain.setValueAtTime(0.25, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
      osc.connect(filter);
      filter.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.24);

    } else if (type === 'magic') {
      // Doctor Strange: Warm resonant chime chord
      [261.6, 329.6, 392.0].forEach(freq => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(0.06, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.26);
      });

    } else {
      // Black Panther: Clean metallic claw swipe + low kinetic bass
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.12);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.22, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      noise.connect(filter);
      filter.connect(g);
      g.connect(this.sfxGain);
      noise.start(now);
    }
  }

  playSpecial() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.38);
    g.gain.setValueAtTime(0.24, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  playUltimate() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.9);
    g.gain.setValueAtTime(0.38, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.0);
  }

  playDoomBeam() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.4);
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  playDoomLaugh() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Deep cinematic brass impact instead of harsh synth
    [65.41, 98.0].forEach(freq => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(240, now);
      g.gain.setValueAtTime(0.18, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.connect(filter);
      filter.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.95);
    });
  }

  playExplosion() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.45);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.exponentialRampToValueAtTime(45, now + 0.42);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    noise.start(now);
  }

  // Soft Warm Orchestral Sub-Pad (Zero High-Frequency Buzz)
  startWarmAmbientBGM() {
    if (this.bgmInterval) clearInterval(this.bgmInterval);
    const notes = [55.0, 65.41, 73.42, 61.74]; // Deep A1, C2, D2, B1
    let idx = 0;

    const step = () => {
      if (!this.ctx || this.isMuted || this.bgmMuted) return;
      const now = this.ctx.currentTime;
      const rootFreq = notes[idx % notes.length];
      idx++;

      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(rootFreq, now);

      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(this.bossMode ? 0.14 : 0.08, now + 1.4);
      g.gain.linearRampToValueAtTime(0.001, now + 3.8);

      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 3.9);
    };

    step();
    this.bgmInterval = setInterval(step, 4000);
  }

  setBossMode(active) {
    this.bossMode = active;
  }
}

window.soundSystem = new SoundSystem();
