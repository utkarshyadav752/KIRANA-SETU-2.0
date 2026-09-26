/**
 * Audio helpers for Gemini Live API & Speech Synthesis
 * - 16kHz PCM capture for input to Gemini Live
 * - 24kHz PCM gapless playback for output from Gemini Live
 */

// Convert Float32 audio samples from Web Audio API to 16-bit PCM Linear format
export function float32To16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new DataView(new ArrayBuffer(input.length * 2));
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return output.buffer;
}

// Convert ArrayBuffer to Base64 string
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 24kHz 16-bit PCM audio back to Float32Array for AudioBuffer playback
export function base64PCMToFloat32(base64: string): Float32Array {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16Data = new Int16Array(bytes.buffer);
  const float32Data = new Float32Array(int16Data.length);
  for (let i = 0; i < int16Data.length; i++) {
    float32Data[i] = int16Data[i] / 32768.0;
  }
  return float32Data;
}

// Live Audio Player class managing gapless playback and interruption
export class GeminiLiveAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  public onSpeakingChange?: (isSpeaking: boolean) => void;

  constructor() {
    // Lazy initialize when user interacts
  }

  private initContext() {
    if (!this.audioCtx || this.audioCtx.state === "closed") {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: 24000 });
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  public playChunk(base64Pcm: string) {
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const float32Data = base64PCMToFloat32(base64Pcm);
      const buffer = this.audioCtx.createBuffer(1, float32Data.length, 24000);
      buffer.getChannelData(0).set(float32Data);

      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioCtx.destination);

      const currentTime = this.audioCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += buffer.duration;

      this.activeSources.push(source);
      if (this.onSpeakingChange) this.onSpeakingChange(true);

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) this.activeSources.splice(idx, 1);
        if (this.activeSources.length === 0 && this.onSpeakingChange) {
          this.onSpeakingChange(false);
        }
      };
    } catch (err) {
      console.error("[GeminiLiveAudioPlayer] Playback error:", err);
    }
  }

  public interrupt() {
    // Stop all playing audio instantly when interrupted
    for (const s of this.activeSources) {
      try {
        s.stop();
      } catch {}
    }
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    }
    if (this.onSpeakingChange) this.onSpeakingChange(false);
  }

  public close() {
    this.interrupt();
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      try {
        this.audioCtx.close();
      } catch {}
    }
    this.audioCtx = null;
  }
}
