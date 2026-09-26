import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  UserCheck,
  LogIn,
  Plus,
  BadgeCheck,
  Mail,
  User,
  Zap,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { CustomerUser } from "../../types";
import { sounds } from "../../utils/audio";
import { DemoVideoPlayer } from "./DemoVideoPlayer";
import { Film, Play } from "lucide-react";

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: CustomerUser) => void;
  language: "en" | "hi";
  initialMode?: "login" | "register";
}

const DEFAULT_ACCOUNTS: CustomerUser[] = [
  {
    id: "cust-3",
    name: "Utkarsh Yadav",
    email: "utkarshyadav752@gmail.com",
    phone: "+91 9554460651",
    googleId: "google-utkarsh-03",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    isPhoneVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cust-1",
    name: "Priya Sharma",
    email: "priya.sharma@gmail.com",
    phone: "+91 98450 67890",
    googleId: "google-priya-01",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    isPhoneVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cust-2",
    name: "Anand Verma",
    email: "anand.verma@gmail.com",
    phone: "+91 98111 22334",
    googleId: "google-anand-02",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    isPhoneVerified: true,
    createdAt: new Date().toISOString(),
  },
];

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  language,
  initialMode = "login",
}) => {
  const isHindi = language === "hi";

  const [activeTab, setActiveTab] = useState<"login" | "register">(initialMode);
  const [existingAccounts, setExistingAccounts] = useState<CustomerUser[]>(DEFAULT_ACCOUNTS);
  const [showDemoVideo, setShowDemoVideo] = useState<boolean>(true);

  // Existing account search/identifier input
  const [existingIdentifier, setExistingIdentifier] = useState("");

  // Google Account state (for New Customer registration)
  const [googleConnected, setGoogleConnected] = useState<boolean>(true);
  const [googleUser, setGoogleUser] = useState<{
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
  }>({
    id: "google-utkarsh-03",
    name: "Utkarsh Yadav",
    email: "utkarshyadav752@gmail.com",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  });

  const [isCustomGoogleOpen, setIsCustomGoogleOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");

  // Phone state (for New Customer registration)
  const [rawPhoneNumber, setRawPhoneNumber] = useState<string>("9554460651");
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>("");
  const [phoneVerified, setPhoneVerified] = useState<boolean>(true);
  const [simulatedOtp, setSimulatedOtp] = useState<string>("123456");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggestedRegisterNumber, setSuggestedRegisterNumber] = useState<string | null>(null);

  // Sync tab and load existing accounts when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setErrorMessage(null);
      setSuggestedRegisterNumber(null);
      fetch("/api/auth/customer/existing-accounts")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            setExistingAccounts(data.data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Instant 1-Tap Login with any existing account
  const handleDirectSelectCustomer = async (cust: CustomerUser) => {
    sounds.playScanBeep();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/auth/customer/login-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: cust.id }),
      });
      const data = await response.json();
      if (data.success && data.customer) {
        sounds.playSuccessChime();
        onSuccess(data.customer);
        onClose();
      } else {
        // Fallback to client state
        sounds.playSuccessChime();
        onSuccess(cust);
        onClose();
      }
    } catch {
      sounds.playSuccessChime();
      onSuccess(cust);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual identifier login for existing customer
  const handleManualExistingLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = existingIdentifier.trim();
    if (!query) {
      setErrorMessage(
        isHindi
          ? "कृपया अपना पंजीकृत फ़ोन नंबर, ईमेल या नाम दर्ज करें।"
          : "Please enter your registered mobile number, email, or name."
      );
      sounds.playWarningBuzz();
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setSuggestedRegisterNumber(null);
    sounds.playScanBeep();

    try {
      const response = await fetch("/api/auth/customer/login-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: query }),
      });
      const data = await response.json();

      if (!response.ok || !data.success || !data.customer) {
        const cleanDigits = query.replace(/\D/g, "");
        if (cleanDigits.length >= 10) {
          setSuggestedRegisterNumber(cleanDigits.slice(-10));
        }
        throw new Error(
          data.error ||
            (isHindi
              ? "इस विवरण के साथ कोई ग्राहक खाता नहीं मिला।"
              : "No customer found with this number or email.")
        );
      }

      sounds.playSuccessChime();
      onSuccess(data.customer);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Customer account not found.");
      sounds.playWarningBuzz();
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to Register tab with pre-filled phone number
  const handleSwitchToRegisterWithPreFill = (num: string) => {
    setActiveTab("register");
    setRawPhoneNumber(num);
    setErrorMessage(null);
    setPhoneVerified(false);
    setOtpSent(false);
    sounds.playScanBeep();
  };

  // Handle Google Sign-in selection
  const handleSelectGoogleProfile = (name: string, email: string, avatar: string) => {
    sounds.playScanBeep();
    setGoogleUser({
      id: `google-${Date.now()}`,
      name,
      email,
      avatarUrl: avatar,
    });
    setGoogleConnected(true);
    setIsCustomGoogleOpen(false);
    setErrorMessage(null);
  };

  // Apply custom Google account details
  const handleSaveCustomGoogle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim() || !customEmail.includes("@")) {
      setErrorMessage(
        isHindi
          ? "कृपया मान्य नाम और जीमेल पता दर्ज करें।"
          : "Please enter a valid name and email address."
      );
      return;
    }
    handleSelectGoogleProfile(
      customName.trim(),
      customEmail.trim(),
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
    );
  };

  // Send OTP
  const handleSendOtp = () => {
    const rawDigits = rawPhoneNumber.replace(/\D/g, "");
    if (rawDigits.length < 10) {
      setErrorMessage(
        isHindi
          ? "कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।"
          : "Please enter a valid 10-digit mobile number."
      );
      sounds.playWarningBuzz();
      return;
    }
    sounds.playScanBeep();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(code);
    setOtpSent(true);
    setPhoneVerified(false);
    setErrorMessage(null);
  };

  // Auto-fill OTP
  const handleAutoFillOtp = () => {
    sounds.playScanBeep();
    setOtpCode(simulatedOtp);
  };

  // Verify OTP
  const handleVerifyOtp = () => {
    const inputClean = otpCode.trim();
    if (inputClean !== simulatedOtp && inputClean !== "123456") {
      setErrorMessage(
        isHindi
          ? "अमान्य OTP कोड। कृपया नीचे दिखाया गया 6-अंकीय कोड दर्ज करें।"
          : "Invalid OTP code. Please enter the 6-digit code shown or '123456'."
      );
      sounds.playWarningBuzz();
      return;
    }
    sounds.playSuccessChime();
    setPhoneVerified(true);
    setErrorMessage(null);
  };

  // Finalize Customer Registration & Login
  const handleCompleteRegistration = async () => {
    const rawDigits = rawPhoneNumber.replace(/\D/g, "");
    if (rawDigits.length < 10) {
      setErrorMessage(
        isHindi
          ? "कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।"
          : "Please enter a valid 10-digit mobile phone number."
      );
      sounds.playWarningBuzz();
      return;
    }

    if (!googleConnected || !googleUser) {
      setErrorMessage(
        isHindi
          ? "कृपया अपना गूगल खाता चुनें।"
          : "Please connect with a Google account."
      );
      sounds.playWarningBuzz();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    sounds.playScanBeep();

    const formattedPhone = `+91 ${rawDigits.slice(-10, -5)} ${rawDigits.slice(-5)}`;

    try {
      const response = await fetch("/api/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleUser,
          phone: formattedPhone,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.customer) {
        throw new Error(data.error || "Failed to authenticate customer account.");
      }

      sounds.playSuccessChime();
      onSuccess(data.customer);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in. Please try again.");
      sounds.playWarningBuzz();
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-Step Phone Instant Auth
  const handleQuickPhoneAuth = async () => {
    const rawDigits = rawPhoneNumber.replace(/\D/g, "");
    if (rawDigits.length < 10) {
      setErrorMessage(
        isHindi
          ? "कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।"
          : "Please enter a valid 10-digit mobile phone number."
      );
      sounds.playWarningBuzz();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    sounds.playScanBeep();

    try {
      const response = await fetch("/api/auth/customer/quick-phone-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: rawDigits.slice(-10),
          name: googleUser?.name || "Utkarsh Yadav",
          email: googleUser?.email || "utkarshyadav752@gmail.com",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.customer) {
        throw new Error(data.error || "Authentication failed.");
      }

      sounds.playSuccessChime();
      onSuccess(data.customer);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in. Please try again.");
      sounds.playWarningBuzz();
    } finally {
      setIsLoading(false);
    }
  };

  // Filter existing accounts for live instant search
  const filteredAccounts = existingAccounts.filter((acc) => {
    if (!existingIdentifier.trim()) return true;
    const q = existingIdentifier.toLowerCase().trim();
    const phoneDigits = acc.phone.replace(/\D/g, "");
    const qDigits = q.replace(/\D/g, "");
    return (
      acc.name.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q) ||
      acc.phone.toLowerCase().includes(q) ||
      (qDigits.length >= 3 && phoneDigits.includes(qDigits))
    );
  });

  return (
    <div
      id="customer-auth-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-neutral-100 flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-start justify-between gap-3 bg-gradient-to-b from-neutral-850 to-neutral-900">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <ShieldCheck className="w-3 h-3" />
              <span>{isHindi ? "ग्राहक पोर्टल एवं बाज़ार" : "Customer Portal & Marketplace"}</span>
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
              <span>{isHindi ? "ग्राहक लॉगिन एवं सत्यापन" : "Customer Access • KiranaSetu"}</span>
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Real-Time
              </span>
            </h3>
            <p className="text-xs text-neutral-400 leading-snug">
              {isHindi
                ? "किराना दुकानों में लाइव स्टॉक, 30-मिनट पिकअप होल्ड और सुबह के दूध-ब्रेड सब्सक्रिप्शन के लिए लॉगिन करें।"
                : "Browse live store inventory, check real-time stock, and place 30-minute pickup holds."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between gap-2">
          <div className="flex bg-neutral-900 p-1 rounded-2xl border border-neutral-800 text-xs w-full">
            <button
              type="button"
              id="customer-tab-login"
              onClick={() => {
                setActiveTab("login");
                setErrorMessage(null);
              }}
              className={`flex-1 px-4 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "login"
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isHindi ? "मौजूदा ग्राहक लॉगिन" : "Login Existing Account"}</span>
            </button>
            <button
              type="button"
              id="customer-tab-register"
              onClick={() => {
                setActiveTab("register");
                setErrorMessage(null);
              }}
              className={`flex-1 px-4 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "register"
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isHindi ? "नया ग्राहक खाता" : "New Customer"}</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-bold">Error:</span> {errorMessage}
              </div>
              {suggestedRegisterNumber && (
                <button
                  type="button"
                  onClick={() => handleSwitchToRegisterWithPreFill(suggestedRegisterNumber)}
                  className="px-3 py-1 bg-amber-500 text-neutral-950 font-bold rounded-xl text-[11px] hover:bg-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>
                    {isHindi
                      ? `+91 ${suggestedRegisterNumber} के साथ तुरंत नया खाता बनाएं`
                      : `Register now with +91 ${suggestedRegisterNumber}`}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* TAB 1: CUSTOMER LOGIN (EXISTING ACCOUNT) */}
          {activeTab === "login" && (
            <div className="space-y-4">
              {/* CUSTOMER DEMO VIDEO (SEPARATE VIDEO FOR CUSTOMERS WITH DEDICATED SKIP OPTION) */}
              {showDemoVideo ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isHindi ? "ग्राहक डेमो वीडियो (४५ सेकंड)" : "Customer Walkthrough Video (45s)"}</span>
                    </span>
                    <button
                      type="button"
                      id="customer-login-skip-video-link"
                      onClick={() => setShowDemoVideo(false)}
                      className="text-[11px] text-neutral-400 hover:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      {isHindi ? "वीडियो छोड़ें (Skip Video)" : "Skip Video"}
                    </button>
                  </div>
                  <DemoVideoPlayer
                    role="customer"
                    language={language}
                    onSkip={() => setShowDemoVideo(false)}
                    onComplete={() => setShowDemoVideo(false)}
                    title={isHindi ? "ग्राहक डेमो: ३०-मिनट होल्ड व बोलकर ऑर्डर" : "Customer Demo: 30-Min Holds & Voice Order"}
                  />
                </div>
              ) : (
                <div className="p-2.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                      <Film className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-white block truncate text-xs">
                        {isHindi ? "किरानासेतु ग्राहक डेमो वीडियो" : "KiranaSetu Customer Walkthrough"}
                      </span>
                      <span className="text-[10px] text-neutral-400 block truncate">
                        {isHindi ? "३०-मिनट काउंटर होल्ड, बोलकर ऑर्डर व पर्ची स्कैनर (४५ सेकंड)" : "30-min pickup holds, voice orders & parchi scanner (45s)"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="customer-login-watch-video-btn"
                    onClick={() => setShowDemoVideo(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-amber-300" />
                    <span>{isHindi ? "डेमो देखें" : "Watch Demo"}</span>
                  </button>
                </div>
              )}

              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl text-xs text-neutral-400 space-y-1">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-amber-400" />
                  <span>{isHindi ? "त्वरित ग्राहक खाता खोज व प्रवेश" : "Customer Account Lookup"}</span>
                </p>
                <p className="text-[11px]">
                  {isHindi
                    ? "पंजीकृत मोबाइल नंबर (10 अंक), ईमेल या नाम दर्ज करें। यदि खाता नहीं है तो स्वतः नया खाता बना सकते हैं।"
                    : "Enter your 10-digit mobile number, email, or select an account below."}
                </p>
              </div>

              {/* Identifier Search Form */}
              <form onSubmit={handleManualExistingLogin} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
                    {isHindi ? "पंजीकृत फ़ोन नंबर, ईमेल या नाम" : "Registered Phone, Email, or Name"}
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      value={existingIdentifier}
                      onChange={(e) => {
                        setExistingIdentifier(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="9988776655, utkarshyadav752@gmail.com or Utkarsh"
                      className="w-full pl-9 pr-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    id="customer-manual-login-btn"
                    disabled={isLoading}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{isHindi ? "खाते में प्रवेश करें" : "Log In to Customer Account"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const cleanDigits = existingIdentifier.replace(/\D/g, "");
                      handleSwitchToRegisterWithPreFill(cleanDigits.length >= 10 ? cleanDigits.slice(-10) : "9988776655");
                    }}
                    className="px-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-xl text-xs border border-neutral-700 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isHindi ? "नया खाता" : "New Account"}</span>
                  </button>
                </div>
              </form>

              {/* Live Registered Accounts List */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  {isHindi ? "उपलब्ध पंजीकृत ग्राहक खाते:" : "Available Customer Accounts in System:"}
                </span>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {filteredAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleDirectSelectCustomer(acc)}
                      className="w-full p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-amber-500/50 flex items-center justify-between text-left transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={acc.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                          alt={acc.name}
                          className="w-8 h-8 rounded-full object-cover border border-amber-500/30 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white group-hover:text-amber-300 truncate flex items-center gap-1.5">
                            <span>{acc.name}</span>
                            {acc.email === "utkarshyadav752@gmail.com" && (
                              <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded">
                                User
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono truncate">
                            {acc.email} • {acc.phone}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold flex-shrink-0 pl-2">
                        <span>Select</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NEW CUSTOMER VERIFICATION */}
          {activeTab === "register" && (
            <div className="space-y-4">
              {/* STEP 1: GOOGLE ACCOUNT LOGIN */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-amber-400 flex items-center justify-center font-mono text-[11px]">
                      1
                    </span>
                    Google Account Verification
                  </span>
                  {googleConnected && (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Google Connected
                    </span>
                  )}
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={googleUser?.avatarUrl}
                        alt={googleUser?.name}
                        className="w-9 h-9 rounded-full border border-amber-500/40 object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-white flex items-center gap-1.5 truncate">
                          <span>{googleUser?.name}</span>
                          <span className="text-[10px] px-1 py-0.2 bg-emerald-500/20 text-emerald-400 rounded">
                            Verified
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono truncate">{googleUser?.email}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCustomGoogleOpen(!isCustomGoogleOpen)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex-shrink-0 font-medium ml-2"
                    >
                      {isCustomGoogleOpen ? "Cancel" : "Change / Custom"}
                    </button>
                  </div>

                  {/* Custom Google details form */}
                  {isCustomGoogleOpen && (
                    <form onSubmit={handleSaveCustomGoogle} className="pt-2 border-t border-neutral-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="Your Name (e.g. Utkarsh)"
                          className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:border-amber-500 outline-none"
                        />
                        <input
                          type="email"
                          value={customEmail}
                          onChange={(e) => setCustomEmail(e.target.value)}
                          placeholder="Gmail (e.g. user@gmail.com)"
                          className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:border-amber-500 outline-none font-mono"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectGoogleProfile(
                              "Utkarsh Yadav",
                              "utkarshyadav752@gmail.com",
                              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                            )
                          }
                          className="px-2.5 py-1 text-[11px] bg-neutral-800 text-neutral-300 rounded-lg hover:text-white"
                        >
                          Reset Utkarsh Yadav
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 text-[11px] bg-amber-500 text-neutral-950 font-bold rounded-lg hover:bg-amber-400"
                        >
                          Apply Custom Profile
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* STEP 2: PHONE NUMBER & OTP VERIFICATION */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-amber-400 flex items-center justify-center font-mono text-[11px]">
                      2
                    </span>
                    Mobile Phone Verification
                  </span>
                  {phoneVerified && (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Phone Verified
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-amber-400 font-bold">+91</span>
                      </div>
                      <input
                        type="tel"
                        value={rawPhoneNumber}
                        onChange={(e) => {
                          setRawPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="99887 76655"
                        className="w-full pl-16 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    <button
                      type="button"
                      id="send-otp-btn"
                      onClick={handleSendOtp}
                      className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold rounded-xl text-xs border border-neutral-700 transition-colors whitespace-nowrap"
                    >
                      {otpSent ? "Resend OTP" : "Send OTP"}
                    </button>
                  </div>

                  {/* Simulated SMS Alert & OTP Input */}
                  {otpSent && (
                    <div className="space-y-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl animate-in fade-in">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-amber-300 font-semibold">📲 SMS Verification Code:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-200 font-mono text-xs font-bold">{simulatedOtp}</span>
                          <button
                            type="button"
                            onClick={handleAutoFillOtp}
                            className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/40"
                          >
                            Auto-Fill
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter 6-digit OTP..."
                          className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-center font-mono text-white tracking-widest focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          id="verify-otp-btn"
                          onClick={handleVerifyOtp}
                          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs shadow transition-all active:scale-95"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions: Direct 1-Tap Instant Authentication or Complete Form */}
              <div className="space-y-2 pt-2">
                <button
                  id="customer-complete-auth-btn"
                  type="button"
                  onClick={handleCompleteRegistration}
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-black rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  {isLoading ? (
                    <span>Authenticating Customer...</span>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>
                        {isHindi
                          ? "सत्यापित करें एवं किराना बाज़ार में प्रवेश करें"
                          : "AUTHENTICATE & ENTER MARKETPLACE"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Switch to Login */}
              <div className="text-center pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setErrorMessage(null);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 hover:underline font-medium"
                >
                  {isHindi
                    ? "पहले से पंजीकृत खाता है? यहाँ क्लिक करके लॉगिन करें"
                    : "Already registered? Click here to Log In"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
