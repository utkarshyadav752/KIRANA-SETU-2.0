import React, { useState } from "react";
import {
  X,
  Volume2,
  VolumeX,
  Radio,
  Play,
  CheckCircle2,
  Sparkles,
  Zap,
} from "lucide-react";
import { SoundboxSettings, Shop } from "../../types";
import { sounds } from "../../utils/audio";

interface SoundboxSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
  settings: SoundboxSettings;
  onSaveSettings: (settings: SoundboxSettings) => void;
  language?: "en" | "hi";
}

export const SoundboxSettingsModal: React.FC<SoundboxSettingsModalProps> = ({
  isOpen,
  onClose,
  shop,
  settings,
  onSaveSettings,
  language = "hi",
}) => {
  const isHindi = language === "hi";
  const [localSettings, setLocalSettings] = useState<SoundboxSettings>(settings);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  if (!isOpen) return null;

  const handleTest = (amount: number = 340) => {
    setIsPlayingTest(true);
    sounds.playSoundboxAnnouncement(amount, localSettings.language, shop.name);
    setTimeout(() => setIsPlayingTest(false), 2000);
  };

  const handleSave = () => {
    sounds.playSuccessChime();
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div
      id="soundbox-settings-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-4 py-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 via-neutral-800 to-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-white">
                  {isHindi ? "किरानासेतु ऑडियो साउंडबॉक्स" : "KiranaSetu Audio Soundbox"}
                </h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  Paytm / PhonePe Style
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {isHindi
                  ? "काउन्टर बिलिंग एवं आरक्षण भुगतान पर वास्तविक समय वॉयस घोषणा"
                  : "Instant dual-tone chime and voice alerts for store payments"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4">
          {/* Main Soundbox Enable Toggle */}
          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>{isHindi ? "साउंडबॉक्स चालू रखें" : "Enable Audio Soundbox"}</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {isHindi
                  ? "भुगतान होते ही दुकान पर स्पीकर से आवाज़ आएगी"
                  : "Plays musical chime and announces received amount loudly"}
              </p>
            </div>

            <button
              onClick={() =>
                setLocalSettings((s) => ({ ...s, enabled: !s.enabled }))
              }
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                localSettings.enabled ? "bg-emerald-500" : "bg-neutral-800"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  localSettings.enabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Voice Language Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              {isHindi ? "घोषणा की भाषा (Announcement Language):" : "Voice Language:"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLocalSettings((s) => ({ ...s, language: "hi" }))}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  localSettings.language === "hi"
                    ? "bg-amber-500/15 border-amber-500 text-white font-bold"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400"
                }`}
              >
                <div className="text-xs">हिंदी (Hindi)</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  "₹340 प्राप्त हुए — किरानासेतु"
                </div>
              </button>

              <button
                onClick={() => setLocalSettings((s) => ({ ...s, language: "en" }))}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  localSettings.language === "en"
                    ? "bg-amber-500/15 border-amber-500 text-white font-bold"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400"
                }`}
              >
                <div className="text-xs">English (Indian)</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  "₹340 received on KiranaSetu"
                </div>
              </button>
            </div>
          </div>

          {/* Automatic Triggers */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">
              {isHindi ? "स्वतः घोषणा कब हो?" : "Automatic Announcement Triggers:"}
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs cursor-pointer">
                <span>{isHindi ? "POS काउन्टर पर बिल पूरा होने पर" : "On In-Store POS Bill Completion"}</span>
                <input
                  type="checkbox"
                  checked={localSettings.autoAnnounceOnPOS}
                  onChange={(e) =>
                    setLocalSettings((s) => ({ ...s, autoAnnounceOnPOS: e.target.checked }))
                  }
                  className="rounded text-emerald-500 focus:ring-emerald-500 bg-neutral-900 border-neutral-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs cursor-pointer">
                <span>{isHindi ? "ग्राहक द्वारा 30-मिनट आरक्षण सामान उठाने पर" : "On 30-Min Hold Pickup Confirmation"}</span>
                <input
                  type="checkbox"
                  checked={localSettings.autoAnnounceOnPickup}
                  onChange={(e) =>
                    setLocalSettings((s) => ({ ...s, autoAnnounceOnPickup: e.target.checked }))
                  }
                  className="rounded text-emerald-500 focus:ring-emerald-500 bg-neutral-900 border-neutral-700"
                />
              </label>
            </div>
          </div>

          {/* Test Soundbox Card */}
          <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">
                {isHindi ? "साउंडबॉक्स टेस्ट करें" : "Test Soundbox"}
              </div>
              <div className="text-[10px] text-neutral-400">
                {isHindi ? "चाइम धुन एवं बोलने की आवाज़ सुनें" : "Plays test chime for ₹340"}
              </div>
            </div>

            <button
              onClick={() => handleTest(340)}
              disabled={isPlayingTest}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-emerald-400" />
              <span>{isPlayingTest ? "Playing..." : isHindi ? "आवाज़ सुनें" : "Play Chime"}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold transition-colors"
          >
            {isHindi ? "रद्द करें" : "Cancel"}
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isHindi ? "सेव करें" : "Save Settings"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
