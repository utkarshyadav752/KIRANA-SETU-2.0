import React, { useState } from "react";
import {
  ShieldAlert,
  Barcode as BarcodeIcon,
  CheckCircle2,
  AlertTriangle,
  History,
  Sparkles,
  ClipboardList,
  Check,
  Search,
} from "lucide-react";
import { Product, Shop, StockVerification } from "../../types";
import { formatINR, formatDate } from "../../utils/barcode";
import { BarcodeScannerModal } from "../BarcodeScannerModal";
import { sounds } from "../../utils/audio";

interface StockGuardianProps {
  shop: Shop;
  products: Product[];
  onRefreshProducts: () => void;
  language: "en" | "hi";
  initialProduct?: Product | null;
  onClose?: () => void;
}

export const StockGuardian: React.FC<StockGuardianProps> = ({
  shop,
  products,
  onRefreshProducts,
  language,
  initialProduct,
  onClose,
}) => {
  const isHindi = language === "hi";

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    initialProduct || products[0] || null
  );
  const [physicalCount, setPhysicalCount] = useState<string>(
    initialProduct ? String(initialProduct.currentStock) : "0"
  );
  const [selectedReason, setSelectedReason] = useState<string>("Counting error");
  const [notes, setNotes] = useState<string>("");
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isStocktakeMode, setIsStocktakeMode] = useState<boolean>(false);
  const [recentVerifications, setRecentVerifications] = useState<StockVerification[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch recent verifications on load
  React.useEffect(() => {
    fetch(`/api/inventory/verifications?shopId=${shop.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRecentVerifications(data.data);
        }
      })
      .catch(() => {});
  }, [shop.id]);

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setPhysicalCount(String(prod.currentStock));
    setSuccessMessage(null);
  };

  const handleBarcodeScanned = (barcode: string) => {
    const prod = products.find((p) => p.barcode === barcode);
    if (!prod) {
      sounds.playWarningBuzz();
      alert(`Product with barcode ${barcode} not found.`);
      return;
    }

    sounds.playScanBeep();
    setSelectedProduct(prod);
    setPhysicalCount(String(prod.currentStock));
    setSuccessMessage(null);
  };

  const countNumber = parseFloat(physicalCount) || 0;
  const expectedStock = selectedProduct ? selectedProduct.currentStock : 0;
  const discrepancy = selectedProduct ? countNumber - expectedStock : 0;
  const hasDiscrepancy = discrepancy !== 0;

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || isSubmitting) return;

    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/products/verify-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          productId: selectedProduct.id,
          physicalCount: countNumber,
          reason: hasDiscrepancy ? selectedReason : "Routine verification",
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to verify stock");
      }

      if (hasDiscrepancy) {
        sounds.playWarningBuzz();
      } else {
        sounds.playSuccessChime();
      }

      setSuccessMessage(
        hasDiscrepancy
          ? `✓ Discrepancy logged (${discrepancy > 0 ? `+${discrepancy}` : discrepancy} units). System stock corrected to ${countNumber} ${selectedProduct.unit}.`
          : `✓ Perfect match! Stock verified at ${countNumber} ${selectedProduct.unit}.`
      );

      // Refresh verification logs
      setRecentVerifications((prev) => [data.verification, ...prev]);
      onRefreshProducts();
    } catch (err: any) {
      console.error(err);
      sounds.playWarningBuzz();
      alert(err.message || "Error submitting stock verification");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="stock-guardian-container" className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-neutral-900 to-neutral-950 border border-emerald-500/30 rounded-3xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                {isHindi ? "स्टॉक गार्जियन (Stock Guardian)" : "Stock Guardian Verification"}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Audit Trail Protected
              </span>
            </div>
            <p className="text-xs text-neutral-400 max-w-xl">
              Eliminates silent inventory drift. Scan shelf products, reconcile physical counts with expected system stock, and record audit reasons.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <BarcodeIcon className="w-4 h-4" />
            <span>{isHindi ? "स्कैन कर प्रोडक्ट चुनें" : "SCAN PRODUCT TO VERIFY"}</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
            >
              Back to Inventory
            </button>
          )}
        </div>
      </div>

      {/* Main Verification Workflow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Cols: Active Verification Form */}
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="font-extrabold text-sm text-neutral-200 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-emerald-400" />
              <span>Step-by-Step Physical Stock Count</span>
            </h3>
            {selectedProduct && (
              <span className="font-mono text-xs text-neutral-400">
                Barcode: {selectedProduct.barcode}
              </span>
            )}
          </div>

          {/* Product Quick Select Bar */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Select Product to Audit
            </label>
            <div className="flex gap-2">
              <select
                value={selectedProduct?.id || ""}
                onChange={(e) => {
                  const p = products.find((x) => x.id === e.target.value);
                  if (p) handleSelectProduct(p);
                }}
                className="flex-1 bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Expected: {p.currentStock} {p.unit})
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsScannerOpen(true)}
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 text-xs font-semibold flex items-center gap-1"
                title="Scan Barcode"
              >
                <BarcodeIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Scan</span>
              </button>
            </div>
          </div>

          {selectedProduct && (
            <form onSubmit={handleSubmitVerification} className="space-y-4 text-xs">
              {/* Product Card Summary */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedProduct.name}</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {selectedProduct.brand} • {selectedProduct.category} • Selling at {formatINR(selectedProduct.sellingPrice)}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                    Last Verified: {formatDate(selectedProduct.lastVerifiedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 block uppercase">
                    System Expected Stock
                  </span>
                  <span className="text-xl font-mono font-black text-amber-400">
                    {expectedStock} {selectedProduct.unit}
                  </span>
                </div>
              </div>

              {/* Physical Count Input */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-200">
                    Actual Physical Count on Shelf:
                  </label>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    Unit: {selectedProduct.unit}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={physicalCount}
                    onChange={(e) => setPhysicalCount(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-lg font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                    placeholder="Enter physical count..."
                  />

                  {/* Quick Discrepancy Simulator Buttons for Testing */}
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setPhysicalCount(String(Math.max(0, expectedStock - 4)))}
                      className="px-2 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-rose-300 font-mono text-xs"
                      title="Simulate 4 items missing"
                    >
                      -4
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhysicalCount(String(expectedStock))}
                      className="px-2 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-300 font-mono text-xs"
                      title="Simulate Exact Match"
                    >
                      Match
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhysicalCount(String(expectedStock + 5))}
                      className="px-2 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-blue-300 font-mono text-xs"
                      title="Simulate 5 items extra"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>

              {/* Discrepancy Evaluation Box (Section 17 & 18) */}
              {hasDiscrepancy ? (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-3">
                  <div className="flex items-center justify-between text-rose-300 font-bold">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                      <span>Stock Discrepancy Detected!</span>
                    </div>
                    <span className="font-mono text-sm">
                      {discrepancy > 0 ? `+${discrepancy}` : discrepancy} {selectedProduct.unit}
                    </span>
                  </div>

                  <p className="text-[11px] text-rose-200/90 leading-relaxed">
                    System expected <strong>{expectedStock}</strong> units, but physical count is{" "}
                    <strong>{countNumber}</strong>. Please select the primary reason to ensure regulatory and financial audit compliance:
                  </p>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-300 uppercase block">
                      Discrepancy Reason *
                    </label>
                    <select
                      value={selectedReason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-100 font-medium focus:outline-none"
                    >
                      <option value="Unrecorded sale">Unrecorded sale (sold during rush without scanning)</option>
                      <option value="Damaged product">Damaged product (packet leaked/torn)</option>
                      <option value="Expired product">Expired product (discarded from shelf)</option>
                      <option value="Wrong quantity entered previously">Wrong quantity entered previously</option>
                      <option value="Wrong product scanned previously">Wrong product scanned previously</option>
                      <option value="Counting error">Counting error in earlier stocktake</option>
                      <option value="Customer return">Customer return not restocked</option>
                      <option value="Theft or shrinkage">Theft or shrinkage</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase block">
                      Verification Notes
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Broken packaging discovered behind stack..."
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    No discrepancy. Shelf inventory perfectly matches system records ({countNumber} units).
                  </span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-2xl bg-emerald-900/50 border border-emerald-500/50 text-emerald-200 text-xs font-semibold">
                  {successMessage}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-neutral-950 font-black rounded-2xl text-xs sm:text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>
                  {hasDiscrepancy
                    ? `LOG DISCREPANCY & RECONCILE STOCK TO ${countNumber} ${selectedProduct.unit}`
                    : `CONFIRM & RECORD VERIFICATION`}
                </span>
              </button>
            </form>
          )}
        </div>

        {/* Right 5 Cols: Recent Stock Guardian Audit Trail */}
        <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-extrabold text-sm text-neutral-200 flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-400" />
                <span>Stock Guardian Audit History</span>
              </h3>
              <span className="text-[10px] text-neutral-400 font-mono">
                {recentVerifications.length} Logs
              </span>
            </div>

            <div className="divide-y divide-neutral-800 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
              {recentVerifications.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-xs">
                  No stock verifications recorded yet today.
                </div>
              ) : (
                recentVerifications.map((v) => (
                  <div key={v.id} className="py-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-200 truncate">{v.productName}</span>
                      <span
                        className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          v.discrepancy === 0
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {v.discrepancy === 0 ? "Matched" : `${v.discrepancy > 0 ? `+${v.discrepancy}` : v.discrepancy}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>
                        Expected: {v.expectedStock} → Counted: {v.physicalCount}
                      </span>
                      <span className="text-[10px] text-neutral-500">{formatDate(v.verifiedAt || v.timestamp)}</span>
                    </div>

                    <div className="text-[10px] text-neutral-400 bg-neutral-950 p-1.5 rounded-lg border border-neutral-800 flex items-center justify-between">
                      <span>Reason: <strong className="text-neutral-300">{v.reason}</strong></span>
                      <span className="text-neutral-500">By {v.verifiedBy}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
        mode="verify"
        title="Stock Guardian Barcode Scanner"
        subtitle="Point camera at product on shelf to start audit"
      />
    </div>
  );
};
