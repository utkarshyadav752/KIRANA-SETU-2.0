import React, { useState } from "react";
import {
  X,
  Scale,
  Plus,
  Minus,
  Check,
  Calculator,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { LooseCommodity, Product, InvoiceItem } from "../../types";
import { sounds } from "../../utils/audio";

// Standard Kirana loose commodities with typical market pricing
const DEFAULT_COMMODITIES: LooseCommodity[] = [
  { id: "loose-potato", name: "Potato (Aloo)", hindiName: "आलू", category: "Vegetables", pricePerKg: 25, defaultGrams: 1000 },
  { id: "loose-onion", name: "Onion (Pyaaz)", hindiName: "प्याज़", category: "Vegetables", pricePerKg: 35, defaultGrams: 1000 },
  { id: "loose-tomato", name: "Tomato (Tamatar)", hindiName: "टमाटर", category: "Vegetables", pricePerKg: 30, defaultGrams: 500 },
  { id: "loose-sugar", name: "Loose Sugar (Cheeni)", hindiName: "खुली चीनी", category: "Grains & Staples", pricePerKg: 44, defaultGrams: 1000 },
  { id: "loose-aata", name: "Wheat Flour (Chakki Aata)", hindiName: "गेहूं आटा", category: "Grains & Staples", pricePerKg: 36, defaultGrams: 2000 },
  { id: "loose-toor-dal", name: "Toor / Arhar Dal", hindiName: "अरहर दाल", category: "Pulses", pricePerKg: 145, defaultGrams: 500 },
  { id: "loose-moong-dal", name: "Moong Dal Dhuli", hindiName: "मूंग दाल", category: "Pulses", pricePerKg: 115, defaultGrams: 500 },
  { id: "loose-rice", name: "Kolam / Sona Masoori Rice", hindiName: "चावल", category: "Grains & Staples", pricePerKg: 58, defaultGrams: 1000 },
  { id: "loose-besan", name: "Gram Flour (Besan)", hindiName: "बेसन", category: "Grains & Staples", pricePerKg: 95, defaultGrams: 500 },
  { id: "loose-mustard-oil", name: "Loose Mustard Oil", hindiName: "सरसों तेल", category: "Oils", pricePerKg: 155, defaultGrams: 1000 },
  { id: "loose-ginger", name: "Ginger (Adrak)", hindiName: "अदरक", category: "Vegetables", pricePerKg: 120, defaultGrams: 100 },
  { id: "loose-garlic", name: "Garlic (Lahsun)", hindiName: "लहसुन", category: "Vegetables", pricePerKg: 180, defaultGrams: 100 },
  { id: "loose-chillies", name: "Green Chillies (Hari Mirch)", hindiName: "हरी मिर्च", category: "Vegetables", pricePerKg: 80, defaultGrams: 100 },
  { id: "loose-coriander", name: "Fresh Coriander (Dhaniya)", hindiName: "ताज़ा धनिया", category: "Vegetables", pricePerKg: 60, defaultGrams: 100 },
];

const QUICK_WEIGHT_CHIPS = [
  { label: "50g", grams: 50 },
  { label: "100g", grams: 100 },
  { label: "250g", grams: 250 },
  { label: "500g", grams: 500 },
  { label: "750g", grams: 750 },
  { label: "1 kg", grams: 1000 },
  { label: "1.5 kg", grams: 1500 },
  { label: "2 kg", grams: 2000 },
  { label: "5 kg", grams: 5000 },
];

interface LooseWeightCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLooseItem: (item: {
    name: string;
    weightInGrams: number;
    pricePerKg: number;
    totalPrice: number;
    category: string;
  }) => void;
  language?: "en" | "hi";
}

export const LooseWeightCalculatorModal: React.FC<LooseWeightCalculatorModalProps> = ({
  isOpen,
  onClose,
  onAddLooseItem,
  language = "hi",
}) => {
  const isHindi = language === "hi";
  const [selectedCommodity, setSelectedCommodity] = useState<LooseCommodity>(DEFAULT_COMMODITIES[0]);
  const [customName, setCustomName] = useState("");
  const [pricePerKg, setPricePerKg] = useState<number>(DEFAULT_COMMODITIES[0].pricePerKg);
  const [weightGrams, setWeightGrams] = useState<number>(1000);
  const [tareWeight, setTareWeight] = useState<number>(0);
  const [isCustomItem, setIsCustomItem] = useState(false);

  if (!isOpen) return null;

  const netGrams = Math.max(1, weightGrams - tareWeight);
  const calculatedPrice = Math.round(((pricePerKg * netGrams) / 1000) * 100) / 100;

  const handleSelectCommodity = (item: LooseCommodity) => {
    sounds.playScanBeep();
    setSelectedCommodity(item);
    setPricePerKg(item.pricePerKg);
    setWeightGrams(item.defaultGrams);
    setIsCustomItem(false);
  };

  const handleApplyWeight = (grams: number) => {
    sounds.playScanBeep();
    setWeightGrams(grams);
  };

  const handleAdd = () => {
    const finalName = isCustomItem
      ? customName.trim() || (isHindi ? "तौल सामान" : "Loose Item")
      : `${selectedCommodity.name} (${selectedCommodity.hindiName})`;

    sounds.playSuccessChime();
    onAddLooseItem({
      name: `${finalName} - ${netGrams >= 1000 ? (netGrams / 1000).toFixed(2) + "kg" : netGrams + "g"}`,
      weightInGrams: netGrams,
      pricePerKg,
      totalPrice: calculatedPrice,
      category: isCustomItem ? "Loose Produce" : selectedCommodity.category,
    });
    onClose();
  };

  return (
    <div
      id="loose-weight-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-4 py-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                {isHindi ? "तौल वाले सामान का कैलकुलेटर" : "Loose Weight & Produce Calculator"}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {isHindi ? "आलू, प्याज, दाल, चीनी एवं खुले किराना सामान" : "For non-barcoded grains, vegetables & pulses"}
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Item Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-neutral-300">
                {isHindi ? "सामान चुनें:" : "Select Commodity:"}
              </label>
              <button
                onClick={() => {
                  setIsCustomItem(!isCustomItem);
                  if (!isCustomItem) {
                    setCustomName("");
                  }
                }}
                className="text-[11px] text-amber-400 hover:underline font-semibold"
              >
                {isCustomItem
                  ? isHindi ? "प्रीसेट सूची देखें" : "View Presets"
                  : isHindi ? "+ अन्य सामान लिखें" : "+ Custom Item"}
              </button>
            </div>

            {isCustomItem ? (
              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-750 space-y-2">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={isHindi ? "सामान का नाम (उदा. मखाना, खुला गुड़)" : "Custom item name (e.g., Jaggery / Gur)"}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                {DEFAULT_COMMODITIES.map((c) => {
                  const isSelected = selectedCommodity.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCommodity(c)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-amber-500/15 border-amber-500/50 shadow-sm shadow-amber-500/10"
                          : "bg-neutral-950/70 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <div className="text-xs font-bold text-white truncate">{c.name}</div>
                      <div className="text-[10px] text-amber-300 font-mono">
                        ₹{c.pricePerKg}/kg
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pricing & Weight Control Panel */}
          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-4">
            {/* Rate Input */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-neutral-400 font-semibold block mb-1">
                  {isHindi ? "दर (₹ प्रति किलो)" : "Rate (₹ / kg)"}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-neutral-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 font-semibold block mb-1">
                  {isHindi ? "वज़न (ग्राम / kg)" : "Weight (Grams)"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="50"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-neutral-400 font-mono">
                    {weightGrams >= 1000 ? `${(weightGrams / 1000).toFixed(2)} kg` : "grams"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Weight Chips */}
            <div>
              <label className="text-[11px] text-neutral-400 font-semibold block mb-1.5">
                {isHindi ? "त्वरित वजन (Quick Presets):" : "Quick Presets:"}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_WEIGHT_CHIPS.map((chip) => {
                  const isActive = weightGrams === chip.grams;
                  return (
                    <button
                      key={chip.label}
                      onClick={() => handleApplyWeight(chip.grams)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 scale-105"
                          : "bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800"
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tare Container Deduction */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-850 text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <span>{isHindi ? "खाली डिब्बे / थैली का वज़न (Tare):" : "Tare Container Weight:"}</span>
              </span>
              <div className="flex items-center gap-2">
                {[0, 20, 50].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTareWeight(t)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      tareWeight === t
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                    }`}
                  >
                    {t === 0 ? "None" : `-${t}g`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calculated Output Card */}
          <div className="bg-gradient-to-r from-amber-500/10 via-neutral-900 to-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-neutral-400">
                {isHindi ? "शुद्ध वज़न (Net Weight)" : "Net Weight"}
              </div>
              <div className="text-sm font-extrabold text-white flex items-center gap-1">
                <span>{netGrams >= 1000 ? `${(netGrams / 1000).toFixed(3)} kg` : `${netGrams} g`}</span>
                <span className="text-[11px] text-neutral-400 font-normal">
                  (@ ₹{pricePerKg}/kg)
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] text-neutral-400">
                {isHindi ? "कुल मूल्य (Total Amount)" : "Total Price"}
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                ₹{calculatedPrice.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold transition-colors"
          >
            {isHindi ? "रद्द करें" : "Cancel"}
          </button>

          <button
            onClick={handleAdd}
            className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>
              {isHindi ? `बिल में जोड़ें (₹${calculatedPrice})` : `Add to Bill (₹${calculatedPrice})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
