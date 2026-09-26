import React, { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  Phone,
  CheckCircle2,
  TrendingDown,
  Building2,
  PackageCheck,
  FileText,
  DollarSign,
} from "lucide-react";
import { Supplier, PurchaseOrder, Product, Shop } from "../../types";
import { formatINR, formatDate } from "../../utils/barcode";
import { sounds } from "../../utils/audio";

interface SuppliersManagerProps {
  shop: Shop;
  products: Product[];
  onRefreshProducts: () => void;
  language: "en" | "hi";
}

export const SuppliersManager: React.FC<SuppliersManagerProps> = ({
  shop,
  products,
  onRefreshProducts,
  language,
}) => {
  const isHindi = language === "hi";

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [priceComparisons, setPriceComparisons] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"suppliers" | "purchases" | "price_compare">("purchases");

  // New Supplier Form
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [supName, setSupName] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supAddress, setSupAddress] = useState("");
  const [supGst, setSupGst] = useState("");

  // New Purchase Entry Form
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [purchaseInvoiceNo, setPurchaseInvoiceNo] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || "");
  const [purchaseQty, setPurchaseQty] = useState("50");
  const [purchaseRate, setPurchaseRate] = useState("20");

  useEffect(() => {
    fetchSuppliers();
    fetchPriceComparison();
  }, [shop.id]);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`/api/suppliers?shopId=${shop.id}`);
      const data = await res.json();
      if (data.success) setSuppliers(data.data);
    } catch {}
  };

  const fetchPriceComparison = async () => {
    try {
      const res = await fetch("/api/suppliers/price-comparison");
      const data = await res.json();
      if (data.success) setPriceComparisons(data.data);
    } catch {}
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName || !supPhone) return;

    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          name: supName,
          phone: supPhone,
          address: supAddress,
          gstNumber: supGst,
          productsSupplied: ["FMCG", "Groceries"],
        }),
      });
      const data = await res.json();
      if (data.success) {
        sounds.playSuccessChime();
        setSuppliers((prev) => [...prev, data.data]);
        setIsAddSupplierOpen(false);
        setSupName("");
        setSupPhone("");
      }
    } catch {}
  };

  const handleReceivePurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === selectedProduct);
    if (!prod) return;

    try {
      const res = await fetch("/api/products/add-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          productId: prod.id,
          quantity: Number(purchaseQty),
          purchasePrice: Number(purchaseRate),
          supplierId: selectedSupplierId,
          source: "Supplier Purchase Order",
        }),
      });
      const data = await res.json();
      if (data.success) {
        sounds.playSuccessChime();
        setIsAddPurchaseOpen(false);
        onRefreshProducts();
        alert(`Stock received! Added ${purchaseQty} units of ${prod.name} into inventory.`);
      }
    } catch {}
  };

  return (
    <div id="suppliers-manager-container" className="space-y-4">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-black text-white">
              {isHindi ? "सप्लायर व खरीद प्रबंधन" : "Suppliers & Purchases"}
            </h2>
          </div>
          <p className="text-xs text-neutral-400">
            Log supplier deliveries, automatically update stock, and analyze wholesale rates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddPurchaseOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Receive Purchase Stock</span>
          </button>
          <button
            onClick={() => setIsAddSupplierOpen(true)}
            className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-2xl text-xs flex items-center gap-1 border border-neutral-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-1.5 rounded-2xl text-xs">
        <button
          onClick={() => setActiveTab("purchases")}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            activeTab === "purchases"
              ? "bg-amber-500 text-neutral-950 shadow"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Purchase Orders & Stock In
        </button>
        <button
          onClick={() => setActiveTab("suppliers")}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            activeTab === "suppliers"
              ? "bg-amber-500 text-neutral-950 shadow"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Supplier Contacts ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab("price_compare")}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
            activeTab === "price_compare"
              ? "bg-amber-500 text-neutral-950 shadow"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Wholesale Price Comparison</span>
        </button>
      </div>

      {/* Active Tab Views */}
      {activeTab === "purchases" && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="font-bold text-sm text-neutral-200">
              Recent Inward Goods & Invoices
            </h3>
            <span className="text-neutral-500">Auto-connected to Stock Ledger</span>
          </div>

          <div className="space-y-2">
            {[
              {
                id: "PO-9102",
                supplier: "Metro FMCG Wholesalers Ltd",
                date: "2026-09-16",
                items: "Parle-G (100 units), Tata Salt (50 units)",
                amount: 3200,
                status: "Received & Stock Updated",
              },
              {
                id: "PO-9101",
                supplier: "ITC Direct Agency",
                date: "2026-09-14",
                items: "Aashirvaad Atta 5kg (30 units)",
                amount: 6000,
                status: "Received & Stock Updated",
              },
            ].map((po) => (
              <div
                key={po.id}
                className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-neutral-100 flex items-center gap-2">
                    <span>{po.supplier}</span>
                    <span className="font-mono text-neutral-500 text-[10px]">{po.id}</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{po.items}</div>
                  <div className="text-[10px] text-neutral-500">{po.date}</div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-neutral-100">
                    {formatINR(po.amount)}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-block mt-1">
                    {po.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "suppliers" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-2 text-xs"
            >
              <div className="font-extrabold text-sm text-neutral-100 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>{s.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-400">
                <Phone className="w-3.5 h-3.5 text-neutral-500" />
                <span className="font-mono">{s.phone}</span>
              </div>
              {s.gstNumber && (
                <div className="text-[10px] text-neutral-500 font-mono">
                  GST: {s.gstNumber}
                </div>
              )}
              <div className="pt-2 border-t border-neutral-800 flex flex-wrap gap-1">
                {s.productsSupplied.map((p, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-950 text-neutral-400 border border-neutral-800"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Supplier Wholesale Price Comparison (Section 25) */}
      {activeTab === "price_compare" && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="font-bold text-sm text-neutral-200">
              Supplier Wholesale Price Intelligence
            </h3>
            <span className="text-emerald-400 font-semibold">
              Find lowest procurement costs
            </span>
          </div>

          <div className="space-y-3">
            {priceComparisons.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2"
              >
                <div className="font-bold text-sm text-neutral-100">{item.productName}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.records.map((rec: any, rIdx: number) => (
                    <div
                      key={rIdx}
                      className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-neutral-300">{rec.supplierName}</div>
                        <div className="text-[10px] text-neutral-500">
                          Purchased: {rec.lastPurchased}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-sm text-amber-400">
                        {formatINR(rec.purchasePrice)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Receive Purchase Modal */}
      {isAddPurchaseOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-sm text-white">
                Receive Stock from Supplier
              </h3>
              <button onClick={() => setIsAddPurchaseOpen(false)} className="text-neutral-400">✕</button>
            </div>

            <form onSubmit={handleReceivePurchaseOrder} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-400 block">Product to Receive</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-neutral-400 block">Quantity Received</label>
                  <input
                    type="number"
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl font-mono text-neutral-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-400 block">Purchase Cost per Unit (₹)</label>
                  <input
                    type="number"
                    value={purchaseRate}
                    onChange={(e) => setPurchaseRate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl font-mono text-neutral-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddPurchaseOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl"
                >
                  Confirm & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-sm text-white">Add New Supplier</h3>
              <button onClick={() => setIsAddSupplierOpen(false)} className="text-neutral-400">✕</button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-400 block">Supplier / Company Name *</label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="e.g. Parle Direct Depot"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 block">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  placeholder="+91 98450..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
