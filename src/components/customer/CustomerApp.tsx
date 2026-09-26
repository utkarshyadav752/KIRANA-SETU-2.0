import React, { useState, useEffect } from "react";
import {
  Store,
  Search,
  MapPin,
  Clock,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Timer,
  Zap,
  Star,
  MessageCircle,
  ArrowRight,
  Bell,
  RefreshCw,
  Plus,
  Minus,
  Trash2,
  Layers,
  ChevronRight,
  HelpCircle,
  Send,
  Scale,
  FileText,
  Sun,
  Award,
  Share2,
  Volume2,
  Mic,
  MicOff,
  Truck,
} from "lucide-react";
import {
  Shop,
  Product,
  Reservation,
  RestockWaitlist,
  CustomerUser,
  MorningSubscription,
  LoyaltyProfile,
} from "../../types";
import { formatINR, formatDate } from "../../utils/barcode";
import { sounds } from "../../utils/audio";
import { voiceManager } from "../../utils/speech";
import { FindEverythingModal } from "./FindEverythingModal";
import { CustomerAIAssistant } from "./CustomerAIAssistant";
import { LiveChatDrawer } from "../chat/LiveChatDrawer";
import { CustomerProfileSection } from "../auth/CustomerProfileSection";
import { ParchiScannerModal } from "../modals/ParchiScannerModal";
import { LooseWeightCalculatorModal } from "../modals/LooseWeightCalculatorModal";
import { ShareWhatsAppCatalogModal } from "../modals/ShareWhatsAppCatalogModal";
import { MorningSubscriptionsModal } from "./MorningSubscriptionsModal";
import { NeighborhoodLoyaltyCard } from "./NeighborhoodLoyaltyCard";
import { LogOut, UserCheck } from "lucide-react";
import { INITIAL_SHOPS, INITIAL_PRODUCTS } from "../../data/initialData";

interface CustomerAppProps {
  shops: Shop[];
  products: Product[];
  reservations: Reservation[];
  onRefreshProducts: () => void;
  language: "en" | "hi";
  saralMode?: boolean;
  customerUser?: CustomerUser | null;
  onLogout?: () => void;
  onOpenCustomerAuth?: () => void;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({
  shops,
  products,
  reservations,
  onRefreshProducts,
  language,
  saralMode = false,
  customerUser,
  onLogout,
  onOpenCustomerAuth,
}) => {
  const isHindi = language === "hi";

  const customerId = customerUser?.id || "cust-1";
  const customerName = customerUser?.name || "Priya Sharma";
  const customerPhone = customerUser?.phone || "+91 98450 67890";

  // Selected shop for browsing (resilient fallback ensures it is never null)
  const [selectedShop, setSelectedShop] = useState<Shop>(() => {
    return shops && shops.length > 0 ? shops[0] : INITIAL_SHOPS[0];
  });

  const activeShop: Shop = selectedShop || (shops && shops.length > 0 ? shops[0] : INITIAL_SHOPS[0]);

  useEffect(() => {
    if ((!selectedShop || !shops.find((s) => s.id === selectedShop.id)) && shops && shops.length > 0) {
      setSelectedShop(shops[0]);
    }
  }, [shops]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Cart for Reservation
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [orderDeliveryMode, setOrderDeliveryMode] = useState<"pickup" | "delivery">("pickup");

  // Voice Search & Voice-to-Cart handler
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
          const lower = text.toLowerCase();
          const matched = products.find(
            (p) =>
              p.name.toLowerCase().includes(lower) ||
              (p.hindiName && p.hindiName.includes(text)) ||
              p.category.toLowerCase().includes(lower)
          );
          if (matched && matched.currentStock > 0) {
            handleAddToCart(matched);
            sounds.speakText(
              isHindi
                ? `${matched.hindiName || matched.name} झोले में जोड़ा गया`
                : `${matched.name} added to cart`,
              language
            );
          }
        }
      },
      () => setIsVoiceListening(false),
      () => setIsVoiceListening(false)
    );
    if (success) setIsVoiceListening(true);
  };

  const handleVoicePreset = (term: string) => {
    sounds.playScanBeep();
    setSearchQuery(term);
    const lower = term.toLowerCase();
    const matched = products.find(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        (p.hindiName && p.hindiName.includes(term))
    );
    if (matched && matched.currentStock > 0) {
      handleAddToCart(matched);
      sounds.speakText(
        isHindi
          ? `${matched.hindiName || matched.name} झोले में जोड़ा गया`
          : `${matched.name} added to cart`,
        language
      );
    }
  };

  // Modals & Drawers
  const [isFindEverythingOpen, setIsFindEverythingOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParchiScannerOpen, setIsParchiScannerOpen] = useState(false);
  const [isMorningSubsOpen, setIsMorningSubsOpen] = useState(false);
  const [isWhatsAppCatalogOpen, setIsWhatsAppCatalogOpen] = useState(false);
  const [isLooseProduceOpen, setIsLooseProduceOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"catalog" | "reservations" | "ai" | "feedback" | "account">("catalog");

  // Morning Subscriptions & Loyalty State
  const [subscriptions, setSubscriptions] = useState<MorningSubscription[]>([
    {
      id: "sub-1",
      customerId,
      customerName,
      customerPhone,
      shopId: selectedShop?.id || "shop-1",
      shopName: selectedShop?.name || "Aggarwal Super Mart",
      stapleType: "milk",
      itemName: "Amul Taaza Homogenised Milk (500ml)",
      brand: "Amul",
      quantity: 1,
      unit: "Packet",
      dailyPrice: 27,
      frequency: "daily",
      pickupSlot: "7:00 AM - 8:00 AM",
      status: "active",
      deliveryType: "counter_pickup",
      startDate: "2026-09-15",
      nextScheduledDate: "2026-09-21",
    },
  ]);

  const [loyaltyProfile, setLoyaltyProfile] = useState<LoyaltyProfile>({
    customerId,
    shopId: selectedShop?.id || "shop-1",
    stampsCount: 4,
    targetStamps: 5,
    rewardAmount: 50,
    lifetimePoints: 240,
    couponsAvailable: [
      {
        code: "KIRANALOYAL50",
        amount: 50,
        description: "₹50 Off on orders above ₹200",
        expiresAt: "2026-10-31",
        isUsed: false,
      },
    ],
    recentActivity: [
      {
        id: "act-1",
        date: "2026-09-18",
        event: "Reservation Picked up on Time",
        stampsEarned: 1,
      },
    ],
  });
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);

  // Substitution modal for out-of-stock item
  const [substituteItem, setSubstituteItem] = useState<{
    original: Product;
    alternatives: Product[];
  } | null>(null);

  // Restock alerts
  const [waitlists, setWaitlists] = useState<RestockWaitlist[]>([]);
  const [waitlistSuccess, setWaitlistSuccess] = useState<string | null>(null);

  // Platform Feedback Form
  const [fbRating, setFbRating] = useState(5);
  const [fbCategories, setFbCategories] = useState<string[]>(["Easy to use"]);
  const [fbComment, setFbComment] = useState("");
  const [fbSuccess, setFbSuccess] = useState(false);

  // Add items extracted from Parchi Scanner
  const handleAddParchiItems = (items: { product: Product; quantity: number }[]) => {
    items.forEach(({ product, quantity }) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          const maxAvailable = product.currentStock > 0 ? product.currentStock : 99;
          return prev.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: Math.min(maxAvailable, i.quantity + quantity) }
              : i
          );
        }
        return [...prev, { product, quantity: Math.max(1, quantity) }];
      });
    });
    sounds.playSuccessChime();
    setIsCartDrawerOpen(true);
  };

  // Add loose produce calculated by weight
  const handleAddLooseProduceToCart = (item: {
    name: string;
    weightInGrams: number;
    pricePerKg: number;
    totalPrice: number;
    category: string;
  }) => {
    const looseProduct: Product = {
      id: `loose-${Date.now()}`,
      shopId: selectedShop?.id || "shop-1",
      name: item.name,
      brand: "Fresh Loose",
      category: item.category,
      unit: item.weightInGrams >= 1000 ? "Kg" : "Gram",
      currentStock: 999,
      reservedStock: 0,
      damagedStock: 0,
      expiredStock: 0,
      minimumStock: 5,
      mrp: item.totalPrice,
      sellingPrice: item.totalPrice,
      purchasePrice: Math.round(item.totalPrice * 0.8),
      gstPercent: 0,
      sku: `LOOSE-${Date.now()}`,
      barcode: "",
      hasBarcode: false,
      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300",
      status: "active",
      lastVerifiedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };
    setCart((prev) => [...prev, { product: looseProduct, quantity: 1 }]);
    setIsCartDrawerOpen(true);
  };

  // Fetch waitlists for this customer
  useEffect(() => {
    fetch(`/api/waitlist?customerId=${customerId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setWaitlists(d.data);
      })
      .catch(() => {});
  }, [customerId]);

  const currentShopId = activeShop.id;
  const matchedProducts = products.filter((p) => p.shopId === currentShopId);
  const shopProducts = matchedProducts.length > 0 ? matchedProducts : (products.length > 0 ? products : INITIAL_PRODUCTS);
  const categories = ["All", ...Array.from(new Set(shopProducts.map((p) => p.category)))];

  const filteredProducts = shopProducts.filter((p) => {
    if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Add to cart
  const handleAddToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      // Suggest substitution
      handleCheckSubstitute(product);
      return;
    }

    sounds.playScanBeep();
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQty = (idx: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      const newQty = copy[idx].quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== idx);
      }
      copy[idx].quantity = newQty;
      return copy;
    });
  };

  // Check Substitution for Out-of-Stock Item (Section 16)
  const handleCheckSubstitute = async (product: Product) => {
    try {
      const res = await fetch(`/api/marketplace/substitutes/${product.id}`);
      const data = await res.json();
      if (data.success && data.substitutes.length > 0) {
        setSubstituteItem({ original: product, alternatives: data.substitutes });
      } else {
        alert(`${product.name} is currently out of stock. You can join the restock waitlist!`);
      }
    } catch {}
  };

  // Join Restock Waitlist (Section 36 & 37)
  const handleJoinWaitlist = async (product: Product) => {
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: activeShop.id,
          productId: product.id,
          customerId,
          customerName,
          customerPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        sounds.playSuccessChime();
        setWaitlistSuccess(`✓ You will be notified instantly when ${product.name} is restocked!`);
        setWaitlists((prev) => [data.data, ...prev]);
        setTimeout(() => setWaitlistSuccess(null), 4000);
      }
    } catch {}
  };

  // Submit Reservation (Section 26)
  const handleCreateReservation = async () => {
    if (cart.length === 0) return;

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: activeShop.id,
          customerId,
          customerName,
          customerPhone,
          items: cart.map((c) => ({
            productId: c.product.id,
            quantity: c.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        sounds.playSuccessChime();
        setCart([]);
        setIsCartDrawerOpen(false);
        setActiveTab("reservations");
        onRefreshProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // "I'm coming in 20 minutes" Action (Section 31)
  const handleComingSoon = async (reservationId: string) => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}/coming-soon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eta: "20 minutes" }),
      });
      const data = await res.json();
      if (data.success) {
        sounds.playSuccessChime();
        alert("✓ Shopkeeper alerted! Your reservation is marked as arriving in ~20 minutes.");
        onRefreshProducts();
      }
    } catch {}
  };

  // Submit Platform Feedback (Section 45 & 46)
  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/platform-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: customerId,
          userName: customerName,
          userRole: "customer",
          rating: fbRating,
          categories: fbCategories,
          comment: fbComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        sounds.playSuccessChime();
        setFbSuccess(true);
        setFbComment("");
      }
    } catch {}
  };

  // Helper for Inventory Confidence (Section 19)
  const getConfidenceLevel = (lastVerifiedAt: string) => {
    const verifiedDate = new Date(lastVerifiedAt);
    const diffHours = (Date.now() - verifiedDate.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return {
        label: "Recently verified (Today)",
        color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
        indicator: "🟢",
      };
    } else if (diffHours < 72) {
      return {
        label: "May have changed (~2 days ago)",
        color: "text-amber-400 bg-amber-500/20 border-amber-500/30",
        indicator: "🟡",
      };
    } else {
      return {
        label: "Needs confirmation (>3 days ago)",
        color: "text-neutral-400 bg-neutral-800 border-neutral-700",
        indicator: "🔴",
      };
    }
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );

  const customerReservations = reservations.filter(
    (r) => r.customerId === customerId || r.customerPhone === customerPhone
  );

  return (
    <div id="customer-app-container" className="space-y-4">
      {/* Top Customer Toolbar & Shop Switcher */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Nearby Shop Picker */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 font-semibold block uppercase">
              Shopping At Neighborhood Kirana:
            </span>
            <select
              value={activeShop.id}
              onChange={(e) => {
                const availableShops = shops && shops.length > 0 ? shops : INITIAL_SHOPS;
                const s = availableShops.find((x) => x.id === e.target.value);
                if (s) setSelectedShop(s);
              }}
              className="bg-neutral-950 border border-neutral-700 text-white font-extrabold rounded-xl px-2.5 py-1 text-xs focus:outline-none"
            >
              {(shops && shops.length > 0 ? shops : INITIAL_SHOPS).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.distanceKm} km • {s.area})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {/* FIND EVERYTHING IN ONE SHOP (Section 15) */}
          <button
            id="find-everything-btn"
            onClick={() => setIsFindEverythingOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black rounded-2xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Find Everything in One Shop</span>
          </button>

          {/* Chat with Shopkeeper */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-2xl text-xs flex items-center gap-1.5 border border-neutral-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Chat</span>
          </button>

          {/* Cart / Reservation Bag */}
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-2xl text-xs flex items-center gap-1.5 border border-neutral-700 transition-colors relative"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Bag</span>
            {cart.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-neutral-950 font-mono text-[10px] font-black flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sub Tabs: Catalog, My Reservations, Ask AI, App Feedback, Account */}
      <div className="flex flex-wrap items-center bg-neutral-900 border border-neutral-800 p-1.5 rounded-2xl text-xs gap-1">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            activeTab === "catalog"
              ? "bg-amber-500 text-neutral-950 shadow"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          {isHindi ? `दुकान उत्पाद (${shopProducts.length})` : `Store Catalog (${shopProducts.length})`}
        </button>

        <button
          onClick={() => setActiveTab("reservations")}
          className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all relative ${
            activeTab === "reservations"
              ? "bg-amber-500 text-neutral-950 shadow"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          <span>{isHindi ? "मेरी बुकिंग" : "My Reservations"}</span>
          {customerReservations.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 text-[10px] font-mono">
              {customerReservations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeTab === "ai"
              ? "bg-amber-500 text-neutral-950 shadow"
              : "text-amber-400 hover:bg-neutral-800"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isHindi ? "दुकान AI से पूछें" : "Ask My Shop AI"}</span>
        </button>

        <button
          onClick={() => setActiveTab("feedback")}
          className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeTab === "feedback"
              ? "bg-amber-500 text-neutral-950 shadow"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>{isHindi ? "प्रतिक्रिया व रेटिंग" : "Rate App / Feedback"}</span>
        </button>

        <button
          id="customer-tab-account"
          onClick={() => setActiveTab("account")}
          className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeTab === "account"
              ? "bg-rose-600 text-white shadow"
              : "text-rose-400 hover:bg-rose-950/30"
          }`}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isHindi ? "खाता और लॉगआउट" : "Account & Logout"}</span>
        </button>
      </div>

      {/* QUICK HIGH-VALUE SERVICES ACTION BAR (Competitive Feature Suite) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          id="open-parchi-scanner-btn"
          onClick={() => setIsParchiScannerOpen(true)}
          className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-neutral-900 to-amber-500/10 border border-amber-500/30 hover:border-amber-400 text-left transition-all group flex items-center gap-2.5 shadow-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
              {isHindi ? "पर्ची स्कैनर (AI OCR)" : "Scan Parchi / Slip"}
            </div>
            <div className="text-[10px] text-neutral-400 truncate">
              {isHindi ? "कागज़ की पर्ची से स्वतः कार्ट" : "Auto-match hand notes"}
            </div>
          </div>
        </button>

        <button
          id="open-morning-subs-btn"
          onClick={() => setIsMorningSubsOpen(true)}
          className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-neutral-900 to-yellow-500/10 border border-amber-500/30 hover:border-amber-400 text-left transition-all group flex items-center gap-2.5 shadow-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
              {isHindi ? "दैनिक सुबह आवश्यक" : "Morning Staples"}
            </div>
            <div className="text-[10px] text-neutral-400 truncate">
              {isHindi ? "रोज़ सुबह दूध-ब्रेड तैयार" : "Auto 7 AM milk & bread"}
            </div>
          </div>
        </button>

        <button
          id="open-loose-produce-btn"
          onClick={() => setIsLooseProduceOpen(true)}
          className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-neutral-900 to-emerald-500/10 border border-emerald-500/30 hover:border-emerald-400 text-left transition-all group flex items-center gap-2.5 shadow-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Scale className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white group-hover:text-emerald-300 truncate">
              {isHindi ? "तौल सामान कैलकुलेटर" : "Weighing Scale"}
            </div>
            <div className="text-[10px] text-neutral-400 truncate">
              {isHindi ? "आलू, दाल, चीनी ग्राम में" : "Loose produce & grains"}
            </div>
          </div>
        </button>

        <button
          id="open-whatsapp-catalog-btn"
          onClick={() => setIsWhatsAppCatalogOpen(true)}
          className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600/15 via-neutral-900 to-emerald-600/10 border border-emerald-600/30 hover:border-emerald-500 text-left transition-all group flex items-center gap-2.5 shadow-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Share2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white group-hover:text-emerald-300 truncate">
              {isHindi ? "दुकान व्हाट्सएप शेयर" : "Share WhatsApp"}
            </div>
            <div className="text-[10px] text-neutral-400 truncate">
              {isHindi ? "पड़ोसियों को कैटलॉग भेजें" : "Viral catalog & UPI link"}
            </div>
          </div>
        </button>
      </div>

      {waitlistSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-semibold">
          {waitlistSuccess}
        </div>
      )}

      {/* TAB: CUSTOMER ACCOUNT & LOGOUT */}
      {activeTab === "account" && (
        <CustomerProfileSection
          customerUser={customerUser}
          onLogout={onLogout || (() => {})}
          onOpenCustomerAuth={onOpenCustomerAuth}
          language={language}
        />
      )}

      {/* TAB 1: CATALOG & PRODUCT SEARCH */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          {/* Neighborhood Loyalty Stamp Card Widget */}
          <NeighborhoodLoyaltyCard
            shop={activeShop}
            loyaltyProfile={loyaltyProfile}
            onApplyDiscount={(code, amount) => {
              setAppliedDiscount(amount);
              alert(
                isHindi
                  ? `✓ कूपन ${code} लागू हुआ! आपके बिल पर ₹${amount} की छूट मिलेगी।`
                  : `✓ Coupon ${code} applied! ₹${amount} discount added to your checkout.`
              );
            }}
            language={language}
          />
          {/* Voice Order & Quick Presets Bar for Ground-Level Simplicity */}
          <div className="p-3 bg-gradient-to-r from-amber-500/10 via-neutral-900 to-amber-500/15 border border-amber-500/30 rounded-3xl space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="customer-voice-order-btn"
                  onClick={handleToggleVoice}
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold shadow-md transition-all ${
                    isVoiceListening
                      ? "bg-red-500 text-white animate-pulse scale-105"
                      : "bg-amber-500 text-neutral-950 hover:bg-amber-400"
                  }`}
                  title={isHindi ? "माइक दबाकर बोलें" : "Tap microphone to speak"}
                >
                  {isVoiceListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <div>
                  <h4 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                    <span>{isHindi ? "बोलकर सामान खोजें व जोड़ें" : "Speak to Order / Voice Cart"}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                      {isHindi ? "माइक दबाएं" : "Tap Mic"}
                    </span>
                  </h4>
                  <p className="text-[10px] text-neutral-400">
                    {isHindi
                      ? "माइक दबाकर 'दूध', 'आटा' बोलें या नीचे दिए गए बटन छुएं"
                      : "Speak 'Milk' or tap instant preset buttons below"}
                  </p>
                </div>
              </div>

              {isVoiceListening && (
                <span className="px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-bold animate-pulse">
                  {isHindi ? "सुन रहा हूँ... बोलिए" : "Listening... Speak now"}
                </span>
              )}
            </div>

            {/* Quick 1-Tap Visual Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
              {[
                { label: isHindi ? "🥛 अमूल दूध" : "🥛 Amul Milk", term: "Amul Milk" },
                { label: isHindi ? "🌾 आशीर्वाद आटा" : "🌾 Aashirvaad Atta", term: "Atta" },
                { label: isHindi ? "🥔 आलू 2 किलो" : "🥔 Potatoes", term: "Potato" },
                { label: isHindi ? "🧂 टाटा नमक" : "🧂 Tata Salt", term: "Tata Salt" },
                { label: isHindi ? "☕ ताज चाय" : "☕ Tea", term: "Tea" },
                { label: isHindi ? "🍪 पारले-जी" : "🍪 Parle-G", term: "Parle-G" },
                { label: isHindi ? "🧼 डेटॉल साबुन" : "🧼 Dettol Soap", term: "Soap" },
              ].map((item) => (
                <button
                  key={item.term}
                  type="button"
                  onClick={() => handleVoicePreset(item.term)}
                  className="px-2.5 py-1 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 hover:border-amber-500/40 text-[11px] font-bold text-neutral-200 transition-colors whitespace-nowrap active:scale-95 shadow-sm"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isHindi ? "सामान खोजें: मैगी, पारले-जी, दूध, आलू..." : "Search products: Maggi, Parle-G, Milk, Tomatoes..."}
                className="w-full pl-9 pr-9 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg ${
                  isVoiceListening ? "text-red-400 animate-pulse" : "text-neutral-400 hover:text-amber-400"
                }`}
                title="Voice Search"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                    selectedCategory === c
                      ? "bg-amber-500 text-neutral-950"
                      : "bg-neutral-950 text-neutral-400 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className={`grid gap-3 ${saralMode ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`}>
            {filteredProducts.map((prod) => {
              const inStock = prod.currentStock > 0;
              const confidence = getConfidenceLevel(prod.lastVerifiedAt);

              return (
                <div
                  key={prod.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-3xl p-3.5 shadow-xl flex flex-col justify-between space-y-2 hover:border-neutral-700 transition-all group"
                >
                  <div className="space-y-2">
                    {/* Header tags: in stock + confidence indicator */}
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${confidence.color}`}
                        title={`Last Verified: ${formatDate(prod.lastVerifiedAt)}`}
                      >
                        <span>{confidence.indicator}</span>
                        <span className="truncate">{confidence.label}</span>
                      </span>

                      {inStock ? (
                        <span className="text-emerald-400 font-bold font-mono">
                          {prod.currentStock} in stock
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold">Out of stock</span>
                      )}
                    </div>

                    {/* Product Image with Speaker button */}
                    <div className="relative w-full aspect-square rounded-2xl bg-neutral-950 overflow-hidden border border-neutral-800">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.speakItem(prod.hindiName || prod.name, prod.sellingPrice, language);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-black/80 hover:bg-amber-500 hover:text-neutral-950 text-amber-300 flex items-center justify-center transition-colors shadow-md"
                        title={isHindi ? "आवाज़ में नाम व कीमत सुनें" : "Speak name and price aloud"}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Product Name & Brand */}
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-extrabold text-sm text-neutral-100 group-hover:text-amber-300 transition-colors line-clamp-1">
                          {prod.name}
                        </h4>
                      </div>
                      {prod.hindiName && (
                        <p className="text-[11px] text-neutral-300 font-medium line-clamp-1">
                          {prod.hindiName}
                        </p>
                      )}
                      <p className="text-[10px] text-neutral-500 mt-0.5">
                        {prod.brand} • {prod.category}
                      </p>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-base font-mono font-black text-amber-400">
                        {formatINR(prod.sellingPrice)}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        per {prod.unit}
                      </div>
                    </div>

                    {inStock ? (
                      <button
                        onClick={() => handleAddToCart(prod)}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isHindi ? "जोड़ें" : "Reserve"}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        {/* Notify Me When Available Button (Section 36) */}
                        <button
                          onClick={() => handleJoinWaitlist(prod)}
                          className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-xl text-[10px] flex items-center gap-1 border border-neutral-700"
                          title="Alert me when restocked"
                        >
                          <Bell className="w-3 h-3 text-amber-400" />
                          <span>Notify</span>
                        </button>

                        {/* Substitution Alternative Button (Section 16) */}
                        <button
                          onClick={() => handleCheckSubstitute(prod)}
                          className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-xl text-[10px] border border-amber-500/30"
                        >
                          Substitute
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-neutral-400 space-y-2 bg-neutral-900/50 rounded-3xl border border-neutral-800 p-6">
                <ShoppingBag className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
                <p className="font-bold text-sm text-neutral-200">
                  {isHindi ? "कोई उत्पाद नहीं मिला" : "No products found in this selection"}
                </p>
                <p className="text-xs text-neutral-400">
                  {isHindi ? "कृपया दूसरी श्रेणी चुनें या खोज रीसेट करें" : "Try selecting 'All' or search for essentials like Parle-G, Milk, or Salt"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors"
                >
                  {isHindi ? "सभी उत्पाद दिखाएं" : "Show All Products"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY RESERVATIONS & 30-MIN TIMER (Section 26-33) */}
      {activeTab === "reservations" && (
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base text-white">
                  Active Pickup Holds & Guarantee
                </h3>
              </div>
              <span className="text-xs text-neutral-400">
                Logged in as <strong>{customerName}</strong>
              </span>
            </div>

            {customerReservations.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500 space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto text-neutral-600" />
                <p>No active reservations yet.</p>
                <p className="text-[11px] text-neutral-400">
                  Select items from the catalog and tap &quot;Reserve for Pickup&quot; to guarantee stock hold.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {customerReservations.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-neutral-400">
                            {res.reservationNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {res.status}
                          </span>
                          {res.comingSoonAlert && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                              Shopkeeper alerted (~20 min ETA)
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-sm sm:text-base text-white mt-1">
                          {res.shopName}
                        </h4>
                        <p className="text-[11px] text-neutral-400">
                          Hold guarantee until {formatDate(res.expiresAt)}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-black text-base text-amber-400">
                          {formatINR(res.estimatedTotal || res.totalAmount)}
                        </div>
                        <span className="text-[10px] text-neutral-500">Pay at counter upon pickup</span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="pt-2 border-t border-neutral-900 flex flex-wrap gap-1.5 text-xs">
                      {res.items.map((i, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800"
                        >
                          {i.productName} (x{i.quantity})
                        </span>
                      ))}
                    </div>

                    {/* ACTIONS: "I'M COMING IN 20 MINUTES" (Section 31) */}
                    <div className="pt-3 border-t border-neutral-900 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-neutral-400">
                        Directions: 12th Main, Indiranagar • Ph: +91 98765 43210
                      </div>

                      {["Requested", "Confirmed", "Ready"].includes(res.status) && (
                        <div className="flex items-center gap-2">
                          <button
                            id="coming-soon-btn"
                            onClick={() => handleComingSoon(res.id)}
                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                          >
                            <Zap className="w-4 h-4" />
                            <span>I&apos;m Coming in 20 Minutes</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ASK MY SHOP AI (Section 50) */}
      {activeTab === "ai" && (
        <CustomerAIAssistant selectedShop={activeShop} language={language} />
      )}

      {/* TAB 4: APP FEEDBACK & RATING (Section 45 & 46) */}
      {activeTab === "feedback" && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl max-w-2xl mx-auto space-y-4 text-xs">
          <div className="pb-3 border-b border-neutral-800 space-y-1">
            <h3 className="font-extrabold text-base text-white">
              Platform Experience Feedback
            </h3>
            <p className="text-neutral-400">
              Share your feedback to help improve the KiranaSetu local retail network.
            </p>
          </div>

          {fbSuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
              <p className="font-bold">Thank you for your valuable feedback!</p>
              <button
                onClick={() => setFbSuccess(false)}
                className="px-4 py-1.5 rounded-xl bg-neutral-800 text-white font-semibold"
              >
                Submit another review
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendFeedback} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-neutral-300 font-bold block">Overall Rating:</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFbRating(star)}
                      className="p-1 text-2xl transition-transform hover:scale-110"
                    >
                      {star <= fbRating ? "⭐" : "☆"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Category Chips */}
              <div className="space-y-1.5">
                <label className="text-neutral-300 font-bold block">What went well or needs work?</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Easy to use",
                    "Fast",
                    "Barcode scanner",
                    "Billing",
                    "Stock accuracy",
                    "Reservation pickup",
                    "AI Assistant",
                    "Bug or error",
                  ].map((cat) => {
                    const selected = fbCategories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => {
                          if (selected) {
                            setFbCategories(fbCategories.filter((c) => c !== cat));
                          } else {
                            setFbCategories([...fbCategories, cat]);
                          }
                        }}
                        className={`px-3 py-1 rounded-xl text-[11px] font-medium transition-colors ${
                          selected
                            ? "bg-amber-500 text-neutral-950 font-bold"
                            : "bg-neutral-950 text-neutral-400 border border-neutral-800"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300 font-bold block">Your Comments (Optional)</label>
                <textarea
                  value={fbComment}
                  onChange={(e) => setFbComment(e.target.value)}
                  placeholder="Tell us what you liked, or report an issue..."
                  rows={3}
                  className="w-full p-3 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-xs shadow-md transition-colors"
              >
                Submit Feedback to Platform
              </button>
            </form>
          )}
        </div>
      )}

      {/* Cart / Reservation Drawer */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="bg-neutral-900 border-l border-neutral-800 w-full max-w-md h-full p-5 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-extrabold text-base text-white">
                    Reservation Bag ({cart.length})
                  </h3>
                </div>
                <button
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="py-16 text-center text-neutral-500 text-xs">
                  Your reservation bag is empty.
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar">
                  {cart.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-neutral-100">{item.product.name}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {formatINR(item.product.sellingPrice)} each
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateCartQty(idx, -1)}
                          className="p-1 rounded bg-neutral-800 text-neutral-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold text-neutral-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateCartQty(idx, 1)}
                          className="p-1 rounded bg-neutral-800 text-neutral-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-neutral-800 space-y-3">
                {/* Order Delivery / Pickup Mode Toggle */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950 rounded-2xl border border-neutral-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setOrderDeliveryMode("pickup")}
                    className={`py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                      orderDeliveryMode === "pickup"
                        ? "bg-amber-500 text-neutral-950 shadow"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>{isHindi ? "30 मि. पिकअप" : "30-Min Hold"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderDeliveryMode("delivery")}
                    className={`py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                      orderDeliveryMode === "delivery"
                        ? "bg-amber-500 text-neutral-950 shadow"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{isHindi ? "घर मंगवाएं" : "Home Delivery"}</span>
                  </button>
                </div>

                <div className="flex justify-between items-baseline text-sm font-bold text-white">
                  <div className="flex items-center gap-1.5">
                    <span>{isHindi ? "अनुमानित कुल राशि:" : "Estimated Total:"}</span>
                    <button
                      type="button"
                      onClick={() =>
                        sounds.speakText(
                          isHindi
                            ? `झोले का कुल सामान ${Math.round(cartTotal)} रुपये`
                            : `Cart total is ${Math.round(cartTotal)} rupees`,
                          language
                        )
                      }
                      className="p-1 rounded-md text-neutral-400 hover:text-amber-400"
                      title="Speak total"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xl font-mono text-amber-400">
                    {formatINR(cartTotal)}
                  </span>
                </div>

                <p className="text-[11px] text-neutral-400 leading-tight">
                  {orderDeliveryMode === "pickup"
                    ? isHindi
                      ? "🔒 30 मिनट तक दुकान का स्टॉक आपके नाम से आरक्षित रहेगा। दुकान पर आकर नकद या UPI दें।"
                      : "🔒 Holds shelf stock for 30 minutes. Pay upon collection at counter."
                    : isHindi
                    ? "🛵 पास के किराना स्टोर से सीधा आपके पते पर डिलीवरी।"
                    : "🛵 Direct neighborhood delivery from the shopkeeper."}
                </p>

                <button
                  onClick={handleCreateReservation}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-neutral-950 font-black rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
                >
                  {orderDeliveryMode === "pickup"
                    ? isHindi
                      ? `30 मिनट पिकअप आरक्षित करें • ${formatINR(cartTotal)}`
                      : `CONFIRM 30-MIN PICKUP HOLD • ${formatINR(cartTotal)}`
                    : isHindi
                    ? `घर पर डिलीवरी ऑर्डर करें • ${formatINR(cartTotal)}`
                    : `ORDER HOME DELIVERY • ${formatINR(cartTotal)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Substitution Modal (Section 16) */}
      {substituteItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <span className="text-[10px] font-bold text-rose-400 uppercase block">
                  Out of Stock
                </span>
                <h3 className="font-extrabold text-sm text-white">
                  {substituteItem.original.name}
                </h3>
              </div>
              <button onClick={() => setSubstituteItem(null)} className="text-neutral-400">
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-300 block">
                Available In-Store Alternatives:
              </span>

              {substituteItem.alternatives.map((alt) => (
                <div
                  key={alt.id}
                  className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-neutral-100 flex items-center gap-1.5">
                      <span>{alt.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                        Alternative
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                      {formatINR(alt.sellingPrice)} • {alt.currentStock} in stock
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleAddToCart(alt);
                      setSubstituteItem(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs"
                  >
                    Choose This
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Find Everything in One Shop Modal (Section 15) */}
      <FindEverythingModal
        isOpen={isFindEverythingOpen}
        onClose={() => setIsFindEverythingOpen(false)}
        onSelectShopToReserve={(shop, matchedProds) => {
          setSelectedShop(shop);
          matchedProds.forEach((p) => handleAddToCart(p));
          setIsCartDrawerOpen(true);
        }}
      />

      {/* Live Chat Drawer (Section 38 & 39) */}
      <LiveChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        shop={activeShop}
        customerId={customerId}
        customerName={customerName}
        senderRole="customer"
      />

      {/* Parchi Scanner Modal for handwritten grocery notes */}
      <ParchiScannerModal
        isOpen={isParchiScannerOpen}
        onClose={() => setIsParchiScannerOpen(false)}
        shop={activeShop}
        shopProducts={shopProducts}
        onAddItemsToCart={handleAddParchiItems}
        language={language}
      />

      {/* Morning Subscriptions Modal (Milk, Bread, Eggs, Curd daily auto-hold) */}
      <MorningSubscriptionsModal
        isOpen={isMorningSubsOpen}
        onClose={() => setIsMorningSubsOpen(false)}
        shop={activeShop}
        customerId={customerId}
        customerName={customerName}
        customerPhone={customerPhone}
        subscriptions={subscriptions}
        onSaveSubscriptions={(newSubs) => setSubscriptions(newSubs)}
        language={language}
      />

      {/* Loose Weight & Scale Produce Calculator */}
      <LooseWeightCalculatorModal
        isOpen={isLooseProduceOpen}
        onClose={() => setIsLooseProduceOpen(false)}
        onAddLooseItem={handleAddLooseProduceToCart}
        language={language}
      />

      {/* Share WhatsApp Store Catalog */}
      <ShareWhatsAppCatalogModal
        isOpen={isWhatsAppCatalogOpen}
        onClose={() => setIsWhatsAppCatalogOpen(false)}
        shop={activeShop}
        products={shopProducts}
        language={language}
      />

      {/* Sticky Mobile Floating Cart Bar */}
      {cart.length > 0 && !isCartDrawerOpen && (
        <div className="sm:hidden fixed bottom-20 left-3 right-3 z-30 bg-gradient-to-r from-emerald-600 to-emerald-500 text-neutral-950 p-3 rounded-2xl shadow-2xl flex items-center justify-between font-bold border border-emerald-400/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-neutral-950/20 flex items-center justify-center text-white">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-white">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} {isHindi ? "सामान" : "items"} • {formatINR(cartTotal)}
              </div>
              <div className="text-[10px] text-emerald-100">
                {orderDeliveryMode === "pickup"
                  ? isHindi ? "30-मिनट पिकअप रिज़र्वेशन" : "30-min pickup hold"
                  : isHindi ? "घर पर डिलीवरी" : "Home delivery"}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-neutral-950 text-white font-black text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-transform"
          >
            <span>{isHindi ? "झोला देखें" : "View Bag"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
