import React, { useState } from "react";
import {
  Package,
  Plus,
  Barcode as BarcodeIcon,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  QrCode,
  Edit,
  SlidersHorizontal,
  CheckCircle2,
  Printer,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Product, Shop } from "../../types";
import { formatINR, formatDate } from "../../utils/barcode";
import { BarcodeScannerModal } from "../BarcodeScannerModal";
import { sounds } from "../../utils/audio";

interface InventoryViewProps {
  shop: Shop;
  products: Product[];
  onRefreshProducts: () => void;
  language: "en" | "hi";
  onOpenVerify: (product?: Product) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  shop,
  products,
  onRefreshProducts,
  language,
  onOpenVerify,
}) => {
  const isHindi = language === "hi";

  const [activeFilter, setActiveFilter] = useState<"all" | "low" | "expiring" | "loose" | "out">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Scanner states
  const [isScanAddOpen, setIsScanAddOpen] = useState(false);
  const [scannedBatch, setScannedBatch] = useState<
    { product: Product; quantity: number; purchasePrice: number; sellingPrice: number }[]
  >([]);
  const [showBatchReview, setShowBatchReview] = useState(false);

  // Manual Product Creation Modal
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Vegetables & Fruits");
  const [newProdBrand, setNewProdBrand] = useState("Local");
  const [newProdUnit, setNewProdUnit] = useState("Kg");
  const [newProdMrp, setNewProdMrp] = useState("40");
  const [newProdPrice, setNewProdPrice] = useState("35");
  const [newProdPurchasePrice, setNewProdPurchasePrice] = useState("28");
  const [newProdStock, setNewProdStock] = useState("25");
  const [newProdMinStock, setNewProdMinStock] = useState("5");
  const [newProdHasBarcode, setNewProdHasBarcode] = useState(false);
  const [newProdBarcode, setNewProdBarcode] = useState("");
  const [newProdExpiry, setNewProdExpiry] = useState("");

  // Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustCount, setAdjustCount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>("Counting error");
  const [adjustNotes, setAdjustNotes] = useState<string>("");

  // Label Print Modal for generated barcode
  const [labelProduct, setLabelProduct] = useState<Product | null>(null);

  // Filter products
  const now = new Date();
  const expiringSoonLimit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "All" && p.category !== selectedCategory) return false;

    if (activeFilter === "low" && !(p.currentStock > 0 && p.currentStock <= p.minimumStock)) {
      return false;
    }
    if (activeFilter === "out" && p.currentStock !== 0) return false;
    if (activeFilter === "loose" && p.hasBarcode) return false;
    if (activeFilter === "expiring") {
      if (!p.expiryDate) return false;
      const exp = new Date(p.expiryDate);
      if (exp > expiringSoonLimit) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle continuous scan to add stock (Section 6)
  const handleContinuousScan = (code: string) => {
    let matched = products.find((p) => p.barcode === code);
    if (!matched) {
      sounds.playWarningBuzz();
      alert(`Barcode ${code} not found in inventory. You can create it as a new product.`);
      return;
    }

    sounds.playScanBeep();

    setScannedBatch((prev) => {
      const idx = prev.findIndex((item) => item.product.id === matched!.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      } else {
        return [
          ...prev,
          {
            product: matched!,
            quantity: 1,
            purchasePrice: matched!.purchasePrice || Math.round(matched!.sellingPrice * 0.8),
            sellingPrice: matched!.sellingPrice,
          },
        ];
      }
    });
  };

  // Submit continuous stock batch
  const handleSaveBatchStock = async () => {
    if (scannedBatch.length === 0) return;

    try {
      const res = await fetch("/api/products/batch-stock-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          items: scannedBatch.map((b) => ({
            productId: b.product.id,
            quantity: b.quantity,
            purchasePrice: b.purchasePrice,
            sellingPrice: b.sellingPrice,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        sounds.playSuccessChime();
        setScannedBatch([]);
        setShowBatchReview(false);
        setIsScanAddOpen(false);
        onRefreshProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create Product (Manual / Loose / With Barcode)
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) return;

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          name: newProdName,
          category: newProdCategory,
          brand: newProdBrand,
          unit: newProdUnit,
          mrp: Number(newProdMrp),
          sellingPrice: Number(newProdPrice),
          purchasePrice: Number(newProdPurchasePrice),
          quantity: Number(newProdStock),
          minimumStock: Number(newProdMinStock),
          hasBarcode: newProdHasBarcode,
          barcode: newProdHasBarcode ? newProdBarcode : undefined,
          expiryDate: newProdExpiry || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        sounds.playSuccessChime();
        setIsNewProductModalOpen(false);
        onRefreshProducts();

        // Reset form
        setNewProdName("");
        setNewProdBarcode("");
      }
    } catch (err) {
      console.error("Create product failed", err);
    }
  };

  // Submit Manual Stock Adjustment (Section 7)
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    try {
      const res = await fetch("/api/products/verify-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          productId: adjustingProduct.id,
          physicalCount: adjustCount,
          reason: adjustReason,
          notes: adjustNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        sounds.playSuccessChime();
        setAdjustingProduct(null);
        onRefreshProducts();
      }
    } catch (err) {
      console.error("Stock adjustment failed", err);
    }
  };

  return (
    <div id="inventory-view-container" className="space-y-4">
      {/* Top Header & Actions Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-black text-white">
              {isHindi ? "स्टॉक व इन्वेंटरी प्रबंधन" : "Inventory & Stock Guardian"}
            </h2>
          </div>
          <p className="text-xs text-neutral-400">
            Multi-column real-time ledger tracking physical, reserved, and sellable stock.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* SCAN & ADD STOCK (Section 5 & 6) */}
          <button
            id="scan-add-stock-btn"
            onClick={() => setIsScanAddOpen(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <BarcodeIcon className="w-4 h-4" />
            <span>{isHindi ? "स्कैन व स्टॉक जोड़ें" : "SCAN & ADD STOCK"}</span>
          </button>

          {/* ADD PRODUCT MANUALLY (Loose items / local products - Section 8) */}
          <button
            id="add-product-manual-btn"
            onClick={() => setIsNewProductModalOpen(true)}
            className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-2xl text-xs flex items-center gap-2 border border-neutral-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{isHindi ? "नया प्रोडक्ट बनाएं" : "ADD PRODUCT MANUALLY"}</span>
          </button>

          {/* VERIFY STOCK / STOCKTAKE (Section 18) */}
          <button
            onClick={() => onOpenVerify()}
            className="px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold rounded-2xl text-xs flex items-center gap-2 border border-emerald-500/30 transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{isHindi ? "स्टॉक गार्जियन सत्यापन" : "STOCK GUARDIAN"}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeFilter === "all"
                ? "bg-amber-500 text-neutral-950"
                : "bg-neutral-950 text-neutral-400 hover:text-white"
            }`}
          >
            All Products ({products.length})
          </button>

          <button
            onClick={() => setActiveFilter("low")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
              activeFilter === "low"
                ? "bg-amber-500 text-neutral-950"
                : "bg-neutral-950 text-amber-400 hover:bg-neutral-800"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock</span>
          </button>

          <button
            onClick={() => setActiveFilter("out")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
              activeFilter === "out"
                ? "bg-rose-500 text-white"
                : "bg-neutral-950 text-rose-400 hover:bg-neutral-800"
            }`}
          >
            <span>Out of Stock</span>
          </button>

          <button
            onClick={() => setActiveFilter("loose")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeFilter === "loose"
                ? "bg-amber-500 text-neutral-950"
                : "bg-neutral-950 text-neutral-400 hover:text-white"
            }`}
          >
            Loose / Non-Barcode
          </button>

          <button
            onClick={() => setActiveFilter("expiring")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
              activeFilter === "expiring"
                ? "bg-amber-500 text-neutral-950"
                : "bg-neutral-950 text-yellow-400 hover:bg-neutral-800"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Expiring Soon</span>
          </button>
        </div>

        {/* Search & Category dropdown */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-neutral-950 border border-neutral-700 text-neutral-300 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product or barcode..."
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Multi-Column Stock Table (Section 4) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 border-b border-neutral-800 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-3">Barcode / SKU</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-center">Physical Stock</th>
                <th className="py-3 px-3 text-center">Reserved</th>
                <th className="py-3 px-3 text-center">Sellable Stock</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    No products matched your filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const sellable = Math.max(0, prod.currentStock - prod.reservedStock);
                  const isLow = prod.currentStock > 0 && prod.currentStock <= prod.minimumStock;
                  const isOut = prod.currentStock === 0;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-neutral-800/40 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-100 flex items-center gap-1.5">
                          <span>{prod.name}</span>
                          {!prod.hasBarcode && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-amber-300 font-mono">
                              Loose
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-0.5">
                          <span>{prod.brand}</span>
                          <span>•</span>
                          <span>{prod.category}</span>
                          {prod.expiryDate && (
                            <>
                              <span>•</span>
                              <span className="text-yellow-400/80">Exp: {prod.expiryDate}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-neutral-400">
                        <div className="flex items-center gap-1">
                          <span>{prod.barcode}</span>
                          {!prod.hasBarcode && (
                            <button
                              onClick={() => setLabelProduct(prod)}
                              className="text-amber-400 hover:text-amber-300 p-0.5"
                              title="Print QR label"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-neutral-100">
                        {formatINR(prod.sellingPrice)}
                        <span className="text-[10px] text-neutral-500 font-normal block">
                          MRP {formatINR(prod.mrp)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-sm text-neutral-100">
                        {prod.currentStock} {prod.unit}
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-neutral-400">
                        {prod.reservedStock > 0 ? (
                          <span className="text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            {prod.reservedStock}
                          </span>
                        ) : (
                          "0"
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-sm">
                        <span
                          className={
                            sellable === 0
                              ? "text-rose-400"
                              : sellable <= prod.minimumStock
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }
                        >
                          {sellable}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            In Stock
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Manual Stock Adjustment Button */}
                          <button
                            onClick={() => {
                              setAdjustingProduct(prod);
                              setAdjustCount(prod.currentStock);
                            }}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1 transition-colors"
                            title="Adjust Stock"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Adjust</span>
                          </button>

                          {/* Verify Button */}
                          <button
                            onClick={() => onOpenVerify(prod)}
                            className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs flex items-center gap-1 transition-colors border border-emerald-500/20"
                            title="Verify Stock with Stock Guardian"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Verify</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONTINUOUS SCAN & ADD STOCK MODAL (Section 6) */}
      <BarcodeScannerModal
        isOpen={isScanAddOpen}
        onClose={() => {
          setIsScanAddOpen(false);
          if (scannedBatch.length > 0) {
            setShowBatchReview(true);
          }
        }}
        onScan={handleContinuousScan}
        mode="add_stock"
        continuous={true}
        title="Continuous Scan & Add Stock"
        subtitle="Keep scanning crates or items. Stock counts will accumulate automatically."
      />

      {/* Batch Review Modal before saving stock */}
      {showBatchReview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="font-extrabold text-white text-base">
                  Review Scanned Stock Batch
                </h3>
                <p className="text-xs text-neutral-400">
                  {scannedBatch.length} unique products scanned.
                </p>
              </div>
              <button
                onClick={() => setShowBatchReview(false)}
                className="text-neutral-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <div className="divide-y divide-neutral-800 max-h-60 overflow-y-auto custom-scrollbar">
              {scannedBatch.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-neutral-100">{item.product.name}</div>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      Current Stock: {item.product.currentStock} → New Stock:{" "}
                      {item.product.currentStock + item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-bold font-mono rounded-lg border border-amber-500/30">
                      +{item.quantity} {item.product.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <button
                onClick={() => {
                  setShowBatchReview(false);
                  setIsScanAddOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold"
              >
                Scan More
              </button>

              <button
                onClick={handleSaveBatchStock}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-black text-xs shadow-lg transition-colors"
              >
                Save All & Update Inventory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL PRODUCT CREATION MODAL (Section 8 - Loose items) */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="font-extrabold text-white text-base">
                  {isHindi ? "नया प्रोडक्ट जोड़ें" : "Create Product in Catalog"}
                </h3>
                <p className="text-xs text-neutral-400">
                  Supports loose items (grains, vegetables by Kg) and official barcodes.
                </p>
              </div>
              <button
                onClick={() => setIsNewProductModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-300 font-semibold block">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Fresh Hybrid Tomatoes, Basmati Rice..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold block">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100 focus:outline-none"
                  >
                    <option value="Vegetables & Fruits">Vegetables & Fruits</option>
                    <option value="Grains & Pulses">Grains & Pulses</option>
                    <option value="Dairy & Bakery">Dairy & Bakery</option>
                    <option value="Snacks & Biscuits">Snacks & Biscuits</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="General Groceries">General Groceries</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold block">Unit of Sale</label>
                  <select
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100 focus:outline-none"
                  >
                    <option value="Kg">Kg (Loose)</option>
                    <option value="Gram">Gram</option>
                    <option value="Packet">Packet</option>
                    <option value="Piece">Piece</option>
                    <option value="Litre">Litre</option>
                  </select>
                </div>
              </div>

              {/* Barcode Option Toggle (Section 8) */}
              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProdHasBarcode}
                    onChange={(e) => setNewProdHasBarcode(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-neutral-900 border-neutral-700"
                  />
                  <span className="font-bold text-neutral-200">Product has an official Barcode</span>
                </label>

                {newProdHasBarcode ? (
                  <input
                    type="text"
                    value={newProdBarcode}
                    onChange={(e) => setNewProdBarcode(e.target.value)}
                    placeholder="Scan or type barcode (e.g. 890123...)"
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-100 font-mono"
                  />
                ) : (
                  <p className="text-[11px] text-amber-400/80">
                    ✓ A system internal QR/Barcode will be automatically generated so you can print a sticker label!
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-neutral-400 block">Purchase Price (₹)</label>
                  <input
                    type="number"
                    value={newProdPurchasePrice}
                    onChange={(e) => setNewProdPurchasePrice(e.target.value)}
                    className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-700 rounded-xl font-mono text-neutral-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-400 block">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-700 rounded-xl font-mono text-amber-400 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-400 block">MRP (₹)</label>
                  <input
                    type="number"
                    value={newProdMrp}
                    onChange={(e) => setNewProdMrp(e.target.value)}
                    className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-700 rounded-xl font-mono text-neutral-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-neutral-400 block">Initial Physical Stock</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-700 rounded-xl font-mono text-neutral-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-400 block">Minimum Alert Threshold</label>
                  <input
                    type="number"
                    value={newProdMinStock}
                    onChange={(e) => setNewProdMinStock(e.target.value)}
                    className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-700 rounded-xl font-mono text-neutral-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-xs shadow-lg transition-colors"
                >
                  Save Product & Add to Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL STOCK ADJUSTMENT MODAL (Section 7) */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="font-extrabold text-white text-base">
                  Manual Stock Adjustment
                </h3>
                <p className="text-xs text-neutral-400">
                  {adjustingProduct.name} ({adjustingProduct.unit})
                </p>
              </div>
              <button onClick={() => setAdjustingProduct(null)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                <div>
                  <span className="text-neutral-500 block text-[10px]">Expected in System:</span>
                  <span className="font-mono font-bold text-neutral-200 text-sm">
                    {adjustingProduct.currentStock} {adjustingProduct.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block text-[10px]">Adjusted Physical Count:</span>
                  <input
                    type="number"
                    min="0"
                    value={adjustCount}
                    onChange={(e) => setAdjustCount(Number(e.target.value))}
                    className="w-20 px-2 py-1 bg-neutral-900 border border-amber-500/50 rounded-lg text-right font-mono font-bold text-amber-400"
                  />
                </div>
              </div>

              {/* Mandatory Reason (Section 7) */}
              <div className="space-y-1">
                <label className="text-neutral-300 font-semibold block">
                  Mandatory Adjustment Reason *
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100 focus:outline-none"
                >
                  <option value="Counting error">Counting error</option>
                  <option value="Unrecorded sale">Unrecorded sale</option>
                  <option value="Damaged product">Damaged product</option>
                  <option value="Expired product">Expired product</option>
                  <option value="Wrong quantity entered">Wrong quantity entered</option>
                  <option value="Customer return">Customer return</option>
                  <option value="Theft or shrinkage">Theft or shrinkage</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 block">Audit Notes (Optional)</label>
                <textarea
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Found 2 packets broken in bottom shelf..."
                  rows={2}
                  className="w-full p-2 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs shadow-lg transition-colors"
                >
                  Confirm Adjustment & Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR LABEL PRINT MODAL FOR NON-BARCODE ITEMS (Section 8) */}
      {labelProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-neutral-900 rounded-3xl p-6 w-full max-w-xs text-center space-y-4 shadow-2xl">
            <div className="space-y-1 border-b pb-3">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">
                KiranaSetu Shelf Label
              </span>
              <h3 className="font-extrabold text-base text-neutral-900">
                {labelProduct.name}
              </h3>
              <p className="font-mono text-xs font-bold text-neutral-600">
                {formatINR(labelProduct.sellingPrice)} / {labelProduct.unit}
              </p>
            </div>

            <div className="p-3 bg-neutral-50 border rounded-2xl inline-block">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                  labelProduct.barcode
                )}`}
                alt="Barcode QR"
                className="w-32 h-32 mx-auto"
              />
              <span className="font-mono text-[10px] text-neutral-600 block mt-1 font-bold">
                {labelProduct.barcode}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Print Label
              </button>
              <button
                onClick={() => setLabelProduct(null)}
                className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
