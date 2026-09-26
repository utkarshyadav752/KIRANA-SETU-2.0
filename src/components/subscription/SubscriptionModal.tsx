import React, { useState } from "react";
import {
  X,
  Sparkles,
  Check,
  CheckCircle2,
  Zap,
  Bot,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  QrCode,
  BellRing,
  CreditCard,
  ArrowRight,
  Lock,
  Star,
  Award,
} from "lucide-react";
import { SellerUser, SellerSubscription, SubscriptionPlan } from "../../types";
import { sounds } from "../../utils/audio";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerUser?: SellerUser | null;
  shopId?: string;
  currentSubscription?: SellerSubscription | null;
  onSubscriptionSuccess: (subscription: SellerSubscription) => void;
  language: "en" | "hi";
  initialPlan?: SubscriptionPlan;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  sellerUser,
  shopId,
  currentSubscription,
  onSubscriptionSuccess,
  language,
  initialPlan = "monthly",
}) => {
  const isHindi = language === "hi";

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    initialPlan === "yearly" ? "yearly" : "monthly"
  );
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [upiApp, setUpiApp] = useState<"gpay" | "phonepe" | "paytm" | "bhim">("gpay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPrice = selectedPlan === "yearly" ? 200 : 20;
  const currentDuration = selectedPlan === "yearly" ? (isHindi ? "1 वर्ष" : "1 Year") : (isHindi ? "1 महीना" : "1 Month");

  const PRO_FEATURES = [
    {
      icon: Bot,
      title: isHindi ? "किराना एआई सहायक (Gemini Co-Pilot)" : "Kirana AI Assistant (Gemini Co-Pilot)",
      desc: isHindi
        ? "रीऑर्डरिंग पूर्वानुमान, रीयल-टाइम स्टॉक सुझाव और मुनाफा बढ़ाने के लिए स्मार्ट सलाह।"
        : "Smart restock forecasting, low-stock reorder suggestions, and high-margin product advice.",
    },
    {
      icon: TrendingUp,
      title: isHindi ? "थोक व्यापारी मूल्य तुलना (मल्टी-सप्लायर)" : "Wholesale Margin Comparator",
      desc: isHindi
        ? "Metro FMCG, Udaan और स्थानीय APMC मंडी के लाइव दामों की तुलना और 1-क्लिक खरीद आर्डर।"
        : "Real-time wholesale price arbitrage across Metro, Udaan & Mandis with 1-click PO creation.",
    },
    {
      icon: ShieldCheck,
      title: isHindi ? "स्टॉक गार्जियन प्रेडिक्टिव ऑडिट" : "Stock Guardian Predictive Telemetry",
      desc: isHindi
        ? "अदृश्य स्टॉक चोरी/नुकसान का पूर्वानुमान और शेल्फ एक्सपायरी टाइमलाइन अलर्ट।"
        : "Automated shelf shrinkage risk heatmaps and shelf life expiry warning telemetry.",
    },
    {
      icon: QrCode,
      title: isHindi ? "कस्टम ब्रांडेड काउंटर स्टैंडी क्यूआर" : "Custom Dedicated QR Standee Studio",
      desc: isHindi
        ? "दुकान के नाम और लोगो के साथ डाउनलोड करने योग्य हाई-रेजोल्यूशन काउंटर स्टैंडी।"
        : "Printable high-res shop QR standees with zero-commission direct bank settlements.",
    },
    {
      icon: BellRing,
      title: isHindi ? "प्राथमिकता 30-मिनट पिकअप अलर्ट्स" : "Priority 30-Min Hold Broadcasts",
      desc: isHindi
        ? "ग्राहकों के पिकअप होल्ड और एसएमएस/व्हाट्सएप सूचनाएं सीधे आपके डैशबोर्ड पर।"
        : "Instant sound alerts and automated hold pickup notifications for nearby shoppers.",
    },
    {
      icon: FileSpreadsheet,
      title: isHindi ? "वित्तीय बहीखाता एवं P&L एक्सेल एक्सपोर्ट" : "Financial Ledger & P&L Export",
      desc: isHindi
        ? "दैनिक बिक्री, जीएसटी और कुल शुद्ध लाभ की रिपोर्ट सीएसवी और एक्सेल में एक्सपोर्ट करें।"
        : "One-click export of invoice ledgers, GST tax breakdowns, and net profit analytics.",
    },
  ];

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    sounds.playScanBeep();

    const targetSellerId = sellerUser?.id || (shopId ? "seller-1" : "seller-1");

    try {
      const response = await fetch("/api/seller/subscription/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: targetSellerId,
          plan: selectedPlan,
          paymentMethod: paymentMethod === "upi" ? `UPI (${upiApp.toUpperCase()})` : paymentMethod,
          transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Subscription upgrade failed");
      }

      sounds.playSuccessChime();
      setPaymentSuccess(true);
      onSubscriptionSuccess(data.subscription);

      setTimeout(() => {
        onClose();
        setPaymentSuccess(false);
      }, 1600);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process payment. Please try again.");
      sounds.playWarningBuzz();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="subscription-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-neutral-100 flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-800 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-yellow-950/30 flex items-start justify-between gap-3 relative">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isHindi ? "किरानासेतु प्रो सब्सक्रिप्शन" : "KiranaSetu Pro Suite"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{isHindi ? "एआई असिस्टेंट और प्रो फीचर्स अनलॉक करें" : "Unlock AI Assistant & Pro Features"}</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {isHindi
                ? "किराना दुकानदारों के लिए स्मार्ट एआई इन्वेंट्री सह-पायलट, थोक मूल्य तुलना और प्रीमियम टूल्स।"
                : "Supercharge your Kirana store with real-time Gemini AI assistance, wholesale price intelligence, and advanced analytics."}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {paymentSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">
                  {isHindi ? "किराना प्रो सफलतापूर्वक सक्रिय हुआ!" : "Kirana Pro Activated Successfully!"}
                </h3>
                <p className="text-xs text-neutral-300 font-mono">
                  {isHindi
                    ? `${selectedPlan === "yearly" ? "₹200/वर्ष" : "₹20/माह"} का प्रो प्लान अब आपके स्टोर के लिए सक्रिय है।`
                    : `${selectedPlan === "yearly" ? "₹200/year" : "₹20/month"} plan is now active for ${sellerUser?.shopName || "your store"}.`}
                </p>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs text-amber-400 font-medium">
                {isHindi ? "एआई असिस्टेंट और सभी प्रो सुविधाएं अब खुली हैं!" : "AI Assistant & all premium features unlocked!"}
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Plan Selection Cards: ₹20/month and ₹200/year */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                  {isHindi ? "अपनी सदस्यता योजना चुनें:" : "Choose Subscription Plan:"}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Monthly Plan: ₹20 / month */}
                  <div
                    onClick={() => {
                      sounds.playScanBeep();
                      setSelectedPlan("monthly");
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all relative ${
                      selectedPlan === "monthly"
                        ? "bg-amber-950/30 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500"
                        : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                          {isHindi ? "मासिक योजना" : "Monthly Plan"}
                        </span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl sm:text-3xl font-black text-white">₹20</span>
                          <span className="text-xs text-neutral-400 font-medium">
                            {isHindi ? "/ महीना" : "/ month"}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          selectedPlan === "monthly"
                            ? "bg-amber-500 border-amber-500 text-neutral-950"
                            : "border-neutral-700"
                        }`}
                      >
                        {selectedPlan === "monthly" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-2">
                      {isHindi ? "लचीला भुगतान, कभी भी रद्द करें।" : "Flexible billing, cancel anytime."}
                    </p>
                  </div>

                  {/* Yearly Plan: ₹200 / year (Save ₹40) */}
                  <div
                    onClick={() => {
                      sounds.playScanBeep();
                      setSelectedPlan("yearly");
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all relative overflow-hidden ${
                      selectedPlan === "yearly"
                        ? "bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500"
                        : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    {/* Badge */}
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-neutral-950 font-black text-[9px] uppercase tracking-wide flex items-center gap-1 shadow-sm">
                      <Star className="w-2.5 h-2.5 fill-neutral-950" />
                      <span>{isHindi ? "₹40 की बचत (बेस्ट)" : "Save ₹40 • Best Value"}</span>
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                          {isHindi ? "वार्षिक योजना" : "Annual Plan"}
                        </span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl sm:text-3xl font-black text-amber-400">₹200</span>
                          <span className="text-xs text-neutral-400 font-medium">
                            {isHindi ? "/ वर्ष" : "/ year"}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center mt-4 ${
                          selectedPlan === "yearly"
                            ? "bg-amber-500 border-amber-500 text-neutral-950"
                            : "border-neutral-700"
                        }`}
                      >
                        {selectedPlan === "yearly" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-300 mt-2 font-medium">
                      {isHindi ? "पूरे 12 महीने के लिए निर्बाध एआई उपयोग।" : "12 months of full AI assistance & pro features."}
                    </p>
                  </div>
                </div>
              </div>

              {/* What You Get - Features List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                    {isHindi ? "प्रो प्लान में शामिल सुविधाएं:" : "Features Included with Premium:"}
                  </label>
                  <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>{isHindi ? "पूर्ण व्यावसायिक सुइट" : "Full Kirana Suite"}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PRO_FEATURES.map((feat, idx) => {
                    const Icon = feat.icon;
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-bold text-xs text-white">{feat.title}</div>
                          <div className="text-[11px] text-neutral-400 leading-snug">{feat.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Section */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    {isHindi ? "भुगतान विधि" : "Payment Method"}
                  </span>
                  <span className="text-xs font-mono font-black text-amber-400">
                    {isHindi ? `कुल देय: ₹${currentPrice}` : `Total Payable: ₹${currentPrice}`}
                  </span>
                </div>

                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === "upi"
                        ? "bg-amber-500 text-neutral-950 border-amber-500 shadow-sm"
                        : "bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>UPI (GPay / PhonePe / Paytm)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === "card"
                        ? "bg-amber-500 text-neutral-950 border-amber-500 shadow-sm"
                        : "bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Card / NetBanking</span>
                  </button>
                </div>

                {paymentMethod === "upi" && (
                  <div className="pt-2 flex items-center justify-between gap-3 text-xs bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
                    <span className="text-neutral-400">{isHindi ? "यूपीआई ऐप चुनें:" : "Choose UPI App:"}</span>
                    <div className="flex gap-1.5">
                      {(["gpay", "phonepe", "paytm", "bhim"] as const).map((app) => (
                        <button
                          key={app}
                          type="button"
                          onClick={() => setUpiApp(app)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                            upiApp === app
                              ? "bg-amber-500 text-neutral-950 font-black"
                              : "bg-neutral-800 text-neutral-400 hover:text-white"
                          }`}
                        >
                          {app}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Checkout Action Button */}
              <button
                type="button"
                id="subscribe-pay-btn"
                disabled={isProcessing}
                onClick={handleSubscribe}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-black rounded-2xl text-sm shadow-xl shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    <span>{isHindi ? "सत्यापन एवं सक्रियकरण..." : "Processing & Activating Kirana Pro..."}</span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isHindi
                        ? `₹${currentPrice} का भुगतान करें और तुरंत सक्रिय करें (${currentDuration})`
                        : `Pay ₹${currentPrice} & Activate Instantly (${currentDuration})`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
