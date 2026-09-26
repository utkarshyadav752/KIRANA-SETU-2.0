import React from "react";
import {
  Home,
  Store,
  ShoppingBag,
  Sparkles,
  User,
  ShieldCheck,
  Award,
} from "lucide-react";
import { AppView, SellerUser, CustomerUser } from "../../types";
import { sounds } from "../../utils/audio";

interface MobileBottomNavProps {
  currentRole: AppView;
  onSelectRole: (role: AppView) => void;
  language: "en" | "hi";
  activeReservationsCount?: number;
  currentSeller?: SellerUser | null;
  currentCustomer?: CustomerUser | null;
  onOpenAssistant: () => void;
  onOpenFounder: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentRole,
  onSelectRole,
  language,
  activeReservationsCount = 0,
  currentSeller,
  currentCustomer,
  onOpenAssistant,
  onOpenFounder,
}) => {
  const isHindi = language === "hi";

  const handleNav = (role: AppView) => {
    sounds.playClickSoft();
    onSelectRole(role);
  };

  return (
    <nav
      aria-label="Mobile Navigation Dock"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800 shadow-[0_-8px_24px_rgba(0,0,0,0.5)] pb-safe transition-all"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {/* 1. Home Tab */}
        <button
          onClick={() => handleNav("frontpage")}
          className={`flex flex-col items-center justify-center py-1 relative group transition-colors ${
            currentRole === "frontpage"
              ? "text-amber-400"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          {currentRole === "frontpage" && (
            <span className="absolute top-0 w-8 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          )}
          <Home className="w-5 h-5 mb-0.5 transition-transform group-active:scale-90" />
          <span className="text-[10px] font-bold tracking-tight">
            {isHindi ? "होम" : "Home"}
          </span>
        </button>

        {/* 2. Shopkeeper POS Tab */}
        <button
          onClick={() => handleNav("seller")}
          className={`flex flex-col items-center justify-center py-1 relative group transition-colors ${
            currentRole === "seller"
              ? "text-amber-400"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          {currentRole === "seller" && (
            <span className="absolute top-0 w-8 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          )}
          <div className="relative">
            <Store className="w-5 h-5 mb-0.5 transition-transform group-active:scale-90" />
            {activeReservationsCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center font-mono animate-pulse shadow-sm">
                {activeReservationsCount}
              </span>
            )}
            {currentSeller && activeReservationsCount === 0 && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-neutral-950" />
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight">
            {isHindi ? "दुकानदार" : "POS Suite"}
          </span>
        </button>

        {/* 3. Customer Marketplace Tab */}
        <button
          onClick={() => handleNav("customer")}
          className={`flex flex-col items-center justify-center py-1 relative group transition-colors ${
            currentRole === "customer"
              ? "text-amber-400"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          {currentRole === "customer" && (
            <span className="absolute top-0 w-8 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          )}
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5 transition-transform group-active:scale-90" />
            {currentCustomer && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-neutral-950" />
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight">
            {isHindi ? "ग्राहक बाज़ार" : "Customer"}
          </span>
        </button>

        {/* 4. Gemini AI Sahayak Assistant */}
        <button
          onClick={() => {
            sounds.playSuccessChime();
            onOpenAssistant();
          }}
          className="flex flex-col items-center justify-center py-1 text-neutral-400 hover:text-amber-300 relative group transition-colors"
        >
          <div className="w-8 h-7 rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/30 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-0.5 shadow-sm group-active:scale-90 transition-transform">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-[10px] font-bold text-amber-300 tracking-tight">
            {isHindi ? "AI सहायक" : "AI Sahayak"}
          </span>
        </button>

        {/* 5. Founder Utkarsh Yadav Details Tab */}
        <button
          onClick={() => {
            sounds.playClickSoft();
            onOpenFounder();
          }}
          className="flex flex-col items-center justify-center py-1 text-neutral-400 hover:text-amber-300 relative group transition-colors"
          title="Founder Utkarsh Yadav"
        >
          <div className="relative">
            <Award className="w-5 h-5 mb-0.5 text-amber-400 transition-transform group-active:scale-90" />
            <span className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-neutral-950" />
          </div>
          <span className="text-[10px] font-bold text-neutral-300 tracking-tight">
            {isHindi ? "संस्थापक" : "Founder"}
          </span>
        </button>
      </div>
    </nav>
  );
};
