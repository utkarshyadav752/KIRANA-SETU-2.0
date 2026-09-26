import React from "react";
import {
  Store,
  ShoppingBag,
  ShieldCheck,
  Globe,
  RotateCcw,
  BookOpen,
  Wifi,
  Sparkles,
  Home,
  LogOut,
  UserCheck,
  FileCheck2,
  Award,
  User,
  Phone,
} from "lucide-react";
import { AppView, Shop, SellerUser, CustomerUser } from "../types";

interface HeaderProps {
  currentRole: AppView;
  onRoleChange: (role: AppView) => void;
  language: "en" | "hi";
  onLanguageChange?: (lang: "en" | "hi") => void;
  onLanguageToggle?: () => void;
  onOpenDemoGuide?: () => void;
  onResetDemo?: () => void;
  currentShop?: Shop | null;
  shops?: Shop[];
  onSelectShop?: (shop: Shop) => void;
  unreadMessagesCount?: number;
  activeReservationsCount?: number;
  currentSeller?: SellerUser | null;
  currentCustomer?: CustomerUser | null;
  onOpenSellerAuth?: () => void;
  onOpenCustomerAuth?: () => void;
  onSellerLogout?: () => void;
  onCustomerLogout?: () => void;
  onOpenAssistant?: () => void;
  onOpenFounder?: () => void;
  saralMode?: boolean;
  onToggleSaralMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  language,
  onLanguageChange,
  onLanguageToggle,
  onOpenDemoGuide,
  onResetDemo,
  currentShop,
  shops = [],
  onSelectShop,
  activeReservationsCount = 0,
  currentSeller,
  currentCustomer,
  onOpenSellerAuth,
  onOpenCustomerAuth,
  onSellerLogout,
  onCustomerLogout,
  onOpenAssistant,
  onOpenFounder,
  saralMode = false,
  onToggleSaralMode,
}) => {
  const isHindi = language === "hi";

  const handleLangToggle = () => {
    if (onLanguageToggle) {
      onLanguageToggle();
    } else if (onLanguageChange) {
      onLanguageChange(language === "en" ? "hi" : "en");
    }
  };

  // Guarded Seller navigation: No direct entry without login/business proof, blocked if customer logged in
  const handleSellerClick = () => {
    onRoleChange("seller");
  };

  // Guarded Customer navigation: No direct entry without Google + Phone, blocked if seller logged in
  const handleCustomerClick = () => {
    onRoleChange("customer");
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand & Status */}
        <button
          onClick={() => onRoleChange("frontpage")}
          className="flex items-center gap-2.5 sm:gap-3 text-left group focus:outline-none"
          title="Return to KiranaSetu Front Page"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center text-amber-400">
              <Store className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-amber-200 via-white to-amber-100 bg-clip-text text-transparent group-hover:text-amber-300 transition-colors">
                KiranaSetu
              </h1>
              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {isHindi ? "किरानासेतु" : "POS • Market"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-neutral-400">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Wifi className="w-3 h-3" />
                <span>{isHindi ? "ऑनलाइन कनेक्टेड" : "Online • Real-Time"}</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline text-neutral-400">Indiranagar, Bengaluru</span>
            </div>
          </div>
        </button>

        {/* Center: Role Switcher Tabs (Desktop / Tablet - Mobile uses bottom dock) */}
        <div className="hidden md:flex items-center bg-neutral-950 p-1 rounded-2xl border border-neutral-800 shadow-inner">
          <button
            id="role-btn-frontpage"
            onClick={() => onRoleChange("frontpage")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentRole === "frontpage"
                ? "bg-amber-500 text-neutral-950 shadow-md scale-100"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>{isHindi ? "होम" : "Home"}</span>
          </button>

          <button
            id="role-btn-seller"
            onClick={handleSellerClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentRole === "seller"
                ? "bg-amber-500 text-neutral-950 shadow-md scale-100"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>{isHindi ? "दुकानदार (POS)" : "Shopkeeper"}</span>
            {currentSeller ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Verified Seller Logged In" />
            ) : (
              <span className="text-[10px] opacity-60 font-mono hidden md:inline">Proof Req.</span>
            )}
            {activeReservationsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] flex items-center justify-center font-mono animate-pulse">
                {activeReservationsCount}
              </span>
            )}
          </button>

          <button
            id="role-btn-customer"
            onClick={handleCustomerClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentRole === "customer"
                ? "bg-amber-500 text-neutral-950 shadow-md scale-100"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isHindi ? "ग्राहक बाज़ार" : "Customer App"}</span>
            {currentCustomer ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Customer Logged In" />
            ) : (
              <span className="text-[10px] opacity-60 font-mono hidden md:inline">Google+Phone</span>
            )}
          </button>
        </div>

        {/* Right: Active User Badges & Quick Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Active Seller Badge & Logout */}
          {currentRole === "seller" && currentSeller && (
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px]">
              <FileCheck2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="text-white font-bold max-w-[80px] sm:max-w-[120px] truncate">
                {currentSeller.shopName}
              </span>
              <span className="hidden sm:inline text-[10px] text-emerald-400 font-mono font-bold">
                [{currentSeller.businessProofs?.[0]?.type || "Verified"}]
              </span>
              {onSellerLogout && (
                <button
                  type="button"
                  id="header-seller-logout-btn"
                  onClick={onSellerLogout}
                  title={isHindi ? "व्यापारी खाते से लॉगआउट करें" : "Log out of Shopkeeper Suite"}
                  className="p-1 px-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold flex items-center gap-1 transition-colors ml-0.5"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden md:inline">{isHindi ? "लॉगआउट" : "Logout"}</span>
                </button>
              )}
            </div>
          )}

          {/* Active Customer Badge & Logout */}
          {currentRole === "customer" && currentCustomer && (
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px]">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="text-white font-bold max-w-[80px] sm:max-w-[110px] truncate">
                {currentCustomer.name}
              </span>
              <span className="hidden sm:inline text-[10px] text-neutral-400 font-mono">
                {currentCustomer.phone.slice(-4)}
              </span>
              {onCustomerLogout && (
                <button
                  type="button"
                  id="header-customer-logout-btn"
                  onClick={onCustomerLogout}
                  title={isHindi ? "ग्राहक खाते से लॉगआउट करें" : "Log out Customer"}
                  className="p-1 px-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold flex items-center gap-1 transition-colors ml-0.5"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden md:inline">{isHindi ? "लॉगआउट" : "Logout"}</span>
                </button>
              )}
            </div>
          )}

          {/* Gemini AI Assistant & Live Voice Launcher */}
          {onOpenAssistant && (
            <button
              id="header-gemini-assistant-btn"
              onClick={onOpenAssistant}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Open Gemini AI Support & Voice Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">{isHindi ? "AI सहायक व आवाज़" : "AI Sahayak & Voice"}</span>
              <span className="sm:hidden">AI</span>
            </button>
          )}

          {/* Global Saral Mode (Visual & Voice Friendly Mode) */}
          {onToggleSaralMode && (
            <button
              id="header-saral-mode-btn"
              onClick={onToggleSaralMode}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm ${
                saralMode
                  ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 shadow-amber-500/25 scale-105 border border-amber-300"
                  : "bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/30"
              }`}
              title={
                isHindi
                  ? "सरल मोड (बड़ी तस्वीरें, आवाज़ व आसान बटन)"
                  : "Saral Mode (Large Pictures, Spoken Audio & Easy Touch)"
              }
            >
              <span>✨</span>
              <span>{isHindi ? (saralMode ? "सरल मोड ON" : "सरल मोड") : saralMode ? "Saral ON" : "Saral Mode"}</span>
            </button>
          )}

          {/* Quick Call Founder on Mobile */}
          <a
            href="tel:9554460651"
            className="sm:hidden p-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 flex items-center justify-center transition-colors shadow-sm"
            title={isHindi ? "उत्कर्ष यादव को कॉल करें (+91 9554460651)" : "Call Utkarsh Yadav (+91 9554460651)"}
          >
            <Phone className="w-3.5 h-3.5" />
          </a>

          {/* Founder Utkarsh Yadav Details Button */}
          {onOpenFounder && (
            <button
              id="header-founder-btn"
              onClick={onOpenFounder}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-300 border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title={isHindi ? "संस्थापक विवरण (उत्कर्ष यादव) - फोन: 9554460651" : "Meet Founder Utkarsh Yadav - Phone: 9554460651"}
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">{isHindi ? "संस्थापक" : "Founder"}</span>
            </button>
          )}

          {/* Language Toggle */}
          <button
            onClick={handleLangToggle}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHindi ? "ENG" : "हिंदी"}</span>
          </button>

          {/* Reset Demo Data */}
          {onResetDemo && (
            <button
              onClick={onResetDemo}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-rose-300 border border-neutral-700 text-xs font-medium flex items-center gap-1 transition-colors"
              title="Reset to Initial Demo Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

