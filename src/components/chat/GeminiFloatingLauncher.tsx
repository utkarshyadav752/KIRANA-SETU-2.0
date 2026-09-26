import React from "react";
import { Sparkles, Mic, Radio, MessageSquare } from "lucide-react";
import { sounds } from "../../utils/audio";

interface GeminiFloatingLauncherProps {
  onClick: () => void;
  language: "en" | "hi";
}

export const GeminiFloatingLauncher: React.FC<GeminiFloatingLauncherProps> = ({
  onClick,
  language,
}) => {
  const isHindi = language === "hi";

  return (
    <aside
      aria-label="KiranaSetu AI Assistant Launcher"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2"
    >
      <button
        id="gemini-assistant-floating-btn"
        onClick={() => {
          sounds.playScanBeep();
          onClick();
        }}
        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-neutral-900/95 hover:bg-neutral-850 text-white border border-amber-500/40 hover:border-amber-400 shadow-2xl shadow-amber-500/20 backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95"
        title="Open Gemini AI Support & Voice Assistant"
      >
        {/* Glow halo */}
        <span className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 opacity-30 blur-sm group-hover:opacity-60 transition duration-300 pointer-events-none" />

        <div className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-neutral-950 font-bold shadow-sm">
          <Sparkles className="w-4 h-4" />
        </div>

        <div className="relative text-left hidden sm:block">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-neutral-100 group-hover:text-amber-300 transition-colors">
              {isHindi ? "किराना AI सहायक" : "Kirana AI Sahayak"}
            </span>
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
          </div>
          <div className="text-[10px] text-neutral-400 flex items-center gap-1 font-mono">
            <span>Support & Live Voice</span>
          </div>
        </div>

        <div className="relative flex items-center gap-1 bg-neutral-800/80 px-2 py-1 rounded-lg border border-neutral-700 text-emerald-400 text-[10px] font-mono">
          <Radio className="w-3 h-3 animate-pulse" />
          <span className="hidden md:inline">Live</span>
        </div>
      </button>
    </aside>
  );
};
