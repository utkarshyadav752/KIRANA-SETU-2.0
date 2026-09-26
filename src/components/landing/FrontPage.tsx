import React, { useState } from "react";
import {
  Store,
  ShoppingBag,
  ShieldCheck,
  Zap,
  Barcode,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  PackageCheck,
  Search,
  Users,
  Smartphone,
  ChevronRight,
  HelpCircle,
  Truck,
  IndianRupee,
  Layers,
  Flame,
  Star,
  Quote,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { AppView, Shop, Product } from "../../types";
import { sounds } from "../../utils/audio";
import { FounderSection } from "./FounderSection";

interface FrontPageProps {
  onNavigate: (view: AppView) => void;
  language: "en" | "hi";
  shops?: Shop[];
  products?: Product[];
}

export const FrontPage: React.FC<FrontPageProps> = ({
  onNavigate,
  language,
  shops = [],
  products = [],
}) => {
  const isHindi = language === "hi";

  // Interactive Live Simulator tab state
  const [activeSimulatorTab, setActiveSimulatorTab] = useState<
    "pos" | "stock" | "reservation" | "ai"
  >("pos");

  // POS Mini Simulator State
  const [demoCart, setDemoCart] = useState<
    { id: string; name: string; price: number; qty: number; barcode: string }[]
  >([
    { id: "1", name: "Parle-G Gold (250g)", price: 25, qty: 1, barcode: "8901719114511" },
    { id: "2", name: "Tata Salt Vacuum Evaporated (1kg)", price: 28, qty: 1, barcode: "8901058852332" },
  ]);

  // Stock Guardian Mini Simulator State
  const [expectedStock, setExpectedStock] = useState(24);
  const [physicalCount, setPhysicalCount] = useState(21);
  const [auditReason, setAuditReason] = useState("Unrecorded counter sale");

  // Reservation Mini Simulator State
  const [demoMinutesLeft, setDemoMinutesLeft] = useState(28);
  const [demoAlertSent, setDemoAlertSent] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // POS Simulator Actions
  const handleAddDemoItem = (item: { name: string; price: number; barcode: string }) => {
    sounds.playScanBeep();
    setDemoCart((prev) => {
      const existing = prev.find((p) => p.barcode === item.barcode);
      if (existing) {
        return prev.map((p) =>
          p.barcode === item.barcode ? { ...p, qty: p.qty + 1 } : p
        );
      }
      return [
        ...prev,
        { id: String(Date.now()), name: item.name, price: item.price, qty: 1, barcode: item.barcode },
      ];
    });
  };

  const handleClearDemoCart = () => {
    setDemoCart([]);
  };

  const demoSubtotal = demoCart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const demoTax = Math.round(demoSubtotal * 0.05);
  const demoGrandTotal = demoSubtotal + demoTax;

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative pt-4 sm:pt-10 overflow-hidden">
        {/* Glow ambient background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-20 right-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Trust badges */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-300 shadow-sm">
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isHindi ? "किरानासेतु 2.0" : "KiranaSetu 2.0"}</span>
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isHindi ? "जीरो स्टॉक ड्रिफ्ट गारंटी" : "Zero Silent Stock Drift"}</span>
            </span>
            <span className="text-neutral-600 hidden sm:inline">•</span>
            <span className="text-neutral-400 hidden sm:inline">
              {isHindi ? "स्थानीय दुकानों का डिजिटल साथी" : "Modern Local Commerce"}
            </span>
          </div>

          {/* Main Display Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            {isHindi ? (
              <>
                अपनी किराना दुकान को बनाएं{" "}
                <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                  सुपरफास्ट, आधुनिक और स्मार्ट
                </span>
              </>
            ) : (
              <>
                Empower Your Local Kirana With{" "}
                <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                  Lightning POS & Hyperlocal Commerce
                </span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed">
            {isHindi
              ? "दुकानदारों के लिए 5-सेकंड बारकोड बिलिंग, स्टॉक गार्जियन शेल्फ ऑडिट, और थोक व्यापारी मूल्य तुलना। ग्राहकों के लिए 30-मिनट पिकअप होल्ड और लाइव स्टॉक खोज।"
              : "High-speed continuous barcode billing, Stock Guardian shelf audit that prevents silent loss, 30-minute customer pickup holds, and local store discovery."}
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              id="hero-launch-seller-btn"
              onClick={() => {
                sounds.playSuccessChime();
                onNavigate("seller");
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Store className="w-4 h-4" />
              <span>{isHindi ? "दुकानदार POS शुरू करें" : "Launch Shopkeeper POS"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-launch-customer-btn"
              onClick={() => {
                sounds.playSuccessChime();
                onNavigate("customer");
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-100 border border-neutral-700 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>{isHindi ? "ग्राहक बाज़ार देखें" : "Explore Customer Marketplace"}</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 max-w-4xl mx-auto">
            <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 text-left">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
                <Zap className="w-3.5 h-3.5" />
                <span>{isHindi ? "बिलिंग गति" : "Billing Speed"}</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">&lt; 5 sec</div>
              <div className="text-[11px] text-neutral-400">{isHindi ? "कैमरा व हार्डवेयर बारकोड" : "Fast barcode checkout"}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 text-left">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
                <PackageCheck className="w-3.5 h-3.5" />
                <span>{isHindi ? "स्टॉक सटीकता" : "Stock Accuracy"}</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">99.4%</div>
              <div className="text-[11px] text-neutral-400">{isHindi ? "स्टॉक गार्जियन शेल्फ ऑडिट" : "Zero silent loss drift"}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 text-left">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{isHindi ? "पिकअप होल्ड" : "Pickup Hold"}</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">30 Mins</div>
              <div className="text-[11px] text-neutral-400">{isHindi ? "गारंटीकृत काउंटर रिज़र्वेशन" : "Reserved for customer"}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 text-left">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold mb-1">
                <IndianRupee className="w-3.5 h-3.5" />
                <span>{isHindi ? "प्लेटफ़ॉर्म शुल्क" : "Commission"}</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">₹ 0</div>
              <div className="text-[11px] text-neutral-400">{isHindi ? "100% दुकानदार का मुनाफ़ा" : "Zero aggregator cut"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE ROLE LAUNCHPAD CARDS */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-400">
            {isHindi ? "एकाधिक पोर्टल" : "Role Gateways"}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isHindi ? "एक क्लिक में अपनी भूमिका चुनें" : "Select Your Portal to Get Started"}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            {isHindi
              ? "दुकानदार या ग्राहक के रूप में तुरंत लाइव सिस्टम में प्रवेश करें।"
              : "Switch between the full Kirana POS suite or hyperlocal customer marketplace."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Shopkeeper POS */}
          <div className="group relative rounded-3xl bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/50 p-6 flex flex-col justify-between transition-all hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Store className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block mb-1.5">
                  {isHindi ? "दुकानदारों के लिए" : "Shopkeeper Suite"}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {isHindi ? "सुपरफास्ट किराना POS" : "Retail POS & Stock Suite"}
                </h3>
                <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                  {isHindi
                    ? "कैमरा व हैंडहेल्ड बारकोड बिलिंग, खुले सामान का वजन, स्टॉक गार्जियन शेल्फ ऑडिट, और डिजिटल GST रसीदें।"
                    : "Continuous barcode checkout, loose commodities, Stock Guardian physical reconciliation, and supplier prices."}
                </p>
              </div>

              <ul className="space-y-2 text-xs text-neutral-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>{isHindi ? "हार्डवेयर या फोन कैमरा बारकोड स्कैनर" : "Continuous camera & handheld scanner"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>{isHindi ? "✨ सरल मोड: बड़ी तस्वीरें, आवाज़ व मुद्रा नोट कैलकुलेटर" : "✨ Saral Mode: Large pictures, audio & currency note calculator"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>{isHindi ? "📖 बही-खाता (उधार लेज़र) व आज का गल्ला" : "📖 Digital Khata ledger & Cash Drawer balance"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>{isHindi ? "🌾 थोक मंडी भाव रडार व स्टॉक गार्जियन" : "🌾 Wholesale Mandi Bhav radar & Stock Guardian"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>{isHindi ? "दुकान AI सहायक (Gemini द्वारा संचालित)" : "Store AI assistant answering business queries"}</span>
                </li>
              </ul>
            </div>

            <button
              id="card-open-seller-btn"
              onClick={() => {
                sounds.playScanBeep();
                onNavigate("seller");
              }}
              className="mt-6 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <span>{isHindi ? "POS खोलें" : "Open Shopkeeper POS"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Customer Marketplace */}
          <div className="group relative rounded-3xl bg-neutral-900/80 border border-neutral-800 hover:border-emerald-500/50 p-6 flex flex-col justify-between transition-all hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mb-1.5">
                  {isHindi ? "ग्राहकों के लिए" : "Hyperlocal Marketplace"}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {isHindi ? "पड़ोसी किराना बाज़ार" : "Customer Discovery & Holds"}
                </h3>
                <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                  {isHindi
                    ? "आसपास की दुकानों में स्टॉक जांचें, 30 मिनट के लिए सामान रोकें, और '20 मिनट में आ रहा हूँ' का अलर्ट भेजें।"
                    : "Real-time stock confidence badges, 30-min pickup reservations, and find-everything basket matcher."}
                </p>
              </div>

              <ul className="space-y-2 text-xs text-neutral-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{isHindi ? "30-मिनट गारंटीकृत पिकअप होल्ड" : "30-min guaranteed counter hold"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{isHindi ? "'20 मिनट में आ रहा हूँ' चेतावनी बटन" : "'I'm coming in 20 mins' store alert"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{isHindi ? "स्टॉक ताज़गी टैग (आज जाँचा गया)" : "Inventory confidence & verification tags"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{isHindi ? "एक ही दुकान में पूरी पर्ची खोजने की सुविधा" : "Basket multi-item matcher across shops"}</span>
                </li>
              </ul>
            </div>

            <button
              id="card-open-customer-btn"
              onClick={() => {
                sounds.playSuccessChime();
                onNavigate("customer");
              }}
              className="mt-6 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <span>{isHindi ? "ग्राहक बाज़ार खोलें" : "Open Customer App"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE MINI SIMULATOR SPOTLIGHT */}
      <section className="rounded-3xl bg-neutral-900 border border-neutral-800 p-5 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isHindi ? "लाइव अनुभव सिम्युलेटर" : "Live Feature Playground"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {isHindi ? "देखें कि किरानासेतु कैसे काम करता है" : "Experience KiranaSetu in Action"}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              {isHindi
                ? "बिना किसी सेटअप के मुख्य विशेषताओं का तुरंत परीक्षण करें।"
                : "Test key workflows directly in this interactive sandbox."}
            </p>
          </div>

          {/* Simulator switcher tabs */}
          <div className="flex items-center gap-1.5 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800 self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveSimulatorTab("pos")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeSimulatorTab === "pos"
                  ? "bg-amber-500 text-neutral-950 shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>{isHindi ? "फास्ट POS बिलिंग" : "Fast POS Billing"}</span>
            </button>

            <button
              onClick={() => setActiveSimulatorTab("stock")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeSimulatorTab === "stock"
                  ? "bg-amber-500 text-neutral-950 shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <PackageCheck className="w-3 h-3" />
              <span>{isHindi ? "स्टॉक गार्जियन" : "Stock Guardian"}</span>
            </button>

            <button
              onClick={() => setActiveSimulatorTab("reservation")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeSimulatorTab === "reservation"
                  ? "bg-amber-500 text-neutral-950 shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{isHindi ? "30-मिनट होल्ड" : "30-Min Hold"}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: FAST POS BILLING SIMULATOR */}
        {activeSimulatorTab === "pos" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Barcode scan trigger chips */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                    <Barcode className="w-4 h-4 text-amber-400" />
                    <span>{isHindi ? "बारकोड टेस्ट चिप्स (क्लिक करें)" : "Click Barcode Test Chips to Scan"}</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Audio Beep Enabled
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { name: "Maggi 2-Minute Noodles (70g)", price: 14, barcode: "8901058853412" },
                    { name: "Dettol Antiseptic Liquid (125ml)", price: 45, barcode: "8901396112109" },
                    { name: "Amul Butter Pasteurised (100g)", price: 58, barcode: "8901262010041" },
                    { name: "Fortune Sunlite Oil (1L)", price: 145, barcode: "8906007280015" },
                  ].map((item) => (
                    <button
                      key={item.barcode}
                      onClick={() => handleAddDemoItem(item)}
                      className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-left transition-all flex flex-col justify-between group active:scale-95"
                    >
                      <div className="text-xs font-semibold text-neutral-200 group-hover:text-amber-400 line-clamp-1">
                        {item.name}
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[11px] font-mono">
                        <span className="text-neutral-500 font-normal">#{item.barcode.slice(-4)}</span>
                        <span className="font-bold text-emerald-400">₹{item.price}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-neutral-500">
                  {isHindi
                    ? "वास्तविक ऐप में, आप अपने फोन कैमरे या किसी भी USB/ब्लूटूथ बारकोड गन से लगातार स्कैन कर सकते हैं।"
                    : "In the full app, you can use your phone camera or any physical USB/Bluetooth handheld barcode scanner."}
                </p>
              </div>

              {/* Direct launcher CTA */}
              <button
                onClick={() => {
                  sounds.playScanBeep();
                  onNavigate("seller");
                }}
                className="w-full py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <span>{isHindi ? "पूरी दुकान में POS शुरू करें →" : "Launch Full Barcode POS in Shopkeeper Mode →"}</span>
              </button>
            </div>

            {/* Right: Live Digital Bill Preview */}
            <div className="lg:col-span-6 p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div>
                  <div className="text-xs font-bold text-white tracking-wider uppercase">
                    KIRANA DIGITAL TAX BILL #SIM-042
                  </div>
                  <div className="text-[10px] text-neutral-500">Continuous Auto-Sync Active</div>
                </div>
                {demoCart.length > 0 && (
                  <button
                    onClick={handleClearDemoCart}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-sans"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {demoCart.length === 0 ? (
                  <div className="text-center py-6 text-xs text-neutral-500 font-sans">
                    Cart is empty. Click any item on the left to scan.
                  </div>
                ) : (
                  demoCart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs py-1 border-b border-neutral-900"
                    >
                      <div className="truncate max-w-[200px] text-neutral-300">
                        {item.name} <span className="text-neutral-500">x{item.qty}</span>
                      </div>
                      <div className="font-bold text-white">₹{item.price * item.qty}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-neutral-800 space-y-1 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal:</span>
                  <span>₹{demoSubtotal}</span>
                </div>
                <div className="flex justify-between text-neutral-500 text-[11px]">
                  <span>CGST + SGST (5%):</span>
                  <span>₹{demoTax}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-amber-400 pt-1 border-t border-neutral-800">
                  <span>Grand Total:</span>
                  <span>₹{demoGrandTotal}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => {
                    sounds.playSuccessChime();
                    alert("Demo Bill Paid! In the full app, this generates a printable GST invoice and syncs stock.");
                  }}
                  className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-sans font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simulate Cash / UPI (₹{demoGrandTotal})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STOCK GUARDIAN AUDIT SIMULATOR */}
        {activeSimulatorTab === "stock" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200">
                    {isHindi ? "शेल्फ पर वास्तविक गिनती जांचें" : "Interactive Shelf Verification"}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Zero Silent Loss
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-neutral-400 block mb-1">
                      Product: <strong className="text-neutral-200">Aashirvaad Shudh Chakki Atta (5kg)</strong>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                      <span className="text-neutral-400 block text-[10px] uppercase">System Expected</span>
                      <span className="text-xl font-bold font-mono text-white">{expectedStock} bags</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-neutral-900 border border-amber-500/40">
                      <span className="text-amber-400 block text-[10px] uppercase">Physical Shelf Count</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <button
                          onClick={() => setPhysicalCount((c) => Math.max(0, c - 1))}
                          className="w-6 h-6 rounded bg-neutral-800 text-neutral-200 font-bold hover:bg-neutral-700"
                        >
                          -
                        </button>
                        <span className="text-xl font-bold font-mono text-amber-400">{physicalCount}</span>
                        <button
                          onClick={() => setPhysicalCount((c) => c + 1)}
                          className="w-6 h-6 rounded bg-neutral-800 text-neutral-200 font-bold hover:bg-neutral-700"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {physicalCount !== expectedStock && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Discrepancy Detected: {physicalCount - expectedStock} units</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-400">Mandatory Reason:</span>
                        <select
                          value={auditReason}
                          onChange={(e) => setAuditReason(e.target.value)}
                          className="bg-neutral-950 border border-neutral-700 rounded px-1.5 py-0.5 text-[11px] text-white"
                        >
                          <option>Unrecorded counter sale</option>
                          <option>Damaged in transit / bag leak</option>
                          <option>Expired / Pest damage</option>
                          <option>Misplaced in back storage</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  sounds.playScanBeep();
                  onNavigate("seller");
                }}
                className="w-full py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <span>{isHindi ? "स्टॉक गार्जियन मैनेजर में जाएं →" : "Open Full Stock Guardian & Shelf Audit →"}</span>
              </button>
            </div>

            <div className="lg:col-span-6 space-y-3">
              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="text-xs font-bold text-neutral-300">Why Stock Guardian Solves Kirana's #1 Pain:</div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Traditional software only tracks sales. But in Indian kiranas, stock is lost silently due to
                  forgotten loose sales, customer tasting, bag tears, or rat damage.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Reconciles physical shelf stock with system numbers in under 2 minutes daily.</span>
                  </div>
                  <div className="flex items-start gap-2 text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Logs immutable audit entries with mandatory reason tracking.</span>
                  </div>
                  <div className="flex items-start gap-2 text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Prevents customer disappointment by ensuring online inventory is 100% truthful.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 30-MIN HOLD SIMULATOR */}
        {activeSimulatorTab === "reservation" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-xs font-bold text-neutral-200">
                    {isHindi ? "ग्राहक पिकअप होल्ड पर्ची" : "Customer 30-Min Hold Slip"}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    CODE: #RSV-779
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">Pickup Hold Timer</span>
                    <span className="text-xl font-black font-mono text-emerald-400">
                      {demoMinutesLeft} mins remaining
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="text-neutral-400">Reserved Items (Guaranteed behind counter):</div>
                  <div className="p-2 rounded-lg bg-neutral-900/60 flex justify-between">
                    <span>Amul Taaza Milk (500ml) x 2</span>
                    <span className="font-mono font-bold">₹54</span>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900/60 flex justify-between">
                    <span>Britannia Brown Bread (400g) x 1</span>
                    <span className="font-mono font-bold">₹50</span>
                  </div>
                </div>

                {/* "I'm coming in 20 mins" trigger */}
                <div className="pt-1">
                  <button
                    onClick={() => {
                      sounds.playSuccessChime();
                      setDemoAlertSent(true);
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      demoAlertSent
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-sky-500 hover:bg-sky-400 text-neutral-950 shadow-md"
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>
                      {demoAlertSent
                        ? "✓ Alert Sent: 'I'm coming in 20 mins!'"
                        : "Test Click: 'I'm coming in 20 mins' Alert"}
                    </span>
                  </button>
                  {demoAlertSent && (
                    <span className="text-[10px] text-emerald-400 block text-center mt-1">
                      Shopkeeper receives a flashing audio ping on their POS screen!
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-3">
              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="text-xs font-bold text-neutral-300">Why 30-Minute Holds Change Everything:</div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Shoppers leave their office or home hoping their favorite bread, milk, or curd is in stock,
                  only to find it sold out 15 minutes later. With KiranaSetu, shoppers reserve items with 1 click.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                    <span>Guaranteed 30-minute hold window with live countdown timer.</span>
                  </div>
                  <div className="flex items-start gap-2 text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                    <span>One-touch "I'm coming in 20 mins" ping so the store packs it before you arrive.</span>
                  </div>
                  <div className="flex items-start gap-2 text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                    <span>Converted into an instant POS bill with 1 click at the counter.</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sounds.playSuccessChime();
                    onNavigate("customer");
                  }}
                  className="w-full mt-3 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border border-neutral-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Try It in Customer Marketplace →</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. COMPARISON: KIRANASETU VS OLD WAYS */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            {isHindi ? "तुलना चार्ट" : "The Modern Advantage"}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isHindi ? "पारंपरिक बहीखाता बनाम किरानासेतु" : "Why Traditional Kiranas Are Upgrading"}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 bg-neutral-900/60">
                <th className="p-3.5 font-bold uppercase">{isHindi ? "सुविधा / समस्या" : "Feature / Pain Point"}</th>
                <th className="p-3.5 font-bold uppercase text-rose-400">{isHindi ? "पुरानी मैन्युअल डायरी / खाता" : "Old Manual Diary / Khata"}</th>
                <th className="p-3.5 font-bold uppercase text-amber-400">{isHindi ? "क्विक-कॉमर्स ऐप्स" : "Quick-Commerce Apps"}</th>
                <th className="p-3.5 font-bold uppercase text-emerald-400 bg-emerald-950/20">KiranaSetu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              <tr>
                <td className="p-3.5 font-semibold text-white">{isHindi ? "स्टॉक नुकसान ट्रैकिंग" : "Stock Loss Tracking"}</td>
                <td className="p-3.5 text-neutral-400">{isHindi ? "महीने के अंत तक नुकसान का पता नहीं चलता" : "Silent loss undetected until month end"}</td>
                <td className="p-3.5 text-neutral-400">{isHindi ? "केवल केंद्रीय गोदाम" : "Centralized warehouse only"}</td>
                <td className="p-3.5 font-bold text-emerald-400 bg-emerald-950/20">
                  {isHindi ? "स्टॉक गार्जियन दैनिक भौतिक शेल्फ ऑडिट" : "Stock Guardian daily physical shelf audit"}
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-white">{isHindi ? "प्लेटफ़ॉर्म कमीशन" : "Platform Commission"}</td>
                <td className="p-3.5 text-neutral-400">{isHindi ? "0% (परंतु स्टॉक नुकसान अधिक)" : "0% (but high pilferage losses)"}</td>
                <td className="p-3.5 text-rose-400">{isHindi ? "20%–30% भारी कमीशन" : "High 20%–30% platform cut"}</td>
                <td className="p-3.5 font-bold text-emerald-400 bg-emerald-950/20">
                  {isHindi ? "0% कमीशन (100% दुकानदार का)" : "0% Commission (100% direct to shop)"}
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-white">{isHindi ? "बिलिंग गति" : "Billing Checkout Speed"}</td>
                <td className="p-3.5 text-neutral-400">{isHindi ? "धीमी कलम-कागज़ गणना (30-60 सेकंड)" : "Slow pen & paper math (30-60 sec)"}</td>
                <td className="p-3.5 text-neutral-400">{isHindi ? "लागू नहीं (केवल वेयरहाउस)" : "N/A (Warehouse only)"}</td>
                <td className="p-3.5 font-bold text-emerald-400 bg-emerald-950/20">
                  {isHindi ? "< 5 सेकंड सतत कैमरा व बारकोड" : "< 5 seconds continuous camera barcode"}
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-white">{isHindi ? "ग्राहक प्री-ऑर्डर" : "Customer Pre-Orders"}</td>
                <td className="p-3.5 text-neutral-400">{isHindi ? "अव्यवस्थित फोन कॉल व भूली हुई पर्चियां" : "Messy phone calls & forgotten notes"}</td>
                <td className="p-3.5 text-neutral-400">{isHindi ? "केवल डार्क स्टोर" : "Dark stores only"}</td>
                <td className="p-3.5 font-bold text-emerald-400 bg-emerald-950/20">
                  {isHindi ? "20 मिनट अलर्ट के साथ 30 मिनट पिकअप होल्ड" : "30-Min Pickup Holds with 20-min alert"}
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-white">{isHindi ? "थोक व्यापारी मूल्य तुलना" : "Wholesale Supplier Intel"}</td>
                <td className="p-3.5 text-neutral-400">{isHindi ? "याददाश्त / बिखरी कागजी रसीदें" : "Memory / scattered paper slips"}</td>
                <td className="p-3.5 text-neutral-400">{isHindi ? "केवल आंतरिक" : "Internal only"}</td>
                <td className="p-3.5 font-bold text-emerald-400 bg-emerald-950/20">
                  {isHindi ? "लाइव खरीद लागत तुलना लेज़र" : "Live procurement cost comparison"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. VERIFIED MERCHANT STORIES & TESTIMONIALS */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-400">
            {isHindi ? "दुकानदारों के अनुभव" : "Merchant Stories"}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isHindi ? "भारत के स्थानीय दुकानदारों का भरोसा" : "Trusted by Neighborhood Kiranas"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed italic">
              {isHindi
                ? '"हम पहले बिना दर्ज खुले सामान की बिक्री और एक्सपायर पैकेटों में हर महीने ₹12,000 गंवा देते थे। स्टॉक गार्जियन ने पहले ही हफ्ते में हमारा नुकसान बंद कर दिया।"'
                : '"We used to lose ₹12,000 every month in unrecorded loose sales and expired packets. Stock Guardian shelf checks fixed our inventory in our first week."'}
            </p>
            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">{isHindi ? "रमेश पटेल" : "Ramesh Patel"}</div>
                <div className="text-[10px] text-neutral-500">{isHindi ? "रमेश किराना स्टोर, इंदिरानगर" : "Ramesh Kirana Store, Indiranagar"}</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {isHindi ? "प्रमाणित किराना" : "Verified Kirana"}
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed italic">
              {isHindi
                ? '"दफ्तर से निकलते समय लोग दूध और शाम का नाश्ता बुक कर लेते हैं। जैसे ही वे \'20 मिनट में आ रहा हूँ\' दबाते हैं, हम सामान पैक करके काउंटर पर तैयार रखते हैं!"'
                : '"Office workers reserve their milk and evening snacks before starting their commute. When they tap \'I\'m coming in 20 mins\', we pack it and have it ready at the counter!"'}
            </p>
            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">{isHindi ? "सुरेश गुप्ता" : "Suresh Gupta"}</div>
                <div className="text-[10px] text-neutral-500">{isHindi ? "गुप्ता प्रोविजन स्टोर, दिल्ली" : "Gupta Provisions, Delhi NCR"}</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {isHindi ? "प्रमाणित किराना" : "Verified Kirana"}
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed italic">
              {isHindi
                ? '"थोक सप्लायर तुलना की सुविधा बहुत उपयोगी है। यह तुरंत बता देती है कि फॉर्च्यून तेल मेट्रो से मंगाना है या श्री लक्ष्मी ट्रेडर्स से, जिससे ₹8 प्रति पाउच बचते हैं।"'
                : '"The wholesale supplier comparison is pure gold. It automatically tells me whether to order Fortune oil from Metro Wholesalers or Sri Lakshmi Traders to save ₹8 per pouch."'}
            </p>
            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">{isHindi ? "लक्ष्मी नारायण" : "Laxmi Narayan"}</div>
                <div className="text-[10px] text-neutral-500">{isHindi ? "लक्ष्मी जनरल स्टोर, मुंबई" : "Laxmi General Store, Mumbai"}</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {isHindi ? "प्रमाणित किराना" : "Verified Kirana"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOUNDER SECTION: Utkarsh Yadav */}
      <FounderSection language={language} />

      {/* 7. FAQ ACCORDION */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-sky-400">
            {isHindi ? "अक्सर पूछे जाने वाले प्रश्न" : "Got Questions?"}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isHindi ? "सामान्य प्रश्न व उत्तर" : "Frequently Asked Questions"}
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: isHindi ? "क्या मुझे महंगे बारकोड स्कैनर हार्डवेयर की आवश्यकता है?" : "Do I need expensive dedicated barcode scanner hardware?",
              a: isHindi
                ? "नहीं! किरानासेतु आपके फोन या लैपटॉप के कैमरे को हाई-स्पीड बारकोड स्कैनर के रूप में इस्तेमाल करता है। यदि आपके पास सामान्य USB या ब्लूटूथ बारकोड गन है, तो वह भी स्वतः काम करती है।"
                : "Not at all! KiranaSetu turns your smartphone, tablet, or laptop camera into a continuous high-speed barcode scanner. Standard USB and Bluetooth handheld barcode scanners are also automatically supported without driver setup.",
            },
            {
              q: isHindi ? "स्टॉक गार्जियन चुपचाप होने वाले नुकसान को कैसे रोकता है?" : "How does Stock Guardian eliminate silent stock drift?",
              a: isHindi
                ? "स्टॉक गार्जियन दैनिक रूप से आपकी अलमारियों पर रखी वस्तुओं की संख्या की तुलना सिस्टम के आंकड़ों से करता है। अंतर मिलने पर यह कारण (जैसे बेहिसाब बिक्री, टूट-फूट या समाप्ति) दर्ज कर स्टॉक लेज़र को अद्यतित करता है।"
                : "Stock Guardian guides shopkeepers through rapid shelf checks where physical counts are reconciled with expected numbers. Any difference mandates a category tag (e.g. unrecorded sale, damage, expiry), updating the immutable ledger and eliminating phantom inventory.",
            },
            {
              q: isHindi ? "30-मिनट पिकअप होल्ड कैसे काम करता है?" : "How do 30-minute customer pickup holds work?",
              a: isHindi
                ? "ग्राहक ऐप में उपलब्ध वस्तुओं को 30 मिनट के लिए रिज़र्व कर सकते हैं। दुकानदार को स्क्रीन पर सूचना मिलती है, और काउंटर पर पहुंचने पर 1 क्लिक में डिजिटल टैक्स बिल बन जाता है।"
                : "Customers discover nearby shops and hold items for 30 minutes with an active countdown timer. When they trigger 'I'm coming in 20 mins', the store packs it ahead of time. Counter pickup converts the hold to a completed POS bill in 1 second.",
            },
            {
              q: isHindi ? "क्या कोई मासिक सदस्यता या कमीशन शुल्क है?" : "Is there any commission or subscription cut?",
              a: isHindi
                ? "नहीं, किरानासेतु 0% कमीशन पर संचालित होता है। सभी भुगतान सीधे ग्राहक और दुकानदार के बीच नकद या UPI द्वारा होते हैं।"
                : "Zero commissions. Unlike delivery aggregators who shave 20-30% from small margins, KiranaSetu empowers direct counter transactions with 100% margin retained by the shopkeeper.",
            },
            {
              q: isHindi ? "किरानासेतु के संस्थापक कौन हैं और मैं उनसे कैसे संपर्क कर सकता हूँ?" : "Who founded KiranaSetu and how can I contact the founder directly?",
              a: isHindi
                ? "किरानासेतु के संस्थापक उत्कर्ष यादव (Utkarsh Yadav) हैं। आप उनसे सीधे फोन नंबर +91 9554460651 या ईमेल utkarshyadav752@gmail.com पर कॉल, व्हाट्सएप या ईमेल द्वारा संपर्क कर सकते हैं। दुकानदारों के लिए सीधी हेल्पलाइन हमेशा खुली है।"
                : "KiranaSetu is founded by Utkarsh Yadav. You can reach him directly via phone or WhatsApp at +91 9554460651 or email at utkarshyadav752@gmail.com for store onboarding, feature requests, or direct technical support.",
            },
          ].map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-neutral-900/70 border border-neutral-800 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-white hover:text-amber-400 transition-colors"
                >
                  <span>{item.q}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-neutral-400 transition-transform ${
                      isOpen ? "rotate-90 text-amber-400" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-neutral-300 leading-relaxed border-t border-neutral-800/60">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. BOTTOM LAUNCH BANNER */}
      <section className="rounded-3xl bg-gradient-to-tr from-amber-500/20 via-neutral-900 to-emerald-500/20 border border-neutral-800 p-6 sm:p-10 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          {isHindi ? "अपनी दुकान को डिजिटल करने के लिए तैयार हैं?" : "Ready to Modernize Your Kirana Store?"}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-300 max-w-xl mx-auto">
          {isHindi
            ? "शून्य कमीशन, 5-सेकंड बिलिंग और सटीक स्टॉक प्रबंधन के साथ आज ही शुरुआत करें।"
            : "Join India's next-generation local retail revolution. Zero commission, rapid barcode billing, and zero silent stock drift."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              sounds.playSuccessChime();
              onNavigate("seller");
            }}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
          >
            <Store className="w-4 h-4" />
            <span>{isHindi ? "दुकानदार POS खोलें" : "Open Shopkeeper POS"}</span>
          </button>

          <button
            onClick={() => {
              sounds.playSuccessChime();
              onNavigate("customer");
            }}
            className="px-6 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-100 border border-neutral-700 font-bold text-xs flex items-center gap-2 transition-all hover:scale-105"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>{isHindi ? "ग्राहक बाज़ार देखें" : "Explore Customer Marketplace"}</span>
          </button>
        </div>
      </section>
    </div>
  );
};
