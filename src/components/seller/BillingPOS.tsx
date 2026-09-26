import React, { useState, useEffect } from "react";
import {
  Barcode as BarcodeIcon,
  Plus,
  Minus,
  Trash2,
  Undo2,
  Search,
  CheckCircle2,
  QrCode,
  CreditCard,
  Banknote,
  Percent,
  User,
  Phone,
  Receipt,
  Sparkles,
  Layers,
  ArrowRight,
  Scale,
  Radio,
  Volume2,
  Mic,
  MicOff,
  Share2,
  LayoutGrid,
} from "lucide-react";
import { Product, InvoiceItem, Invoice, PaymentMethod, Shop, SoundboxSettings } from "../../types";
import { formatINR } from "../../utils/barcode";
import { sounds } from "../../utils/audio";
import { voiceManager } from "../../utils/speech";
import { BarcodeScannerModal } from "../BarcodeScannerModal";
import { DigitalInvoiceModal } from "../DigitalInvoiceModal";
import { LooseWeightCalculatorModal } from "../modals/LooseWeightCalculatorModal";
import { SoundboxSettingsModal } from "../modals/SoundboxSettingsModal";
import { ParchiScannerModal } from "../modals/ParchiScannerModal";
import { VisualCashCalculatorModal } from "../modals/VisualCashCalculatorModal";
import { FastProductGrid } from "./FastProductGrid";

interface BillingPOSProps {
  shop: Shop;
  products: Product[];
  onBillCompleted: (invoice: Invoice) => void;
  language: "en" | "hi";
  saralMode?: boolean;
  prefilledReservation?: {
    reservationId: string;
    customerName: string;
    customerPhone: string;
    items: { productId: string; quantity: number }[];
  } | null;
}

export const BillingPOS: React.FC<BillingPOSProps> = ({
  shop,
  products,
  onBillCompleted,
  language,
  saralMode = false,
  prefilledReservation,
}) => {
  const isHindi = language === "hi";

  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [historyStack, setHistoryStack] = useState<InvoiceItem[][]>([]);
  const [customerPhone, setCustomerPhone] = useState("+91 98450 67890");
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Dedicated Business UPI QR");
  const [discountTotal, setDiscountTotal] = useState<number>(0);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isParchiScannerOpen, setIsParchiScannerOpen] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isLooseWeightOpen, setIsLooseWeightOpen] = useState(false);
  const [isSoundboxOpen, setIsSoundboxOpen] = useState(false);
  const [isCashCalcOpen, setIsCashCalcOpen] = useState(false);
  const [showFastGrid, setShowFastGrid] = useState<boolean>(true);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [soundboxSettings, setSoundboxSettings] = useState<SoundboxSettings>({
    enabled: true,
    language: language === "hi" ? "hi" : "en",
    volume: 1,
    autoAnnounceOnPOS: true,
    autoAnnounceOnPickup: true,
    chimeStyle: "paytm",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeReservationId, setActiveReservationId] = useState<string | undefined>(undefined);

  // Completed invoice to view/print
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Voice Search / Voice Cart handler
  const handleToggleVoice = () => {
    if (isVoiceListening) {
      voiceManager.stopListening();
      setIsVoiceListening(false);
      return;
    }

    sounds.playScanBeep();
    const success = voiceManager.startListening(
      language,
      (text, isFinal) => {
        setSearchQuery(text);
        if (isFinal) {
          // Try to match product
          const lower = text.toLowerCase();
          const matched = products.find(
            (p) =>
              p.name.toLowerCase().includes(lower) ||
              (p.hindiName && p.hindiName.includes(text)) ||
              p.category.toLowerCase().includes(lower)
          );
          if (matched && matched.currentStock > 0) {
            handleAddManualProduct(matched, 1);
            sounds.playSuccessChime();
          }
        }
      },
      (err) => {
        setIsVoiceListening(false);
      },
      () => {
        setIsVoiceListening(false);
      }
    );

    if (success) {
      setIsVoiceListening(true);
    }
  };

  // Add loose weight commodity from calculator
  const handleAddLooseProduce = (item: {
    name: string;
    weightInGrams: number;
    pricePerKg: number;
    totalPrice: number;
    category: string;
  }) => {
    const newItem: InvoiceItem = {
      productId: `loose-${Date.now()}`,
      productName: item.name,
      unit: item.weightInGrams >= 1000 ? "Kg" : "Gram",
      quantity: 1,
      mrp: item.totalPrice,
      sellingPrice: item.totalPrice,
      gstPercent: 0,
      discount: 0,
      total: item.totalPrice,
      isManualEntry: true,
    };
    saveCartState([...cart, newItem]);
  };

  // If prefilled from reservation
  useEffect(() => {
    if (prefilledReservation) {
      setCustomerName(prefilledReservation.customerName);
      setCustomerPhone(prefilledReservation.customerPhone);
      setActiveReservationId(prefilledReservation.reservationId);

      const items: InvoiceItem[] = [];
      for (const resItem of prefilledReservation.items) {
        const prod = products.find((p) => p.id === resItem.productId);
        if (prod) {
          items.push({
            productId: prod.id,
            productName: prod.name,
            barcode: prod.barcode,
            unit: prod.unit,
            quantity: resItem.quantity,
            mrp: prod.mrp,
            sellingPrice: prod.sellingPrice,
            gstPercent: prod.gstPercent,
            discount: 0,
            total: prod.sellingPrice * resItem.quantity,
            isManualEntry: !prod.hasBarcode,
          });
        }
      }
      setCart(items);
    }
  }, [prefilledReservation, products]);

  const saveCartState = (newCart: InvoiceItem[]) => {
    setHistoryStack((prev) => [...prev.slice(-10), cart]);
    setCart(newCart);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));
    setCart(previous);
  };

  // Add items extracted from Parchi Scanner (AI OCR)
  const handleAddParchiItemsToPOS = (items: { product: Product; quantity: number }[]) => {
    const newItems: InvoiceItem[] = items.map(({ product, quantity }) => {
      const sp = product.sellingPrice || 40;
      const mrp = product.mrp || sp;
      return {
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        unit: product.unit,
        quantity,
        mrp,
        sellingPrice: sp,
        gstPercent: product.gstPercent || 0,
        discount: Math.max(0, mrp - sp),
        total: sp * quantity,
        isManualEntry: !product.barcode || product.barcode.startsWith("PARCHI-"),
      };
    });
    saveCartState([...cart, ...newItems]);
    sounds.playSuccessChime();
  };

  // Barcode scanned in POS
  const handleBarcodeScanned = (barcode: string) => {
    const product = products.find(
      (p) => p.barcode === barcode || p.sku.toLowerCase() === barcode.toLowerCase()
    );

    if (!product) {
      sounds.playWarningBuzz();
      setErrorMessage(`No product found with barcode ${barcode}. Try searching manually.`);
      return;
    }

    if (product.currentStock <= 0) {
      sounds.playWarningBuzz();
      setErrorMessage(`${product.name} is out of stock!`);
      return;
    }

    setErrorMessage(null);

    // If item already in cart, increment quantity (Section 11: Repeated Barcode Scanning)
    const existingIndex = cart.findIndex((i) => i.productId === product.id);
    let newCart = [...cart];

    if (existingIndex >= 0) {
      const existing = newCart[existingIndex];
      const newQty = existing.quantity + 1;
      if (newQty > product.currentStock) {
        setErrorMessage(`Cannot add more. Max physical stock available: ${product.currentStock}`);
        return;
      }
      newCart[existingIndex] = {
        ...existing,
        quantity: newQty,
        total: existing.sellingPrice * newQty - existing.discount,
      };
    } else {
      newCart.push({
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        unit: product.unit,
        quantity: 1,
        mrp: product.mrp,
        sellingPrice: product.sellingPrice,
        gstPercent: product.gstPercent,
        discount: 0,
        total: product.sellingPrice,
        isManualEntry: !product.hasBarcode,
      });
    }

    saveCartState(newCart);
  };

  // Add item manually from search / quick catalog
  const handleAddManualProduct = (product: Product, quantity = 1) => {
    if (product.currentStock <= 0) {
      setErrorMessage(`${product.name} is out of stock.`);
      return;
    }

    const existingIndex = cart.findIndex((i) => i.productId === product.id);
    let newCart = [...cart];

    if (existingIndex >= 0) {
      const existing = newCart[existingIndex];
      const newQty = existing.quantity + quantity;
      newCart[existingIndex] = {
        ...existing,
        quantity: newQty,
        total: existing.sellingPrice * newQty - existing.discount,
      };
    } else {
      newCart.push({
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        unit: product.unit,
        quantity,
        mrp: product.mrp,
        sellingPrice: product.sellingPrice,
        gstPercent: product.gstPercent,
        discount: 0,
        total: product.sellingPrice * quantity,
        isManualEntry: !product.hasBarcode,
      });
    }

    sounds.playScanBeep();
    saveCartState(newCart);
    setSearchQuery("");
  };

  const handleUpdateQty = (index: number, delta: number) => {
    const item = cart[index];
    const product = products.find((p) => p.id === item.productId);
    const max = product ? product.currentStock : 999;
    const newQty = Math.max(1, Math.min(max, item.quantity + delta));

    const newCart = [...cart];
    newCart[index] = {
      ...item,
      quantity: newQty,
      total: item.sellingPrice * newQty - item.discount,
    };
    saveCartState(newCart);
  };

  const handleManualQtyChange = (index: number, val: string) => {
    const qty = parseFloat(val) || 1;
    const item = cart[index];
    const newCart = [...cart];
    newCart[index] = {
      ...item,
      quantity: qty,
      total: item.sellingPrice * qty - item.discount,
    };
    saveCartState(newCart);
  };

  const handleRemoveItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    saveCartState(newCart);
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const gstEstimated = cart.reduce(
    (sum, item) => sum + (item.total * item.gstPercent) / 100,
    0
  );
  const finalTotal = Math.max(0, Math.round(subtotal - discountTotal));

  // Submit and Complete Bill transaction
  const handleCompleteBill = async () => {
    if (cart.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          customerName: customerName.trim() || "Walk-in Customer",
          customerPhone: customerPhone.trim(),
          items: cart.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            sellingPrice: i.sellingPrice,
            discount: i.discount,
          })),
          discountTotal,
          paymentMethod,
          reservationId: activeReservationId,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create invoice and update stock");
      }

      sounds.playSuccessChime();
      if (soundboxSettings.enabled && soundboxSettings.autoAnnounceOnPOS) {
        sounds.playSoundboxAnnouncement(finalTotal, soundboxSettings.language, shop.name);
      }
      setCompletedInvoice(data.invoice);
      onBillCompleted(data.invoice);

      // Reset cart
      setCart([]);
      setHistoryStack([]);
      setDiscountTotal(0);
      setActiveReservationId(undefined);
      setIsUpiModalOpen(false);
    } catch (err: any) {
      console.error("Billing error:", err);
      sounds.playWarningBuzz();
      setErrorMessage(err.message || "Failed to complete transaction");
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter products for manual quick search
  const filteredProducts = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.barcode.includes(searchQuery)
        )
        .slice(0, 6)
    : [];

  return (
    <div id="billing-pos-container" className="space-y-4">
      {/* Top POS Action Toolbar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Major Button: SCAN PRODUCT */}
          <button
            id="scan-product-btn"
            onClick={() => setIsScannerOpen(true)}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <BarcodeIcon className="w-5 h-5" />
            <span>{isHindi ? "बारकोड स्कैन करें" : "SCAN PRODUCT"}</span>
          </button>

          {/* Major Button: SCAN PARCHI (AI OCR) */}
          <button
            id="pos-scan-parchi-btn"
            onClick={() => setIsParchiScannerOpen(true)}
            className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-yellow-500/20 via-amber-500/25 to-yellow-500/20 hover:from-amber-500/35 hover:to-yellow-500/35 border border-amber-500/50 text-amber-300 hover:text-amber-200 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            title={isHindi ? "कागज़ की पर्ची या व्हाट्सएप लिस्ट स्कैन करें (Gemini AI)" : "Scan handwritten grocery slip or WhatsApp list with Gemini AI"}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{isHindi ? "पर्ची स्कैन (AI)" : "SCAN PARCHI (AI)"}</span>
          </button>

          {/* Undo Last Scan Button (Section 11) */}
          <button
            onClick={handleUndo}
            disabled={historyStack.length === 0}
            className="px-3 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-700"
            title="Undo last item addition"
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          {/* Quick Loose Produce / Weighing Scale Calculator */}
          <button
            id="loose-weight-calc-btn"
            onClick={() => setIsLooseWeightOpen(true)}
            className="px-3 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-amber-500/30 shadow-sm"
            title={isHindi ? "तौल वाले सामान का कैलकुलेटर (आलू, प्याज, चीनी, दाल)" : "Loose Weight Calculator (Potatoes, Dal, Sugar)"}
          >
            <Scale className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">{isHindi ? "तौल सामान (Loose)" : "Weighing Scale"}</span>
          </button>

          {/* Soundbox Setting & Status */}
          <button
            id="soundbox-status-btn"
            onClick={() => setIsSoundboxOpen(true)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border ${
              soundboxSettings.enabled
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700"
            }`}
            title="Configure Paytm/PhonePe style voice announcements"
          >
            <Radio className={`w-3.5 h-3.5 ${soundboxSettings.enabled ? "text-emerald-400 animate-pulse" : "text-neutral-500"}`} />
            <span className="hidden lg:inline">{isHindi ? "साउंडबॉक्स" : "Soundbox"}</span>
            {soundboxSettings.enabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            )}
          </button>
          {/* Fast Picture Grid Toggle Button */}
          <button
            id="toggle-fast-grid-btn"
            type="button"
            onClick={() => setShowFastGrid(!showFastGrid)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border ${
              showFastGrid
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white"
            }`}
            title={isHindi ? "चित्र व फोटो द्वारा त्वरित बिलिंग ग्रिड" : "Visual Touch Fast Product Grid"}
          >
            <LayoutGrid className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">{isHindi ? "फोटो ग्रिड POS" : "Touch Grid"}</span>
          </button>
        </div>

        {/* Manual Search & Non-Barcode Loose Products with Voice Mic */}
        <div className="relative flex-1 min-w-[220px] max-w-md flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              id="pos-search-product"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHindi ? "सामान का नाम खोजें (आलू, दूध, नमक)..." : "Search loose items (Tomatoes, Rice, Dal)..."}
              className="w-full pl-9 pr-9 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
            />
            {/* Voice Mic Button inside input */}
            <button
              type="button"
              id="pos-voice-search-btn"
              onClick={handleToggleVoice}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all ${
                isVoiceListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "text-neutral-400 hover:text-amber-400"
              }`}
              title={isHindi ? "बोलकर खोजें व जोड़ें" : "Speak to search & add"}
            >
              {isVoiceListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Quick Search Dropdown */}
          {filteredProducts.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl z-30 overflow-hidden divide-y divide-neutral-800 max-h-60 overflow-y-auto">
              {filteredProducts.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => handleAddManualProduct(prod)}
                  className="w-full p-2.5 text-left hover:bg-neutral-800 flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <div className="font-bold text-neutral-100 flex items-center gap-1.5">
                      <span>{prod.name}</span>
                      {!prod.hasBarcode && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                          Loose {prod.unit}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Stock: {prod.currentStock} {prod.unit} • MRP {formatINR(prod.mrp)}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-amber-400">
                    {formatINR(prod.sellingPrice)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-neutral-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Fast Product Grid (Visual Touch POS for high-speed counter billing) */}
      {showFastGrid && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-extrabold text-xs sm:text-sm text-neutral-200">
                {isHindi ? "त्वरित चित्र बिलिंग (Fast Touch Grid)" : "Visual Fast Touch Grid"}
              </h3>
            </div>
            <span className="text-[11px] text-neutral-500">
              {isHindi ? "सामान का फोटो छूकर 1 सेकंड में बिल बनाएं" : "Tap photo to add to bill"}
            </span>
          </div>
          <FastProductGrid
            products={products}
            onAddProduct={(prod, qty = 1) => handleAddManualProduct(prod, qty)}
            language={language}
            saralMode={saralMode}
          />
        </div>
      )}

      {/* Main Billing Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 8 Cols: Itemized Current Bill */}
        <div className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between min-h-[440px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-neutral-200">
                  {isHindi ? "सक्रिय बिल तालिका" : "Active Bill Items"} ({cart.length})
                </h3>
              </div>
              {activeReservationId && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  Linked to Reservation {activeReservationId}
                </span>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-neutral-500">
                  <BarcodeIcon className="w-7 h-7" />
                </div>
                <div className="text-sm font-semibold text-neutral-300">
                  {isHindi ? "बिल खाली है" : "No items scanned yet"}
                </div>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  {isHindi
                    ? "ऊपर दिए गए उत्पाद फोटो छुएं या 'बारकोड स्कैन करें' दबाएं"
                    : "Tap product photos above or tap SCAN PRODUCT to scan barcodes"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-800/60 overflow-y-auto max-h-[360px] custom-scrollbar pr-1">
                {cart.map((item, idx) => (
                  <div
                    key={`${item.productId}-${idx}`}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-neutral-100 truncate flex items-center gap-1.5">
                        <span>{item.productName}</span>
                        {item.isManualEntry && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-amber-300">
                            Loose
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => sounds.speakItem(item.productName, item.total, language)}
                          className="p-1 rounded-md text-neutral-500 hover:text-amber-400"
                          title="Speak item name and price"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-0.5">
                        <span>{formatINR(item.sellingPrice)} / {item.unit}</span>
                        {item.gstPercent > 0 && <span>• GST {item.gstPercent}%</span>}
                        {item.barcode && <span className="font-mono text-neutral-500">{item.barcode}</span>}
                      </div>
                    </div>

                    {/* Quantity Selector: Minus / Plus / Manual input */}
                    <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-700 rounded-xl p-1">
                      <button
                        onClick={() => handleUpdateQty(idx, -1)}
                        className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-300"
                        title="Decrease Qty"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleManualQtyChange(idx, e.target.value)}
                        className="w-12 text-center bg-transparent font-mono font-bold text-neutral-100 focus:outline-none text-xs"
                      />

                      <button
                        onClick={() => handleUpdateQty(idx, 1)}
                        className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-300"
                        title="Increase Qty"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Total Item Price & Remove */}
                    <div className="text-right min-w-[70px]">
                      <div className="font-mono font-bold text-sm text-neutral-100">
                        {formatINR(item.total)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fast Non-Barcode Loose Items Shortcuts (Section 8) */}
          <div className="pt-3 border-t border-neutral-800 mt-4">
            <div className="text-[11px] font-semibold text-neutral-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Quick Add Loose Groceries (No Barcode Required):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {products
                .filter((p) => !p.hasBarcode)
                .slice(0, 5)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleAddManualProduct(p, 1)}
                    className="px-2.5 py-1 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-[11px] text-neutral-300 transition-colors flex items-center gap-1"
                  >
                    <span>+ {p.name.split(" ")[0]}</span>
                    <span className="text-amber-400 font-mono font-bold">
                      {formatINR(p.sellingPrice)}/{p.unit}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Customer, Payment & Complete Bill Checkout */}
        <div className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Customer Details */}
            <div className="space-y-2 pb-3 border-b border-neutral-800">
              <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
                Customer Information
              </label>
              <div className="space-y-1.5">
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 Phone number..."
                    className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name..."
                    className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector (Select Payment Method Only - Payment Arrives via Dedicated QR) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
                  Select Payment Method
                </label>
                <span className="text-[10px] text-amber-400 font-semibold">
                  Zero Gateway Fee • Direct Settlement
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  id="payment-method-dedicated-qr"
                  onClick={() => setPaymentMethod("Dedicated Business UPI QR")}
                  className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === "Dedicated Business UPI QR" || paymentMethod === "UPI"
                      ? "bg-amber-500 text-neutral-950 border-amber-400 shadow-md scale-[1.01]"
                      : "bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span className="leading-tight text-center">Dedicated Business QR</span>
                  <span className="text-[9px] font-normal opacity-80">Arrives in Business UPI</span>
                </button>

                <button
                  type="button"
                  id="payment-method-cash"
                  onClick={() => setPaymentMethod("Cash")}
                  className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === "Cash"
                      ? "bg-amber-500 text-neutral-950 border-amber-400 shadow-md scale-[1.01]"
                      : "bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Cash Payment</span>
                  <span className="text-[9px] font-normal opacity-80">Physical Counter Cash</span>
                </button>

                <button
                  type="button"
                  id="payment-method-khata"
                  onClick={() => setPaymentMethod("Store Credit (Khata)")}
                  className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === "Store Credit (Khata)"
                      ? "bg-amber-500 text-neutral-950 border-amber-400 shadow-md scale-[1.01]"
                      : "bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Store Credit (Khata)</span>
                  <span className="text-[9px] font-normal opacity-80">Customer Udhar Book</span>
                </button>

                <button
                  type="button"
                  id="payment-method-card"
                  onClick={() => setPaymentMethod("Card POS Terminal")}
                  className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === "Card POS Terminal" || paymentMethod === "Card"
                      ? "bg-amber-500 text-neutral-950 border-amber-400 shadow-md scale-[1.01]"
                      : "bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Card POS Terminal</span>
                  <span className="text-[9px] font-normal opacity-80">Store EDC Swipe</span>
                </button>
              </div>

              {/* Dedicated Business QR details banner */}
              {(paymentMethod === "Dedicated Business UPI QR" || paymentMethod === "UPI") && (
                <div className="p-2.5 bg-neutral-950 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-2 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-[11px] flex items-center gap-1">
                        <span>Dedicated QR:</span>
                        <span className="font-mono text-amber-400 font-bold">{shop.upiId}</span>
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        Funds arrive directly in your business account • 0% gateway commission
                      </div>
                    </div>
                  </div>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsUpiModalOpen(true)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-[11px] shadow-sm flex-shrink-0 transition-colors"
                    >
                      Show QR
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bill Discount Input */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-neutral-400">
                <span>Flat Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={discountTotal}
                  onChange={(e) => setDiscountTotal(Math.max(0, Number(e.target.value)))}
                  className="w-20 px-2 py-0.5 bg-neutral-950 border border-neutral-700 rounded-lg text-right text-xs font-mono text-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-800 text-xs text-neutral-400">
              <div className="flex justify-between">
                <span>Subtotal ({cart.length} items):</span>
                <span className="font-mono text-neutral-200">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Est. GST:</span>
                <span className="font-mono text-neutral-400">{formatINR(gstEstimated)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount:</span>
                  <span className="font-mono">-{formatINR(discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-neutral-800 text-base font-extrabold text-white">
                <div className="flex items-center gap-1.5">
                  <span>Payable Amount:</span>
                  <button
                    type="button"
                    onClick={() =>
                      sounds.speakText(
                        isHindi
                          ? `कुल बिल राशि ${finalTotal} रुपये`
                          : `Total payable amount: ${finalTotal} rupees`,
                        language
                      )
                    }
                    className="p-1 rounded-md text-neutral-400 hover:text-amber-400"
                    title="Speak bill total"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-xl font-mono text-amber-400">{formatINR(finalTotal)}</span>
              </div>
            </div>
          </div>

          {/* Checkout / Complete Button */}
          <div className="space-y-2">
            {/* Visual Cash Calculator button when Cash is selected */}
            {paymentMethod === "Cash" && cart.length > 0 && (
              <button
                type="button"
                id="open-cash-calc-btn"
                onClick={() => setIsCashCalcOpen(true)}
                className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-amber-500/40 shadow-sm"
              >
                <Banknote className="w-4 h-4 text-amber-400" />
                <span>{isHindi ? "💵 नकद नोट व छुट्टे कैलकुलेटर" : "Visual Cash & Change Calculator"}</span>
              </button>
            )}

            {/* Khata notice when Store Credit is selected */}
            {paymentMethod === "Store Credit (Khata)" && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-[11px] font-semibold flex items-center gap-2">
                <span>📖</span>
                <span>
                  {isHindi
                    ? `${customerName} के बही-खाते में ₹${finalTotal} का उधार जुड़ेगा`
                    : `Will record ₹${finalTotal} credit under ${customerName}'s Khata`}
                </span>
              </div>
            )}

            {(paymentMethod === "Dedicated Business UPI QR" || paymentMethod === "UPI") && cart.length > 0 && (
              <button
                type="button"
                onClick={() => setIsUpiModalOpen(true)}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-amber-500/30"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Show Customer Dedicated Business QR</span>
              </button>
            )}

            <button
              id="complete-bill-btn"
              onClick={handleCompleteBill}
              disabled={cart.length === 0 || isProcessing}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-neutral-950 font-black rounded-2xl text-sm shadow-xl shadow-emerald-500/20 disabled:opacity-40 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              {isProcessing ? (
                <span>Recording Inventory & Bill...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>RECORD BILL • {formatINR(finalTotal)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
        mode="billing"
        continuous={true}
        language={language}
        title={isHindi ? "पीओएस बारकोड स्कैनर" : "POS Barcode Scanner"}
        subtitle={isHindi ? "उत्पाद के बारकोड पर कैमरा लाएं या त्वरित नमूना उत्पाद टैप करें" : "Point camera at product barcode or tap simulated product below"}
      />

      {/* Interactive Dedicated Business UPI QR Modal */}
      {isUpiModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsUpiModalOpen(false)}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-3xl p-6 w-full max-w-sm text-center space-y-4 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <QrCode className="w-3 h-3" />
                <span>{isHindi ? "समर्पित व्यापारिक यूपीआई क्यूआर" : "Dedicated Business UPI QR"}</span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                {shop.name}
              </h3>
              <p className="font-mono text-xs text-amber-400 font-semibold">{shop.upiId}</p>
            </div>

            {/* Generated UPI QR Code Graphics */}
            <div className="p-3 bg-white rounded-2xl inline-block shadow-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `upi://pay?pa=${shop.upiId}&pn=${encodeURIComponent(shop.name)}&am=${finalTotal}&cu=INR`
                )}`}
                alt="Dedicated Business UPI QR Code"
                className="w-44 h-44 mx-auto rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-black font-mono text-emerald-400">
                {formatINR(finalTotal)}
              </div>
              <p className="text-[11px] text-neutral-400">
                {isHindi ? "भुगतान सीधे व्यापारी के पंजीकृत बैंक खाते में पहुंचेगा" : "Payment arrives directly in merchant's registered business account"}
              </p>
              <p className="text-[10px] text-neutral-500">
                Google Pay • PhonePe • Paytm • BHIM • Cred
              </p>
            </div>

            <button
              id="confirm-payment-received-btn"
              onClick={() => {
                setIsUpiModalOpen(false);
                handleCompleteBill();
              }}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black rounded-xl text-xs shadow-md transition-colors"
            >
              {isHindi ? "व्यापारिक खाते में भुगतान प्राप्त हुआ • रसीद प्रिंट करें" : "Payment Arrived in Dedicated Account • Print Bill"}
            </button>
          </div>
        </div>
      )}

      {/* Digital Invoice Modal upon bill completion */}
      <DigitalInvoiceModal
        invoice={completedInvoice}
        shop={shop}
        isOpen={!!completedInvoice}
        onClose={() => setCompletedInvoice(null)}
        language={language}
      />

      {/* Loose Weight Produce & Non-Barcode Scale Calculator */}
      <LooseWeightCalculatorModal
        isOpen={isLooseWeightOpen}
        onClose={() => setIsLooseWeightOpen(false)}
        onAddLooseItem={handleAddLooseProduce}
        language={language}
      />

      {/* Audio Soundbox Settings & Test */}
      <SoundboxSettingsModal
        isOpen={isSoundboxOpen}
        onClose={() => setIsSoundboxOpen(false)}
        shop={shop}
        settings={soundboxSettings}
        onSaveSettings={(newSettings) => setSoundboxSettings(newSettings)}
        language={language}
      />

      {/* Parchi Scanner Modal for handwritten customer grocery slips */}
      <ParchiScannerModal
        isOpen={isParchiScannerOpen}
        onClose={() => setIsParchiScannerOpen(false)}
        shop={shop}
        shopProducts={products}
        onAddItemsToCart={handleAddParchiItemsToPOS}
        language={language}
        mode="seller"
      />

      {/* Visual Cash & Change Calculator with Currency Notes & Coins */}
      <VisualCashCalculatorModal
        isOpen={isCashCalcOpen}
        onClose={() => setIsCashCalcOpen(false)}
        payableAmount={finalTotal}
        onConfirmCash={(received, change) => {
          setIsCashCalcOpen(false);
          sounds.announceCashChange(received, change, language);
          handleCompleteBill();
        }}
        language={language}
      />
    </div>
  );
};
