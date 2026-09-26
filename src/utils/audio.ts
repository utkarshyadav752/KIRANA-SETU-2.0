// Synthetic scanner sound feedback using Web Audio API (zero external dependency)

class SoundManager {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // High-pitched quick retail barcode scanner beep (880Hz -> 1760Hz)
  playScanBeep() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // A6 note
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);

      // Haptic vibration
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(40);
      }
    } catch {
      // Audio playback might be restricted before first user interaction
    }
  }

  // Pleasant double chime on successful checkout or reservation
  playSuccessChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.15, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.2);
      });

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([40, 50, 60]);
      }
    } catch {}
  }

  // Warning or discrepancy sound
  playWarningBuzz() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch {}
  }

  // Cash drawer bell sound (sharp register ding)
  playCashChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1318.5, ctx.currentTime); // E6
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }

  // Coin clink sound
  playCoinSound() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(2637, ctx.currentTime); // E7
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  // Soft subtle click sound for buttons and modal dismiss
  playClickSoft() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }

  // General Text-to-Speech narration for ground-level audio accessibility
  speakText(text: string, language: "hi" | "en" = "hi") {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  // Speak product name and price aloud
  speakItem(name: string, price: number, language: "hi" | "en" = "hi") {
    const text =
      language === "hi"
        ? `${name}, ${Math.round(price)} रुपये`
        : `${name}, ₹${Math.round(price)}`;
    this.speakText(text, language);
  }

  // Announce cash change return
  announceCashChange(given: number, change: number, language: "hi" | "en" = "hi") {
    this.playCashChime();
    setTimeout(() => {
      const text =
        language === "hi"
          ? change > 0
            ? `ग्राहक से मिले ₹${Math.round(given)}। वापस लौटाएं: ₹${Math.round(change)}`
            : `ग्राहक से पूरे ₹${Math.round(given)} प्राप्त हुए`
          : change > 0
          ? `Received ₹${Math.round(given)}. Return change: ₹${Math.round(change)}`
          : `Full payment of ₹${Math.round(given)} received`;
      this.speakText(text, language);
    }, 200);
  }

  // Realistic Paytm / PhonePe Merchant Soundbox chime + voice announcement
  playSoundboxAnnouncement(amount: number, language: "hi" | "en" = "hi", storeName: string = "KiranaSetu") {
    try {
      const ctx = this.getContext();
      if (ctx) {
        const now = ctx.currentTime;
        // 4-note musical soundbox intro chime: G4 -> C5 -> E5 -> G5
        const melody = [392.0, 523.25, 659.25, 783.99];
        melody.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.25, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.35);
        });

        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([80, 50, 80, 50, 120]);
        }
      }

      // Spoken voice announcement following the musical chime
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        setTimeout(() => {
          try {
            window.speechSynthesis.cancel();
            const text =
              language === "hi"
                ? `${storeName} पर ₹${Math.round(amount)} प्राप्त हुए।`
                : `₹${Math.round(amount)} received on ${storeName}.`;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.05;
            utterance.pitch = 1.0;
            utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
            window.speechSynthesis.speak(utterance);
          } catch {}
        }, 500);
      }
    } catch {}
  }
}

export const sounds = new SoundManager();
