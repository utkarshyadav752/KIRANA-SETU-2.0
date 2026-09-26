import React, { useState } from "react";
import {
  ShieldCheck,
  Store,
  User,
  Phone,
  Mail,
  QrCode,
  FileText,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Sparkles,
  Bot,
  Zap,
} from "lucide-react";
import { Shop, SellerUser, SellerSubscription } from "../../types";
import { getTranslation, Language } from "../../utils/translations";

interface MerchantProfileSectionProps {
  shop: Shop;
  sellerUser?: SellerUser | null;
  subscription?: SellerSubscription | null;
  onOpenSubscription?: () => void;
  onNavigateToMsme?: () => void;
  onLogout: () => void;
  language: Language;
}

export const MerchantProfileSection: React.FC<MerchantProfileSectionProps> = ({
  shop,
  sellerUser,
  subscription,
  onOpenSubscription,
  onNavigateToMsme,
  onLogout,
  language,
}) => {
  const t = getTranslation(language);
  const isHindi = language === "hi";

  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const owner = sellerUser?.ownerName || shop.ownerName || "Retail Merchant";
  const phone = sellerUser?.phone || shop.phone || "+91 98450 11223";
  const email = sellerUser?.email || "merchant@kirana.local";
  const upiId = sellerUser?.dedicatedUpiId || shop.upiId || "kiranasetu@upi";
  const proofs = sellerUser?.businessProofs || [
    {
      type: "GSTIN" as const,
      label: "GSTIN Registration",
      documentNumber: "29AABCU9603R1ZM",
      verified: true,
    },
    {
      type: "MSME" as const,
      label: "MSME Udyam Certificate",
      documentNumber: "UDYAM-KR-03-0021482",
      verified: true,
    },
  ];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-md flex-shrink-0">
            <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center text-amber-400">
              <Store className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white">
                {shop.name}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{t.verifiedMerchant}</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {t.merchantProfileSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 font-mono">
            {isHindi ? "सत्र स्थिति: सक्रिय और सुरक्षित" : "Session: Active & Authenticated"}
          </span>
        </div>
      </div>

      {/* Grid of Verified Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Merchant & Shop Details */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHindi ? "मालिक और स्टोर विवरण" : "Proprietor & Store Details"}</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-neutral-900">
              <span className="text-neutral-400">{t.ownerName}</span>
              <span className="font-bold text-neutral-200">{owner}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-900">
              <span className="text-neutral-400">{t.contactPhone}</span>
              <span className="font-mono text-neutral-200">{phone}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-900">
              <span className="text-neutral-400">{t.contactEmail}</span>
              <span className="font-mono text-neutral-200">{email}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-400">{t.dedicatedUpiIdLabel}</span>
              <span className="font-mono text-amber-400 font-bold">{upiId}</span>
            </div>
          </div>
        </div>

        {/* Verified Business Proofs List */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.verifiedProofsList}</span>
            </h3>
            {onNavigateToMsme && (
              <button
                type="button"
                onClick={onNavigateToMsme}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold transition-colors"
              >
                {isHindi ? "MSME B2B सत्यापन →" : "MSME B2B Status →"}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {/* MSME Udyam Highlight */}
            {sellerUser?.msmeVerification && (
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-emerald-500/30 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>MSME Udyam (Cashify SuperSale Tier)</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                        sellerUser.msmeVerification.status === "verified"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : sellerUser.msmeVerification.status === "pending_review"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {sellerUser.msmeVerification.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-neutral-300 mt-0.5">
                    {sellerUser.msmeVerification.udyamNumber || "Document submission pending"}
                  </div>
                </div>
                <ShieldCheck
                  className={`w-4 h-4 ${
                    sellerUser.msmeVerification.status === "verified"
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                />
              </div>
            )}

            {proofs.map((proof, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>{proof.type}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                      {isHindi ? "सत्यापित" : "Verified"}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-neutral-400 mt-0.5">
                    {proof.documentNumber}
                  </div>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription & Plan Status Card */}
      <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  {isHindi ? "किरानासेतु प्रो सदस्यता (सब्सक्रिप्शन)" : "KiranaSetu Pro Subscription"}
                </h3>
                {subscription?.isPremium ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-neutral-950">
                    Pro Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-800 text-neutral-400">
                    Free Tier
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {subscription?.isPremium
                  ? isHindi
                    ? `सक्रिय प्लान: ₹${subscription.price} / ${subscription.plan === "yearly" ? "वर्ष" : "माह"} • एआई सहायक और प्रो टूल्स अनलॉक हैं।`
                    : `Active Plan: ₹${subscription.price} / ${subscription.plan === "yearly" ? "year" : "month"} • AI Assistant and advanced tools unlocked.`
                  : isHindi
                  ? "₹20/माह या ₹200/वर्ष में एआई सहायक, थोक मूल्य तुलना व वित्तीय लेज़र अनलॉक करें।"
                  : "Subscribe for ₹20/mo or ₹200/yr to unlock Gemini AI Co-Pilot & advanced tools."}
              </p>
            </div>
          </div>

          {onOpenSubscription && (
            <button
              type="button"
              id="merchant-manage-sub-btn"
              onClick={onOpenSubscription}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-center ${
                subscription?.isPremium
                  ? "bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/30"
                  : "bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 font-black shadow-md hover:brightness-110 active:scale-95"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {subscription?.isPremium
                  ? isHindi
                    ? "प्लान प्रबंधित करें"
                    : "Manage Plan"
                  : isHindi
                  ? "प्रो में अपग्रेड करें (₹20/माह)"
                  : "Upgrade to Pro (₹20/mo)"}
              </span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-850">
            <span className="text-neutral-500 block text-[10px]">AI Co-Pilot</span>
            <span className={subscription?.isPremium ? "text-amber-400 font-bold" : "text-neutral-400"}>
              {subscription?.isPremium ? "✓ Active" : "Locked (₹20/mo)"}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-850">
            <span className="text-neutral-500 block text-[10px]">Wholesale Arbitrage</span>
            <span className={subscription?.isPremium ? "text-emerald-400 font-bold" : "text-neutral-400"}>
              {subscription?.isPremium ? "✓ Active" : "Locked (₹20/mo)"}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-850">
            <span className="text-neutral-500 block text-[10px]">Stock Guardian</span>
            <span className={subscription?.isPremium ? "text-cyan-400 font-bold" : "text-neutral-400"}>
              {subscription?.isPremium ? "✓ Active" : "Locked (₹20/mo)"}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-850">
            <span className="text-neutral-500 block text-[10px]">P&L Excel Export</span>
            <span className={subscription?.isPremium ? "text-amber-400 font-bold" : "text-neutral-400"}>
              {subscription?.isPremium ? "✓ Active" : "Locked (₹20/mo)"}
            </span>
          </div>
        </div>
      </div>

      {/* Security Rule Warning Note */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
        <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
        <div className="space-y-1">
          <div className="font-bold text-white">
            {isHindi ? "सक्रिय खाता सुरक्षा प्रतिबंध" : "Active Account Restriction"}
          </div>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            {t.logoutWarningNote}
          </p>
        </div>
      </div>

      {/* Logout Action Area */}
      <div className="pt-2 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-white">
            {isHindi ? "सत्र समाप्ति (लॉगआउट)" : "Session Termination"}
          </h4>
          <p className="text-[11px] text-neutral-400">
            {isHindi
              ? "दुकानदार सत्र समाप्त करने और सुरक्षित रूप से बाहर निकलने के लिए लॉगआउट दबाएं।"
              : "Log out to end this merchant session and allow new logins."}
          </p>
        </div>

        {showConfirmLogout ? (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onLogout}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.confirmLogout}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmLogout(false)}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-xl text-xs transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        ) : (
          <button
            type="button"
            id="seller-logout-btn"
            onClick={() => setShowConfirmLogout(true)}
            className="w-full sm:w-auto px-6 py-3 bg-rose-600/90 hover:bg-rose-500 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-98 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.logoutButtonDanger}</span>
          </button>
        )}
      </div>
    </div>
  );
};
