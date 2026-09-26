// Voice Input & Speech-to-Text helper for Ground-Level Visual Commerce
// Supports both English and Hindi audio input with speech synthesis and graceful fallback

export interface VoiceRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export class VoiceAssistantManager {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          this.recognition = new SpeechRecognition();
          this.recognition.continuous = false;
          this.recognition.interimResults = true;
          this.recognition.maxAlternatives = 1;
        } catch {
          this.recognition = null;
        }
      }
    }
  }

  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  startListening(
    language: "hi" | "en",
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ): boolean {
    if (typeof window === "undefined") {
      onError("Voice is not supported in this environment.");
      return false;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError("Speech recognition is not supported in this browser. Please use keyboard or preset buttons.");
      return false;
    }

    // Stop any existing instance
    this.stopListening();

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = language === "hi" ? "hi-IN" : "en-IN";

      let finalCaptured = false;

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const text = (finalTranscript || interimTranscript).trim();
        if (text) {
          if (finalTranscript) finalCaptured = true;
          onResult(text, Boolean(finalTranscript));
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        const errType = event.error || "error";
        let message = "Voice input error";
        if (errType === "not-allowed" || errType === "service-not-allowed") {
          message = "Microphone access blocked. Please allow mic permissions in browser settings.";
        } else if (errType === "no-speech") {
          message = "No speech detected. Please speak closer to your microphone.";
        } else if (errType === "network") {
          message = "Network error during speech recognition.";
        }
        onError(message);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd();
      };

      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (e: any) {
      this.isListening = false;
      onError(e.message || "Could not access microphone.");
      return false;
    }
  }

  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }
    this.isListening = false;
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  // Spoken voice playback via SpeechSynthesis
  speak(text: string, language: "hi" | "en" = "hi"): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[#*_`~>[\]()]/g, "").slice(0, 300);
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = language === "hi" ? "hi-IN" : "en-IN";
      utter.rate = 1.0;
      utter.pitch = 1.0;
      window.speechSynthesis.speak(utter);
    } catch {}
  }
}

export const voiceManager = new VoiceAssistantManager();
