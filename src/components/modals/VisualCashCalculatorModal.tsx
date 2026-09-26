import React, { useState, useEffect } from "react";
import {
  X,
  Banknote,
  RotateCcw,
  Volume2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { formatINR } from "../../utils/barcode";
import { sounds } from "../../utils/audio";

interface VisualCashCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  payableAmount: number;
  onConfirmCash: (cashReceived: number, changeGiven: number) => void;
  language: "en" | "hi";
}

interface NoteOption {
  value: number;
  label: string;
  colorBg: string;
  textColor: string;
  borderColor: string;
  isCoin?: boolean;
}

const RUPEE_NOTES: NoteOption[] = [
  {
    value: 500,
    label: "₹500",
    colorBg: "bg-stone-800 hover:bg-stone-700",
    textColor: "text-stone-100",
    borderColor: "border-stone-500",
  },
  {
    value: 200,
    label: "₹200",
    colorBg: "bg-amber-900/60 hover:bg-amber-800/80",
    textColor: "text-amber-200",
    borderColor: "border-amber-500",
  },
  {
    value: 100,
    label: "₹100",
    colorBg: "bg-indigo-950 hover:bg-indigo-900",
    textColor: "text-indigo-200",
    borderColor: "border-indigo-500",
  },
  {
    value: 50,
    label: "₹50",
    colorBg: "bg-cyan-950 hover:bg-cyan-900",
    textColor: "text-cyan-200",
    borderColor: "border-cyan-500",
  },
  {
    value: 20,
    label: "₹20",
    colorBg: "bg-lime-950 hover:bg-lime-900",
    textColor: "text-lime-200",
    borderColor: "border-lime-500",
  },
  {
    value: 10,
    label: "₹10",
    colorBg: "bg-amber-950/70 hover:bg-amber-900/80",
    textColor: "text-orange-200",
    borderColor: "border-orange-600",
  },
  {
    value: 5,
    label: "₹5",
    colorBg: "bg-neutral-800 hover:bg-neutral-700",
    textColor: "text-yellow-300",
    borderColor: "border-yellow-600",
    isCoin: true,
  },
  {
    value: 2,
    label: "₹2",
    colorBg: "bg-neutral-800 hover:bg-neutral-700",
    textColor: "text-neutral-200",
    borderColor: "border-neutral-500",
    isCoin: true,
  },
  {
    value: 1,
    label: "₹1",
    colorBg: "bg-neutral-800 hover:bg-neutral-700",
    textColor: "text-neutral-200",
    borderColor: "border-neutral-500",
    isCoin: true,
  },
];

export const VisualCashCalculatorModal: React.FC<VisualCashCalculatorModalProps> = ({
  isOpen,
  onClose,
  payableAmount,
  onConfirmCash,
  language,
}) => {
  const isHindi = language === "hi";
  const [cashReceived, setCashReceived] = useState<number>(payableAmount);
  const [tappedNotes, setTappedNotes] = useState<{ value: number; count: number }[]>([]);

  useEffect(() => {
    setCashReceived(payableAmount);
    setTappedNotes([]);
  }, [payableAmount, isOpen]);

  if (!isOpen) return null;

  const changeDue = Math.max(0, cashReceived - payableAmount);
  const stillNeeded = Math.max(0, payableAmount - cashReceived);

  const handleAddNote = (val: number) => {
    sounds.playCoinSound();
    setCashReceived((prev) => prev + val);
    setTappedNotes((prev) => {
      const idx = prev.findIndex((n) => n.value === val);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].count += 1;
        return copy;
      }
      return [...prev, { value: val, count: 1 }];
    });
  };

  const handleResetCash = () => {
    sounds.playScanBeep();
    setCashReceived(0);
    setTappedNotes([]);
  };

  const handleExactCash = () => {
    sounds.playCoinSound();
    setCashReceived(payableAmount);
    setTappedNotes([]);
  };

  const handleSpeakCalculation = () => {
    sounds.announceCashChange(cashReceived, changeDue, language);
  };

  const handleComplete = () => {
    sounds.playCashChime();
    onConfirmCash(cashReceived, changeDue);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto animate-in zoom-in-95 text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-white">
                {isHindi ? "नकद व छुट्टे कैलकुलेटर" : "Visual Cash & Change Calculator"}
              </h2>
              <p className="text-[11px] text-neutral-400">
                {isHindi
                  ? "नोट व सिक्के छूकर जोड़ें - छुट्टे अपने आप दिखेंगे"
                  : "Tap rupee notes & coins to calculate change automatically"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display Boards: Bill Total, Received, Return Change */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Bill Payable */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl text-center space-y-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">
              {isHindi ? "कुल बिल राशि" : "Bill Payable"}
            </span>
            <div className="font-mono text-xl sm:text-2xl font-black text-amber-400">
              {formatINR(payableAmount)}
            </div>
          </div>

          {/* Cash Received */}
          <div className="p-3 bg-neutral-950 border border-neutral-700 rounded-2xl text-center space-y-1 relative">
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wide">
                {isHindi ? "ग्राहक से मिले" : "Cash Received"}
              </span>
              <button
                type="button"
                onClick={handleSpeakCalculation}
                className="text-neutral-400 hover:text-amber-400"
                title="Speak aloud"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-black text-blue-400">
              {formatINR(cashReceived)}
            </div>
          </div>

          {/* Change to Return / Still Needed */}
          <div
            className={`p-3 rounded-2xl text-center space-y-1 border ${
              cashReceived >= payableAmount
                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                : "bg-rose-950/40 border-rose-500/30 text-rose-300"
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wide block">
              {cashReceived >= payableAmount
                ? isHindi
                  ? "छुट्टे वापस दें"
                  : "Change Return"
                : isHindi
                ? "और बाकी हैं"
                : "Still Needed"}
            </span>
            <div className="font-mono text-xl sm:text-2xl font-black">
              {formatINR(cashReceived >= payableAmount ? changeDue : stillNeeded)}
            </div>
          </div>
        </div>

        {/* Visual Rupee Notes Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-300 flex items-center gap-1">
              <span>{isHindi ? "भारतीय रुपये के नोट छुएं:" : "Tap Currency Notes:"}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExactCash}
                className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold text-[11px] transition-colors"
              >
                {isHindi ? "पूरा नकद (Exact)" : "Exact Amount"}
              </button>
              <button
                type="button"
                onClick={handleResetCash}
                className="px-2.5 py-1 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isHindi ? "शून्य करें" : "Clear"}</span>
              </button>
            </div>
          </div>

          {/* Notes Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {RUPEE_NOTES.filter((n) => !n.isCoin).map((note) => (
              <button
                key={note.value}
                type="button"
                onClick={() => handleAddNote(note.value)}
                className={`py-3 px-2 rounded-2xl border-2 font-black text-sm flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition-all ${note.colorBg} ${note.textColor} ${note.borderColor}`}
              >
                <Banknote className="w-4 h-4 opacity-80" />
                <span className="font-mono text-base font-black tracking-tight">{note.label}</span>
                <span className="text-[9px] uppercase font-bold opacity-75">
                  {isHindi ? "नोट" : "Note"}
                </span>
              </button>
            ))}
          </div>

          {/* Coins Row */}
          <div className="space-y-1 pt-1">
            <span className="text-[11px] font-bold text-neutral-400">
              {isHindi ? "सिक्के (Coins):" : "Coins:"}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {RUPEE_NOTES.filter((n) => n.isCoin).map((coin) => (
                <button
                  key={coin.value}
                  type="button"
                  onClick={() => handleAddNote(coin.value)}
                  className="py-2.5 rounded-2xl border-2 border-neutral-700 hover:border-amber-400 bg-neutral-950 font-black text-sm text-neutral-200 flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-xs font-mono">
                    ₹
                  </div>
                  <span className="font-mono font-bold">{coin.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Notes Summary Pills */}
        {tappedNotes.length > 0 && (
          <div className="p-2.5 bg-neutral-950 rounded-2xl border border-neutral-800 text-xs flex items-center gap-2 flex-wrap">
            <span className="text-neutral-400 text-[11px] font-semibold">
              {isHindi ? "जोड़े गए नोट:" : "Tapped:"}
            </span>
            {tappedNotes.map((n) => (
              <span
                key={n.value}
                className="px-2 py-0.5 rounded-lg bg-neutral-800 text-amber-300 font-mono text-xs font-bold border border-neutral-700"
              >
                ₹{n.value} × {n.count}
              </span>
            ))}
          </div>
        )}

        {/* Action Button: Confirm & Return */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleSpeakCalculation}
            className="p-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-colors border border-neutral-700"
            title="Speak speech output"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">{isHindi ? "बोलकर सुनें" : "Speak Aloud"}</span>
          </button>

          <button
            type="button"
            onClick={handleComplete}
            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>
              {isHindi
                ? `नकद भुगतान दर्ज करें • ${formatINR(payableAmount)}`
                : `RECORD CASH PAYMENT • ${formatINR(payableAmount)}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
