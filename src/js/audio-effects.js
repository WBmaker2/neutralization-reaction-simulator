/**
 * Web Audio API pure oscillator sound engine
 * Zero-dependency procedural synthesis for chemical lab interactions.
 */

export class SoundEngine {
  /**
   * @param {AudioContext|null} [audioContext=null] Optional mock or existing AudioContext
   */
  constructor(audioContext = null) {
    this.ctx = audioContext;
    this.muted = false;
  }

  /**
   * Lazily initializes and returns the AudioContext instance.
   * Handles autoplay policy suspension by attempting resume().
   * @returns {AudioContext|null}
   */
  getAudioContext() {
    if (!this.ctx) {
      try {
        if (typeof window !== 'undefined') {
          const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
          if (AudioCtxClass) {
            this.ctx = new AudioCtxClass();
          }
        } else if (typeof AudioContext !== 'undefined') {
          this.ctx = new AudioContext();
        }
      } catch (_) {
        return null;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx || null;
  }

  /**
   * @param {boolean} muted
   */
  setMuted(muted) {
    this.muted = Boolean(muted);
  }

  /**
   * @returns {boolean}
   */
  isMuted() {
    return this.muted;
  }

  /**
   * Toggles mute state and returns the new value.
   * @returns {boolean}
   */
  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /**
   * Helper to set up clean oscillator -> gain -> destination node chain
   * with automatic disconnection on end.
   * @private
   */
  _createVoice(ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (_) {}
    };

    return { osc, gain };
  }

  /**
   * 물방울 똑 떨어지는 소리 (sine wave frequency ramp 800Hz -> 300Hz, quick decay)
   */
  playDrop() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.12;
      const { osc, gain } = this._createVoice(ctx);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + duration);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    } catch (_) {}
  }

  /**
   * 중화 반응 결합 에너지 지직/반짝 소리 (short triangle/saw sweep with fast exponential gain drop)
   */
  playReact() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.14;
      const { osc, gain } = this._createVoice(ctx);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + duration * 0.6);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    } catch (_) {}
  }

  /**
   * 중화점 달성 팡파레 (4 arpeggio tones: C5, E5, G5, C6)
   */
  playEquivalenceFanfare() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [
        { freq: 523.25, timeOffset: 0.0, dur: 0.28 }, // C5
        { freq: 659.25, timeOffset: 0.09, dur: 0.28 }, // E5
        { freq: 783.99, timeOffset: 0.18, dur: 0.32 }, // G5
        { freq: 1046.50, timeOffset: 0.27, dur: 0.65 } // C6
      ];

      const now = ctx.currentTime;

      notes.forEach(({ freq, timeOffset, dur }) => {
        const start = now + timeOffset;
        const { osc, gain } = this._createVoice(ctx);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.22, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.start(start);
        osc.stop(start + dur);
      });
    } catch (_) {}
  }

  /**
   * 퀴즈 정답 딩동댕 (G4: 392Hz, C5: 523Hz, E5: 659Hz)
   */
  playCorrect() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [
        { freq: 392.00, timeOffset: 0.0, dur: 0.22 }, // G4
        { freq: 523.25, timeOffset: 0.12, dur: 0.25 }, // C5
        { freq: 659.25, timeOffset: 0.24, dur: 0.50 }  // E5
      ];

      const now = ctx.currentTime;

      notes.forEach(({ freq, timeOffset, dur }) => {
        const start = now + timeOffset;
        const { osc, gain } = this._createVoice(ctx);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.start(start);
        osc.stop(start + dur);
      });
    } catch (_) {}
  }

  /**
   * 퀴즈 오답 땡 (low sawtooth: 130Hz with vibrato/decay)
   */
  playIncorrect() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.38;
      const { osc, gain } = this._createVoice(ctx);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + duration);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    } catch (_) {}
  }
}
