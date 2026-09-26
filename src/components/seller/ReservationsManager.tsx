import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  Phone,
  User,
  Zap,
  Timer,
  BadgeAlert,
  ChevronRight,
} from "lucide-react";
import { Reservation, Shop, ReservationStatus } from "../../types";
import { formatINR, formatDate } from "../../utils/barcode";
import { sounds } from "../../utils/audio";

interface ReservationsManagerProps {
  shop: Shop;
  reservations: Reservation[];
  onUpdateStatus: (id: string, status: ReservationStatus, reason?: string) => void;
  onConvertToBill: (reservation: Reservation) => void;
  language: "en" | "hi";
}

export const ReservationsManager: React.FC<ReservationsManagerProps> = ({
  shop,
  reservations,
  onUpdateStatus,
  onConvertToBill,
  language,
}) => {
  const isHindi = language === "hi";

  const [activeTab, setActiveTab] = useState<"active" | "completed" | "all">("active");
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Tick clock for countdown timers
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getRemainingTime = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - currentTime;
    if (diff <= 0) return "Expired";
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const filteredReservations = reservations.filter((r) => {
    if (r.shopId !== shop.id) return false;
    if (activeTab === "active") {
      return ["Requested", "Confirmed", "Ready"].includes(r.status);
    }
    if (activeTab === "completed") {
      return ["Collected", "Cancelled", "No-show"].includes(r.status);
    }
    return true;
  });

  return (
    <div id="seller-reservations-container" className="space-y-4">
      {/* Header Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-black text-white">
              {isHindi ? "ग्राहक रिज़र्वेशन व पिकअप" : "Customer Reservations & Pickup"}
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              30-min Hold Guarantee
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Reserved products lock sellable stock so customers arrive with zero disappointment.
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex items-center bg-neutral-950 p-1 rounded-2xl border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "active"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Active Holds (
            {reservations.filter((r) => ["Requested", "Confirmed", "Ready"].includes(r.status)).length}
            )
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "completed"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Past & Completed
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "all"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Reservations List */}
      <div className="space-y-3">
        {filteredReservations.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center text-neutral-500 text-xs">
            No reservations found in this view.
          </div>
        ) : (
          filteredReservations.map((res) => {
            const isComingSoon = res.comingSoonAlert;
            const remaining = getRemainingTime(res.expiresAt);
            const isExpired = remaining === "Expired" && ["Requested", "Confirmed", "Ready"].includes(res.status);

            return (
              <div
                key={res.id}
                className={`bg-neutral-900 border rounded-3xl p-4 sm:p-5 shadow-lg transition-all ${
                  isComingSoon
                    ? "border-amber-500 shadow-amber-500/10 ring-2 ring-amber-500/30"
                    : "border-neutral-800"
                }`}
              >
                {/* Coming Soon Alert Banner (Section 31) */}
                {isComingSoon && (
                  <div className="mb-3 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-between text-amber-300 text-xs animate-pulse">
                    <div className="flex items-center gap-2 font-bold">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>
                        CUSTOMER ON THE WAY! ETA: ~{res.comingSoonEta || "20 minutes"}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono bg-amber-500/30 px-2 py-0.5 rounded">
                      High Priority Hold
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Left: Customer info & Reservation Number */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-neutral-400">
                        {res.reservationNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          res.status === "Ready"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : res.status === "Confirmed"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : res.status === "Collected"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : res.status === "No-show"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-neutral-800 text-neutral-300"
                        }`}
                      >
                        {res.status}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                      <span>{res.customerName}</span>
                      <span className="text-neutral-400 text-xs font-normal font-mono">
                        ({res.customerPhone})
                      </span>
                    </h3>

                    <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                      <span>Created: {formatDate(res.createdAt || res.requestedAt)}</span>
                      <span>•</span>
                      <span className="text-neutral-500">Pick-up counter pickup</span>
                    </div>
                  </div>

                  {/* Right: Countdown & Total */}
                  <div className="text-right space-y-1">
                    <div className="flex items-center justify-end gap-1.5 text-xs">
                      <Timer className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-neutral-400">Hold Timer:</span>
                      <span
                        className={`font-mono font-bold ${
                          isExpired ? "text-rose-400" : "text-amber-300"
                        }`}
                      >
                        {remaining}
                      </span>
                    </div>

                    <div className="text-base font-mono font-black text-emerald-400">
                      {formatINR(res.estimatedTotal || res.totalAmount)}
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="mt-4 pt-3 border-t border-neutral-800/80">
                  <div className="text-[11px] font-semibold text-neutral-400 mb-1.5">
                    Reserved Items (Held in Shelf Stock):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {res.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-neutral-200">{item.productName}</div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {formatINR(item.sellingPrice || item.price)} each
                          </div>
                        </div>
                        <div className="font-mono font-bold text-amber-400">
                          x{item.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {res.status === "Requested" && (
                      <button
                        onClick={() => onUpdateStatus(res.id, "Confirmed")}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors"
                      >
                        Confirm Hold
                      </button>
                    )}

                    {["Requested", "Confirmed"].includes(res.status) && (
                      <button
                        onClick={() => onUpdateStatus(res.id, "Ready")}
                        className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-colors"
                      >
                        Pack & Mark Ready
                      </button>
                    )}

                    {["Requested", "Confirmed", "Ready"].includes(res.status) && (
                      <button
                        onClick={() => onUpdateStatus(res.id, "No-show", "Customer did not arrive within timer")}
                        className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-300 text-xs font-medium transition-colors"
                        title="Release stock and mark customer as No-show"
                      >
                        Mark No-Show
                      </button>
                    )}
                  </div>

                  {/* 1-Click Convert to Bill (Section 32) */}
                  {["Requested", "Confirmed", "Ready"].includes(res.status) && (
                    <button
                      onClick={() => onConvertToBill(res)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-neutral-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>CONVERT TO BILL & COLLECT PAYMENT</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
