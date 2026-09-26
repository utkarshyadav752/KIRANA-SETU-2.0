import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { FrontPage } from "./components/landing/FrontPage";
import { SellerApp } from "./components/seller/SellerApp";
import { CustomerApp } from "./components/customer/CustomerApp";
import { CustomerAuthModal } from "./components/auth/CustomerAuthModal";
import { SellerAuthModal } from "./components/auth/SellerAuthModal";
import { AccountSwitchBlockModal } from "./components/modals/AccountSwitchBlockModal";
import { FounderModal } from "./components/modals/FounderModal";
import { GeminiChatbotModal } from "./components/chat/GeminiChatbotModal";
import { GeminiFloatingLauncher } from "./components/chat/GeminiFloatingLauncher";
import { Shop, Product, Invoice, Reservation, ReservationStatus, AppView, SellerUser, CustomerUser } from "./types";
import { sounds } from "./utils/audio";
import { ArrowLeft, Home, ShieldCheck, UserCheck, Lock, Phone, Mail, User, Award, ExternalLink } from "lucide-react";
import { MobileBottomNav } from "./components/navigation/MobileBottomNav";
import { INITIAL_SHOPS, INITIAL_PRODUCTS, INITIAL_INVOICES, INITIAL_RESERVATIONS } from "./data/initialData";

export default function App() {
  const [currentRole, setCurrentRole] = useState<AppView>("frontpage");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [shops, setShops] = useState<Shop[]>(INITIAL_SHOPS);
  const [currentShop, setCurrentShop] = useState<Shop | null>(INITIAL_SHOPS[0]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [loading, setLoading] = useState(false);

  // Authenticated Users (Enforces NO DIRECT LOGIN)
  const [currentSeller, setCurrentSeller] = useState<SellerUser | null>(() => {
    try {
      const saved = localStorage.getItem("kirana_seller_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentCustomer, setCurrentCustomer] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem("kirana_customer_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Auth Modals State
  const [isSellerAuthOpen, setIsSellerAuthOpen] = useState<boolean>(false);
  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState<boolean>(false);
  const [isFounderModalOpen, setIsFounderModalOpen] = useState<boolean>(false);
  const [accountSwitchTarget, setAccountSwitchTarget] = useState<"seller" | "customer" | null>(null);

  // Gemini Support & Voice Assistant State
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);

  // Sound effects toggle
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Global Saral Mode (Visual, High-Contrast & Voice Assisted Mode for zero-reading barriers)
  const [saralMode, setSaralMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("kirana_saral_mode");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const handleToggleSaralMode = () => {
    const next = !saralMode;
    setSaralMode(next);
    sounds.playSuccessChime();
    sounds.speakText(
      next
        ? language === "hi"
          ? "सरल दृश्य मोड चालू हुआ"
          : "Saral Visual Mode enabled"
        : language === "hi"
        ? "सरल दृश्य मोड बंद हुआ"
        : "Saral Visual Mode disabled",
      language
    );
  };

  useEffect(() => {
    try {
      localStorage.setItem("kirana_saral_mode", JSON.stringify(saralMode));
    } catch {}
  }, [saralMode]);

  // Save sessions to localStorage
  useEffect(() => {
    try {
      if (currentSeller) {
        localStorage.setItem("kirana_seller_session", JSON.stringify(currentSeller));
      } else {
        localStorage.removeItem("kirana_seller_session");
      }
    } catch {}
  }, [currentSeller]);

  useEffect(() => {
    try {
      if (currentCustomer) {
        localStorage.setItem("kirana_customer_session", JSON.stringify(currentCustomer));
      } else {
        localStorage.removeItem("kirana_customer_session");
      }
    } catch {}
  }, [currentCustomer]);

  // Fetch initial data (resilient to offline/static deployments)
  const fetchData = async () => {
    try {
      // Fetch shops
      const shopsRes = await fetch("/api/shops");
      if (!shopsRes.ok) return;
      const contentType = shopsRes.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) return;

      const shopsData = await shopsRes.json();
      let activeShop: Shop | null = null;
      if (shopsData.success && Array.isArray(shopsData.data) && shopsData.data.length > 0) {
        setShops(shopsData.data);
        // If currentSeller has a registered shopId, activate it; otherwise shop 0
        if (currentSeller?.shopId) {
          activeShop = shopsData.data.find((s: Shop) => s.id === currentSeller.shopId) || shopsData.data[0];
        } else {
          activeShop = shopsData.data[0];
        }
        setCurrentShop(activeShop);
      }

      const shopToQuery = activeShop || currentShop || INITIAL_SHOPS[0];
      if (shopToQuery) {
        // Fetch products for active shop
        const prodRes = await fetch(`/api/products?shopId=${shopToQuery.id}`);
        if (prodRes.ok && (prodRes.headers.get("content-type") || "").includes("application/json")) {
          const prodData = await prodRes.json();
          if (prodData.success && Array.isArray(prodData.data)) {
            setProducts(prodData.data);
          }
        }

        // Fetch invoices
        const invRes = await fetch(`/api/invoices?shopId=${shopToQuery.id}`);
        if (invRes.ok && (invRes.headers.get("content-type") || "").includes("application/json")) {
          const invData = await invRes.json();
          if (invData.success && Array.isArray(invData.data)) {
            setInvoices(invData.data);
          }
        }

        // Fetch reservations
        const resRes = await fetch(`/api/reservations?shopId=${shopToQuery.id}`);
        if (resRes.ok && (resRes.headers.get("content-type") || "").includes("application/json")) {
          const resData = await resRes.json();
          if (resData.success && Array.isArray(resData.data)) {
            setReservations(resData.data);
          }
        }
      }
    } catch (err) {
      console.warn("KiranaSetu running with pre-seeded local data (offline/static mode):", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefreshProducts = async () => {
    if (!currentShop) return;
    try {
      const prodRes = await fetch(`/api/products?shopId=${currentShop.id}`);
      const prodData = await prodRes.json();
      if (prodData.success) {
        setProducts(prodData.data);
      }

      const resRes = await fetch(`/api/reservations?shopId=${currentShop.id}`);
      const resData = await resRes.json();
      if (resData.success) {
        setReservations(resData.data);
      }
    } catch {}
  };

  const handleBillCompleted = (newInvoice: Invoice) => {
    sounds.playSuccessChime();
    setInvoices((prev) => [newInvoice, ...prev]);
    handleRefreshProducts();
  };

  const handleUpdateReservationStatus = async (
    id: string,
    status: ReservationStatus,
    reason?: string
  ) => {
    try {
      const res = await fetch(`/api/reservations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, cancellationReason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        sounds.playSuccessChime();
        setReservations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r))
        );
        handleRefreshProducts();
      }
    } catch {}
  };

  // Guarded Role Switcher: Strictly enforces "NO DIRECT LOGIN" & "CANNOT SWITCH ACCOUNT WHEN ONE IS LOGINED"
  const handleRoleChangeGuarded = (role: AppView) => {
    sounds.playScanBeep();

    if (role === "seller") {
      // If customer is currently logged in, block switching accounts until logged out
      if (currentCustomer) {
        setAccountSwitchTarget("seller");
        return;
      }
      if (!currentSeller) {
        setIsSellerAuthOpen(true);
        return;
      }
    } else if (role === "customer") {
      // If seller is currently logged in, block switching accounts until logged out
      if (currentSeller) {
        setAccountSwitchTarget("customer");
        return;
      }
      if (!currentCustomer) {
        setIsCustomerAuthOpen(true);
        return;
      }
    }

    setCurrentRole(role);
  };

  const handleLogoutAndSwitch = () => {
    if (accountSwitchTarget === "seller") {
      handleCustomerLogout();
      setAccountSwitchTarget(null);
      setIsSellerAuthOpen(true);
    } else if (accountSwitchTarget === "customer") {
      handleSellerLogout();
      setAccountSwitchTarget(null);
      setIsCustomerAuthOpen(true);
    }
  };

  // Seller Auth Success
  const handleSellerAuthSuccess = (seller: SellerUser, shop: Shop) => {
    setCurrentSeller(seller);
    setCurrentShop(shop);
    setShops((prev) => {
      const exists = prev.some((s) => s.id === shop.id);
      return exists ? prev.map((s) => (s.id === shop.id ? shop : s)) : [shop, ...prev];
    });
    fetch(`/api/products?shopId=${shop.id}`)
      .then((r) => r.json())
      .then((d) => d.success && setProducts(d.data));
    setCurrentRole("seller");
  };

  // Customer Auth Success
  const handleCustomerAuthSuccess = (customer: CustomerUser) => {
    setCurrentCustomer(customer);
    setCurrentRole("customer");
  };

  // Logout Handlers
  const handleSellerLogout = () => {
    sounds.playScanBeep();
    setCurrentSeller(null);
    if (currentRole === "seller") {
      setCurrentRole("frontpage");
    }
  };

  const handleCustomerLogout = () => {
    sounds.playScanBeep();
    setCurrentCustomer(null);
    if (currentRole === "customer") {
      setCurrentRole("frontpage");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500 selection:text-neutral-950">
      {/* Top Application Navigation Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChangeGuarded}
        currentShop={currentShop}
        shops={shops}
        onSelectShop={(shop) => {
          setCurrentShop(shop);
          fetch(`/api/products?shopId=${shop.id}`)
            .then((r) => r.json())
            .then((d) => d.success && setProducts(d.data));
        }}
        language={language}
        onLanguageChange={setLanguage}
        currentSeller={currentSeller}
        currentCustomer={currentCustomer}
        onOpenSellerAuth={() => setIsSellerAuthOpen(true)}
        onOpenCustomerAuth={() => setIsCustomerAuthOpen(true)}
        onSellerLogout={handleSellerLogout}
        onCustomerLogout={handleCustomerLogout}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenFounder={() => setIsFounderModalOpen(true)}
        saralMode={saralMode}
        onToggleSaralMode={handleToggleSaralMode}
      />

      {/* Main Role Content View */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-4 md:p-6 pb-24 sm:pb-8">
        {loading && !currentShop ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-neutral-400 font-mono tracking-wider uppercase">
              Connecting KiranaSetu Engine...
            </p>
          </div>
        ) : (
          <>
            {/* FRONTPAGE LANDING VIEW */}
            {currentRole === "frontpage" && (
              <FrontPage
                onNavigate={handleRoleChangeGuarded}
                language={language}
                shops={shops}
                products={products}
              />
            )}

            {/* Back to Home Breadcrumb for Active Role Workspaces */}
            {currentRole !== "frontpage" && (
              <div className="mb-4 flex items-center justify-between">
                <button
                  id="back-to-home-btn"
                  onClick={() => {
                    sounds.playScanBeep();
                    setCurrentRole("frontpage");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 border border-neutral-800 text-xs font-medium transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{language === "hi" ? "← मुख्य पृष्ठ (होम)" : "← Back to Front Page"}</span>
                </button>

                <div className="text-[11px] text-neutral-500 font-mono hidden sm:block">
                  {currentRole === "seller" && "Mode: Shopkeeper POS & Shelf Guardian"}
                  {currentRole === "customer" && "Mode: Hyperlocal Marketplace & 30-Min Holds"}
                </div>
              </div>
            )}

            {/* SELLER ROLE VIEW */}
            {currentRole === "seller" && currentShop && (
              <SellerApp
                shop={currentShop}
                products={products}
                invoices={invoices}
                reservations={reservations}
                onRefreshProducts={handleRefreshProducts}
                onBillCompleted={handleBillCompleted}
                onUpdateReservationStatus={handleUpdateReservationStatus}
                language={language}
                saralMode={saralMode}
                sellerUser={currentSeller}
                onUpdateSeller={setCurrentSeller}
                onLogout={handleSellerLogout}
              />
            )}

            {/* CUSTOMER ROLE VIEW */}
            {currentRole === "customer" && (
              <CustomerApp
                shops={shops}
                products={products}
                reservations={reservations}
                onRefreshProducts={handleRefreshProducts}
                language={language}
                saralMode={saralMode}
                customerUser={currentCustomer}
                onLogout={handleCustomerLogout}
                onOpenCustomerAuth={() => setIsCustomerAuthOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Account Switching Guard Modal (Strict Rule: cannot switch account when one is logged in) */}
      <AccountSwitchBlockModal
        isOpen={accountSwitchTarget !== null}
        onClose={() => setAccountSwitchTarget(null)}
        currentSeller={currentSeller}
        currentCustomer={currentCustomer}
        targetRole={accountSwitchTarget || "seller"}
        onLogoutAndSwitch={handleLogoutAndSwitch}
        language={language}
      />

      {/* Customer Verification Modal (Google Account + Phone Number) */}
      <CustomerAuthModal
        isOpen={isCustomerAuthOpen}
        onClose={() => setIsCustomerAuthOpen(false)}
        onSuccess={handleCustomerAuthSuccess}
        language={language}
      />

      {/* Seller Verification Modal (Business Proof + Email/Phone + Strong Password) */}
      <SellerAuthModal
        isOpen={isSellerAuthOpen}
        onClose={() => setIsSellerAuthOpen(false)}
        onSuccess={handleSellerAuthSuccess}
        language={language}
      />

      {/* Gemini Context-Aware AI Chatbot & Live Voice Modal */}
      <GeminiChatbotModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        currentRole={currentRole}
        currentShop={currentShop}
        currentSeller={currentSeller}
        currentCustomer={currentCustomer}
        products={products}
        reservations={reservations}
        onNavigateRole={handleRoleChangeGuarded}
        language={language}
      />

      {/* Persistent Gemini Support & Live Voice Floating Launcher */}
      <GeminiFloatingLauncher
        onClick={() => setIsAssistantOpen(true)}
        language={language}
      />

      {/* Founder Details Modal (Utkarsh Yadav) */}
      <FounderModal
        isOpen={isFounderModalOpen}
        onClose={() => setIsFounderModalOpen(false)}
        language={language}
      />

      {/* Footer Branding & Founder Contact Section */}
      <footer className="border-t border-neutral-900/80 bg-neutral-950/60 backdrop-blur-sm py-4 px-4 text-xs text-neutral-400 max-w-7xl mx-auto w-full space-y-3 pb-20 sm:pb-4">
        {/* Founder Contact Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold flex-shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white">Utkarsh Yadav</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  {language === "hi" ? "संस्थापक" : "Founder"}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {language === "hi"
                  ? "किरानासेतु संस्थापक हेल्पलाइन व सीधा संपर्क"
                  : "KiranaSetu Founder Direct Hotline"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <a
              href="tel:9554460651"
              className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-mono flex items-center gap-1.5 border border-neutral-700 transition-colors"
              title="Call Founder Utkarsh Yadav"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>+91 9554460651</span>
            </a>

            <a
              href="mailto:utkarshyadav752@gmail.com"
              className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-mono flex items-center gap-1.5 border border-neutral-700 transition-colors"
              title="Email Founder Utkarsh Yadav"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">utkarshyadav752@gmail.com</span>
              <span className="sm:hidden">Email</span>
            </a>

            <button
              onClick={() => setIsFounderModalOpen(true)}
              className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-colors"
            >
              <User className="w-3 h-3" />
              <span>{language === "hi" ? "पूरा परिचय" : "Founder Bio"}</span>
            </button>
          </div>
        </div>

        {/* Platform Legal / Tagline */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-neutral-400">KiranaSetu</span>
            <span>•</span>
            <span>Next-Gen Local Commerce & POS Platform</span>
          </div>
          <div className="font-mono text-[10px] text-neutral-600">
            Zero Silent Stock Drift • Stock Guardian • 30-min Pickup Holds • 0% Commission
          </div>
        </div>
      </footer>

      {/* Mobile-First Bottom Navigation Dock */}
      <MobileBottomNav
        currentRole={currentRole}
        onSelectRole={handleRoleChangeGuarded}
        language={language}
        activeReservationsCount={reservations.filter((r) => r.status === "pending" || r.status === "confirmed").length}
        currentSeller={currentSeller}
        currentCustomer={currentCustomer}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenFounder={() => setIsFounderModalOpen(true)}
      />
    </div>
  );
}
