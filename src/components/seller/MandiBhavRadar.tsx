import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Volume2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Percent,
  Sparkles,
} from "lucide-react";
import { formatINR } from "../../utils/barcode";
import { sounds } from "../../utils/audio";

interface MandiItem {
  id: string;
  name: string;
  hindiName: string;
  category: string;
  wholesaleMandiPrice: number;
  unit: string;
  marketLocation: string;
  recommendedRetailPrice: number;
  trend: "up" | "down" | "stable";
  trendPercent: number;
  notes: string;
}

const MANDI_ITEMS: MandiItem[] = [
  {
    id: "m-1",
    name: "Sugar (M-Grade Refined)",
    hindiName: "चीनी (एम-ग्रेड)",
    category: "Grains & Sugar",
    wholesaleMandiPrice: 38,
    unit: "kg",
    marketLocation: "APMC Wholesale Mandi",
    recommendedRetailPrice: 44,
    trend: "down",
    trendPercent: -2.5,
    notes: "New mill arrivals softening wholesale prices by ₹1/kg.",
  },
  {
    id: "m-2",
    name: "Sharbati Wheat (Atta Quality)",
    hindiName: "शरबती गेहूं (चक्की आटा)",
    category: "Grains & Sugar",
    wholesaleMandiPrice: 28,
    unit: "kg",
    marketLocation: "Khari Baoli / Mandi",
    recommendedRetailPrice: 35,
    trend: "stable",
    trendPercent: 0,
    notes: "Steady demand; ideal time to stock 50kg bags.",
  },
  {
    id: "m-3",
    name: "Mustard Oil (Kachi Ghani Tin)",
    hindiName: "कच्ची घानी सरसों तेल",
    category: "Edible Oils",
    wholesaleMandiPrice: 125,
    unit: "Litre",
    marketLocation: "APMC Oil Terminal",
    recommendedRetailPrice: 155,
    trend: "up",
    trendPercent: 4.2,
    notes: "Global edible oil prices rising; retail margins strong at 24%.",
  },
  {
    id: "m-4",
    name: "Toor / Arhar Dal (Fatka Grade)",
    hindiName: "अरहर दाल (फटका)",
    category: "Pulses",
    wholesaleMandiPrice: 142,
    unit: "kg",
    marketLocation: "APMC Grain Market",
    recommendedRetailPrice: 170,
    trend: "down",
    trendPercent: -3.0,
    notes: "Import buffer stock released; wholesale softening.",
  },
  {
    id: "m-5",
    name: "Agra Potato (Cold Storage)",
    hindiName: "आगरा नया आलू",
    category: "Fresh Produce",
    wholesaleMandiPrice: 18,
    unit: "kg",
    marketLocation: "Azadpur / Yeshwanthpur Mandi",
    recommendedRetailPrice: 28,
    trend: "stable",
    trendPercent: 0,
    notes: "High retail velocity item with 55% gross margin.",
  },
  {
    id: "m-6",
    name: "Nashik Red Onion",
    hindiName: "नासिक लाल प्याज",
    category: "Fresh Produce",
    wholesaleMandiPrice: 24,
    unit: "kg",
    marketLocation: "Lasalgaon / APMC Yard",
    recommendedRetailPrice: 38,
    trend: "up",
    trendPercent: 5.5,
    notes: "Supply tightening due to seasonal weather; keep healthy stock.",
  },
];

interface MandiBhavRadarProps {
  language: "en" | "hi";
}

export const MandiBhavRadar: React.FC<MandiBhavRadarProps> = ({ language }) => {
  const isHindi = language === "hi";
  const [items, setItems] = useState<MandiItem[]>(MANDI_ITEMS);
  const [filterCategory, setFilterCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const categories = ["All", "Grains & Sugar", "Edible Oils", "Pulses", "Fresh Produce"];

  const handleRefresh = () => {
    setIsRefreshing(true);
    sounds.playScanBeep();
    setTimeout(() => {
      setIsRefreshing(false);
      sounds.playSuccessChime();
    }, 700);
  };

  const handleSpeakItem = (item: MandiItem) => {
    const text = isHindi
      ? `आज ${item.hindiName} का थोक भाव ${item.wholesaleMandiPrice} रुपये प्रति ${item.unit} है। दुकान में बिक्री भाव ${item.recommendedRetailPrice} रुपये रखें।`
      : `Today's wholesale rate for ${item.name} is ₹${item.wholesaleMandiPrice} per ${item.unit}. Recommended retail is ₹${item.recommendedRetailPrice}.`;
    sounds.speakText(text, language);
  };

  const filtered = items.filter((item) => {
    const matchCat = filterCategory === "All" || item.category === filterCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hindiName.includes(searchQuery);
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-md flex-shrink-0">
            <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center text-amber-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base sm:text-lg text-white">
                {isHindi ? "थोक मंडी भाव रडार (APMC Mandi Rates)" : "Wholesale Mandi Bhav Radar"}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Live Wholesale Benchmarks
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              {isHindi
                ? "दैनिक थोक भाव, खुदरा मुनाफा (मार्जिन) प्रतिशत और नया माल खरीदने का सही समय"
                : "Real wholesale commodity rates, retail profit margins & smart restocking insights"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-3.5 py-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center gap-2 transition-colors border border-neutral-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isHindi ? "ताज़ा भाव लोड करें" : "Refresh Rates"}</span>
        </button>
      </div>

      {/* Categories & Search Filter */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                filterCategory === cat
                  ? "bg-amber-500 text-neutral-950 shadow"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              {cat === "All" ? (isHindi ? "सभी सामान" : "All Commodities") : cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isHindi ? "मंडी सामान खोजें (दाल, चीनी)..." : "Search commodity..."}
            className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Grid of Mandi Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((item) => {
          const margin = item.recommendedRetailPrice - item.wholesaleMandiPrice;
          const marginPercent = Math.round((margin / item.recommendedRetailPrice) * 100);

          return (
            <div
              key={item.id}
              className="p-4 bg-neutral-900 border border-neutral-800 rounded-3xl space-y-3 shadow-md hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-sm text-neutral-100">
                    {isHindi ? item.hindiName : item.name}
                  </h3>
                  <div className="text-[10px] text-neutral-500">
                    {item.name} • {item.marketLocation}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSpeakItem(item)}
                  className="p-1.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-amber-400 transition-colors"
                  title="Speak rate aloud"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Price comparison card */}
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-neutral-950 rounded-2xl border border-neutral-800 text-center">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    {isHindi ? "थोक मंडी भाव" : "Wholesale Cost"}
                  </span>
                  <div className="font-mono text-base font-black text-amber-400">
                    ₹{item.wholesaleMandiPrice}
                    <span className="text-[10px] font-normal text-neutral-500">/{item.unit}</span>
                  </div>
                </div>

                <div className="border-l border-neutral-800">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    {isHindi ? "दुकान बिक्री भाव" : "Retail Price"}
                  </span>
                  <div className="font-mono text-base font-black text-emerald-400">
                    ₹{item.recommendedRetailPrice}
                    <span className="text-[10px] font-normal text-neutral-500">/{item.unit}</span>
                  </div>
                </div>
              </div>

              {/* Profit Margin & Trend */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[11px] border border-emerald-500/30">
                    {marginPercent}% {isHindi ? "मुनाफा" : "Margin"} (+₹{margin})
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-semibold">
                  {item.trend === "down" ? (
                    <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                      <TrendingDown className="w-3.5 h-3.5" />
                      {Math.abs(item.trendPercent)}% {isHindi ? "सस्ता हुआ" : "down"}
                    </span>
                  ) : item.trend === "up" ? (
                    <span className="text-rose-400 flex items-center gap-0.5 font-bold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +{item.trendPercent}% {isHindi ? "महंगा हुआ" : "up"}
                    </span>
                  ) : (
                    <span className="text-neutral-400 flex items-center gap-0.5">
                      <Minus className="w-3.5 h-3.5" />
                      {isHindi ? "स्थिर" : "stable"}
                    </span>
                  )}
                </div>
              </div>

              {/* Note / Tip */}
              <p className="text-[11px] text-neutral-400 leading-relaxed bg-neutral-800/40 p-2 rounded-xl">
                💡 {item.notes}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
