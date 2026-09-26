import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Receipt,
  Calendar,
  CreditCard,
  QrCode,
  Bot,
  Lock,
  FileText,
  Check,
  Zap,
  ArrowRight,
  TrendingUp,
  Store,
  Clock,
  HelpCircle,
} from "lucide-react";
import { Shop, SellerUser, SellerSubscription } from "../../types";
import { formatINR } from "../../utils/barcode";

interface DashboardSubscriptionSectionProps {
  subscription: SellerSubscription;
  shop: Shop;
  sellerUser?: SellerUser | null;
  onOpenUpgrade: () => void;
  language: "en" | "hi";
}

export const DashboardSubscriptionSection: React.FC<DashboardSubscriptionSectionProps> = ({
  subscription,
  shop,
  sellerUser,
  onOpenUpgrade,
  language,
}) => {
  const isHindi = language === "hi";
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);

  const isPro = subscription.isPremium;
  const planName = isPro
    ? subscription.plan === "yearly"
      ? isHindi
        ? "किराना प्रो (वार्षिक योजना)"
        : "Kirana Pro (Annual Plan)"
      : isHindi
      ? "किराना प्रो (मासिक योजना)"
      : "Kirana Pro (Monthly Plan)"
    : isHindi
    ? "किराना बेसिक (मुफ़्त टियर)"
    : "Kirana Basic (Free Tier)";

  const planPrice = isPro
    ? subscription.plan === "yearly"
      ? "₹200"
      : "₹20"
    : "₹0";

  const billingCycle = isPro
    ? subscription.plan === "yearly"
      ? isHindi
        ? "प्रति वर्ष (2 महीने मुफ़्त)"
        : "per year (2 months free)"
      : isHindi
      ? "प्रति माह"
      : "per month"
    : isHindi
    ? "आजीवन मुफ़्त"
    : "Free forever";

  const startDateFormatted = subscription.startDate
    ? new Date(subscription.startDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  const endDateFormatted = subscription.endDate
    ? new Date(subscription.endDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Ongoing";

  const licenseId =
    subscription.transactionId ||
    `KRN-PRO-${shop.id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "STORE"}-2026`;

  const upiId = sellerUser?.dedicatedUpiId || shop.upiId || "kiranasetu@okhdfcbank";

  const featureMatrix = [
    {
      title: isHindi ? "जेमिनी एआई किराना सह-पायलट" : "Gemini AI Kirana Co-Pilot",
      desc: isHindi
        ? "मांग पूर्वानुमान, धीमी गति से बिकने वाले सामान की चेतावनी व बिक्री अनुकूलन"
        : "Predictive restock forecasts, dead stock warnings, and daily sales tips",
      proOnly: true,
      unlocked: isPro,
      icon: Bot,
    },
    {
      title: isHindi ? "थोक व एपीएमसी मंडी भाव तुलना" : "Mandi & Wholesale Rate Arb Engine",
      desc: isHindi
        ? "मेट्रो कैश एंड कैरी, उड़ान और स्थानीय मंडी दरों के साथ लाइव मार्जिन विश्लेषण"
        : "Live benchmark pricing against Metro Cash & Carry, APMC Mandi, and Udaan",
      proOnly: true,
      unlocked: isPro,
      icon: TrendingUp,
    },
    {
      title: isHindi ? "स्टॉक गार्जियन टेलीमेट्री व ऑडिट" : "Stock Guardian Drift Telemetry",
      desc: isHindi
        ? "शारीरिक व सिस्टम इन्वेंट्री विचलन का स्वचालित पता लगाना व त्रुटि लॉगिंग"
        : "Automated shelf stock drift tracking, loss prevention, and discrepancy audit",
      proOnly: true,
      unlocked: isPro,
      icon: ShieldCheck,
    },
    {
      title: isHindi ? "स्थानीय खरीदारों में प्राथमिकता" : "Hyperlocal Discovery Priority",
      desc: isHindi
        ? "निकटवर्ती ग्राहकों की खोज में शीर्ष स्थान व 30-मिनट पिकअप होल्ड आरक्षण"
        : "Featured placement for nearby customer searches and 30-minute reserve holds",
      proOnly: true,
      unlocked: isPro,
      icon: Store,
    },
    {
      title: isHindi ? "असीमित बारकोड व पीओएस बिलिंग" : "Unlimited Barcode & POS Billing",
      desc: isHindi
        ? "फास्ट थर्मल रसीद, जीएसटीआईएन गणना व ध्वनि सूचना एकीकरण"
        : "Ultra-fast thermal printing, GST rates, and audio payment confirmations",
      proOnly: false,
      unlocked: true,
      icon: Receipt,
    },
    {
      title: isHindi ? "समर्पित यूपीआई व 24/7 सहायता" : "Dedicated Settlement & Support",
      desc: isHindi
        ? "प्रत्यक्ष बैंक खाता निपटान, व्हाट्सएप व्यापारी सहायता व हार्डवेयर गाइड"
        : "Direct merchant VPA settlement, priority WhatsApp desk, and hardware support",
      proOnly: false,
      unlocked: true,
      icon: QrCode,
    },
  ];

  return (
    <div
      id="dashboard-subscription-section"
      className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              {isHindi ? "स्टोर सदस्यता एवं लाइसेंस विवरण" : "Store Subscription & Licensing"}
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isPro
                  ? "bg-amber-500 text-neutral-950 shadow-sm"
                  : "bg-neutral-800 text-neutral-400 border border-neutral-700 font-mono"
              }`}
            >
              {isPro ? "PRO ACTIVE" : "FREE TIER"}
            </span>
          </div>
          <p className="text-xs text-neutral-400 pl-10">
            {isHindi
              ? "आपके किराना स्टोर का सक्रिय व्यावसायिक प्लान, बिलिंग चक्र और एआई टूल अनुमतियां।"
              : "Comprehensive billing details, renewal schedules, and verified tier entitlements for your store."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center pl-10 sm:pl-0">
          <button
            type="button"
            id="sub-details-upgrade-cta"
            onClick={onOpenUpgrade}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              isPro
                ? "bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700"
                : "bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-neutral-950 font-black"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isPro
                ? isHindi
                  ? "प्लान बदलें / नवीनीकरण"
                  : "Change / Manage Plan"
                : isHindi
                ? "प्रो में अपग्रेड करें (₹20/माह)"
                : "Upgrade to Pro (₹20/mo)"}
            </span>
          </button>
        </div>
      </div>

      {/* Primary Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Active Plan Specifications */}
        <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                {isHindi ? "योजना विवरण" : "Plan Overview"}
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                {isPro ? "Auto-Renewing" : "Standard"}
              </span>
            </div>

            <div>
              <div className="text-lg font-black text-white">{planName}</div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black font-mono text-amber-400">
                  {planPrice}
                </span>
                <span className="text-xs text-neutral-400 font-medium">
                  {billingCycle}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-900 space-y-2 text-xs">
              <div className="flex justify-between items-center text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{isHindi ? "सक्रिय तिथि" : "Activated On"}</span>
                </span>
                <span className="font-mono text-neutral-200">{startDateFormatted}</span>
              </div>

              <div className="flex justify-between items-center text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{isHindi ? "वैधता / नवीनीकरण" : "Valid Through"}</span>
                </span>
                <span className="font-mono text-neutral-200">
                  {isPro ? endDateFormatted : "Lifetime"}
                </span>
              </div>

              <div className="flex justify-between items-center text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{isHindi ? "लाइसेंस आईडी" : "License Ref"}</span>
                </span>
                <span className="font-mono text-[11px] text-amber-400 font-semibold truncate max-w-[130px]">
                  {licenseId}
                </span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isHindi ? "सुरक्षा स्थिति" : "Audit Status"}</span>
            </span>
            <span className="text-emerald-400 font-bold">
              {isHindi ? "सत्यापित" : "Verified Safe"}
            </span>
          </div>
        </div>

        {/* Column 2: Payment & Settlement Details */}
        <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                {isHindi ? "भुगतान व निपटान" : "Settlement & Payment"}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Direct VPA
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-neutral-400">
                {isHindi ? "समर्पित व्यापारी यूपीआई आईडी" : "Linked Merchant Settlement UPI"}
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 font-mono text-xs text-amber-400 font-bold flex items-center justify-between">
                <span className="truncate">{upiId}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 ml-1" />
              </div>
              <p className="text-[10px] text-neutral-500">
                {isHindi
                  ? "सभी ग्राहक भुगतान और पिकअप होल्ड बिना किसी देरी के सीधे इस खाते में जमा होते हैं।"
                  : "Direct 0% MDR instant bank deposits for all customer pickup orders & counter payments."}
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-900 space-y-2 text-xs">
              <div className="flex justify-between items-center text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{isHindi ? "भुगतान विधि" : "Billing Method"}</span>
                </span>
                <span className="text-neutral-200 font-medium">
                  {subscription.paymentMethod || "UPI Instant (PhonePe/GPay)"}
                </span>
              </div>

              <div className="flex justify-between items-center text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{isHindi ? "जीएसटी चालान" : "Tax Invoice"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowInvoicesModal(true)}
                  className="text-amber-400 hover:underline font-medium text-[11px]"
                >
                  {isHindi ? "चालान देखें" : "View Invoice"}
                </button>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{isHindi ? "किरानासेट लेज़र सिंक" : "Ledger Sync"}</span>
            </span>
            <span className="text-neutral-300 font-mono font-semibold">Real-Time</span>
          </div>
        </div>

        {/* Column 3: Plan Actions & Tier Comparison */}
        <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                {isHindi ? "योजना नियंत्रण" : "Plan Management"}
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                {isPro ? "PRO TIER" : "BASIC TIER"}
              </span>
            </div>

            {isPro ? (
              <div className="space-y-2">
                <div className="text-xs text-neutral-300">
                  {isHindi
                    ? "आपकी दुकान पर सभी प्रो सुविधाएं सक्रिय हैं।"
                    : "Your store enjoys full access to intelligent Kirana AI and analytics."}
                </div>
                {subscription.plan === "monthly" ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isHindi ? "वार्षिक योजना पर ₹40 बचाएं" : "Save ₹40 with Annual Plan"}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      {isHindi
                        ? "₹200/वर्ष पर स्विच करें और 2 महीने मुफ़्त प्राप्त करें।"
                        : "Switch to ₹200/year to get 12 months for the price of 10."}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isHindi ? "सर्वोत्तम मूल्य योजना सक्रिय" : "Best Value Plan Active"}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      {isHindi
                        ? "आप ₹200/वर्ष के वार्षिक प्लान पर 2 महीने मुफ़्त का आनंद ले रहे हैं।"
                        : "You have secured the annual discount with full uninterrupted access."}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-neutral-300">
                  {isHindi
                    ? "एआई और थोक दर तुलना जैसे टूल्स केवल प्रो सदस्यों के लिए उपलब्ध हैं।"
                    : "Gemini AI Co-Pilot and Wholesale Mandi arbitrage require Kirana Pro."}
                </div>
                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>₹20 / {isHindi ? "माह" : "month"}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    {isHindi
                      ? "बिना किसी लॉक-इन अवधि के तुरंत सक्रिय करें। कभी भी रद्द करें।"
                      : "Instant UPI activation with zero lock-in. Cancel anytime."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-neutral-900">
            <button
              type="button"
              id="sub-action-primary-btn"
              onClick={onOpenUpgrade}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isPro
                  ? isHindi
                    ? "सदस्यता अपग्रेड / नवीनीकरण"
                    : "Upgrade or Switch Tier"
                  : isHindi
                  ? "₹20/माह में प्रो सक्रिय करें"
                  : "Activate Pro for ₹20/mo"}
              </span>
            </button>
            <div className="text-center">
              <span className="text-[10px] text-neutral-500">
                {isHindi
                  ? "सुरक्षित एनपीसीआई यूपीआई गेटवे • शून्य छिपे हुए शुल्क"
                  : "Secured by NPCI UPI Gateway • Zero hidden processing fees"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature & Entitlement Matrix Breakdown */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>{isHindi ? "योजना अनुसार सुविधाएं और अनुमतियां" : "Feature Entitlements & Capability Matrix"}</span>
          </h4>
          <span className="text-[11px] text-neutral-500">
            {isPro
              ? isHindi
                ? "सभी 6 सुविधाएं सक्रिय हैं"
                : "All 6 modules active"
              : isHindi
              ? "2 मानक सक्रिय, 4 प्रो सुविधाएं लॉक"
              : "2 standard active, 4 pro features locked"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {featureMatrix.map((feat, idx) => {
            const IconComponent = feat.icon;
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                  feat.unlocked
                    ? "bg-neutral-950 border-neutral-800"
                    : "bg-neutral-950/50 border-neutral-800/60 opacity-60"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    feat.unlocked
                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                      : "bg-neutral-900 border border-neutral-800 text-neutral-500"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-white truncate">
                      {feat.title}
                    </span>
                    {feat.unlocked ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
                        {isHindi ? "सक्रिय" : "Active"}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 flex-shrink-0">
                        Pro Only
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice Details Modal */}
      {showInvoicesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm text-white">
                  {isHindi ? "सदस्यता टैक्स इनवॉइस" : "Subscription Tax Invoice"}
                </h4>
              </div>
              <button
                onClick={() => setShowInvoicesModal(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg bg-neutral-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-800/80">
                <span className="text-neutral-400">Store Name</span>
                <span className="font-bold text-neutral-100">{shop.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/80">
                <span className="text-neutral-400">Proprietor</span>
                <span className="text-neutral-200">{sellerUser?.ownerName || shop.ownerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/80">
                <span className="text-neutral-400">Invoice Number</span>
                <span className="font-mono text-neutral-200">{licenseId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/80">
                <span className="text-neutral-400">Plan Tier</span>
                <span className="text-amber-400 font-bold">{planName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/80">
                <span className="text-neutral-400">Billing Period</span>
                <span className="font-mono text-neutral-200">{startDateFormatted} – {endDateFormatted}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/80">
                <span className="text-neutral-400">Base Amount</span>
                <span className="font-mono text-neutral-200">{planPrice}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/80">
                <span className="text-neutral-400">GST (0% for Micro MSME SaaS)</span>
                <span className="font-mono text-emerald-400">₹0.00</span>
              </div>
              <div className="flex justify-between py-1.5 text-sm font-bold">
                <span className="text-white">Total Paid</span>
                <span className="font-mono text-amber-400">{planPrice}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400">
              Payment confirmed via UPI settlement reference {licenseId}. Valid for retail store operation & input tax record.
            </div>

            <button
              onClick={() => setShowInvoicesModal(false)}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs"
            >
              {isHindi ? "बंद करें" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
