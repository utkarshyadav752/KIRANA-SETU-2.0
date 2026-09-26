import React, { useState } from "react";
import { Product } from "../../types";
import { formatINR } from "../../utils/barcode";
import { sounds } from "../../utils/audio";
import { Volume2, Plus, Check, Sparkles } from "lucide-react";

interface FastProductGridProps {
  products: Product[];
  onAddProduct: (product: Product, quantity?: number) => void;
  language: "en" | "hi";
  saralMode?: boolean;
}

export const FastProductGrid: React.FC<FastProductGridProps> = ({
  products,
  onAddProduct,
  language,
  saralMode = false,
}) => {
  const isHindi = language === "hi";
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const categories = [
    { id: "All", label: isHindi ? "सभी सामान" : "All Fast Items", icon: "⚡" },
    { id: "Dairy", label: isHindi ? "दूध व दही" : "Dairy & Milk", icon: "🥛" },
    { id: "Grains", label: isHindi ? "आटा व दाल" : "Flour & Grains", icon: "🌾" },
    { id: "Snacks", label: isHindi ? "बिस्कुट व मैगी" : "Snacks & Biscuits", icon: "🍪" },
    { id: "Cooking", label: isHindi ? "तेल, नमक व चीनी" : "Oil, Salt & Sugar", icon: "🧂" },
    { id: "Personal Care", label: isHindi ? "साबुन व सफाई" : "Soap & Cleaning", icon: "🧼" },
  ];

  const handleCardClick = (product: Product) => {
    sounds.playScanBeep();
    onAddProduct(product, 1);
    setLastAddedId(product.id);
    setTimeout(() => setLastAddedId(null), 800);
  };

  const handleSpeak = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    sounds.speakItem(product.hindiName || product.name, product.sellingPrice, language);
  };

  // Filter products
  const fastProducts = products
    .filter((p) => p.status === "active")
    .filter((p) => {
      if (selectedCategory === "All") return true;
      if (selectedCategory === "Dairy")
        return (
          p.category.toLowerCase().includes("dairy") ||
          p.name.toLowerCase().includes("milk") ||
          p.name.toLowerCase().includes("curd") ||
          p.name.toLowerCase().includes("butter")
        );
      if (selectedCategory === "Grains")
        return (
          p.category.toLowerCase().includes("grain") ||
          p.name.toLowerCase().includes("atta") ||
          p.name.toLowerCase().includes("rice") ||
          p.name.toLowerCase().includes("dal")
        );
      if (selectedCategory === "Snacks")
        return (
          p.category.toLowerCase().includes("snack") ||
          p.name.toLowerCase().includes("biscuit") ||
          p.name.toLowerCase().includes("maggi") ||
          p.name.toLowerCase().includes("parle")
        );
      if (selectedCategory === "Cooking")
        return (
          p.category.toLowerCase().includes("oil") ||
          p.category.toLowerCase().includes("spices") ||
          p.name.toLowerCase().includes("salt") ||
          p.name.toLowerCase().includes("sugar") ||
          p.name.toLowerCase().includes("oil")
        );
      if (selectedCategory === "Personal Care")
        return (
          p.category.toLowerCase().includes("care") ||
          p.name.toLowerCase().includes("soap") ||
          p.name.toLowerCase().includes("surf")
        );
      return true;
    });

  return (
    <div className="space-y-3">
      {/* Category Pills with Emoji Icons */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? "bg-amber-500 text-neutral-950 shadow-md scale-100"
                : "bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Visual Product Grid */}
      <div
        className={`grid gap-2.5 ${
          saralMode
            ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        }`}
      >
        {fastProducts.map((p) => {
          const isJustAdded = lastAddedId === p.id;
          const isOutOfStock = p.currentStock <= 0;

          return (
            <div
              key={p.id}
              onClick={() => !isOutOfStock && handleCardClick(p)}
              className={`group relative rounded-3xl p-2.5 text-left border transition-all cursor-pointer select-none flex flex-col justify-between ${
                isOutOfStock
                  ? "bg-neutral-950/60 border-neutral-800/60 opacity-50 cursor-not-allowed"
                  : isJustAdded
                  ? "bg-emerald-950/60 border-emerald-500 scale-[1.03] shadow-lg shadow-emerald-500/20"
                  : "bg-neutral-950 hover:bg-neutral-800/80 border-neutral-800 hover:border-amber-500/60 shadow-md active:scale-95"
              }`}
            >
              {/* Product Image */}
              <div className="relative w-full aspect-square rounded-2xl bg-neutral-900 overflow-hidden mb-2 border border-neutral-800/80">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback visual icon
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />

                {/* Speaker Voice Button */}
                <button
                  type="button"
                  onClick={(e) => handleSpeak(e, p)}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-xl bg-black/75 hover:bg-amber-500 hover:text-neutral-950 text-amber-300 flex items-center justify-center transition-colors shadow-sm"
                  title="Speak product and price"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>

                {/* Stock badge */}
                <span
                  className={`absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-lg text-[9px] font-mono font-bold ${
                    isOutOfStock
                      ? "bg-rose-500/90 text-white"
                      : "bg-neutral-900/90 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {isOutOfStock ? "Out of stock" : `${p.currentStock} ${p.unit}`}
                </span>
              </div>

              {/* Title & Price */}
              <div className="space-y-1">
                <h4 className="font-extrabold text-xs text-neutral-100 line-clamp-1 leading-tight group-hover:text-amber-300 transition-colors">
                  {p.name}
                </h4>
                {p.hindiName && (
                  <p className="text-[10px] text-neutral-400 line-clamp-1 font-medium">
                    {p.hindiName}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono text-sm sm:text-base font-black text-amber-400">
                    {formatINR(p.sellingPrice)}
                  </span>

                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold transition-all ${
                      isJustAdded
                        ? "bg-emerald-500 text-neutral-950 animate-bounce"
                        : "bg-neutral-800 group-hover:bg-amber-500 text-neutral-300 group-hover:text-neutral-950"
                    }`}
                  >
                    {isJustAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
