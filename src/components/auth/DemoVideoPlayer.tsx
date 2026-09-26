import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  FastForward,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Store,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Mic,
  Receipt,
  Layers,
  ArrowRight,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { sounds } from "../../utils/audio";

interface DemoVideoPlayerProps {
  role: "customer" | "merchant";
  language: "en" | "hi";
  onSkip: () => void;
  onComplete?: () => void;
  title?: string;
  autoPlay?: boolean;
}

interface VideoChapter {
  id: string;
  startTime: number; // in seconds
  duration: number; // in seconds
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  icon: any;
  accentColor: string;
  visualStage: string;
}

export const DemoVideoPlayer: React.FC<DemoVideoPlayerProps> = ({
  role,
  language,
  onSkip,
  onComplete,
  title,
  autoPlay = true,
}) => {
  const isHindi = language === "hi";
  const isCustomer = role === "customer";

  // Video duration: 45 seconds
  const TOTAL_DURATION = 45;

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  // Chapters tailored for Customer vs Merchant
  const customerChapters: VideoChapter[] = [
    {
      id: "cust-1",
      startTime: 0,
      duration: 11,
      titleEn: "1. Real-Time Store Discovery",
      titleHi: "१. आस-पास की दुकानें और लाइव स्टॉक",
      descEn: "See which neighborhood stores have milk, atta & snacks in stock right now.",
      descHi: "अपने मोहल्ले की किराना दुकानों में सामान का लाइव स्टॉक और सटीक कीमतें देखें।",
      icon: Store,
      accentColor: "from-amber-500 to-yellow-400",
      visualStage: "store_discovery",
    },
    {
      id: "cust-2",
      startTime: 11,
      duration: 12,
      titleEn: "2. 30-Minute Counter Pickup Holds",
      titleHi: "२. ३०-मिनट काउंटर पिकअप होल्ड",
      descEn: "Reserve items before you leave home. Send 'Arriving in 20 min' alert so goods are packed.",
      descHi: "घर से निकलते ही सामान होल्ड करें और '२० मिनट में आ रहा हूँ' का अलर्ट भेजें।",
      icon: Clock,
      accentColor: "from-emerald-500 to-teal-400",
      visualStage: "pickup_hold",
    },
    {
      id: "cust-3",
      startTime: 23,
      duration: 11,
      titleEn: "3. Voice Order & Parchi Scanner",
      titleHi: "३. बोलकर ऑर्डर और पर्ची स्कैनर",
      descEn: "Speak in Hindi or take a photo of handwritten grocery list to auto-add items to cart.",
      descHi: "हाथ से लिखी पर्ची का फोटो खींचें या सीधे माइक में बोलकर सामान झोले में जोड़ें।",
      icon: Mic,
      accentColor: "from-purple-500 to-indigo-400",
      visualStage: "voice_parchi",
    },
    {
      id: "cust-4",
      startTime: 34,
      duration: 11,
      titleEn: "4. Zero Commission & Loyalty Rewards",
      titleHi: "४. शून्य कमीशन और लॉयल्टी कार्ड",
      descEn: "Pay 0% commission directly via UPI QR at the counter and earn punch card stamps.",
      descHi: "काउंटर पर बिना किसी अतिरिक्त शुल्क सीधे यूपीआई से भुगतान करें और रिवॉर्ड पाएं।",
      icon: ShieldCheck,
      accentColor: "from-rose-500 to-pink-400",
      visualStage: "loyalty_upi",
    },
  ];

  const merchantChapters: VideoChapter[] = [
    {
      id: "merch-1",
      startTime: 0,
      duration: 11,
      titleEn: "1. Ultra-Fast Barcode POS Billing",
      titleHi: "१. अल्ट्रा-फ़ास्ट बारकोड POS बिलिंग",
      descEn: "Continuous camera scanning or visual touch grid for 1-second invoice generation.",
      descHi: "कैमरा स्कैनर या सरल टच ग्रिड से केवल १ सेकंड में पक्का टैक्स बिल बनाएं।",
      icon: Receipt,
      accentColor: "from-amber-500 to-yellow-400",
      visualStage: "barcode_pos",
    },
    {
      id: "merch-2",
      startTime: 11,
      duration: 12,
      titleEn: "2. Cashify SuperSale MSME B2B Verification",
      titleHi: "२. MSME B2B सत्यापन (Cashify SuperSale मॉडल)",
      descEn: "Enter Udyam document number; our team verifies credentials to unlock wholesale margins.",
      descHi: "उद्यम नंबर दर्ज करें; हमारी टीम सत्यापन कर थोक B2B लॉट व भारी छूट अनलॉक करेगी।",
      icon: ShieldCheck,
      accentColor: "from-emerald-500 to-teal-400",
      visualStage: "msme_b2b",
    },
    {
      id: "merch-3",
      startTime: 23,
      duration: 11,
      titleEn: "3. Digital Bahi-Khata & WhatsApp UPI",
      titleHi: "३. डिजिटल बही-खाता और व्हाट्सएप पेमेंट लिंक",
      descEn: "Manage customer credit ledgers and send 1-click WhatsApp payment reminders with UPI QR.",
      descHi: "उधार खाता संभालें और १-क्लिक में ग्राहक को व्हाट्सएप पर यूपीआई पेमेंट लिंक भेजें।",
      icon: Layers,
      accentColor: "from-rose-500 to-orange-400",
      visualStage: "bahi_khata",
    },
    {
      id: "merch-4",
      startTime: 34,
      duration: 11,
      titleEn: "4. Aaj Ka Galla & Wholesale Mandi Bhav",
      titleHi: "४. आज का गल्ला और लाइव मंडी भाव",
      descEn: "Track daily cash drawer balance and check real-time APMC Mandi rates to protect profit margins.",
      descHi: "दैनिक नकद गल्ला मिलाएँ और थोक मंडी भाव देखकर अपनी दुकान का मुनाफ़ा बढ़ाएँ।",
      icon: Store,
      accentColor: "from-cyan-500 to-blue-400",
      visualStage: "galla_mandi",
    },
  ];

  const chapters = isCustomer ? customerChapters : merchantChapters;

  // Identify active chapter based on currentTime
  const currentChapter =
    chapters.find(
      (c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration
    ) || chapters[chapters.length - 1];

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= TOTAL_DURATION) {
            setIsPlaying(false);
            if (onComplete) onComplete();
            return TOTAL_DURATION;
          }
          return Math.min(TOTAL_DURATION, prev + 0.25);
        });
      }, 250);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, onComplete]);

  // Audio voiceover announcement for chapter change (if not muted)
  useEffect(() => {
    if (!isMuted && isPlaying && "speechSynthesis" in window) {
      // Small sound chime on chapter change
      sounds.playScanBeep();
    }
  }, [currentChapter.id]);

  const handleTogglePlay = () => {
    sounds.playScanBeep();
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    sounds.playScanBeep();
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleSeek = (time: number) => {
    sounds.playScanBeep();
    setCurrentTime(time);
  };

  const handleSkipClicked = () => {
    sounds.playScanBeep();
    setIsPlaying(false);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    onSkip();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      ref={containerRef}
      id={`${role}-demo-video-player`}
      className="relative w-full bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white select-none animate-in fade-in"
    >
      {/* ============================================================
          1. TOP VIDEO HEADER OVERLAY: Title & Prominent SKIP Button
      ============================================================ */}
      <div className="absolute top-0 inset-x-0 z-30 p-3 sm:p-4 bg-gradient-to-b from-black/90 via-black/60 to-transparent flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            {isCustomer ? <ShoppingBag className="w-4 h-4" /> : <Store className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">
                {title || (isCustomer ? "Customer Demo Video (45s)" : "Merchant Demo Video (45s)")}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-600 text-white font-bold uppercase tracking-wider animate-pulse">
                Live Demo
              </span>
            </div>
            <p className="text-[10px] text-neutral-300 hidden sm:block">
              {isHindi ? "किरानासेतु का उपयोग कैसे करें" : "Walkthrough & feature demonstration"}
            </p>
          </div>
        </div>

        {/* PROMINENT SKIP BUTTON */}
        <button
          type="button"
          id="demo-video-skip-top-btn"
          onClick={handleSkipClicked}
          className="px-3.5 py-1.5 sm:py-2 rounded-xl bg-neutral-900/90 hover:bg-amber-500 hover:text-neutral-950 text-amber-300 font-extrabold text-xs flex items-center gap-1.5 border border-amber-500/50 shadow-lg shadow-black/60 backdrop-blur-md active:scale-95 transition-all group shrink-0"
          title={isHindi ? "वीडियो छोड़ें और सीधे लॉगिन करें" : "Skip video and continue to login"}
        >
          <span>{isHindi ? "स्किप करें (Skip)" : "Skip Video"}</span>
          <FastForward className="w-4 h-4 text-amber-400 group-hover:text-neutral-950 transition-colors" />
        </button>
      </div>

      {/* ============================================================
          2. MAIN VIDEO SCREEN (Simulated Interactive Screencast)
      ============================================================ */}
      <div className="relative aspect-video w-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden min-h-[260px] sm:min-h-[320px]">
        {/* Dynamic Background Glow matching chapter */}
        <div
          className={`absolute -inset-10 opacity-20 blur-3xl bg-gradient-to-r ${currentChapter.accentColor} transition-all duration-700 pointer-events-none`}
        />

        {/* Animated App Screen Simulation Stage */}
        <div className="relative z-10 w-full max-w-lg mx-auto bg-neutral-900/90 border border-neutral-750 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-3">
          {/* Mock App Window Header */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-[11px] text-neutral-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-1 font-mono font-bold text-neutral-300 text-[10px]">
                {isCustomer ? "KiranaSetu Marketplace App" : "KiranaSetu POS Terminal"}
              </span>
            </div>
            <div className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-spin" />
              <span>{isCustomer ? "Grahak Mode" : "Merchant Pro Mode"}</span>
            </div>
          </div>

          {/* Video Stage Visual Content */}
          <div className="py-2 sm:py-3 text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-neutral-800 to-neutral-700 border border-neutral-600 text-amber-400 shadow-md transform animate-bounce">
              <currentChapter.icon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                Step {chapters.indexOf(currentChapter) + 1} of {chapters.length}
              </span>
              <h4 className="text-sm sm:text-base font-black text-white">
                {isHindi ? currentChapter.titleHi : currentChapter.titleEn}
              </h4>
              <p className="text-xs text-neutral-300 max-w-sm mx-auto leading-relaxed">
                {isHindi ? currentChapter.descHi : currentChapter.descEn}
              </p>
            </div>

            {/* Interactive Visual Badges inside screencast */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5">
              {isCustomer ? (
                <>
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300 font-semibold">
                    ✓ Amul Milk (₹27 In Stock)
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 font-semibold">
                    ⏱️ 30-Min Pickup Window
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-[10px] text-cyan-300 font-semibold">
                    🎙️ Voice: "2 packet aata"
                  </span>
                </>
              ) : (
                <>
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300 font-semibold">
                    ⚡ 1-Sec Barcode Scan
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-[10px] text-cyan-300 font-semibold">
                    🏢 MSME B2B Wholesale Tier
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[10px] text-rose-300 font-semibold">
                    📖 1-Click WhatsApp Bahi-Khata
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center Big Play Button Overlay (when paused) */}
        {!isPlaying && (
          <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <button
              type="button"
              id="demo-video-big-play-btn"
              onClick={handleTogglePlay}
              className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
              title="Play Demo Video"
            >
              <Play className="w-8 h-8 fill-neutral-950 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* ============================================================
          3. VIDEO TIMELINE & SCRUBBER
      ============================================================ */}
      <div className="px-3 sm:px-4 py-1.5 bg-neutral-900 border-t border-neutral-800">
        {/* Progress Bar */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            handleSeek(pos * TOTAL_DURATION);
          }}
          className="relative h-2 w-full bg-neutral-800 hover:h-2.5 rounded-full cursor-pointer transition-all overflow-hidden"
        >
          {/* Active Fill */}
          <div
            className={`h-full bg-gradient-to-r ${currentChapter.accentColor} transition-all duration-200`}
            style={{ width: `${(currentTime / TOTAL_DURATION) * 100}%` }}
          />

          {/* Chapter markers */}
          {chapters.map((ch) => (
            <div
              key={ch.id}
              className="absolute top-0 bottom-0 w-0.5 bg-neutral-950"
              style={{ left: `${(ch.startTime / TOTAL_DURATION) * 100}%` }}
            />
          ))}
        </div>

        {/* Chapter labels pills below scrubber */}
        <div className="grid grid-cols-4 gap-1 pt-1.5">
          {chapters.map((ch, idx) => {
            const isChActive = currentChapter.id === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => handleSeek(ch.startTime)}
                className={`py-1 px-1.5 rounded-lg text-[10px] font-bold truncate transition-all text-center ${
                  isChActive
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-extrabold"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                }`}
                title={isHindi ? ch.titleHi : ch.titleEn}
              >
                <span className="hidden sm:inline">{idx + 1}. </span>
                <span>{isHindi ? ch.titleHi.split(". ")[1] || ch.titleHi : ch.titleEn.split(". ")[1] || ch.titleEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================
          4. BOTTOM CONTROLS & DEDICATED SKIP OPTION
      ============================================================ */}
      <div className="px-3 sm:px-4 py-2.5 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            type="button"
            onClick={handleTogglePlay}
            className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-white flex items-center justify-center transition-colors shrink-0"
            title={isPlaying ? "Pause Video" : "Play Video"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          {/* Restart */}
          <button
            type="button"
            onClick={handleRestart}
            className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="Restart Video from 0:00"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Volume Mute/Unmute */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white flex items-center justify-center transition-colors shrink-0"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Time Counter */}
          <div className="text-xs font-mono text-neutral-400">
            <span className="text-white font-bold">{formatTime(currentTime)}</span> / {formatTime(TOTAL_DURATION)}
          </div>
        </div>

        {/* BOTTOM SKIP ACTION (CLEAR & ACCESSIBLE) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="demo-video-skip-bottom-btn"
            onClick={handleSkipClicked}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-neutral-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            <span>{isHindi ? "वीडियो छोड़ें और आगे बढ़ें (Skip)" : "Skip Video & Continue"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
