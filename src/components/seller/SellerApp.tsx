import React, { useState } from "react";
import {
  LayoutDashboard,
  Receipt,
  Package,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Truck,
  FileSpreadsheet,
  Sparkles,
  Plus,
  Barcode as BarcodeIcon,
  AlertTriangle,
  Clock,
  LogOut,
  UserCheck,
  FileText,
  BookOpen,
  Banknote,
  TrendingUp,
} from "lucide-react";
import { Shop, Product, Invoice, Reservation, ReservationStatus, SellerUser, SellerSubscription } from "../../types";
import { BillingPOS } from "./BillingPOS";
import { InventoryView } from "./InventoryView";
import { StockGuardian } from "./StockGuardian";
import { ReservationsManager } from "./ReservationsManager";
import { SuppliersManager } from "./SuppliersManager";
import { ReportsAndLedger } from "./ReportsAndLedger";
import { ShopAIAssistant } from "./ShopAIAssistant";
import { MerchantProfileSection } from "../auth/MerchantProfileSection";
import { SubscriptionModal } from "../subscription/SubscriptionModal";
import { DashboardSubscriptionSection } from "./DashboardSubscriptionSection";
import { DigitalKhataLedger } from "./DigitalKhataLedger";
import { DailyGallaTracker } from "./DailyGallaTracker";
import { MandiBhavRadar } from "./MandiBhavRadar";
import { MsmeVerificationSection } from "./MsmeVerificationSection";
import { formatINR } from "../../utils/barcode";

interface SellerAppProps {
  shop: Shop;
  products: Product[];
  invoices: Invoice[];
  reservations: Reservation[];
  onRefreshProducts: () => void;
  onBillCompleted: (invoice: Invoice) => void;
  onUpdateReservationStatus: (id: string, status: ReservationStatus, reason?: string) => void;
  language: "en" | "hi";
  saralMode?: boolean;
  onNavigateToSection?: string;
  sellerUser?: SellerUser | null;
  onUpdateSeller?: (seller: SellerUser) => void;
  onLogout?: () => void;
}

export type SellerTab =
  | "dashboard"
  | "pos"
  | "msme"
  | "khata"
  | "galla"
  | "mandi"
  | "inventory"
  | "verify"
  | "reservations"
  | "suppliers"
  | "reports"
  | "ai"
  | "account";

export const SellerApp: React.FC<SellerAppProps> = ({
  shop,
  products,
  invoices,
  reservations,
  onRefreshProducts,
  onBillCompleted,
  onUpdateReservationStatus,
  language,
  saralMode = false,
  sellerUser,
  onUpdateSeller,
  onLogout,
}) => {
  const isHindi = language === "hi";

  const [currentTab, setCurrentTab] = useState<SellerTab>("dashboard");
  const [verifyTargetProduct, setVerifyTargetProduct] = useState<Product | null>(null);
  const [prefilledReservation, setPrefilledReservation] = useState<{
    reservationId: string;
    customerName: string;
    customerPhone: string;
    items: { productId: string; quantity: number }[];
  } | null>(null);

  // Subscription state (₹20/month or ₹200/year)
  const [subscription, setSubscription] = useState<SellerSubscription>(() => {
    if (sellerUser?.subscription) return sellerUser.subscription;
    return {
      plan: "free",
      isPremium: false,
      price: 0,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      features: ["basic_pos", "standard_inventory"],
    };
  });
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Sync if sellerUser updates externally
  React.useEffect(() => {
    if (sellerUser?.subscription) {
      setSubscription(sellerUser.subscription);
    }
  }, [sellerUser?.subscription]);

  const handleSubscriptionSuccess = (newSub: SellerSubscription) => {
    setSubscription(newSub);
    if (sellerUser && onUpdateSeller) {
      onUpdateSeller({
        ...sellerUser,
        subscription: newSub,
      });
    }
  };

  // Calculate high-level KPIs for Seller Dashboard
  const shopInvoices = invoices.filter((i) => i.shopId === shop.id);
  const todayRevenue = shopInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const lowStockCount = products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minimumStock).length;
  const outOfStockCount = products.filter((p) => p.currentStock === 0).length;
  const activeReservations = reservations.filter(
    (r) => r.shopId === shop.id && ["Requested", "Confirmed", "Ready"].includes(r.status)
  );

  const handleOpenVerify = (product?: Product) => {
    setVerifyTargetProduct(product || null);
    setCurrentTab("verify");
  };

  const handleConvertToBill = (reservation: Reservation) => {
    setPrefilledReservation({
      reservationId: reservation.id,
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      items: reservation.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });
    setCurrentTab("pos");
  };

  return (
    <div className="space-y-4">
      {/* Seller Sub-Navigation Tabs */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-1.5 flex items-center justify-between gap-1 overflow-x-auto custom-scrollbar text-xs">
        <div className="flex items-center gap-1">
          <button
            id="seller-tab-dashboard"
            onClick={() => setCurrentTab("dashboard")}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              currentTab === "dashboard"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{isHindi ? "डैशबोर्ड" : "Dashboard"}</span>
          </button>

          <button
            id="seller-tab-pos"
            onClick={() => {
              setPrefilledReservation(null);
              setCurrentTab("pos");
            }}
            className={`px-3.5 py-2 rounded-xl font-black flex items-center gap-1.5 transition-all ${
              currentTab === "pos"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>{isHindi ? "बिलिंग (POS)" : "NEW BILL (POS)"}</span>
          </button>

          <button
            id="seller-tab-msme"
            onClick={() => setCurrentTab("msme")}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              currentTab === "msme"
                ? "bg-emerald-500 text-neutral-950 shadow"
                : "text-emerald-400 hover:bg-neutral-800"
            }`}
            title="MSME B2B Verification (Cashify SuperSale Model)"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isHindi ? "MSME सत्यापन" : "MSME B2B"}</span>
          </button>

          <button
            id="seller-tab-khata"
            onClick={() => setCurrentTab("khata")}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              currentTab === "khata"
                ? "bg-rose-500 text-white shadow"
                : "text-rose-400 hover:bg-neutral-800"
            }`}
            title="Customer Credit Ledger (Khatabook Style)"
          >
            <BookOpen className="w-4 h-4" />
            <span>{isHindi ? "बही-खाता (Khata)" : "Khata Ledger"}</span>
          </button>

          <button
            id="seller-tab-galla"
            onClick={() => setCurrentTab("galla")}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              currentTab === "galla"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-amber-400 hover:bg-neutral-800"
            }`}
            title="Daily Cash Drawer Tracker"
          >
            <Banknote className="w-4 h-4" />
            <span>{isHindi ? "आज का गल्ला" : "Cash Drawer"}</span>
          </button>

          <button
            id="seller-tab-mandi"
            onClick={() => setCurrentTab("mandi")}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              currentTab === "mandi"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-emerald-400 hover:bg-neutral-800"
            }`}
            title="APMC Wholesale Mandi Rates"
          >
            <TrendingUp className="w-4 h-4" />
            <span>{isHindi ? "मंडी भाव" : "Mandi Rates"}</span>
          </button>

          <button
            id="seller-tab-inventory"
            onClick={() => setCurrentTab("inventory")}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              currentTab === "inventory"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{isHindi ? `इन्वेंट्री (${products.length})` : `Inventory (${products.length})`}</span>
          </button>

          <button
            id="seller-tab-verify"
            onClick={() => handleOpenVerify()}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              currentTab === "verify"
                ? "bg-emerald-500 text-neutral-950 shadow"
                : "text-emerald-400 hover:bg-emerald-950/40"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{isHindi ? "स्टॉक गार्जियन" : "Stock Guardian"}</span>
          </button>

          <button
            id="seller-tab-reservations"
            onClick={() => setCurrentTab("reservations")}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all relative ${
              currentTab === "reservations"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isHindi ? "पिकअप होल्ड" : "Reservations"}</span>
            {activeReservations.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] flex items-center justify-center font-mono animate-pulse">
                {activeReservations.length}
              </span>
            )}
          </button>

          <button
            id="seller-tab-suppliers"
            onClick={() => setCurrentTab("suppliers")}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              currentTab === "suppliers"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>{isHindi ? "थोक सप्लायर" : "Suppliers"}</span>
          </button>

          <button
            id="seller-tab-reports"
            onClick={() => setCurrentTab("reports")}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              currentTab === "reports"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isHindi ? "रिपोर्ट्स व लेज़र" : "Reports & Ledger"}</span>
          </button>

          <button
            id="seller-tab-ai"
            onClick={() => setCurrentTab("ai")}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              currentTab === "ai"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-amber-400 hover:bg-neutral-800"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isHindi ? "दुकान AI" : "Shop AI"}</span>
          </button>

          <button
            id="seller-tab-account"
            onClick={() => setCurrentTab("account")}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              currentTab === "account"
                ? "bg-rose-600 text-white shadow"
                : "text-rose-400 hover:bg-rose-950/30"
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>{isHindi ? "खाता और लॉगआउट" : "Account & Logout"}</span>
          </button>
        </div>

        {/* Kirana Pro Plan Upgrade / Status CTA in Nav Header */}
        <div className="flex items-center gap-1.5 pl-2 flex-shrink-0">
          {subscription.isPremium ? (
            <button
              type="button"
              id="seller-active-pro-btn"
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isHindi ? "प्रो सक्रिय" : `Pro (${subscription.plan === "yearly" ? "₹200/yr" : "₹20/mo"})`}</span>
            </button>
          ) : (
            <button
              type="button"
              id="seller-upgrade-pro-btn"
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 font-black text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isHindi ? "प्रो लें (₹20/माह)" : "Upgrade to Pro (₹20/mo)"}</span>
            </button>
          )}
        </div>
      </div>

      {/* DASHBOARD TAB (Section 52) */}
      {currentTab === "dashboard" && (
        <div className="space-y-4">
          {/* Merchant Session Status Banner with Quick Logout */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-white">{shop.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    {sellerUser?.businessProofs?.[0]?.type || "MSME Verified"}
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  {sellerUser?.phone || shop.phone} • {sellerUser?.email || "merchant@kirana.local"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setCurrentTab("account")}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors"
              >
                {isHindi ? "खाता विवरण" : "Account Details"}
              </button>
              {onLogout && (
                <button
                  type="button"
                  id="dashboard-merchant-logout-btn"
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isHindi ? "लॉगआउट" : "Log Out"}</span>
                </button>
              )}
            </div>
          </div>

          {/* MSME B2B Verification Callout Banner (Cashify SuperSale Model) */}
          <div
            onClick={() => setCurrentTab("msme")}
            className="p-4 rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-emerald-950/30 border border-emerald-500/30 hover:border-emerald-400/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-white">
                    {isHindi ? "MSME B2B व्यापार सत्यापन (Cashify SuperSale मॉडल)" : "MSME B2B Merchant Verification (Cashify SuperSale Model)"}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                      sellerUser?.msmeVerification?.status === "verified"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : sellerUser?.msmeVerification?.status === "pending_review"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {sellerUser?.msmeVerification?.status === "verified"
                      ? isHindi ? "सत्यापित भागीदार ✓" : "VERIFIED B2B PARTNER ✓"
                      : sellerUser?.msmeVerification?.status === "pending_review"
                      ? isHindi ? "टीम समीक्षा जारी है" : "PENDING TEAM REVIEW"
                      : isHindi ? "सत्यापन आवश्यक" : "VERIFICATION REQUIRED"}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {sellerUser?.msmeVerification?.status === "verified"
                    ? `Udyam #${sellerUser?.msmeVerification?.udyamNumber || "UDYAM-KR-03-0044521"} • Wholesale distributor tier & GST ITC active.`
                    : sellerUser?.msmeVerification?.status === "pending_review"
                    ? `Submitted Udyam #${sellerUser?.msmeVerification?.udyamNumber} • Our compliance team is verifying against Government MSME registry (SLA 2-4 hrs).`
                    : isHindi
                    ? "थोक B2B मूल्य और व्यावसायिक इनवॉइस अनलॉक करने हेतु अपना दस्तावेज़ नंबर दर्ज करें।"
                    : "Enter your official MSME / Udyam document number for our team to verify and unlock B2B wholesale pricing."}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="px-3.5 py-1.5 rounded-xl bg-neutral-800 group-hover:bg-emerald-500 group-hover:text-neutral-950 text-neutral-200 text-xs font-bold transition-all shrink-0 self-end sm:self-auto"
            >
              {sellerUser?.msmeVerification?.status === "verified"
                ? isHindi ? "प्रमाणपत्र देखें →" : "View Certificate →"
                : isHindi ? "दस्तावेज़ दर्ज करें / स्थिति देखें →" : "Enter Document / View Status →"}
            </button>
          </div>

          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Sales Today */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase">
                {isHindi ? "आज की बिक्री" : "Today's Sales"}
              </span>
              <div className="text-xl sm:text-2xl font-mono font-black text-amber-400">
                {formatINR(todayRevenue)}
              </div>
              <p className="text-[10px] text-neutral-500">
                {shopInvoices.length} {isHindi ? "बिल आज पूरे हुए" : "Bills Completed Today"}
              </p>
            </div>

            {/* Active Reservations */}
            <div
              onClick={() => setCurrentTab("reservations")}
              className="bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 rounded-3xl p-4 sm:p-5 shadow-xl space-y-1 cursor-pointer transition-all group"
            >
              <span className="text-[11px] font-semibold text-neutral-400 uppercase flex items-center justify-between">
                <span>{isHindi ? "सक्रिय पिकअप होल्ड" : "Active Reservations"}</span>
                <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform">→</span>
              </span>
              <div className="text-xl sm:text-2xl font-mono font-black text-white">
                {activeReservations.length} {isHindi ? "ऑर्डर" : "Holds"}
              </div>
              <p className="text-[10px] text-emerald-400 font-medium">
                {isHindi ? "शेल्फ स्टॉक में आरक्षित" : "Locked in shelf stock"}
              </p>
            </div>

            {/* Low Stock Alerts */}
            <div
              onClick={() => setCurrentTab("inventory")}
              className="bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 rounded-3xl p-4 sm:p-5 shadow-xl space-y-1 cursor-pointer transition-all"
            >
              <span className="text-[11px] font-semibold text-amber-400 uppercase flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isHindi ? "कम स्टॉक सामान" : "Low Stock Items"}</span>
              </span>
              <div className="text-xl sm:text-2xl font-mono font-black text-amber-400">
                {lowStockCount} {isHindi ? "उत्पाद" : "Products"}
              </div>
              <p className="text-[10px] text-neutral-500">
                {isHindi ? "सुरक्षित सीमा से नीचे" : "Below minimum safety threshold"}
              </p>
            </div>

            {/* Out of Stock */}
            <div
              onClick={() => setCurrentTab("inventory")}
              className="bg-neutral-900 border border-neutral-800 hover:border-rose-500/50 rounded-3xl p-4 sm:p-5 shadow-xl space-y-1 cursor-pointer transition-all"
            >
              <span className="text-[11px] font-semibold text-rose-400 uppercase">
                {isHindi ? "स्टॉक समाप्त" : "Out of Stock"}
              </span>
              <div className="text-xl sm:text-2xl font-mono font-black text-rose-400">
                {outOfStockCount} {isHindi ? "उत्पाद" : "Products"}
              </div>
              <p className="text-[10px] text-neutral-500">
                {isHindi ? "दैनिक बिक्री का नुकसान" : "Losing daily sales"}
              </p>
            </div>
          </div>

          {/* Quick Action Center (Section 52: "Quick action buttons") */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
            <h3 className="font-extrabold text-sm text-neutral-200">
              {isHindi ? "दुकानदार त्वरित कार्य" : "Merchant Quick Actions"}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              <button
                id="qa-new-bill"
                onClick={() => {
                  setPrefilledReservation(null);
                  setCurrentTab("pos");
                }}
                className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold flex flex-col items-center justify-center gap-1.5 text-xs shadow-md transition-all active:scale-95"
              >
                <Receipt className="w-5 h-5" />
                <span>{isHindi ? "नया बिल (POS)" : "New Bill (POS)"}</span>
              </button>

              <button
                id="qa-scan-parchi"
                onClick={() => {
                  setPrefilledReservation(null);
                  setCurrentTab("pos");
                  setTimeout(() => {
                    const btn = document.getElementById("pos-scan-parchi-btn");
                    if (btn) btn.click();
                  }, 120);
                }}
                className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 via-yellow-500/15 to-amber-500/10 hover:from-amber-500/30 hover:to-yellow-500/25 border border-amber-500/40 text-amber-300 font-bold flex flex-col items-center justify-center gap-1.5 text-xs transition-all active:scale-95 group shadow-sm"
              >
                <FileText className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>{isHindi ? "पर्ची स्कैन (AI)" : "Scan Parchi (AI)"}</span>
              </button>

              <button
                id="qa-scan-stock"
                onClick={() => setCurrentTab("inventory")}
                className="p-3 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-neutral-200 font-bold flex flex-col items-center justify-center gap-1.5 text-xs transition-all"
              >
                <BarcodeIcon className="w-5 h-5 text-amber-400" />
                <span>{isHindi ? "स्कैन व स्टॉक जोड़ें" : "Scan & Add Stock"}</span>
              </button>

              <button
                id="qa-verify-stock"
                onClick={() => handleOpenVerify()}
                className="p-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 font-bold flex flex-col items-center justify-center gap-1.5 text-xs transition-all"
              >
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <span>{isHindi ? "स्टॉक ऑडिट" : "Verify Stock"}</span>
              </button>

              <button
                id="qa-reservations"
                onClick={() => setCurrentTab("reservations")}
                className="p-3 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-neutral-200 font-bold flex flex-col items-center justify-center gap-1.5 text-xs transition-all"
              >
                <ShoppingBag className="w-5 h-5 text-blue-400" />
                <span>{isHindi ? "पिकअप होल्ड" : "Pickup Holds"}</span>
              </button>

              <button
                id="qa-suppliers"
                onClick={() => setCurrentTab("suppliers")}
                className="p-3 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-neutral-200 font-bold flex flex-col items-center justify-center gap-1.5 text-xs transition-all"
              >
                <Truck className="w-5 h-5 text-yellow-400" />
                <span>{isHindi ? "ऑर्डर प्राप्त करें" : "Receive Order"}</span>
              </button>

              <button
                id="qa-shop-ai"
                onClick={() => setCurrentTab("ai")}
                className="p-3 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-amber-300 font-bold flex flex-col items-center justify-center gap-1.5 text-xs transition-all"
              >
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>{isHindi ? "दुकान AI पूछें" : "Ask Shop AI"}</span>
              </button>
            </div>
          </div>

          {/* Active Reservations & Low Stock Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Pending Reservations */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <h4 className="font-bold text-sm text-neutral-200 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>Incoming Customer Holds</span>
                </h4>
                <button
                  onClick={() => setCurrentTab("reservations")}
                  className="text-xs text-amber-400 hover:underline"
                >
                  View All ({reservations.length})
                </button>
              </div>

              {activeReservations.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No active customer holds right now.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeReservations.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-neutral-100 flex items-center gap-2">
                          <span>{r.customerName}</span>
                          {r.comingSoonAlert && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px] animate-pulse">
                              On the way!
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          {r.items.map((i) => `${i.productName} (x${i.quantity})`).join(", ")}
                        </div>
                      </div>
                      <button
                        onClick={() => handleConvertToBill(r)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold text-xs"
                      >
                        Bill Now
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Low Stock Alert List */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <h4 className="font-bold text-sm text-neutral-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Immediate Restock Warnings</span>
                </h4>
                <button
                  onClick={() => setCurrentTab("inventory")}
                  className="text-xs text-amber-400 hover:underline"
                >
                  Manage Inventory
                </button>
              </div>

              <div className="space-y-2">
                {products
                  .filter((p) => p.currentStock <= p.minimumStock)
                  .slice(0, 3)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-neutral-100">{p.name}</div>
                        <div className="text-[10px] text-neutral-400">
                          Min Level: {p.minimumStock} {p.unit} • Selling: {formatINR(p.sellingPrice)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-rose-400 text-sm">
                          {p.currentStock} {p.unit} left
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* LOWER DASHBOARD: Comprehensive Store Subscription & Licensing Section */}
          <DashboardSubscriptionSection
            subscription={subscription}
            shop={shop}
            sellerUser={sellerUser}
            onOpenUpgrade={() => setIsSubscriptionModalOpen(true)}
            language={language}
          />
        </div>
      )}

      {/* POS BILLING TAB */}
      {currentTab === "pos" && (
        <BillingPOS
          shop={shop}
          products={products}
          onBillCompleted={onBillCompleted}
          language={language}
          saralMode={saralMode}
          prefilledReservation={prefilledReservation}
        />
      )}

      {/* MSME B2B VERIFICATION (CASHIFY SUPERSALE TIER) */}
      {currentTab === "msme" && (
        <MsmeVerificationSection
          shop={shop}
          sellerUser={sellerUser}
          onUpdateSeller={onUpdateSeller}
          language={language}
        />
      )}

      {/* DIGITAL KHATA / BAHI-KHATA (Khatabook / OkCredit style) */}
      {currentTab === "khata" && (
        <DigitalKhataLedger
          shop={shop}
          language={language}
        />
      )}

      {/* DAILY GALLA / CASH DRAWER COUNTER */}
      {currentTab === "galla" && (
        <DailyGallaTracker
          shop={shop}
          invoices={invoices}
          language={language}
        />
      )}

      {/* WHOLESALE MANDI BHAV RADAR */}
      {currentTab === "mandi" && (
        <MandiBhavRadar
          language={language}
        />
      )}

      {/* INVENTORY TAB */}
      {currentTab === "inventory" && (
        <InventoryView
          shop={shop}
          products={products}
          onRefreshProducts={onRefreshProducts}
          language={language}
          onOpenVerify={handleOpenVerify}
        />
      )}

      {/* STOCK GUARDIAN TAB */}
      {currentTab === "verify" && (
        <StockGuardian
          shop={shop}
          products={products}
          onRefreshProducts={onRefreshProducts}
          language={language}
          initialProduct={verifyTargetProduct}
          onClose={() => setCurrentTab("inventory")}
        />
      )}

      {/* RESERVATIONS TAB */}
      {currentTab === "reservations" && (
        <ReservationsManager
          shop={shop}
          reservations={reservations}
          onUpdateStatus={onUpdateReservationStatus}
          onConvertToBill={handleConvertToBill}
          language={language}
        />
      )}

      {/* SUPPLIERS TAB */}
      {currentTab === "suppliers" && (
        <SuppliersManager
          shop={shop}
          products={products}
          onRefreshProducts={onRefreshProducts}
          language={language}
        />
      )}

      {/* REPORTS TAB */}
      {currentTab === "reports" && (
        <ReportsAndLedger shop={shop} invoices={invoices} language={language} />
      )}

      {/* SHOP AI TAB (Feature Gated with Kirana Pro) */}
      {currentTab === "ai" && (
        <ShopAIAssistant
          shop={shop}
          language={language}
          isPremium={subscription.isPremium}
          onOpenUpgrade={() => setIsSubscriptionModalOpen(true)}
        />
      )}

      {/* DEDICATED MERCHANT ACCOUNT & LOGOUT TAB */}
      {currentTab === "account" && (
        <MerchantProfileSection
          shop={shop}
          sellerUser={sellerUser}
          subscription={subscription}
          onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
          onNavigateToMsme={() => setCurrentTab("msme")}
          onLogout={onLogout || (() => {})}
          language={language}
        />
      )}

      {/* KIRANA PRO SUBSCRIPTION MODAL (₹20/month or ₹200/year) */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        sellerUser={sellerUser}
        shopId={shop.id}
        currentSubscription={subscription}
        onSubscriptionSuccess={handleSubscriptionSuccess}
        language={language}
      />
    </div>
  );
};
