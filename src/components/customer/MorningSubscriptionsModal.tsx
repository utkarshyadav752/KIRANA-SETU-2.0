import React, { useState } from "react";
import {
  X,
  Sun,
  Clock,
  Calendar,
  CheckCircle2,
  Plus,
  Trash2,
  Power,
  Store,
  Sparkles,
} from "lucide-react";
import { MorningSubscription, Shop } from "../../types";
import { sounds } from "../../utils/audio";

const MORNING_STAPLES_PRESETS = [
  {
    stapleType: "milk" as const,
    itemName: "Amul Taaza Homogenised Milk (500ml)",
    brand: "Amul",
    quantity: 1,
    unit: "Packet" as const,
    dailyPrice: 27,
  },
  {
    stapleType: "milk" as const,
    itemName: "Amul Gold Full Cream Milk (500ml)",
    brand: "Amul",
    quantity: 1,
    unit: "Packet" as const,
    dailyPrice: 33,
  },
  {
    stapleType: "bread" as const,
    itemName: "Harvest Gold White Bread (400g)",
    brand: "Harvest Gold",
    quantity: 1,
    unit: "Packet" as const,
    dailyPrice: 35,
  },
  {
    stapleType: "eggs" as const,
    itemName: "Farm Fresh White Eggs (Pack of 6)",
    brand: "Farm Fresh",
    quantity: 1,
    unit: "Box" as const,
    dailyPrice: 48,
  },
  {
    stapleType: "curd" as const,
    itemName: "Amul Masti Dahi Pouch (400g)",
    brand: "Amul",
    quantity: 1,
    unit: "Packet" as const,
    dailyPrice: 35,
  },
  {
    stapleType: "paneer" as const,
    itemName: "Fresh Malai Paneer (200g)",
    brand: "Local Dairy",
    quantity: 1,
    unit: "Packet" as const,
    dailyPrice: 90,
  },
];

interface MorningSubscriptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
  customerId: string;
  customerName: string;
  customerPhone: string;
  subscriptions: MorningSubscription[];
  onSaveSubscriptions: (subs: MorningSubscription[]) => void;
  language?: "en" | "hi";
}

export const MorningSubscriptionsModal: React.FC<MorningSubscriptionsModalProps> = ({
  isOpen,
  onClose,
  shop,
  customerId,
  customerName,
  customerPhone,
  subscriptions,
  onSaveSubscriptions,
  language = "hi",
}) => {
  const isHindi = language === "hi";
  const [activeSubs, setActiveSubs] = useState<MorningSubscription[]>(subscriptions);
  const [selectedSlot, setSelectedSlot] = useState<"6:00 AM - 7:00 AM" | "7:00 AM - 8:00 AM" | "8:00 AM - 9:00 AM">(
    "7:00 AM - 8:00 AM"
  );
  const [frequency, setFrequency] = useState<"daily" | "weekdays" | "weekends">("daily");

  if (!isOpen) return null;

  const shopId = shop?.id || "shop-1";
  const shopName = shop?.name || "Neighborhood Kirana";

  const handleAddPreset = (preset: typeof MORNING_STAPLES_PRESETS[0]) => {
    sounds.playScanBeep();
    const newSub: MorningSubscription = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      customerId,
      customerName,
      customerPhone,
      shopId,
      shopName,
      stapleType: preset.stapleType,
      itemName: preset.itemName,
      brand: preset.brand,
      quantity: preset.quantity,
      unit: preset.unit,
      dailyPrice: preset.dailyPrice,
      frequency,
      pickupSlot: selectedSlot,
      status: "active",
      deliveryType: "counter_pickup",
      startDate: new Date().toISOString().split("T")[0],
      nextScheduledDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    };

    const updated = [...activeSubs, newSub];
    setActiveSubs(updated);
    onSaveSubscriptions(updated);
    sounds.playSuccessChime();
  };

  const handleToggleStatus = (id: string) => {
    sounds.playScanBeep();
    const updated = activeSubs.map((sub) =>
      sub.id === id
        ? { ...sub, status: sub.status === "active" ? ("paused" as const) : ("active" as const) }
        : sub
    );
    setActiveSubs(updated);
    onSaveSubscriptions(updated);
  };

  const handleDeleteSub = (id: string) => {
    sounds.playScanBeep();
    const updated = activeSubs.filter((sub) => sub.id !== id);
    setActiveSubs(updated);
    onSaveSubscriptions(updated);
  };

  const activeCount = activeSubs.filter((s) => s.status === "active").length;
  const totalDailyEstimated = activeSubs
    .filter((s) => s.status === "active")
    .reduce((acc, curr) => acc + curr.dailyPrice * curr.quantity, 0);

  return (
    <div
      id="morning-subscriptions-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-4 py-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Sun className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-white">
                  {isHindi ? "दैनिक सुबह आवश्यक (दूध-ब्रेड आरक्षण)" : "Morning Essentials Subscription"}
                </h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                  Ready by 7 AM
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {isHindi
                  ? `${shopName} पर रोज़ सुबह ताज़ा दूध और ब्रेड बिना लाइन के तैयार पाएं`
                  : `Automated daily morning hold at ${shopName} for zero-wait pickups`}
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
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Slot & Frequency Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800">
            <div>
              <label className="text-[11px] text-neutral-400 font-semibold block mb-1">
                {isHindi ? "सुबह का पसंदीदा समय:" : "Preferred Morning Pickup Slot:"}
              </label>
              <select
                value={selectedSlot}
                onChange={(e: any) => setSelectedSlot(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="6:00 AM - 7:00 AM">6:00 AM - 7:00 AM (Early Bird)</option>
                <option value="7:00 AM - 8:00 AM">7:00 AM - 8:00 AM (Standard)</option>
                <option value="8:00 AM - 9:00 AM">8:00 AM - 9:00 AM (Breakfast)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 font-semibold block mb-1">
                {isHindi ? "आवृत्ति (Frequency):" : "Frequency:"}
              </label>
              <select
                value={frequency}
                onChange={(e: any) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="daily">{isHindi ? "प्रतिदिन (Daily)" : "Everyday (Mon - Sun)"}</option>
                <option value="weekdays">{isHindi ? "सोमवार - शुक्रवार (Weekdays)" : "Weekdays Only (Mon - Fri)"}</option>
                <option value="weekends">{isHindi ? "शनिवार - रविवार (Weekends)" : "Weekends Only (Sat - Sun)"}</option>
              </select>
            </div>
          </div>

          {/* Quick Add Presets */}
          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-2">
              {isHindi ? "+ सुबह के दैनिक सामान जोड़ें:" : "+ Add Morning Staples to Daily Routine:"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MORNING_STAPLES_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddPreset(preset)}
                  className="p-2.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 hover:border-amber-500/50 text-left transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                      {preset.itemName}
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-1">
                      {preset.brand} • {preset.unit}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-850">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      ₹{preset.dailyPrice}
                    </span>
                    <span className="w-5 h-5 rounded-lg bg-amber-500/10 group-hover:bg-amber-500 group-hover:text-neutral-950 text-amber-400 flex items-center justify-center transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Subscriptions List */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">
                {isHindi ? `सक्रिय दैनिक आरक्षण (${activeCount})` : `Your Active Morning Subscriptions (${activeCount})`}
              </span>
              <span className="text-[11px] text-amber-400 font-mono">
                Est. Daily: ₹{totalDailyEstimated}
              </span>
            </div>

            {activeSubs.length === 0 ? (
              <div className="p-6 rounded-2xl bg-neutral-950/40 border border-neutral-800/80 text-center text-xs text-neutral-500 space-y-1">
                <Sun className="w-8 h-8 text-neutral-600 mx-auto mb-1" />
                <p>{isHindi ? "कोई दैनिक सुबह आरक्षण नहीं जुड़ा है।" : "No active morning subscriptions yet."}</p>
                <p className="text-[11px] text-neutral-500">
                  {isHindi ? "ऊपर से दूध या ब्रेड चुनें और रोज़ सुबह बिना लाइन के सामान पाएं।" : "Click any staple above to start morning auto-holds."}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {activeSubs.map((sub) => (
                  <div
                    key={sub.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      sub.status === "active"
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-neutral-950/50 border-neutral-800 opacity-60"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {sub.itemName}
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 flex-wrap">
                        <span className="text-amber-300 font-mono font-semibold">₹{sub.dailyPrice}</span>
                        <span>•</span>
                        <span>{sub.pickupSlot}</span>
                        <span>•</span>
                        <span className="capitalize">{sub.frequency}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleStatus(sub.id)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-colors flex items-center gap-1 ${
                          sub.status === "active"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{sub.status === "active" ? "Active" : "Paused"}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteSub(sub.id)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <div className="text-xs text-neutral-400">
            {isHindi ? "0% कमीशन • सीधे दुकान पर भुगतान" : "Zero commission • Pay at counter on pickup"}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            {isHindi ? "पूर्ण (Done)" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
};
