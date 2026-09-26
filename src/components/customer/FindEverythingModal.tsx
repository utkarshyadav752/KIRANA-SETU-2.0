import React, { useState } from "react";
import {
  X,
  Sparkles,
  ShoppingBag,
  Store,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ChevronRight,
  Plus,
} from "lucide-react";
import { formatINR } from "../../utils/barcode";
import { Shop, Product } from "../../types";

interface FindEverythingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShopToReserve: (shop: Shop, matchedProducts: Product[]) => void;
}

export const FindEverythingModal: React.FC<FindEverythingModalProps> = ({
  isOpen,
  onClose,
  onSelectShopToReserve,
}) => {
  const [itemsText, setItemsText] = useState("Milk, Bread, Eggs, Maggi, Tata Salt");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const presets = [
    { label: "Daily Essentials", items: "Milk, Bread, Eggs, Tata Salt, Maggi" },
    { label: "Tea Time", items: "Tea, Milk, Parle-G, Good Day Cookies" },
    { label: "Cooking Staples", items: "Atta, Sunflower Oil, Tomatoes, Onions, Salt" },
    { label: "Hygiene", items: "Dettol Soap, Colgate, Dishwash" },
  ];

  const handleSearch = async (textToUse?: string) => {
    const raw = textToUse || itemsText;
    const items = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (items.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/marketplace/find-everything", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemNames: items }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 w-full max-w-2xl shadow-2xl space-y-4 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Find Everything in One Shop
              </h3>
              <p className="text-xs text-neutral-400">
                Discover which nearby neighborhood kirana has your entire grocery list in stock right now!
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-neutral-400 block">
            Popular Quick Baskets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setItemsText(p.items);
                  handleSearch(p.items);
                }}
                className="px-2.5 py-1 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 font-medium transition-colors"
              >
                + {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={itemsText}
            onChange={(e) => setItemsText(e.target.value)}
            placeholder="Type items comma-separated: Milk, Bread, Eggs, Maggi..."
            className="flex-1 px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-all"
          >
            {loading ? "Matching..." : "Compare Shops"}
          </button>
        </div>

        {/* Results List */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
          {results.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-xs">
              Click &quot;Compare Shops&quot; to discover which nearby stores have your basket.
            </div>
          ) : (
            results.map((r, idx) => {
              const allMatched = r.missingCount === 0;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl bg-neutral-950 border transition-all ${
                    allMatched
                      ? "border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                      : "border-neutral-800"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-white">{r.shop.name}</h4>
                        {allMatched && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            100% IN STOCK
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-400" />
                          {r.distanceKm} km away ({r.shop.area})
                        </span>
                        <span>•</span>
                        <span>⭐ {r.shop.rating}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-amber-400">
                        {formatINR(r.estimatedTotal)}
                      </div>
                      <span className="text-[10px] text-neutral-400">
                        {r.availableCount} of {r.totalRequested} items available
                      </span>
                    </div>
                  </div>

                  {/* Matched items chips */}
                  <div className="mt-3 pt-2 border-t border-neutral-900 flex flex-wrap gap-1.5 text-[11px]">
                    {r.matchedItems.map((m: any, mIdx: number) => (
                      <span
                        key={mIdx}
                        className="px-2 py-0.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                      >
                        ✓ {m.matchedProduct.name} ({formatINR(m.price)})
                      </span>
                    ))}
                    {r.missingItems.map((name: string, misIdx: number) => (
                      <span
                        key={misIdx}
                        className="px-2 py-0.5 rounded-lg bg-neutral-900 text-neutral-500 border border-neutral-800 line-through"
                      >
                        {name}
                      </span>
                    ))}
                  </div>

                  {/* Action */}
                  <div className="mt-3 pt-2 border-t border-neutral-900 flex justify-end">
                    <button
                      onClick={() => {
                        onSelectShopToReserve(
                          r.shop,
                          r.matchedItems.map((m: any) => m.matchedProduct)
                        );
                        onClose();
                      }}
                      className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <span>Reserve from this Shop</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
