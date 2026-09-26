import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Sparkles,
  Camera,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  ShoppingBag,
  Receipt,
  RotateCcw,
  Zap,
  Check,
  Store,
} from "lucide-react";
import { Shop, Product, ParchiParsedItem } from "../../types";
import { sounds } from "../../utils/audio";

interface ParchiScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
  shopProducts: Product[];
  onAddItemsToCart: (items: { product: Product; quantity: number }[]) => void;
  language?: "en" | "hi";
  mode?: "customer" | "seller";
}

export const ParchiScannerModal: React.FC<ParchiScannerModalProps> = ({
  isOpen,
  onClose,
  shop,
  shopProducts,
  onAddItemsToCart,
  language = "hi",
  mode = "customer",
}) => {
  const isHindi = language === "hi";
  const isSeller = mode === "seller";

  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "paste">("upload");
  const [pastedText, setPastedText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParchiParsedItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aiEngineUsed, setAiEngineUsed] = useState<string | null>(null);

  // Live Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera stream when tab changes or modal closes
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setErrorMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab !== "camera") {
      stopCameraStream();
    }
  }, [activeTab]);

  if (!isOpen) return null;

  const shopId = shop?.id || "shop-1";
  const shopName = shop?.name || "Neighborhood Kirana";

  // Start live camera
  const handleStartCamera = async () => {
    setCameraError(null);
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          isHindi
            ? "इस ब्राउज़र में कैमरा समर्थित नहीं है। कृपया फ़ोटो अपलोड करें।"
            : "Camera API not supported in this browser. Please upload an image."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      sounds.playScanBeep();
    } catch (err: any) {
      console.warn("Camera access error:", err);
      setCameraError(
        isHindi
          ? "कैमरा अनुमति नहीं मिली। कृपया फ़ोटो अपलोड (Upload) विकल्प का उपयोग करें।"
          : "Camera permission denied or unavailable. Please use the Upload Photo option."
      );
      setIsCameraActive(false);
    }
  };

  // Capture frame from video
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setImagePreview(dataUrl);
        stopCameraStream();
        sounds.playScanBeep();
      }
    } catch (err) {
      console.error("Failed to capture snapshot:", err);
    }
  };

  // File upload from disk / gallery
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
      setErrorMessage(null);
      sounds.playScanBeep();
    };
    reader.readAsDataURL(file);
  };

  // Parse parchi via AI
  const handleParse = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    sounds.playScanBeep();

    try {
      const payload: any = { shopId };
      if ((activeTab === "camera" || activeTab === "upload") && imagePreview) {
        payload.imageBase64 = imagePreview;
      } else if (activeTab === "paste" && pastedText.trim()) {
        payload.textContent = pastedText.trim();
      } else {
        throw new Error(
          isHindi
            ? "कृपया पर्ची की फोटो लें या सामान की लिस्ट लिखें।"
            : "Please capture or upload an image of the slip, or paste an item list."
        );
      }

      const res = await fetch("/api/ai/parse-grocery-parchi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !Array.isArray(data.items)) {
        throw new Error(data.error || "Failed to decipher grocery parchi items.");
      }

      if (data.items.length === 0) {
        throw new Error(
          isHindi
            ? "पर्ची में कोई सामान नहीं पढ़ा जा सका। कृपया स्पष्ट तस्वीर लें।"
            : "Could not detect grocery items from the slip. Please provide a clearer photo."
        );
      }

      setParsedItems(data.items);
      setAiEngineUsed(data.aiEngine || "Gemini 3.8 Flash Vision");

      // Select all items by default
      const initialSelected = new Set<string>();
      data.items.forEach((item: ParchiParsedItem) => {
        initialSelected.add(item.id);
      });
      setSelectedItemIds(initialSelected);
      sounds.playSuccessChime();
    } catch (err: any) {
      console.error("Failed to parse parchi:", err);
      setErrorMessage(err.message || "Failed to process grocery slip. Please retry.");
      sounds.playWarningBuzz();
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateItemQuantity = (id: string, delta: number) => {
    setParsedItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, (item.requestedQuantity || 1) + delta);
          return { ...item, requestedQuantity: newQty };
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    setParsedItems((prev) => prev.filter((item) => item.id !== id));
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Add items to POS Bill (Seller) or Hold Cart (Customer)
  const handleAddItems = () => {
    const itemsToAdd: { product: Product; quantity: number }[] = [];

    parsedItems.forEach((item) => {
      if (!selectedItemIds.has(item.id)) return;

      // 1. Try finding matched product in catalog by ID
      let matched = shopProducts.find((p) => p.id === item.matchedProductId);

      // 2. Try matching by name
      if (!matched && item.matchedProductName) {
        matched = shopProducts.find(
          (p) => p.name.toLowerCase() === item.matchedProductName?.toLowerCase()
        );
      }

      // 3. If unlisted loose/commodity item, construct custom Product entity so it adds cleanly!
      if (!matched) {
        const price = item.matchedPrice || 40;
        matched = {
          id: `parchi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: item.matchedProductName || item.rawText,
          hindiName: item.rawText,
          barcode: `PARCHI-${Date.now()}`,
          sku: `PARCHI-${Date.now()}`,
          hasBarcode: false,
          category: "Grocery",
          brand: "Kirana Fresh",
          mrp: price,
          sellingPrice: price,
          purchasePrice: Math.round(price * 0.8),
          gstPercent: 0,
          currentStock: 99,
          reservedStock: 0,
          damagedStock: 0,
          expiredStock: 0,
          minimumStock: 5,
          unit: item.requestedUnit || "Piece",
          shopId,
          image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300",
          status: "active",
          lastVerifiedAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
        };
      }

      if (matched) {
        itemsToAdd.push({
          product: matched,
          quantity: Math.max(1, Math.round(item.requestedQuantity || 1)),
        });
      }
    });

    if (itemsToAdd.length > 0) {
      onAddItemsToCart(itemsToAdd);
      sounds.playSuccessChime();
      stopCameraStream();
      onClose();
    }
  };

  const selectedCount = parsedItems.filter((i) => selectedItemIds.has(i.id)).length;
  const totalEstimatedAmount = parsedItems
    .filter((i) => selectedItemIds.has(i.id))
    .reduce((acc, curr) => acc + curr.matchedPrice * (curr.requestedQuantity || 1), 0);

  return (
    <div
      id="parchi-scanner-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl max-h-[94vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  {isSeller
                    ? isHindi
                      ? "दुकानदार पर्ची स्कैनर (AI POS Billing)"
                      : "Merchant Parchi Scanner (AI Auto-Bill)"
                    : isHindi
                    ? "हस्तलिखित पर्ची स्कैनर (AI OCR)"
                    : "Handwritten Grocery Parchi AI"}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                  Gemini Vision AI
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {isSeller
                  ? isHindi
                    ? `${shopName} के स्टॉक से ग्राहक की हस्तलिखित पर्ची का सीधा मिलान व बिल`
                    : `Instant OCR & catalog stock matching for customer paper slips`
                  : isHindi
                  ? `${shopName} के स्टॉक से पर्ची के सामान का स्वतः मिलान`
                  : `Scan paper note or WhatsApp list to match ${shopName}'s active stock`}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Input Method Switcher */}
          <div className="flex rounded-2xl bg-neutral-950 p-1 border border-neutral-800 text-xs">
            <button
              type="button"
              id="parchi-tab-upload"
              onClick={() => setActiveTab("upload")}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "upload"
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isHindi ? "फ़ोटो अपलोड (Upload)" : "Upload Photo"}</span>
            </button>
            <button
              type="button"
              id="parchi-tab-camera"
              onClick={() => {
                setActiveTab("camera");
                handleStartCamera();
              }}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "camera"
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isHindi ? "लाइव कैमरा (Camera)" : "Live Camera"}</span>
            </button>
            <button
              type="button"
              id="parchi-tab-paste"
              onClick={() => setActiveTab("paste")}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "paste"
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isHindi ? "टेक्स्ट लिस्ट (Paste)" : "Paste Text"}</span>
            </button>
          </div>

          {/* Tab 1: Upload Photo */}
          {activeTab === "upload" && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-700 hover:border-amber-500/70 rounded-3xl p-8 text-center cursor-pointer transition-all bg-neutral-950/60 hover:bg-neutral-950 flex flex-col items-center justify-center space-y-3 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-neutral-200">
                      {isHindi ? "पर्ची की फोटो चुनें (फ़ाइल या गैलरी)" : "Select Grocery Slip Image"}
                    </div>
                    <p className="text-xs text-neutral-400 max-w-sm">
                      {isHindi
                        ? "कागज़ पर पेन या पेंसिल से लिखी किराना पर्ची या व्हाट्सएप स्क्रीनशॉट अपलोड करें। जेमिनी एआई सामान और मात्रा तुरंत पहचान लेगा।"
                        : "Upload a handwritten kirana slip or WhatsApp order list screenshot. AI extracts items, units & prices in real-time."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-neutral-750 bg-black max-h-60 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Grocery Slip Preview"
                    className="max-h-60 object-contain"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-xl bg-black/80 hover:bg-neutral-800 text-white text-[11px] font-bold flex items-center gap-1 border border-neutral-700"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{isHindi ? "बदलें" : "Change"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="p-1.5 rounded-xl bg-black/80 hover:bg-rose-600 text-white transition-colors border border-neutral-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Live Camera */}
          {activeTab === "camera" && (
            <div className="space-y-3">
              {!imagePreview ? (
                <div className="relative rounded-3xl overflow-hidden border border-neutral-750 bg-black min-h-[260px] flex flex-col items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full max-h-72 object-cover ${isCameraActive ? "block" : "hidden"}`}
                  />

                  {!isCameraActive && (
                    <div className="p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-neutral-300 max-w-xs">
                        {cameraError ||
                          (isHindi
                            ? "दुकान या फ़ोन का कैमरा शुरू करें"
                            : "Click below to activate camera")}
                      </p>
                      <button
                        type="button"
                        onClick={handleStartCamera}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 mx-auto"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{isHindi ? "कैमरा चालू करें" : "Start Camera"}</span>
                      </button>
                    </div>
                  )}

                  {isCameraActive && (
                    <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleCaptureSnapshot}
                        className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-neutral-950 font-black rounded-2xl text-xs flex items-center gap-2 shadow-xl active:scale-95 transition-all"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{isHindi ? "फोटो खींचें (Snap Photo)" : "Capture Slip Photo"}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-neutral-750 bg-black max-h-60 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Captured Parchi"
                    className="max-h-60 object-contain"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        handleStartCamera();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-black/80 hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-1.5 border border-neutral-700"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isHindi ? "दोबारा खींचें" : "Retake Photo"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Paste Text */}
          {activeTab === "paste" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-300 block">
                  {isHindi
                    ? "व्हाट्सएप, एसएमएस या डायरी से सामान की सूची यहाँ लिखें / पेस्ट करें:"
                    : "Type or paste items (one per line or separated by comma):"}
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setPastedText((prev) =>
                        prev ? prev + "\n1kg चीनी" : "1kg चीनी\n2 पैकेट मैगी\n500g तूर दाल"
                      )
                    }
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    + {isHindi ? "उदाहरण जोड़ें" : "Insert Example"}
                  </button>
                </div>
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={5}
                placeholder={
                  isHindi
                    ? "उदा:&#10;1kg चीनी&#10;2 पैकेट मैगी&#10;500g तूर दाल&#10;1 लीटर सरसों तेल&#10;2 पीस साबुन"
                    : "e.g.&#10;1kg sugar&#10;2 packet maggi&#10;500g toor dal&#10;1 bottle mustard oil&#10;2 soap"
                }
                className="w-full px-3.5 py-2.5 rounded-2xl bg-neutral-950 border border-neutral-750 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 leading-relaxed resize-none font-mono"
              />
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{errorMessage}</p>
                <p className="text-[11px] text-neutral-400">
                  {isHindi
                    ? "सुझाव: सुनिश्चित करें कि फोटो साफ और पढ़ने योग्य है, या ऊपर दिए गए 'टेक्स्ट लिस्ट' विकल्प में सामान टाइप करें।"
                    : "Tip: Ensure lighting is clear, or paste the item names directly in the Text tab."}
                </p>
              </div>
            </div>
          )}

          {/* Process with AI Button */}
          <button
            type="button"
            id="parse-parchi-btn"
            onClick={handleParse}
            disabled={
              isProcessing ||
              ((activeTab === "upload" || activeTab === "camera") && !imagePreview) ||
              (activeTab === "paste" && !pastedText.trim())
            }
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-40 text-neutral-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all active:scale-[0.98]"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{isHindi ? "Gemini AI पर्ची पढ़ रहा है..." : "Analyzing Slip with Gemini AI..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-neutral-950" />
                <span>
                  {isSeller
                    ? isHindi
                      ? "पर्ची पढ़ें और दुकान स्टॉक से मिलान करें"
                      : "Parse Slip & Match with Store Stock"
                    : isHindi
                    ? "पर्ची पढ़ें और दुकान में सामान खोजें"
                    : "Parse Parchi & Match Store Shelf Stock"}
                </span>
              </>
            )}
          </button>

          {/* Parsed Items List */}
          {parsedItems.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-neutral-800 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {isHindi
                        ? `${parsedItems.length} सामान पहचाने गए`
                        : `${parsedItems.length} Items Deciphered`}
                    </span>
                  </span>
                  {aiEngineUsed && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-800 text-amber-300 font-mono border border-neutral-700">
                      {aiEngineUsed}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedItemIds.size === parsedItems.length) {
                      setSelectedItemIds(new Set());
                    } else {
                      setSelectedItemIds(new Set(parsedItems.map((i) => i.id)));
                    }
                  }}
                  className="text-amber-400 hover:underline text-[11px] font-bold"
                >
                  {selectedItemIds.size === parsedItems.length
                    ? isHindi
                      ? "सभी हटाएं"
                      : "Deselect All"
                    : isHindi
                    ? "सभी चुनें"
                    : "Select All"}
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {parsedItems.map((item) => {
                  const isSelected = selectedItemIds.has(item.id);
                  const isMatchedInCatalog = Boolean(item.matchedProductId);

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500/40 shadow-sm"
                          : "bg-neutral-950/60 border-neutral-800 opacity-70"
                      }`}
                    >
                      {/* Checkbox and Item details */}
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleSelectItem(item.id)}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? "bg-amber-500 border-amber-500 text-neutral-950"
                              : "border-neutral-600 bg-neutral-900"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-white truncate">
                              {item.matchedProductName || item.rawText}
                            </span>
                            {isMatchedInCatalog ? (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 shrink-0">
                                Stock Match
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30 shrink-0">
                                Custom/Loose
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-neutral-300">
                              {item.rawText !== item.matchedProductName && `"${item.rawText}" • `}
                              {item.requestedUnit}
                            </span>
                            <span>•</span>
                            <span className="text-amber-300 font-bold">
                              ₹{item.matchedPrice} / {item.requestedUnit}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Editor */}
                      <div className="flex items-center gap-1.5 shrink-0 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-white font-mono">
                          {item.requestedQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Item Total & Remove */}
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div className="text-xs font-black text-white font-mono min-w-[50px] text-right">
                          ₹{Math.round(item.matchedPrice * (item.requestedQuantity || 1))}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1 rounded-lg text-neutral-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {parsedItems.length > 0 && (
          <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-neutral-400">
                {isHindi ? "कुल चयनित राशि (Estimated Total):" : "Selected Items Total:"}
              </div>
              <div className="text-lg font-black text-amber-400 font-mono">
                ₹{totalEstimatedAmount}
                <span className="text-[11px] text-neutral-400 font-normal ml-1.5">
                  ({selectedCount} {isHindi ? "सामान" : "items"})
                </span>
              </div>
            </div>

            <button
              type="button"
              id="parchi-confirm-add-btn"
              onClick={handleAddItems}
              disabled={selectedCount === 0}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-40 text-neutral-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-amber-500/20 transition-all active:scale-95"
            >
              {isSeller ? (
                <>
                  <Receipt className="w-4 h-4 text-neutral-950" />
                  <span>
                    {isHindi
                      ? `${selectedCount} सामान बिल (POS) में जोड़ें`
                      : `Add ${selectedCount} Items to POS Bill`}
                  </span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-neutral-950" />
                  <span>
                    {isHindi
                      ? `${selectedCount} सामान कार्ट में जोड़ें`
                      : `Add ${selectedCount} Items to Hold Cart`}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
