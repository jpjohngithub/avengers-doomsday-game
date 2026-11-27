// ============================================================================
// AVENGERS: DOOMSDAY — DYNAMIC HEROIC WEBAUDIO SYNTHESIZER & COMBAT SFX
// ============================================================================

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
    this.masterGain.gain.setValueAtTime(0.38, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.20, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.50, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.startHeroicScoreBGM();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.38, this.ctx.currentTime, 0.04);
    }
    return this.isMuted;
  }

  createNoiseBuffer(durationSec = 0.25) {
    const bufferSize = Math.floor(this.ctx.sampleRate * durationSec);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.32));
    }
    return buffer;
  }

  playUIHover() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.045);
    g.gain.setValueAtTime(0.05, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  playUISelect() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    [330, 495, 660].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.035);
      g.gain.setValueAtTime(0.09, now + i * 0.035);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.035 + 0.16);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + i * 0.035);
      osc.stop(now + i * 0.035 + 0.17);
    });
  }

  playJump() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.14);
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playDash() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.18);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.14);
    filter.Q.setValueAtTime(2.5, now);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.28, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    noise.start(now);
  }

  playHitConfirm(isHeavy = false) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const sg = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isHeavy ? 210 : 285, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + (isHeavy ? 0.21 : 0.12));
    sub.type = 'sine';
    sub.frequency.setValueAtTime(isHeavy ? 115 : 140, now);
    sub.frequency.exponentialRampToValueAtTime(36, now + (isHeavy ? 0.22 : 0.12));
    g.gain.setValueAtTime(isHeavy ? 0.34 : 0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.22 : 0.13));
    sg.gain.setValueAtTime(isHeavy ? 0.28 : 0.16, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.24 : 0.13));
    osc.connect(g); sub.connect(sg);
    g.connect(this.sfxGain); sg.connect(this.sfxGain);
    osc.start(now); sub.start(now);
    osc.stop(now + 0.25); sub.stop(now + 0.25);
  }

  playAttack(type) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    if (type === 'web') {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.14);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1650, now);
      filter.frequency.exponentialRampToValueAtTime(700, now + 0.12);
      filter.Q.setValueAtTime(4.5, now);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.30, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      noise.connect(filter);
      filter.connect(g);
      g.connect(this.sfxGain);
      noise.start(now);
    } else if (type === 'lightning') {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(185, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.26);
      g.gain.setValueAtTime(0.34, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.29);
    } else if (type === 'elastic') {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(135, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, now);
      g.gain.setValueAtTime(0.28, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
      osc.connect(filter);
      filter.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.24);
    } else if (type === 'magic') {
      [523.25, 659.25, 783.99].forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.02);
        g.gain.setValueAtTime(0.075, now + idx * 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(now + idx * 0.02);
        osc.stop(now + 0.26);
      });
    } else if (type === 'repulsor') {
      const osc = this.ctx.createOscillator();
      const mod = this.ctx.createOscillator();
      const modG = this.ctx.createGain();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.16);
      mod.frequency.setValueAtTime(140, now);
      modG.gain.setValueAtTime(180, now);
      mod.connect(modG); modG.connect(osc.frequency);
      g.gain.setValueAtTime(0.18, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(now); mod.start(now);
      osc.stop(now + 0.18); mod.stop(now + 0.18);
    } else if (type === 'shield') {
      [440, 880, 1320].forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 0.85, now + 0.22);
        g.gain.setValueAtTime(0.12 / (idx + 1), now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
        osc.connect(g); g.connect(this.sfxGain);
        osc.start(now); osc.stop(now + 0.24);
      });
    } else if (type === 'adamantium') {
      [0, 0.045].forEach(offset => {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.09);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2100, now + offset);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.24, now + offset);
        g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);
        noise.connect(filter); filter.connect(g); g.connect(this.sfxGain);
        noise.start(now + offset);
      });
    } else if (type === 'chaos') {
      [392.0, 466.16, 622.25].forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.015);
        osc.frequency.exponentialRampToValueAtTime(f * 0.65, now + 0.25);
        g.gain.setValueAtTime(0.09, now + idx * 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
        osc.connect(g); g.connect(this.sfxGain);
        osc.start(now + idx * 0.015); osc.stop(now + 0.27);
      });
    } else {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.12);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(420, now + 0.11);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.26, now);
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
    [130, 195].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 2.1, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.48, now + 0.44);
      g.gain.setValueAtTime(idx === 0 ? 0.26 : 0.14, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.46);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.48);
    });
  }

  playUltimate() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const sub = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(92, now);
    sub.frequency.exponentialRampToValueAtTime(34, now + 0.85);
    sg.gain.setValueAtTime(0.32, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.88);
    sub.connect(sg); sg.connect(this.sfxGain);
    sub.start(now); sub.stop(now + 0.9);
    [110, 164.81, 220, 329.63].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = i % 2 === 0 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.92);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(820, now);
      g.gain.setValueAtTime(0.14, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.96);
      osc.connect(filter);
      filter.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.98);
    });
  }

  playDoomBeam() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(105, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.4);
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  playDoomLaugh() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    [65.41, 98.0, 130.81].forEach(freq => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, now);
      g.gain.setValueAtTime(0.16, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
      osc.connect(filter);
      filter.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 1.0);
    });
  }

  playExplosion() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.45);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, now);
    filter.frequency.exponentialRampToValueAtTime(45, now + 0.42);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.36, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    noise.start(now);
  }

  playWebSwing() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.24);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1900, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + 0.22);
    filter.Q.setValueAtTime(5.0, now);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.32, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    noise.start(now);
  }

  playFlightWhoosh() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.22);
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  playCapeThrow() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.28);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750, now);
    filter.frequency.exponentialRampToValueAtTime(1850, now + 0.22);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.30, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.27);
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    noise.start(now);
  }

  playPerfectDodge() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const sub = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(160, now);
    sub.frequency.exponentialRampToValueAtTime(42, now + 0.35);
    sg.gain.setValueAtTime(0.38, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    sub.connect(sg);
    sg.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.39);

    [880, 1318.5].forEach((freq, idx) => {
      const bell = this.ctx.createOscillator();
      const bg = this.ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(freq, now + idx * 0.03);
      bg.gain.setValueAtTime(0.14, now + idx * 0.03);
      bg.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      bell.connect(bg);
      bg.connect(this.sfxGain);
      bell.start(now + idx * 0.03);
      bell.stop(now + 0.46);
    });
  }

  playStaggerBreak() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    [55, 82.41, 110].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq * 1.4, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.7);
      g.gain.setValueAtTime(0.26, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.78);
    });
  }

  playHealFlask() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    [440, 554.37, 659.25].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      g.gain.setValueAtTime(0.12, now + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + i * 0.05);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + i * 0.05);
      osc.stop(now + 0.42 + i * 0.05);
    });
  }

  playPhaseTransition() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    [73.42, 110, 146.83].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(340, now);
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.16, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
      osc.connect(filter);
      filter.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 1.3);
    });
  }

  // Heroic Avengers-inspired Warm Orchestral Pad + Rhythmic Pulse in Boss Phase
  startHeroicScoreBGM() {
    if (this.bgmInterval) clearInterval(this.bgmInterval);
    const chords = [
      [110.0, 164.81], // A2 + E3 (Heroic fifth)
      [130.81, 196.0], // C3 + G3
      [146.83, 220.0], // D3 + A3
      [123.47, 185.0]  // B2 + F#3
    ];
    let idx = 0;

    const step = () => {
      if (!this.ctx || this.isMuted || this.bgmMuted) return;
      const now = this.ctx.currentTime;
      const pair = chords[idx % chords.length];
      idx++;

      pair.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const g = this.ctx.createGain();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(this.bossMode ? freq * 0.75 : freq * 0.5, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, now);

        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(this.bossMode ? 0.11 : 0.065, now + 1.2);
        g.gain.linearRampToValueAtTime(0.001, now + 3.7);

        osc.connect(filter);
        filter.connect(g);
        g.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 3.85);
      });
    };

    step();
    this.bgmInterval = setInterval(step, 3800);
  }

  setBossMode(active) {
    this.bossMode = active;
  }
}

window.soundSystem = new SoundSystem();