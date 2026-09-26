import React, { useState } from "react";
import {
  Award,
  Sparkles,
  Gift,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  Star,
} from "lucide-react";
import { LoyaltyProfile, Shop } from "../../types";
import { sounds } from "../../utils/audio";

interface NeighborhoodLoyaltyCardProps {
  shop: Shop;
  loyaltyProfile: LoyaltyProfile;
  onApplyDiscount?: (code: string, amount: number) => void;
  language?: "en" | "hi";
}

export const NeighborhoodLoyaltyCard: React.FC<NeighborhoodLoyaltyCardProps> = ({
  shop,
  loyaltyProfile,
  onApplyDiscount,
  language = "hi",
}) => {
  const isHindi = language === "hi";
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const stampsCount = Math.min(5, loyaltyProfile.stampsCount);
  const isRewardUnlocked = stampsCount >= 5;

  const handleCopy = (code: string) => {
    sounds.playScanBeep();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleApply = (code: string, amount: number) => {
    sounds.playSuccessChime();
    if (onApplyDiscount) {
      onApplyDiscount(code, amount);
    }
  };

  return (
    <div
      id="neighborhood-loyalty-card"
      className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/10 via-neutral-900 to-amber-950/20 border border-amber-500/30 text-neutral-100 shadow-xl space-y-3"
    >
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-sm">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-xs sm:text-sm text-white">
                {isHindi ? "खाता वफ़ादारी कार्ड" : "Neighborhood Loyalty Stamp Card"}
              </h4>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                5 Stamps = ₹50 Off
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              {isHindi
                ? `${shop.name} पर 5 विज़िट या ऑर्डर पूरे करें और ₹50 की छूट पाएं`
                : `Earn 1 stamp per completed order. Collect 5 for ₹50 store credit!`}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-mono font-black text-amber-400">
            {stampsCount}/5
          </span>
        </div>
      </div>

      {/* 5-Slot Stamp Visualizer */}
      <div className="grid grid-cols-5 gap-2 py-2">
        {[1, 2, 3, 4, 5].map((slot) => {
          const isFilled = slot <= stampsCount;
          const isTarget = slot === 5;
          return (
            <div
              key={slot}
              className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-1.5 transition-all relative ${
                isFilled
                  ? "bg-gradient-to-tr from-amber-500 to-yellow-400 border-amber-400 text-neutral-950 shadow-md shadow-amber-500/20 scale-105"
                  : isTarget
                  ? "bg-neutral-950 border-dashed border-amber-500/40 text-amber-400"
                  : "bg-neutral-950/70 border-neutral-800 text-neutral-600"
              }`}
            >
              {isFilled ? (
                <>
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-[9px] font-black mt-0.5">#{slot}</span>
                </>
              ) : isTarget ? (
                <>
                  <Gift className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce text-amber-400" />
                  <span className="text-[9px] font-bold text-amber-300 mt-0.5">₹50 Off</span>
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600" />
                  <span className="text-[9px] font-mono text-neutral-500 mt-0.5">#{slot}</span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Rewards Unlocked or Progress status */}
      {isRewardUnlocked ? (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-300">
                {isHindi ? "बधाई! ₹50 का डिस्काउंट कूपन अनलॉक हुआ" : "Reward Ready: ₹50 Discount Unlocked!"}
              </div>
              <div className="text-[11px] text-neutral-300 font-mono">
                Coupon Code: <span className="font-bold text-white">KIRANALOYAL50</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => handleCopy("KIRANALOYAL50")}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-200 text-xs font-bold transition-colors"
              title="Copy Code"
            >
              {copiedCode === "KIRANALOYAL50" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {onApplyDiscount && (
              <button
                onClick={() => handleApply("KIRANALOYAL50", 50)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs shadow-sm transition-all active:scale-95"
              >
                {isHindi ? "लागू करें" : "Apply ₹50"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <span>
            {isHindi
              ? `अगले ₹50 वाउचर के लिए केवल ${5 - stampsCount} स्टैम्प और चाहिए`
              : `Only ${5 - stampsCount} more order to unlock ₹50 coupon`}
          </span>
          <span className="font-mono text-amber-400 font-semibold">
            {stampsCount * 20}% Complete
          </span>
        </div>
      )}
    </div>
  );
};
