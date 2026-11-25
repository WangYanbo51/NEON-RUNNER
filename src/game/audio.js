// 纯 WebAudio 合成音效，不依赖任何音频素材文件
export class Sfx {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  /** 必须在用户手势里调用一次，浏览器才允许出声 */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  tone({ freq = 440, to = null, dur = 0.12, type = 'square', vol = 0.06, delay = 0 }) {
    if (!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, freq), t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  coin() {
    this.tone({ freq: 1180, dur: 0.055, type: 'square', vol: 0.035 });
    this.tone({ freq: 1760, dur: 0.09, type: 'square', vol: 0.03, delay: 0.045 });
  }

  jump() {
    this.tone({ freq: 300, to: 720, dur: 0.2, type: 'triangle', vol: 0.05 });
  }

  slide() {
    this.tone({ freq: 520, to: 120, dur: 0.24, type: 'sawtooth', vol: 0.035 });
  }

  lane() {
    this.tone({ freq: 760, to: 1060, dur: 0.07, type: 'triangle', vol: 0.028 });
  }

  crash() {
    this.tone({ freq: 200, to: 42, dur: 0.55, type: 'sawtooth', vol: 0.09 });
    this.tone({ freq: 90, to: 38, dur: 0.7, type: 'square', vol: 0.05, delay: 0.04 });
  }

  start() {
    this.tone({ freq: 420, dur: 0.09, type: 'square', vol: 0.045 });
    this.tone({ freq: 630, dur: 0.09, type: 'square', vol: 0.045, delay: 0.09 });
    this.tone({ freq: 940, dur: 0.16, type: 'square', vol: 0.045, delay: 0.18 });
  }
}
